"""
MLM Routes - MLM-specific endpoints for purchases, activation, tree visualization
"""
from flask import Blueprint, request, jsonify
from decimal import Decimal
from services.mlm_service import MLMService

mlm_bp = Blueprint('mlm', __name__, url_prefix='/api/mlm')


@mlm_bp.route('/purchase', methods=['POST'])
def create_purchase():
    """
    Create purchase for activation/reactivation
    Automatically calculates and distributes commissions
    """
    try:
        data = request.get_json()

        # Validate required fields
        user_id = data.get('user_id')
        amount = data.get('amount')
        sponsored_by = data.get('sponsored_by')  # Optional referrer ID

        if not user_id:
            return jsonify({'error': 'User ID required'}), 400

        if not amount:
            return jsonify({'error': 'Amount required'}), 400

        # Convert amount to Decimal
        try:
            amount = Decimal(str(amount))
        except:
            return jsonify({'error': 'Invalid amount format'}), 400

        # Process activation
        success, message, result = MLMService.activate_user(user_id, amount, sponsored_by)

        if not success:
            return jsonify({
                'success': False,
                'error': message
            }), 400

        return jsonify({
            'success': True,
            'message': message,
            'data': result
        }), 200

    except Exception as e:
        return jsonify({'error': f'Purchase failed: {str(e)}'}), 500


@mlm_bp.route('/tree/<user_id>', methods=['GET'])
def get_tree(user_id):
    """Get MLM tree for a user (upline and downline)"""
    try:
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400

        # Get tree data
        tree = MLMService.get_mlm_tree(user_id)

        if not tree:
            return jsonify({'error': 'User not found or not in MLM system'}), 404

        return jsonify({
            'success': True,
            'tree': tree
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch tree: {str(e)}'}), 500


@mlm_bp.route('/chain', methods=['GET'])
def get_chain():
    """Get current MLM chain status (for visualization)"""
    try:
        # Optional filters
        active_only = request.args.get('active_only', 'false').lower() == 'true'

        # Get chain status
        chain = MLMService.get_chain_status()

        if active_only:
            chain = [c for c in chain if c['is_active']]

        return jsonify({
            'success': True,
            'chain': chain,
            'total': len(chain),
            'active_count': len([c for c in chain if c['is_active']])
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch chain: {str(e)}'}), 500


@mlm_bp.route('/activate', methods=['POST'])
def activate():
    """
    Manual activation endpoint (alternative to /purchase)
    Uses activation amount from settings
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        sponsored_by = data.get('sponsored_by')

        if not user_id:
            return jsonify({'error': 'User ID required'}), 400

        # Get activation amount from settings
        settings = MLMService.get_settings()
        activation_amount = settings.get('activation_amount', Decimal('1000'))

        # Process activation
        success, message, result = MLMService.activate_user(user_id, activation_amount, sponsored_by)

        if not success:
            return jsonify({
                'success': False,
                'error': message
            }), 400

        return jsonify({
            'success': True,
            'message': message,
            'data': result
        }), 200

    except Exception as e:
        return jsonify({'error': f'Activation failed: {str(e)}'}), 500


@mlm_bp.route('/check-referral/<referral_code>', methods=['GET'])
def check_referral(referral_code):
    """Check if referral code is valid and get referrer info"""
    try:
        if not referral_code:
            return jsonify({'error': 'Referral code required'}), 400

        from utils.db import get_db_connection, return_db_connection
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, username, email, full_name, is_mlm_active
                FROM users
                WHERE referral_code = %s
            """, (referral_code,))

            row = cur.fetchone()
            cur.close()

            if not row:
                return jsonify({
                    'valid': False,
                    'error': 'Invalid referral code'
                }), 404

            return jsonify({
                'valid': True,
                'referrer': {
                    'id': str(row[0]),
                    'username': row[1],
                    'email': row[2],
                    'full_name': row[3],
                    'is_mlm_active': row[4]
                }
            }), 200

        finally:
            return_db_connection(conn)

    except Exception as e:
        return jsonify({'error': f'Failed to check referral: {str(e)}'}), 500


@mlm_bp.route('/stats/global', methods=['GET'])
def get_global_stats():
    """Get global MLM statistics (for admin dashboard)"""
    try:
        from utils.db import get_db_connection, return_db_connection
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # Total users in MLM
            cur.execute("SELECT COUNT(*) FROM users WHERE is_mlm_active = true")
            active_users = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM users WHERE activation_date IS NOT NULL")
            total_mlm_users = cur.fetchone()[0]

            # Total purchases
            cur.execute("SELECT COUNT(*), COALESCE(SUM(amount), 0) FROM purchases")
            row = cur.fetchone()
            total_purchases = row[0]
            total_purchase_amount = float(row[1])

            # Total commissions
            cur.execute("SELECT COUNT(*), COALESCE(SUM(amount), 0) FROM commissions")
            row = cur.fetchone()
            total_commissions_count = row[0]
            total_commissions_amount = float(row[1])

            # Chain length
            cur.execute("SELECT COUNT(*) FROM mlm_chain")
            chain_length = cur.fetchone()[0]

            cur.close()

            return jsonify({
                'success': True,
                'stats': {
                    'active_users': active_users,
                    'total_mlm_users': total_mlm_users,
                    'inactive_users': total_mlm_users - active_users,
                    'total_purchases': total_purchases,
                    'total_purchase_amount': total_purchase_amount,
                    'total_commissions_count': total_commissions_count,
                    'total_commissions_amount': total_commissions_amount,
                    'chain_length': chain_length,
                    'currency': MLMService.get_settings().get('currency', 'INR')
                }
            }), 200

        finally:
            return_db_connection(conn)

    except Exception as e:
        return jsonify({'error': f'Failed to fetch global stats: {str(e)}'}), 500
