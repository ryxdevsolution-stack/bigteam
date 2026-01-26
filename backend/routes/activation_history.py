"""
Activation History Routes - API endpoints for JSONB activation history
"""
from flask import Blueprint, jsonify
from utils.auth import token_required, admin_required, get_current_user_id
from utils.validators import validate_uuid
from utils.rate_limiter import limiter
from services.activation_history_service import ActivationHistoryService

activation_history_bp = Blueprint('activation_history', __name__, url_prefix='/api/activation-history')


@activation_history_bp.route('/user/<user_id>', methods=['GET'])
@limiter.limit("20 per minute")
@token_required
def get_user_activation_history(user_id):
    """
    Get activation history for a specific user (self or admin only)

    Returns complete activation history including:
    - All past activations
    - Current status
    - Statistics
    """
    try:
        # Validate user_id format
        is_valid, error = validate_uuid(user_id)
        if not is_valid:
            return jsonify({'error': error}), 400

        # FIXED: Proper authorization check - must be self or admin
        current_user_id = get_current_user_id()
        if current_user_id != user_id:
            # Verify if current user is admin
            from utils.db import get_db_connection, return_db_connection
            conn = get_db_connection()
            try:
                cur = conn.cursor()
                cur.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
                user_row = cur.fetchone()
                cur.close()

                if not user_row or user_row[0] != 'admin':
                    return jsonify({'error': 'Unauthorized - Admin access required'}), 403
            finally:
                return_db_connection(conn)

        # Get activation history
        history = ActivationHistoryService.get_user_activation_history(user_id)

        if "error" in history:
            return jsonify({'error': history['error']}), 404

        return jsonify({
            'success': True,
            'data': history
        }), 200

    except Exception as e:
        print(f"[ERROR] Failed to get activation history: {e}")
        return jsonify({'error': 'Failed to fetch activation history'}), 500


@activation_history_bp.route('/my-history', methods=['GET'])
@limiter.limit("20 per minute")
@token_required
def get_my_activation_history():
    """
    Get activation history for the authenticated user
    """
    try:
        user_id = get_current_user_id()

        history = ActivationHistoryService.get_user_activation_history(user_id)

        if "error" in history:
            return jsonify({'error': history['error']}), 404

        return jsonify({
            'success': True,
            'data': history
        }), 200

    except Exception as e:
        print(f"[ERROR] Failed to get activation history: {e}")
        return jsonify({'error': 'Failed to fetch activation history'}), 500


@activation_history_bp.route('/stats/reactivation', methods=['GET'])
@limiter.limit("10 per minute")
@token_required
@admin_required
def get_reactivation_stats():
    """
    Get platform-wide reactivation statistics (Admin only)

    Returns:
    - Distribution of users by activation count
    - Top reactivators
    - Average days active
    """
    try:
        stats = ActivationHistoryService.get_reactivation_stats()

        if "error" in stats:
            return jsonify({'error': stats['error']}), 500

        return jsonify({
            'success': True,
            'data': stats
        }), 200

    except Exception as e:
        print(f"[ERROR] Failed to get reactivation stats: {e}")
        return jsonify({'error': 'Failed to fetch statistics'}), 500


@activation_history_bp.route('/stats/packages', methods=['GET'])
@limiter.limit("10 per minute")
@token_required
@admin_required
def get_package_popularity():
    """
    Get package popularity statistics (Admin only)
    """
    try:
        stats = ActivationHistoryService.get_package_popularity()

        return jsonify({
            'success': True,
            'data': stats
        }), 200

    except Exception as e:
        print(f"[ERROR] Failed to get package popularity: {e}")
        return jsonify({'error': 'Failed to fetch statistics'}), 500


@activation_history_bp.route('/timeline', methods=['GET'])
@limiter.limit("10 per minute")
@token_required
@admin_required
def get_activation_timeline():
    """
    Get activation timeline for the past 30 days (Admin only)
    """
    try:
        from flask import request
        days = int(request.args.get('days', 30))

        if days < 1 or days > 365:
            return jsonify({'error': 'Days must be between 1 and 365'}), 400

        timeline = ActivationHistoryService.get_activation_timeline(days)

        return jsonify({
            'success': True,
            'data': timeline
        }), 200

    except ValueError:
        return jsonify({'error': 'Invalid days parameter'}), 400
    except Exception as e:
        print(f"[ERROR] Failed to get activation timeline: {e}")
        return jsonify({'error': 'Failed to fetch timeline'}), 500
