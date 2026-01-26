"""
Team Service - Business Logic for Linear Chain Commission System
Handles activation, commission calculation, and chain management
"""
import json
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
    def _parse_settings_rows(settings_rows) -> Dict[str, any]:
        """Parse settings rows into typed dictionary (DRY helper method)"""
        settings = {}
        for key, value in settings_rows:
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

    @staticmethod
    def get_settings() -> Dict[str, any]:
        """Get team settings from database (no hardcoding)"""
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT setting_key, setting_value FROM mlm_settings")
            rows = cur.fetchall()
            cur.close()
            return TeamService._parse_settings_rows(rows)
        finally:
            return_db_connection(conn)

    @staticmethod
    def generate_invite_code() -> str:
        """Generate unique invite code (e.g., BT-AB12CD) - optimized batch check"""
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
    def activate_user(user_id: str, amount: Decimal, invited_by: Optional[str] = None, package_id: Optional[str] = None) -> Tuple[bool, str, Dict]:
        """
        Activate or reactivate user - optimized single connection
        - Creates purchase record
        - Adds user to chain
        - Calculates and distributes commissions based on package
        - Returns (success, message, data)

        Args:
            user_id: UUID of the user to activate
            amount: Activation amount (should match package amount)
            invited_by: Optional inviter user ID
            package_id: UUID of the selected package (required for commission calculation)
        """
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # Get settings inline (avoid opening new connection)
            cur.execute("SELECT setting_key, setting_value FROM mlm_settings")
            settings_rows = cur.fetchall()
            settings = TeamService._parse_settings_rows(settings_rows)

            # Get package details if package_id provided
            # FOR UPDATE locks the package row to prevent race conditions
            package = None
            if package_id:
                cur.execute("""
                    SELECT id, name, amount, commission_percentage, is_active, is_deleted
                    FROM packages WHERE id = %s
                    FOR UPDATE
                """, (package_id,))
                package_row = cur.fetchone()

                if not package_row:
                    return False, "Package not found", {}

                if not package_row[4]:  # is_active
                    return False, "Package is not active", {}

                if package_row[5]:  # is_deleted
                    return False, "Package has been deleted", {}

                package = {
                    'id': str(package_row[0]),
                    'name': package_row[1],
                    'amount': Decimal(str(package_row[2])),
                    'commission_percentage': Decimal(str(package_row[3]))
                }

                # Use package amount for validation
                required_amount = package['amount']
            else:
                # Fallback to mlm_settings if no package provided (backward compatibility)
                required_amount = settings.get('activation_amount', Decimal('1000'))

            # Validate amount
            if amount < required_amount:
                return False, f"Insufficient amount. Required: {required_amount}", {}

            # Get user inline (avoid opening new connection)
            cur.execute("""
                SELECT id, username, email, full_name, role, is_mlm_active,
                       referral_code, sponsored_by, commission_received_count,
                       total_earnings, available_balance, pending_balance, activation_date
                FROM users WHERE id = %s
            """, (user_id,))
            user_row = cur.fetchone()

            if not user_row:
                return False, "User not found", {}

            user = {
                'id': str(user_row[0]),
                'role': user_row[4],
                'is_active_member': user_row[5],
                'invite_code': user_row[6],
                'activation_date': user_row[12]
            }

            # Admin users should NOT be in team system
            if user.get('role') == 'admin':
                return False, "Admin users cannot participate in team system", {}

            # Determine if this is activation or reactivation
            is_reactivation = user['is_active_member'] or user['activation_date'] is not None
            purchase_type = 'reactivation' if is_reactivation else 'activation'

            # Create purchase record with package_id
            product_name = package['name'] if package else 'Team Activation Package'
            cur.execute("""
                INSERT INTO purchases (user_id, product_name, amount, purchase_type, status, package_id)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (user_id, product_name, float(amount), purchase_type, 'completed', package_id))

            purchase_id = cur.fetchone()[0]

            # CORRECT LOGIC: Pay commission to LAST 2 active users in the chain
            # PACKAGE-SPECIFIC: Only pay to users with the SAME package
            commission_limit = settings.get('commission_limit', 2)

            # SECURITY: Find and LOCK the last N active users who will receive commissions
            # FOR UPDATE prevents race conditions where multiple concurrent activations
            # could pay the same user more than their commission limit
            # PACKAGE-SPECIFIC FILTER: Only select users who have the same package_id
            if package_id:
                # Find eligible receivers with the SAME package
                cur.execute("""
                    SELECT mc.user_id, mc.position, mc.is_active,
                           u.username, u.email, u.commission_received_count
                    FROM mlm_chain mc
                    JOIN users u ON mc.user_id = u.id
                    JOIN LATERAL (
                        SELECT package_id FROM purchases
                        WHERE user_id = mc.user_id AND package_id IS NOT NULL
                        ORDER BY created_at DESC LIMIT 1
                    ) latest_purchase ON true
                    WHERE mc.is_active = true
                      AND u.commission_received_count < %s
                      AND latest_purchase.package_id = %s
                    ORDER BY mc.position DESC
                    LIMIT %s
                    FOR UPDATE OF u
                """, (commission_limit, package_id, commission_limit))
            else:
                # Fallback for users without package (backward compatibility)
                cur.execute("""
                    SELECT mc.user_id, mc.position, mc.is_active,
                           u.username, u.email, u.commission_received_count
                    FROM mlm_chain mc
                    JOIN users u ON mc.user_id = u.id
                    WHERE mc.is_active = true AND u.commission_received_count < %s
                    ORDER BY mc.position DESC
                    LIMIT %s
                    FOR UPDATE OF u
                """, (commission_limit, commission_limit))

            receiver_rows = cur.fetchall()

            # Calculate commission based on package or fallback to settings
            if package:
                # SECURITY: Validate commission percentage is within acceptable range
                if package['commission_percentage'] < Decimal('0') or package['commission_percentage'] > Decimal('100'):
                    return False, "Invalid package commission percentage (must be 0-100)", {}

                # Use package-specific commission percentage
                commission_rate = package['commission_percentage'] / Decimal('100')  # Convert 15 to 0.15
                commission_amount = package['amount'] * commission_rate

                # SECURITY: Validate commission amount against maximum threshold
                MAX_COMMISSION_AMOUNT = Decimal('100000')  # 1 lakh rupees per transaction
                if commission_amount > MAX_COMMISSION_AMOUNT:
                    return False, f"Commission amount exceeds maximum allowed ({MAX_COMMISSION_AMOUNT})", {}
            else:
                # Fallback to mlm_settings (backward compatibility)
                commission_rate = settings.get('commission_rate', Decimal('0.15'))
                commission_amount = amount * commission_rate
            commissions_paid = []
            receivers_to_deactivate = []

            # Pay commission to each receiver (max 2)
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

                # Update receiver's earnings and get new count
                cur.execute("""
                    UPDATE users
                    SET total_earnings = total_earnings + %s,
                        available_balance = available_balance + %s,
                        commission_received_count = commission_received_count + 1
                    WHERE id = %s
                    RETURNING commission_received_count
                """, (float(commission_amount), float(commission_amount), receiver_id))

                new_count = cur.fetchone()[0]

                commissions_paid.append({
                    'commission_id': str(commission_id),
                    'receiver_id': receiver_id,
                    'receiver_username': receiver_username,
                    'amount': float(commission_amount),
                    'level': level,
                    'new_commission_count': new_count
                })

                # Track receivers to deactivate
                if new_count >= commission_limit:
                    receivers_to_deactivate.append(receiver_id)
                    commissions_paid[-1]['deactivated'] = True

            # Batch deactivate receivers who reached commission limit
            # IMPORTANT: Save their activation to JSONB history before deactivating
            if receivers_to_deactivate:
                for receiver_id in receivers_to_deactivate:
                    # Get current activation data before deactivating
                    cur.execute("""
                        SELECT mc.position, mc.created_at, p.package_id, pkg.name, pkg.amount, u.sponsored_by, u.activation_date
                        FROM mlm_chain mc
                        JOIN users u ON mc.user_id = u.id
                        LEFT JOIN purchases p ON p.user_id = mc.user_id
                            AND p.status = 'completed'
                            AND p.package_id IS NOT NULL
                            AND p.created_at >= mc.created_at
                        LEFT JOIN packages pkg ON p.package_id = pkg.id
                        WHERE mc.user_id = %s AND mc.is_active = true
                        ORDER BY p.created_at DESC
                        LIMIT 1
                    """, (receiver_id,))

                    activation_data = cur.fetchone()

                    if activation_data:
                        position, created_at, pkg_id, pkg_name, pkg_amount, sponsor, activated_at = activation_data

                        # Build activation record for JSONB
                        days_active = (datetime.now() - created_at).days if created_at else 0

                        new_activation = {
                            "position_in_chain": position,
                            "package": {
                                "id": str(pkg_id) if pkg_id else None,
                                "name": pkg_name or "Unknown Package",
                                "amount": float(pkg_amount) if pkg_amount else 0
                            },
                            "timeline": {
                                "activated_at": created_at.isoformat() if created_at else None,
                                "deactivated_at": datetime.now().isoformat(),
                                "days_active": days_active
                            },
                            "performance": {
                                "commissions_earned": 2,
                                "purchase_type": "deactivated_at_limit"
                            },
                            "sponsor_at_activation": str(sponsor) if sponsor else None,
                            "is_current": False
                        }

                        # Add to user's activation_history JSONB
                        try:
                            activation_json = json.dumps(new_activation)
                            cur.execute("""
                                UPDATE users
                                SET activation_history = jsonb_set(
                                    COALESCE(activation_history, '{"activations": [], "statistics": {}}'::jsonb),
                                    '{activations}',
                                    COALESCE(activation_history->'activations', '[]'::jsonb) || %s::jsonb,
                                    true
                                )
                                WHERE id = %s
                            """, (activation_json, receiver_id))
                        except (TypeError, ValueError) as e:
                            print(f"[ERROR] Failed to serialize activation history for user {receiver_id}: {e}")
                            # Continue without failing activation (non-critical)

                # Now deactivate in mlm_chain and users table
                cur.execute("""
                    UPDATE mlm_chain SET is_active = false, deactivated_at = NOW()
                    WHERE user_id = ANY(%s::uuid[]) AND is_active = true
                """, (receivers_to_deactivate,))

                cur.execute("""
                    UPDATE users SET is_mlm_active = false
                    WHERE id = ANY(%s::uuid[])
                """, (receivers_to_deactivate,))

            # Get next position inline (avoid opening new connection)
            cur.execute("SELECT COALESCE(MAX(position), 0) + 1 FROM mlm_chain")
            next_position = cur.fetchone()[0]

            # Check if user already has an entry in mlm_chain
            # FIXED: Use FOR UPDATE to lock row and prevent race conditions
            cur.execute("""
                SELECT id, is_active
                FROM mlm_chain
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 1
                FOR UPDATE
            """, (user_id,))
            existing_chain = cur.fetchone()

            if existing_chain and not existing_chain[1]:
                # User has inactive entry - this is reactivation
                # Save old activation to JSONB history first (if not already saved)
                cur.execute("""
                    SELECT mc.position, mc.created_at, mc.deactivated_at
                    FROM mlm_chain mc
                    WHERE mc.user_id = %s AND mc.is_active = false
                    ORDER BY mc.created_at DESC
                    LIMIT 1
                """, (user_id,))

                old_data = cur.fetchone()
                if old_data:
                    old_position, old_created, old_deactivated = old_data

                    # Check if this activation is already in history
                    cur.execute("""
                        SELECT 1 FROM users
                        WHERE id = %s
                        AND activation_history->'activations' @> %s::jsonb
                    """, (user_id, json.dumps([{"position_in_chain": old_position}])))

                    already_saved = cur.fetchone()

                    if not already_saved:
                        # Add old activation to history
                        days_active = (old_deactivated - old_created).days if (old_deactivated and old_created) else 0

                        old_activation = {
                            "position_in_chain": old_position,
                            "timeline": {
                                "activated_at": old_created.isoformat() if old_created else None,
                                "deactivated_at": old_deactivated.isoformat() if old_deactivated else None,
                                "days_active": days_active
                            },
                            "performance": {
                                "commissions_earned": 2,
                                "purchase_type": "reactivation"
                            },
                            "is_current": False
                        }

                        try:
                            activation_json = json.dumps(old_activation)
                            cur.execute("""
                                UPDATE users
                                SET activation_history = jsonb_set(
                                    COALESCE(activation_history, '{"activations": [], "statistics": {}}'::jsonb),
                                    '{activations}',
                                    COALESCE(activation_history->'activations', '[]'::jsonb) || %s::jsonb,
                                    true
                                )
                                WHERE id = %s
                            """, (activation_json, user_id))
                        except (TypeError, ValueError) as e:
                            print(f"[ERROR] Failed to serialize activation history for user {user_id}: {e}")
                            # Continue without failing activation (non-critical)

                # Update existing entry to active with new position
                cur.execute("""
                    UPDATE mlm_chain
                    SET is_active = true, position = %s, deactivated_at = NULL, created_at = NOW()
                    WHERE user_id = %s AND is_active = false
                """, (next_position, user_id))
            else:
                # First time activation - insert new row
                cur.execute("""
                    INSERT INTO mlm_chain (user_id, position, is_active)
                    VALUES (%s, %s, %s)
                """, (user_id, next_position, True))

            # Update user activation status
            # IMPORTANT: Don't overwrite sponsored_by on reactivation (preserve original sponsor)
            if not user['invite_code']:
                invite_code = TeamService.generate_invite_code()
                cur.execute("""
                    UPDATE users
                    SET is_mlm_active = true,
                        activation_date = NOW(),
                        referral_code = %s,
                        sponsored_by = COALESCE(sponsored_by, %s),
                        commission_received_count = 0
                    WHERE id = %s
                """, (invite_code, invited_by, user_id))
            else:
                # On reactivation, keep original sponsor (don't overwrite)
                if is_reactivation:
                    cur.execute("""
                        UPDATE users
                        SET is_mlm_active = true,
                            activation_date = NOW(),
                            commission_received_count = 0
                        WHERE id = %s
                    """, (user_id,))
                else:
                    # First activation - set sponsor
                    cur.execute("""
                        UPDATE users
                        SET is_mlm_active = true,
                            activation_date = NOW(),
                            sponsored_by = %s,
                            commission_received_count = 0
                        WHERE id = %s
                    """, (invited_by, user_id))

            # Update activation_history statistics
            cur.execute("""
                UPDATE users
                SET activation_history = jsonb_set(
                    activation_history,
                    '{statistics}',
                    jsonb_build_object(
                        'total_activations', COALESCE(jsonb_array_length(activation_history->'activations'), 0) + 1,
                        'last_updated', %s,
                        'current_package', %s
                    ),
                    true
                )
                WHERE id = %s
            """, (datetime.now().isoformat(), package['name'] if package else 'Unknown', user_id))

            # Single commit for entire transaction
            conn.commit()
            cur.close()

            # Log commission distribution for debugging
            print(f"[COMMISSION] User {user_id} activated with package {package['name'] if package else 'None'}")
            print(f"[COMMISSION] Found {len(receiver_rows)} eligible same-package receivers")
            print(f"[COMMISSION] Paid commission to: {[c['receiver_username'] for c in commissions_paid]}")

            return True, f"User {purchase_type} successful", {
                'purchase_id': str(purchase_id),
                'purchase_type': purchase_type,
                'amount': float(amount),
                'position': next_position,
                'package_id': package_id,
                'package_name': package['name'] if package else None,
                'commissions_paid': commissions_paid,
                'total_commission_paid': float(commission_amount) * len(commissions_paid),
                'same_package_receivers_found': len(receiver_rows)
            }

        except Exception as e:
            conn.rollback()
            print(f"[COMMISSION ERROR] Activation failed: {str(e)}")
            import traceback
            traceback.print_exc()
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
        """Get team tree for a user (upline and downline) - optimized single query"""
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # Single query for all team tree data
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
                'is_active_member': user_raw['is_mlm_active'],
                'invite_code': user_raw['referral_code'],
                'invited_by': str(user_raw['sponsored_by']) if user_raw['sponsored_by'] else None,
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
                    'is_active_member': up_raw['is_mlm_active'],
                    'invite_code': up_raw['referral_code'],
                    'invited_by': str(up_raw['sponsored_by']) if up_raw['sponsored_by'] else None,
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
                        'is_active_member': d['is_mlm_active'],
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
        """Get dashboard statistics for a user - optimized with single query"""
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # Get user info
            user = TeamService.get_user_by_id(user_id)
            if not user:
                return {}

            # Single query for all stats using CTEs
            cur.execute("""
                WITH team_stats AS (
                    SELECT
                        COUNT(*) AS total_members,
                        COUNT(*) FILTER (WHERE is_mlm_active = true) AS active_members
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
                    ts.total_members,
                    ts.active_members,
                    cs.total_commissions,
                    COALESCE(
                        json_agg(json_build_object(
                            'amount', r.amount,
                            'created_at', r.created_at,
                            'from_user', r.username
                        )) FILTER (WHERE r.amount IS NOT NULL),
                        '[]'::json
                    ) AS recent_commissions
                FROM team_stats ts
                CROSS JOIN commission_stats cs
                LEFT JOIN recent r ON true
                GROUP BY ts.total_members, ts.active_members, cs.total_commissions
            """, (user_id, user_id, user_id))

            row = cur.fetchone()
            cur.close()

            if row:
                total_team_members = row[0] or 0
                active_team_members = row[1] or 0
                total_commissions = float(row[2] or 0)
                recent_commissions_raw = row[3] if row[3] else []
            else:
                total_team_members = 0
                active_team_members = 0
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
                'recent_commissions': recent_commissions
            }
        finally:
            return_db_connection(conn)
