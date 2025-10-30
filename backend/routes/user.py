"""
User Routes - User-facing endpoints for profile, dashboard, and referrals
"""
from flask import Blueprint, request, jsonify
from services.mlm_service import MLMService

user_bp = Blueprint('user', __name__, url_prefix='/api/user')


@user_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get user profile with MLM info"""
    try:
        # Get user_id from query params (in production, get from JWT token)
        user_id = request.args.get('user_id')

        if not user_id:
            return jsonify({'error': 'User ID required'}), 400

        # Get user data
        user = MLMService.get_user_by_id(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'success': True,
            'user': user
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch profile: {str(e)}'}), 500


@user_bp.route('/profile', methods=['PUT'])
def update_profile():
    """Update user profile"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')

        if not user_id:
            return jsonify({'error': 'User ID required'}), 400

        # Get allowed fields for update
        allowed_fields = ['full_name', 'username']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}

        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400

        # Build update query
        from utils.db import get_db_connection, return_db_connection
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            set_clause = ', '.join([f"{k} = %s" for k in update_data.keys()])
            values = list(update_data.values()) + [user_id]

            cur.execute(f"""
                UPDATE users
                SET {set_clause}, updated_at = NOW()
                WHERE id = %s
                RETURNING id
            """, values)

            if cur.rowcount == 0:
                return jsonify({'error': 'User not found'}), 404

            conn.commit()
            cur.close()

            # Get updated user
            user = MLMService.get_user_by_id(user_id)

            return jsonify({
                'success': True,
                'message': 'Profile updated successfully',
                'user': user
            }), 200

        finally:
            return_db_connection(conn)

    except Exception as e:
        return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500


@user_bp.route('/dashboard-stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics for user"""
    try:
        user_id = request.args.get('user_id')

        if not user_id:
            return jsonify({'error': 'User ID required'}), 400

        # Get comprehensive dashboard stats
        stats = MLMService.get_dashboard_stats(user_id)

        if not stats:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'success': True,
            'stats': stats
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch stats: {str(e)}'}), 500


@user_bp.route('/referrals', methods=['GET'])
def get_referrals():
    """Get user's direct referrals"""
    try:
        user_id = request.args.get('user_id')

        if not user_id:
            return jsonify({'error': 'User ID required'}), 400

        # Get referrals
        referrals = MLMService.get_user_referrals(user_id)

        return jsonify({
            'success': True,
            'referrals': referrals,
            'total': len(referrals)
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch referrals: {str(e)}'}), 500


@user_bp.route('/commissions', methods=['GET'])
def get_commissions():
    """Get user's commission history"""
    try:
        user_id = request.args.get('user_id')
        limit = int(request.args.get('limit', 50))

        if not user_id:
            return jsonify({'error': 'User ID required'}), 400

        # Get commissions
        commissions = MLMService.get_user_commissions(user_id, limit)

        return jsonify({
            'success': True,
            'commissions': commissions,
            'total': len(commissions)
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch commissions: {str(e)}'}), 500


@user_bp.route('/settings/mlm', methods=['GET'])
def get_mlm_settings():
    """Get MLM settings (activation amount, commission rate, etc.)"""
    try:
        settings = MLMService.get_settings()

        return jsonify({
            'success': True,
            'settings': {
                'activation_amount': float(settings.get('activation_amount', 1000)),
                'commission_rate': float(settings.get('commission_rate', 0.15)),
                'commission_limit': settings.get('commission_limit', 2),
                'currency': settings.get('currency', 'INR')
            }
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch settings: {str(e)}'}), 500
