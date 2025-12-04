"""
MLM Service - Business Logic for Linear Chain Commission System
Handles activation, commission calculation, and chain management
"""
import random
import string
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from utils.db import get_db_connection, return_db_connection


class MLMService:
    """
    MLM Service implementing linear chain commission system
    - Users activate by purchasing (amount from mlm_settings)
    - 15% commission goes to last 2 active users before them
    - After 2 commissions received, user becomes inactive
    - Reactivation adds user at end of chain
    """

    @staticmethod
    def get_settings() -> Dict[str, any]:
        """Get MLM settings from database (no hardcoding)"""
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
    def generate_referral_code() -> str:
        """Generate unique referral code (e.g., BT-AB12CD) - optimized batch check"""
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            max_attempts = 3  # Limit retry attempts

            for _ in range(max_attempts):
                # Generate batch of 10 candidate codes
                candidates = ['BT-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
                              for _ in range(10)]

                # Check all candidates in single query
                cur.execute(
                    "SELECT referral_code FROM users WHERE referral_code = ANY(%s)",
                    (candidates,)
                )
                existing = {row[0] for row in cur.fetchall()}

                # Return first unused code
                for code in candidates:
                    if code not in existing:
                        cur.close()
                        return code

            # Fallback: use UUID-based code (guaranteed unique)
            cur.close()
            import uuid
            return 'BT-' + uuid.uuid4().hex[:6].upper()
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
                'is_mlm_active': row[5],
                'referral_code': row[6],
                'sponsored_by': str(row[7]) if row[7] else None,
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
    def activate_user(user_id: str, amount: Decimal, sponsored_by: Optional[str] = None) -> Tuple[bool, str, Dict]:
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
            settings = MLMService.get_settings()

            # Validate amount
            required_amount = settings.get('activation_amount', Decimal('1000'))
            if amount < required_amount:
                return False, f"Insufficient amount. Required: {required_amount}", {}

            # Check if user exists
            user = MLMService.get_user_by_id(user_id)
            if not user:
                return False, "User not found", {}

            # Admin users should NOT be in MLM system
            if user.get('role') == 'admin':
                return False, "Admin users cannot participate in MLM system", {}

            # Determine if this is activation or reactivation
            is_reactivation = user['is_mlm_active'] or user['activation_date'] is not None
            purchase_type = 'reactivation' if is_reactivation else 'activation'

            # Create purchase record
            cur.execute("""
                INSERT INTO purchases (user_id, product_name, amount, purchase_type, status)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (user_id, 'MLM Activation Package', float(amount), purchase_type, 'completed'))

            purchase_id = cur.fetchone()[0]
            conn.commit()

            # CORRECT LOGIC: Pay commission to ONE user only (first with < 2 commissions)
            commission_limit = settings.get('commission_limit', 2)

            # Find the first active user who has received < commission_limit commissions
            cur.execute("""
                SELECT mc.user_id, mc.position, mc.is_active,
                       u.username, u.email, u.commission_received_count
                FROM mlm_chain mc
                JOIN users u ON mc.user_id = u.id
                WHERE mc.is_active = true AND u.commission_received_count < %s
                ORDER BY mc.position ASC
                LIMIT 1
            """, (commission_limit,))

            receiver_row = cur.fetchone()

            # Calculate and distribute commission
            commission_rate = settings.get('commission_rate', Decimal('0.15'))
            commission_amount = amount * commission_rate
            commissions_paid = []

            # Only pay if there's a valid receiver
            if receiver_row:
                receiver_id = str(receiver_row[0])
                receiver_username = receiver_row[3]

                # Record commission
                cur.execute("""
                    INSERT INTO commissions (receiver_id, payer_id, purchase_id, amount, commission_level, status)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (receiver_id, user_id, purchase_id, float(commission_amount), 1, 'completed'))

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
                    'level': 1,
                    'new_commission_count': new_count
                })

                # Check if receiver should be deactivated
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
            next_position = MLMService.get_next_position()
            cur.execute("""
                INSERT INTO mlm_chain (user_id, position, is_active)
                VALUES (%s, %s, %s)
            """, (user_id, next_position, True))
            conn.commit()

            # Update user activation status
            if not user['referral_code']:
                referral_code = MLMService.generate_referral_code()
                cur.execute("""
                    UPDATE users
                    SET is_mlm_active = true,
                        activation_date = NOW(),
                        referral_code = %s,
                        sponsored_by = %s,
                        commission_received_count = 0
                    WHERE id = %s
                """, (referral_code, sponsored_by, user_id))
            else:
                cur.execute("""
                    UPDATE users
                    SET is_mlm_active = true,
                        activation_date = NOW(),
                        sponsored_by = %s,
                        commission_received_count = 0
                    WHERE id = %s
                """, (sponsored_by, user_id))

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

        except Exception as e:
            conn.rollback()
            return False, f"Activation failed: {str(e)}", {}
        finally:
            return_db_connection(conn)

    @staticmethod
    def get_user_referrals(user_id: str) -> List[Dict]:
        """Get direct referrals of a user"""
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
                'is_mlm_active': row[4],
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
    def get_mlm_tree(user_id: str) -> Dict:
        """Get MLM tree for a user (upline and downline) - optimized single query"""
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # Single query for all MLM tree data
            cur.execute("""
                WITH user_data AS (
                    SELECT id, username, email, full_name, role, is_mlm_active,
                           referral_code, sponsored_by, commission_received_count,
                           total_earnings, available_balance, pending_balance, activation_date
                    FROM users WHERE id = %s
                ),
                upline_data AS (
                    SELECT u.id, u.username, u.email, u.full_name, u.role, u.is_mlm_active,
                           u.referral_code, u.sponsored_by, u.commission_received_count,
                           u.total_earnings, u.available_balance, u.pending_balance, u.activation_date
                    FROM users u
                    JOIN user_data ud ON u.id = ud.sponsored_by
                ),
                downline_data AS (
                    SELECT id, username, email, full_name, is_mlm_active,
                           activation_date, total_earnings
                    FROM users WHERE sponsored_by = %s
                    ORDER BY activation_date DESC
                ),
                chain_data AS (
                    SELECT position, is_active, created_at
                    FROM mlm_chain WHERE user_id = %s
                    ORDER BY created_at DESC LIMIT 1
                )
                SELECT
                    row_to_json(ud.*) AS user_info,
                    (SELECT row_to_json(up.*) FROM upline_data up LIMIT 1) AS upline_info,
                    COALESCE((SELECT json_agg(d.*) FROM downline_data d), '[]'::json) AS downline_list,
                    (SELECT row_to_json(c.*) FROM chain_data c LIMIT 1) AS chain_info
                FROM user_data ud
            """, (user_id, user_id, user_id))

            row = cur.fetchone()
            cur.close()

            if not row or not row[0]:
                return {}

            # Parse user data
            user_raw = row[0]
            user = {
                'id': str(user_raw['id']),
                'username': user_raw['username'],
                'email': user_raw['email'],
                'full_name': user_raw['full_name'],
                'role': user_raw['role'],
                'is_mlm_active': user_raw['is_mlm_active'],
                'referral_code': user_raw['referral_code'],
                'sponsored_by': str(user_raw['sponsored_by']) if user_raw['sponsored_by'] else None,
                'commission_received_count': user_raw['commission_received_count'],
                'total_earnings': float(user_raw['total_earnings']) if user_raw['total_earnings'] else 0,
                'available_balance': float(user_raw['available_balance']) if user_raw['available_balance'] else 0,
                'pending_balance': float(user_raw['pending_balance']) if user_raw['pending_balance'] else 0,
                'activation_date': user_raw['activation_date'] if user_raw['activation_date'] else None
            }

            # Parse upline data
            upline = None
            if row[1]:
                up_raw = row[1]
                upline = {
                    'id': str(up_raw['id']),
                    'username': up_raw['username'],
                    'email': up_raw['email'],
                    'full_name': up_raw['full_name'],
                    'role': up_raw['role'],
                    'is_mlm_active': up_raw['is_mlm_active'],
                    'referral_code': up_raw['referral_code'],
                    'sponsored_by': str(up_raw['sponsored_by']) if up_raw['sponsored_by'] else None,
                    'commission_received_count': up_raw['commission_received_count'],
                    'total_earnings': float(up_raw['total_earnings']) if up_raw['total_earnings'] else 0,
                    'available_balance': float(up_raw['available_balance']) if up_raw['available_balance'] else 0,
                    'pending_balance': float(up_raw['pending_balance']) if up_raw['pending_balance'] else 0,
                    'activation_date': up_raw['activation_date'] if up_raw['activation_date'] else None
                }

            # Parse downline data
            downline = []
            if row[2]:
                for d in row[2]:
                    downline.append({
                        'id': str(d['id']),
                        'username': d['username'],
                        'email': d['email'],
                        'full_name': d['full_name'],
                        'is_mlm_active': d['is_mlm_active'],
                        'activation_date': d['activation_date'] if d['activation_date'] else None,
                        'total_earnings': float(d['total_earnings']) if d['total_earnings'] else 0
                    })

            # Parse chain info
            chain_info = None
            if row[3]:
                chain_info = {
                    'position': row[3]['position'],
                    'is_active': row[3]['is_active'],
                    'joined_at': row[3]['created_at'] if row[3]['created_at'] else None
                }

            return {
                'user': user,
                'upline': upline,
                'downline': downline,
                'chain_info': chain_info,
                'total_referrals': len(downline),
                'active_referrals': len([d for d in downline if d['is_mlm_active']])
            }
        finally:
            return_db_connection(conn)

    @staticmethod
    def get_chain_status() -> List[Dict]:
        """Get current MLM chain status (for admin/visualization)"""
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
        """Get dashboard statistics for a user - optimized single query"""
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # Get user info
            user = MLMService.get_user_by_id(user_id)
            if not user:
                return {}

            # Single query for all stats using CTEs
            cur.execute("""
                WITH referral_stats AS (
                    SELECT
                        COUNT(*) AS total_referrals,
                        COUNT(*) FILTER (WHERE is_mlm_active = true) AS active_referrals
                    FROM users
                    WHERE sponsored_by = %s
                ),
                commission_stats AS (
                    SELECT COALESCE(SUM(amount), 0) AS total_commissions
                    FROM commissions
                    WHERE receiver_id = %s AND status = 'completed'
                ),
                recent AS (
                    SELECT c.amount, c.created_at, u.username
                    FROM commissions c
                    JOIN users u ON c.payer_id = u.id
                    WHERE c.receiver_id = %s
                    ORDER BY c.created_at DESC
                    LIMIT 5
                )
                SELECT
                    rs.total_referrals,
                    rs.active_referrals,
                    cs.total_commissions,
                    COALESCE(
                        json_agg(json_build_object(
                            'amount', r.amount,
                            'created_at', r.created_at,
                            'from_user', r.username
                        )) FILTER (WHERE r.amount IS NOT NULL),
                        '[]'::json
                    ) AS recent_commissions
                FROM referral_stats rs
                CROSS JOIN commission_stats cs
                LEFT JOIN recent r ON true
                GROUP BY rs.total_referrals, rs.active_referrals, cs.total_commissions
            """, (user_id, user_id, user_id))

            row = cur.fetchone()
            cur.close()

            if row:
                total_referrals = row[0] or 0
                active_referrals = row[1] or 0
                total_commissions = float(row[2] or 0)
                recent_commissions_raw = row[3] if row[3] else []
            else:
                total_referrals = 0
                active_referrals = 0
                total_commissions = 0.0
                recent_commissions_raw = []

            # Format recent commissions
            recent_commissions = []
            for rc in recent_commissions_raw:
                recent_commissions.append({
                    'amount': float(rc['amount']) if rc.get('amount') else 0,
                    'created_at': rc['created_at'] if rc.get('created_at') else None,
                    'from_user': rc.get('from_user', '')
                })

            return {
                'user': user,
                'total_referrals': total_referrals,
                'active_referrals': active_referrals,
                'inactive_referrals': total_referrals - active_referrals,
                'total_earnings': user['total_earnings'],
                'available_balance': user['available_balance'],
                'pending_balance': user['pending_balance'],
                'total_commissions': total_commissions,
                'commission_received_count': user['commission_received_count'],
                'is_mlm_active': user['is_mlm_active'],
                'referral_code': user['referral_code'],
                'recent_commissions': recent_commissions
            }
        finally:
            return_db_connection(conn)
