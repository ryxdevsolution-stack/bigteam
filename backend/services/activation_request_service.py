"""
Activation Request Service - Admin Approval Workflow

Handles reactivation requests that require admin approval before activation.
Users submit requests, admins review and approve/reject them.
"""

from utils.db import get_db_connection, return_db_connection
from datetime import datetime
import uuid


class ActivationRequestService:
    """Service for managing activation requests with admin approval"""

    @staticmethod
    def create_reactivation_request(user_id: str, package_id: str) -> dict:
        """
        Create a new reactivation request

        Returns:
            {
                'success': True/False,
                'message': str,
                'request_id': str (if success),
                'data': dict (if success)
            }
        """
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # Check if user already has a pending request
            cur.execute("""
                SELECT id, package_name, package_amount, requested_at
                FROM activation_requests
                WHERE user_id = %s AND status = 'pending'
            """, (user_id,))

            existing = cur.fetchone()
            if existing:
                return {
                    'success': False,
                    'message': f'You already have a pending request for {existing[1]} (₹{existing[2]:,.0f}) submitted on {existing[3].strftime("%b %d, %Y")}. Please wait for admin approval or cancel the existing request.',
                    'existing_request_id': str(existing[0])
                }

            # Check if user needs reactivation (2/2 commissions and inactive)
            cur.execute("""
                SELECT is_mlm_active, commission_received_count, amount
                FROM users
                WHERE id = %s
            """, (user_id,))

            user_data = cur.fetchone()
            if not user_data:
                return {'success': False, 'message': 'User not found'}

            is_active, commission_count, balance = user_data

            if is_active:
                return {'success': False, 'message': 'Your account is already active'}

            if commission_count < 2:
                return {'success': False, 'message': 'You need to have 2/2 commissions before reactivation'}

            # Get package details
            cur.execute("""
                SELECT id, name, amount, is_active
                FROM packages
                WHERE id = %s
            """, (package_id,))

            package = cur.fetchone()
            if not package:
                return {'success': False, 'message': 'Package not found'}

            if not package[3]:
                return {'success': False, 'message': 'This package is not available'}

            package_id, package_name, package_amount = package[0], package[1], package[2]

            # Check if user has sufficient balance
            if balance < package_amount:
                return {
                    'success': False,
                    'message': f'Insufficient balance. You need ₹{package_amount:,.0f} but have ₹{balance:,.0f}',
                    'required': float(package_amount),
                    'available': float(balance)
                }

            # Create the request
            request_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO activation_requests (
                    id, user_id, package_id, package_name, package_amount,
                    status, request_type, user_balance_at_request
                )
                VALUES (%s, %s, %s, %s, %s, 'pending', 'reactivation', %s)
                RETURNING id, requested_at
            """, (request_id, user_id, package_id, package_name, package_amount, balance))

            result = cur.fetchone()
            conn.commit()

            print(f"[INFO] Reactivation request created: {request_id} for user {user_id}, package {package_name}")

            return {
                'success': True,
                'message': 'Reactivation request submitted successfully. Admin will review your request shortly.',
                'request_id': str(result[0]),
                'data': {
                    'id': str(result[0]),
                    'package_name': package_name,
                    'package_amount': float(package_amount),
                    'requested_at': result[1].isoformat(),
                    'status': 'pending'
                }
            }

        except Exception as e:
            conn.rollback()
            print(f"[ERROR] Failed to create activation request: {e}")
            return {'success': False, 'message': f'Failed to submit request: {str(e)}'}

        finally:
            cur.close()
            return_db_connection(conn)

    @staticmethod
    def get_user_pending_request(user_id: str) -> dict:
        """Get user's pending activation request if any"""
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            cur.execute("""
                SELECT id, package_id, package_name, package_amount,
                       status, request_type, requested_at, created_at
                FROM activation_requests
                WHERE user_id = %s AND status = 'pending'
                ORDER BY requested_at DESC
                LIMIT 1
            """, (user_id,))

            request = cur.fetchone()
            if not request:
                return {'success': True, 'has_pending': False, 'request': None}

            return {
                'success': True,
                'has_pending': True,
                'request': {
                    'id': str(request[0]),
                    'package_id': str(request[1]),
                    'package_name': request[2],
                    'package_amount': float(request[3]),
                    'status': request[4],
                    'request_type': request[5],
                    'requested_at': request[6].isoformat(),
                    'created_at': request[7].isoformat()
                }
            }

        except Exception as e:
            print(f"[ERROR] Failed to get pending request: {e}")
            return {'success': False, 'message': str(e)}

        finally:
            cur.close()
            return_db_connection(conn)

    @staticmethod
    def cancel_request(request_id: str, user_id: str) -> dict:
        """Allow user to cancel their own pending request"""
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # Verify request belongs to user and is pending
            cur.execute("""
                SELECT status, user_id
                FROM activation_requests
                WHERE id = %s
            """, (request_id,))

            request = cur.fetchone()
            if not request:
                return {'success': False, 'message': 'Request not found'}

            if str(request[1]) != user_id:
                return {'success': False, 'message': 'Unauthorized'}

            if request[0] != 'pending':
                return {'success': False, 'message': f'Cannot cancel {request[0]} request'}

            # Cancel the request
            cur.execute("""
                UPDATE activation_requests
                SET status = 'cancelled', updated_at = NOW()
                WHERE id = %s
            """, (request_id,))

            conn.commit()

            print(f"[INFO] Request {request_id} cancelled by user {user_id}")

            return {
                'success': True,
                'message': 'Request cancelled successfully'
            }

        except Exception as e:
            conn.rollback()
            print(f"[ERROR] Failed to cancel request: {e}")
            return {'success': False, 'message': str(e)}

        finally:
            cur.close()
            return_db_connection(conn)

    @staticmethod
    def get_all_pending_requests() -> dict:
        """Get all pending activation requests (admin only)"""
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            cur.execute("""
                SELECT
                    ar.id, ar.user_id, ar.package_id, ar.package_name, ar.package_amount,
                    ar.status, ar.request_type, ar.requested_at, ar.user_balance_at_request,
                    u.username, u.email, u.commission_received_count, u.amount as current_balance
                FROM activation_requests ar
                JOIN users u ON ar.user_id = u.id
                WHERE ar.status = 'pending'
                ORDER BY ar.requested_at ASC
            """)

            requests = cur.fetchall()

            result = []
            for req in requests:
                result.append({
                    'id': str(req[0]),
                    'user_id': str(req[1]),
                    'package_id': str(req[2]),
                    'package_name': req[3],
                    'package_amount': float(req[4]),
                    'status': req[5],
                    'request_type': req[6],
                    'requested_at': req[7].isoformat(),
                    'user_balance_at_request': float(req[8]) if req[8] else 0,
                    'user': {
                        'username': req[9],
                        'email': req[10],
                        'commission_count': req[11] or 0,
                        'current_balance': float(req[12])
                    }
                })

            return {
                'success': True,
                'count': len(result),
                'requests': result
            }

        except Exception as e:
            print(f"[ERROR] Failed to get pending requests: {e}")
            return {'success': False, 'message': str(e)}

        finally:
            cur.close()
            return_db_connection(conn)

    @staticmethod
    def approve_request(request_id: str, admin_id: str) -> dict:
        """
        Approve activation request and activate the user

        This will:
        1. Deduct money from user balance
        2. Activate user in MLM chain
        3. Reset commission counter
        4. Save old activation to history
        """
        from services.team_service import TeamService

        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # Get request details
            cur.execute("""
                SELECT ar.user_id, ar.package_id, ar.package_name, ar.package_amount,
                       ar.status, u.amount as current_balance
                FROM activation_requests ar
                JOIN users u ON ar.user_id = u.id
                WHERE ar.id = %s
                FOR UPDATE
            """, (request_id,))

            request = cur.fetchone()
            if not request:
                return {'success': False, 'message': 'Request not found'}

            user_id, package_id, package_name, package_amount, status, current_balance = request

            if status != 'pending':
                return {'success': False, 'message': f'Request is already {status}'}

            # Check balance again (may have changed since request)
            if current_balance < package_amount:
                return {
                    'success': False,
                    'message': f'User has insufficient balance. Required: ₹{package_amount:,.0f}, Available: ₹{current_balance:,.0f}'
                }

            # Mark request as approved
            cur.execute("""
                UPDATE activation_requests
                SET status = 'approved',
                    approved_at = NOW(),
                    reviewed_by = %s,
                    updated_at = NOW()
                WHERE id = %s
            """, (admin_id, request_id))

            conn.commit()
            cur.close()
            return_db_connection(conn)

            # Now activate the user using TeamService
            print(f"[INFO] Activating user {user_id} with package {package_name}")

            success, message, data = TeamService.activate_user(
                str(user_id),
                float(package_amount),
                None,  # No inviter for reactivation
                str(package_id)
            )

            if not success:
                # Rollback the approval if activation fails
                conn = get_db_connection()
                cur = conn.cursor()
                cur.execute("""
                    UPDATE activation_requests
                    SET status = 'pending',
                        approved_at = NULL,
                        reviewed_by = NULL
                    WHERE id = %s
                """, (request_id,))
                conn.commit()
                cur.close()
                return_db_connection(conn)

                return {'success': False, 'message': f'Activation failed: {message}'}

            print(f"[INFO] Request {request_id} approved by admin {admin_id}")

            return {
                'success': True,
                'message': f'Request approved successfully. User {package_name} activated.',
                'activation_data': data
            }

        except Exception as e:
            conn.rollback()
            print(f"[ERROR] Failed to approve request: {e}")
            return {'success': False, 'message': str(e)}

        finally:
            if conn and not conn.closed:
                cur.close()
                return_db_connection(conn)

    @staticmethod
    def reject_request(request_id: str, admin_id: str, reason: str = None) -> dict:
        """Reject activation request with optional reason"""
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # Check if request exists and is pending
            cur.execute("""
                SELECT status
                FROM activation_requests
                WHERE id = %s
            """, (request_id,))

            request = cur.fetchone()
            if not request:
                return {'success': False, 'message': 'Request not found'}

            if request[0] != 'pending':
                return {'success': False, 'message': f'Request is already {request[0]}'}

            # Reject the request
            cur.execute("""
                UPDATE activation_requests
                SET status = 'rejected',
                    rejected_at = NOW(),
                    reviewed_by = %s,
                    rejection_reason = %s,
                    updated_at = NOW()
                WHERE id = %s
            """, (admin_id, reason, request_id))

            conn.commit()

            print(f"[INFO] Request {request_id} rejected by admin {admin_id}. Reason: {reason}")

            return {
                'success': True,
                'message': 'Request rejected successfully'
            }

        except Exception as e:
            conn.rollback()
            print(f"[ERROR] Failed to reject request: {e}")
            return {'success': False, 'message': str(e)}

        finally:
            cur.close()
            return_db_connection(conn)

    @staticmethod
    def get_pending_count() -> int:
        """Get count of pending activation requests (for notification badge)"""
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            cur.execute("""
                SELECT COUNT(*)
                FROM activation_requests
                WHERE status = 'pending'
            """)

            count = cur.fetchone()[0]
            return count

        except Exception as e:
            print(f"[ERROR] Failed to get pending count: {e}")
            return 0

        finally:
            cur.close()
            return_db_connection(conn)
