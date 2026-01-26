"""
Activation Requests API Routes - Admin Approval Workflow

Endpoints for users to submit reactivation requests and admins to approve/reject them.
"""

from flask import Blueprint, request, jsonify
from utils.auth import token_required, get_current_user_id
from services.activation_request_service import ActivationRequestService
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

activation_requests_bp = Blueprint('activation_requests', __name__)

# Rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)


@activation_requests_bp.route('/api/activation-requests/submit', methods=['POST'])
@limiter.limit("5 per minute")
@token_required
def submit_reactivation_request():
    """
    User submits a reactivation request

    Request Body:
        {
            "package_id": "uuid"
        }

    Returns:
        {
            "success": true/false,
            "message": "...",
            "request_id": "uuid",
            "data": {...}
        }
    """
    try:
        current_user_id = get_current_user_id()
        data = request.get_json()

        if not data or 'package_id' not in data:
            return jsonify({'error': 'package_id is required'}), 400

        package_id = data['package_id']

        # Create the request
        result = ActivationRequestService.create_reactivation_request(
            current_user_id,
            package_id
        )

        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400

    except Exception as e:
        print(f"[ERROR] Submit request failed: {e}")
        return jsonify({'error': 'Failed to submit request', 'details': str(e)}), 500


@activation_requests_bp.route('/api/activation-requests/my-request', methods=['GET'])
@limiter.limit("20 per minute")
@token_required
def get_my_pending_request():
    """
    Get user's pending activation request

    Returns:
        {
            "success": true,
            "has_pending": true/false,
            "request": {...} or null
        }
    """
    try:
        current_user_id = get_current_user_id()
        result = ActivationRequestService.get_user_pending_request(current_user_id)
        return jsonify(result), 200

    except Exception as e:
        print(f"[ERROR] Get my request failed: {e}")
        return jsonify({'error': 'Failed to get request', 'details': str(e)}), 500


@activation_requests_bp.route('/api/activation-requests/<request_id>/cancel', methods=['POST'])
@limiter.limit("5 per minute")
@token_required
def cancel_my_request(request_id):
    """
    User cancels their own pending request

    Returns:
        {
            "success": true/false,
            "message": "..."
        }
    """
    try:
        current_user_id = get_current_user_id()
        result = ActivationRequestService.cancel_request(request_id, current_user_id)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        print(f"[ERROR] Cancel request failed: {e}")
        return jsonify({'error': 'Failed to cancel request', 'details': str(e)}), 500


# ============================================================================
# ADMIN ONLY ENDPOINTS
# ============================================================================

@activation_requests_bp.route('/api/activation-requests/pending', methods=['GET'])
@limiter.limit("30 per minute")
@token_required
def get_all_pending_requests():
    """
    Get all pending activation requests (Admin only)

    Returns:
        {
            "success": true,
            "count": 5,
            "requests": [...]
        }
    """
    try:
        current_user_id = get_current_user_id()

        # Verify admin role
        from utils.db import get_db_connection
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
        user = cur.fetchone()

        if not user or user[0] != 'admin':
            cur.close()
            conn.close()
            return jsonify({'error': 'Admin access required'}), 403

        cur.close()
        conn.close()

        # Get all pending requests
        result = ActivationRequestService.get_all_pending_requests()

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 500

    except Exception as e:
        print(f"[ERROR] Get pending requests failed: {e}")
        return jsonify({'error': 'Failed to get requests', 'details': str(e)}), 500


@activation_requests_bp.route('/api/activation-requests/<request_id>/approve', methods=['POST'])
@limiter.limit("10 per minute")
@token_required
def approve_activation_request(request_id):
    """
    Admin approves an activation request

    Returns:
        {
            "success": true/false,
            "message": "..."
        }
    """
    try:
        current_user_id = get_current_user_id()

        # Verify admin role
        from utils.db import get_db_connection
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
        user = cur.fetchone()

        if not user or user[0] != 'admin':
            cur.close()
            conn.close()
            return jsonify({'error': 'Admin access required'}), 403

        cur.close()
        conn.close()

        # Approve the request
        result = ActivationRequestService.approve_request(request_id, current_user_id)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        print(f"[ERROR] Approve request failed: {e}")
        return jsonify({'error': 'Failed to approve request', 'details': str(e)}), 500


@activation_requests_bp.route('/api/activation-requests/<request_id>/reject', methods=['POST'])
@limiter.limit("10 per minute")
@token_required
def reject_activation_request(request_id):
    """
    Admin rejects an activation request

    Request Body:
        {
            "reason": "Optional rejection reason"
        }

    Returns:
        {
            "success": true/false,
            "message": "..."
        }
    """
    try:
        current_user_id = get_current_user_id()

        # Verify admin role
        from utils.db import get_db_connection
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
        user = cur.fetchone()

        if not user or user[0] != 'admin':
            cur.close()
            conn.close()
            return jsonify({'error': 'Admin access required'}), 403

        cur.close()
        conn.close()

        # Get rejection reason
        data = request.get_json() or {}
        reason = data.get('reason', 'No reason provided')

        # Reject the request
        result = ActivationRequestService.reject_request(request_id, current_user_id, reason)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        print(f"[ERROR] Reject request failed: {e}")
        return jsonify({'error': 'Failed to reject request', 'details': str(e)}), 500


@activation_requests_bp.route('/api/activation-requests/pending-count', methods=['GET'])
@limiter.limit("60 per minute")
@token_required
def get_pending_count():
    """
    Get count of pending requests (for notification badge)

    Returns:
        {
            "count": 5
        }
    """
    try:
        current_user_id = get_current_user_id()

        # Verify admin role
        from utils.db import get_db_connection
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
        user = cur.fetchone()

        if not user or user[0] != 'admin':
            cur.close()
            conn.close()
            return jsonify({'error': 'Admin access required'}), 403

        cur.close()
        conn.close()

        # Get count
        count = ActivationRequestService.get_pending_count()

        return jsonify({'count': count}), 200

    except Exception as e:
        print(f"[ERROR] Get pending count failed: {e}")
        return jsonify({'error': 'Failed to get count', 'details': str(e)}), 500
