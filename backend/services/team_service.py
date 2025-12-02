"""
Team Service - Business Logic for Linear Chain Commission System
Handles activation, commission calculation, and chain management
"""
import random
import string
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from utils.db import get_db_connection, return_db_connection


class TeamService:
    """
    Team Service implementing linear chain commission system

    COMMISSION FLOW:
    - When new user joins and pays $1000 activation:
    - Find the LAST 2 active users in the chain (who have < 2 commissions)
    - Pay EACH of them $150 (15% commission)
    - If any user reaches 2/2 commissions → they complete their cycle (inactive)

    EXAMPLE:
    A joins → No payment (first user)
    B joins → A gets $150 (A: 1/2)
    C joins → A gets $150, B gets $150 (A: 2/2 ✓ DONE, B: 1/2)
    D joins → B gets $150, C gets $150 (B: 2/2 ✓ DONE, C: 1/2)
    E joins → C gets $150, D gets $150 (C: 2/2 ✓ DONE, D: 1/2)
    ...and so on

    - Reactivation adds user at end of chain with fresh 0/2 count
    """

    @staticmethod
    def get_settings() -> Dict[str, any]:
        """Get team settings from database (no hardcoding)"""
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT setting_key, setting_value FROM mlm_settings")
            rows = cur.fetchall()
            cur.close()

            settings = {}
            for row in rows:
                key, value = row
                # Convert to appropriate types
                if key == 'activation_amount':
                    settings[key] = Decimal(value)
                elif key == 'commission_rate':
                    settings[key] = Decimal(value)
                elif key == 'commission_limit':
                    settings[key] = int(value)
                else:
                    settings[key] = value

            return settings
        finally:
            return_db_connection(conn)

    @staticmethod
    def generate_invite_code() -> str:
        """Generate unique invite code (e.g., BT-AB12CD)"""
        conn = get_db_connection()
        try:
            while True:
                # Generate random code
                code = 'BT-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

                # Check uniqueness
                cur = conn.cursor()
                cur.execute("SELECT COUNT(*) FROM users WHERE referral_code = %s", (code,))
                count = cur.fetchone()[0]
                cur.close()

                if count == 0:
                    return code
        finally:
            return_db_connection(conn)

    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, username, email, full_name, role, is_mlm_active,
                       referral_code, sponsored_by, commission_received_count,
                       total_earnings, available_balance, pending_balance,
                       activation_date
                FROM users
                WHERE id = %s
            """, (user_id,))

            row = cur.fetchone()
            cur.close()

            if not row:
                return None

            return {
                'id': str(row[0]),
                'username': row[1],
                'email': row[2],
                'full_name': row[3],
                'role': row[4],
                'is_active_member': row[5],
                'invite_code': row[6],
                'invited_by': str(row[7]) if row[7] else None,
                'commission_received_count': row[8],
                'total_earnings': float(row[9]) if row[9] else 0,
                'available_balance': float(row[10]) if row[10] else 0,
                'pending_balance': float(row[11]) if row[11] else 0,
                'activation_date': row[12].isoformat() if row[12] else None
            }
        finally:
            return_db_connection(conn)

    @staticmethod
    def get_last_active_users(limit: int = 2) -> List[Dict]:
        """Get last N active users in the chain"""
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT mc.user_id, mc.position, mc.is_active,
                       u.username, u.email, u.commission_received_count
                FROM mlm_chain mc
                JOIN users u ON mc.user_id = u.id
                WHERE mc.is_active = true
                ORDER BY mc.position DESC
                LIMIT %s
            """, (limit,))

            rows = cur.fetchall()
            cur.close()

            return [{
                'user_id': str(row[0]),
                'position': row[1],
                'is_active': row[2],
                'username': row[3],
                'email': row[4],
                'commission_received_count': row[5]
            } for row in rows]
        finally:
            return_db_connection(conn)

    @staticmethod
    def get_next_position() -> int:
        """Get next available position in chain"""
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT COALESCE(MAX(position), 0) + 1 FROM mlm_chain")
            position = cur.fetchone()[0]
            cur.close()
            return position
        finally:
            return_db_connection(conn)

    @staticmethod
    def activate_user(user_id: str, amount: Decimal, invited_by: Optional[str] = None) -> Tuple[bool, str, Dict]:
        """
        Activate or reactivate user
        - Creates purchase record
        - Adds user to chain
        - Calculates and distributes commissions
        - Returns (success, message, data)
        """
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            settings = TeamService.get_settings()

            # Validate amount
            required_amount = settings.get('activation_amount', Decimal('1000'))
            if amount < required_amount:
                return False, f"Insufficient amount. Required: {required_amount}", {}

            # Check if user exists
            user = TeamService.get_user_by_id(user_id)
            if not user:
                return False, "User not found", {}

            # Admin users should NOT be in team system
            if user.get('role') == 'admin':
                return False, "Admin users cannot participate in team system", {}

            # Determine if this is activation or reactivation
            is_reactivation = user['is_active_member'] or user['activation_date'] is not None
            purchase_type = 'reactivation' if is_reactivation else 'activation'

            # Create purchase record
            cur.execute("""
                INSERT INTO purchases (user_id, product_name, amount, purchase_type, status)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (user_id, 'Team Activation Package', float(amount), purchase_type, 'completed'))

            purchase_id = cur.fetchone()[0]
            conn.commit()

            # CORRECT LOGIC: Pay commission to LAST 2 active users in the chain
            commission_limit = settings.get('commission_limit', 2)

            # Find the last 2 active users who have received < commission_limit commissions
            # Order by position DESC to get the most recent active users first
            cur.execute("""
                SELECT mc.user_id, mc.position, mc.is_active,
                       u.username, u.email, u.commission_received_count
                FROM mlm_chain mc
                JOIN users u ON mc.user_id = u.id
                WHERE mc.is_active = true AND u.commission_received_count < %s
                ORDER BY mc.position DESC
                LIMIT 2
            """, (commission_limit,))

            receiver_rows = cur.fetchall()

            # Calculate and distribute commission
            commission_rate = settings.get('commission_rate', Decimal('0.15'))
            commission_amount = amount * commission_rate
            commissions_paid = []

            # Pay commission to each of the last 2 active users
            for level, receiver_row in enumerate(receiver_rows, 1):
                receiver_id = str(receiver_row[0])
                receiver_username = receiver_row[3]

                # Record commission
                cur.execute("""
                    INSERT INTO commissions (receiver_id, payer_id, purchase_id, amount, commission_level, status)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (receiver_id, user_id, purchase_id, float(commission_amount), level, 'completed'))

                commission_id = cur.fetchone()[0]
                conn.commit()

                # Update receiver's earnings
                cur.execute("""
                    UPDATE users
                    SET total_earnings = total_earnings + %s,
                        available_balance = available_balance + %s,
                        commission_received_count = commission_received_count + 1
                    WHERE id = %s
                    RETURNING commission_received_count
                """, (float(commission_amount), float(commission_amount), receiver_id))

                new_count = cur.fetchone()[0]
                conn.commit()

                commissions_paid.append({
                    'commission_id': str(commission_id),
                    'receiver_id': receiver_id,
                    'receiver_username': receiver_username,
                    'amount': float(commission_amount),
                    'level': level,
                    'new_commission_count': new_count
                })

                # Check if receiver should be deactivated (reached 2 commissions)
                if new_count >= commission_limit:
                    cur.execute("""
                        UPDATE mlm_chain
                        SET is_active = false, deactivated_at = NOW()
                        WHERE user_id = %s AND is_active = true
                    """, (receiver_id,))

                    cur.execute("""
                        UPDATE users
                        SET is_mlm_active = false
                        WHERE id = %s
                    """, (receiver_id,))

                    conn.commit()
                    commissions_paid[-1]['deactivated'] = True

            # Add user to chain (at the end)
            next_position = TeamService.get_next_position()
            cur.execute("""
                INSERT INTO mlm_chain (user_id, position, is_active)
                VALUES (%s, %s, %s)
            """, (user_id, next_position, True))
            conn.commit()

            # Update user activation status
            if not user['invite_code']:
                invite_code = TeamService.generate_invite_code()
                cur.execute("""
                    UPDATE users
                    SET is_mlm_active = true,
                        activation_date = NOW(),
                        referral_code = %s,
                        sponsored_by = %s,
                        commission_received_count = 0
                    WHERE id = %s
                """, (invite_code, invited_by, user_id))
            else:
                cur.execute("""
                    UPDATE users
                    SET is_mlm_active = true,
                        activation_date = NOW(),
                        sponsored_by = %s,
                        commission_received_count = 0
                    WHERE id = %s
                """, (invited_by, user_id))

            conn.commit()
            cur.close()

            return True, f"User {purchase_type} successful", {
                'purchase_id': str(purchase_id),
                'purchase_type': purchase_type,
                'amount': float(amount),
                'position': next_position,
                'commissions_paid': commissions_paid,
                'total_commission_paid': float(commission_amount) * len(commissions_paid)
            }

        except Exception:
            conn.rollback()
            return False, "Activation failed", {}
        finally:
            return_db_connection(conn)

    @staticmethod
    def get_user_team_members(user_id: str) -> List[Dict]:
        """Get direct team members of a user"""
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, username, email, full_name, is_mlm_active,
                       activation_date, total_earnings
                FROM users
                WHERE sponsored_by = %s
                ORDER BY activation_date DESC
            """, (user_id,))

            rows = cur.fetchall()
            cur.close()

            return [{
                'id': str(row[0]),
                'username': row[1],
                'email': row[2],
                'full_name': row[3],
                'is_active_member': row[4],
                'activation_date': row[5].isoformat() if row[5] else None,
                'total_earnings': float(row[6]) if row[6] else 0
            } for row in rows]
        finally:
            return_db_connection(conn)

    @staticmethod
    def get_user_commissions(user_id: str, limit: int = 50) -> List[Dict]:
        """Get commission history for a user"""
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT c.id, c.payer_id, c.amount, c.commission_level,
                       c.status, c.created_at, u.username, u.email
                FROM commissions c
                JOIN users u ON c.payer_id = u.id
                WHERE c.receiver_id = %s
                ORDER BY c.created_at DESC
                LIMIT %s
            """, (user_id, limit))

            rows = cur.fetchall()
            cur.close()

            return [{
                'id': str(row[0]),
                'payer_id': str(row[1]),
                'amount': float(row[2]),
                'commission_level': row[3],
                'status': row[4],
                'created_at': row[5].isoformat() if row[5] else None,
                'payer_username': row[6],
                'payer_email': row[7]
            } for row in rows]
        finally:
            return_db_connection(conn)

    @staticmethod
    def get_team_tree(user_id: str) -> Dict:
        """Get team tree for a user (upline and downline)"""
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # Get user info
            user = TeamService.get_user_by_id(user_id)
            if not user:
                return {}

            # Get upline (inviter)
            upline = None
            if user['invited_by']:
                upline = TeamService.get_user_by_id(user['invited_by'])

            # Get downline (direct team members)
            downline = TeamService.get_user_team_members(user_id)

            # Get user's position in chain
            cur.execute("""
                SELECT position, is_active, created_at
                FROM mlm_chain
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 1
            """, (user_id,))

            chain_row = cur.fetchone()
            chain_info = None
            if chain_row:
                chain_info = {
                    'position': chain_row[0],
                    'is_active': chain_row[1],
                    'joined_at': chain_row[2].isoformat() if chain_row[2] else None
                }

            cur.close()

            return {
                'user': user,
                'upline': upline,
                'downline': downline,
                'chain_info': chain_info,
                'total_team_members': len(downline),
                'active_team_members': len([d for d in downline if d['is_active_member']])
            }
        finally:
            return_db_connection(conn)

    @staticmethod
    def get_chain_status() -> List[Dict]:
        """Get current team chain status (for admin/visualization)"""
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT mc.position, mc.user_id, mc.is_active, mc.created_at,
                       u.username, u.email, u.commission_received_count
                FROM mlm_chain mc
                JOIN users u ON mc.user_id = u.id
                ORDER BY mc.position ASC
            """)

            rows = cur.fetchall()
            cur.close()

            return [{
                'position': row[0],
                'user_id': str(row[1]),
                'is_active': row[2],
                'created_at': row[3].isoformat() if row[3] else None,
                'username': row[4],
                'email': row[5],
                'commission_received_count': row[6]
            } for row in rows]
        finally:
            return_db_connection(conn)

    @staticmethod
    def get_dashboard_stats(user_id: str) -> Dict:
        """Get dashboard statistics for a user"""
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # Get user info
            user = TeamService.get_user_by_id(user_id)
            if not user:
                return {}

            # Count direct team members
            cur.execute("SELECT COUNT(*) FROM users WHERE sponsored_by = %s", (user_id,))
            total_team_members = cur.fetchone()[0]

            # Count active team members
            cur.execute("""
                SELECT COUNT(*) FROM users
                WHERE sponsored_by = %s AND is_mlm_active = true
            """, (user_id,))
            active_team_members = cur.fetchone()[0]

            # Get total commissions earned
            cur.execute("""
                SELECT COALESCE(SUM(amount), 0) FROM commissions
                WHERE receiver_id = %s AND status = 'completed'
            """, (user_id,))
            total_commissions = float(cur.fetchone()[0])

            # Get recent commissions (last 5)
            cur.execute("""
                SELECT c.amount, c.created_at, u.username
                FROM commissions c
                JOIN users u ON c.payer_id = u.id
                WHERE c.receiver_id = %s
                ORDER BY c.created_at DESC
                LIMIT 5
            """, (user_id,))
            recent_commissions = cur.fetchall()

            cur.close()

            return {
                'user': user,
                'total_team_members': total_team_members,
                'active_team_members': active_team_members,
                'inactive_team_members': total_team_members - active_team_members,
                'total_earnings': user['total_earnings'],
                'available_balance': user['available_balance'],
                'pending_balance': user['pending_balance'],
                'total_commissions': total_commissions,
                'commission_received_count': user['commission_received_count'],
                'is_active_member': user['is_active_member'],
                'invite_code': user['invite_code'],
                'recent_commissions': [{
                    'amount': float(row[0]),
                    'created_at': row[1].isoformat() if row[1] else None,
                    'from_user': row[2]
                } for row in recent_commissions]
            }
        finally:
            return_db_connection(conn)
