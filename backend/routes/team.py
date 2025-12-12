"""
Team Routes - Team-specific endpoints for purchases, activation, tree visualization
All endpoints require authentication; sensitive endpoints require admin access
"""
from flask import Blueprint, request, jsonify
from decimal import Decimal
from services.team_service import TeamService
from utils.auth import token_required, admin_required, get_current_user_id, validate_user_access
from utils.validators import validate_uuid, validate_amount
from utils.rate_limiter import limiter

team_bp = Blueprint('team', __name__, url_prefix='/api/team')


@team_bp.route('/purchase', methods=['POST'])
@limiter.limit("5 per minute")
@token_required
def create_purchase():
    """
    Create purchase for activation/reactivation
    User can only purchase for themselves (enforced by token)

    Body:
    {
        "amount": 1000,
        "package_id": "uuid-of-package",  // Required for package-based commission
        "invited_by": "uuid-of-inviter"   // Optional
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body required'}), 400

        # Get user_id from token (secure - cannot be spoofed)
        user_id = get_current_user_id()

        # Validate amount
        amount = data.get('amount')
        if not amount:
            return jsonify({'error': 'Amount required'}), 400

        is_valid, error, validated_amount = validate_amount(amount, min_amount=Decimal('1'))
        if not is_valid:
            return jsonify({'error': error}), 400

        # Optional inviter (validated)
        invited_by = None
        if data.get('invited_by'):
            is_valid, error = validate_uuid(data.get('invited_by'))
            if not is_valid:
                return jsonify({'error': 'Invalid inviter ID'}), 400
            invited_by = data.get('invited_by')

        # Package ID for commission calculation (validated)
        package_id = None
        if data.get('package_id'):
            is_valid, error = validate_uuid(data.get('package_id'))
            if not is_valid:
                return jsonify({'error': 'Invalid package ID'}), 400
            package_id = data.get('package_id')

        # Process activation with package
        success, message, result = TeamService.activate_user(user_id, validated_amount, invited_by, package_id)

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

    except Exception:
        return jsonify({'error': 'Purchase failed'}), 500


@team_bp.route('/tree/<user_id>', methods=['GET'])
@token_required
def get_tree(user_id):
    """Get team tree for a user (upline and downline)"""
    try:
        # Validate user_id format
        is_valid, error = validate_uuid(user_id)
        if not is_valid:
            return jsonify({'error': error}), 400

        # Validate access - users can only view their own tree unless admin
        if not validate_user_access(user_id):
            return jsonify({'error': 'Access denied'}), 403

        tree = TeamService.get_team_tree(user_id)

        if not tree:
            return jsonify({'error': 'User not found or not in team system'}), 404

        return jsonify({
            'success': True,
            'tree': tree
        }), 200

    except Exception:
        return jsonify({'error': 'Failed to fetch tree'}), 500


@team_bp.route('/chain', methods=['GET'])
@limiter.limit("10 per minute")
@admin_required
def get_chain():
    """Get current team chain status (admin only - sensitive data)"""
    try:
        active_only = request.args.get('active_only', 'false').lower() == 'true'

        chain = TeamService.get_chain_status()

        if active_only:
            chain = [c for c in chain if c['is_active']]

        return jsonify({
            'success': True,
            'chain': chain,
            'total': len(chain),
            'active_count': len([c for c in chain if c['is_active']])
        }), 200

    except Exception:
        return jsonify({'error': 'Failed to fetch chain'}), 500


@team_bp.route('/activate', methods=['POST'])
@limiter.limit("5 per minute")
@token_required
def activate():
    """
    Manual activation endpoint
    User can only activate themselves (enforced by token)
    """
    try:
        data = request.get_json() or {}

        # Get user_id from token (secure)
        user_id = get_current_user_id()

        # Optional inviter (validated)
        invited_by = None
        if data.get('invited_by'):
            is_valid, error = validate_uuid(data.get('invited_by'))
            if not is_valid:
                return jsonify({'error': 'Invalid inviter ID'}), 400
            invited_by = data.get('invited_by')

        # Get activation amount from settings
        settings = TeamService.get_settings()
        activation_amount = settings.get('activation_amount', Decimal('1000'))

        # Process activation
        success, message, result = TeamService.activate_user(user_id, activation_amount, invited_by)

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

    except Exception:
        return jsonify({'error': 'Activation failed'}), 500


@team_bp.route('/chain-with-commissions', methods=['GET'])
@limiter.limit("10 per minute")
@admin_required
def get_chain_with_commissions():
    """
    Get chain with commission relationships (admin only - sensitive financial data)
    OPTIMIZED: Uses only 3 queries instead of N+2 queries (was causing 9+ second load times)
    SECURITY: Rate limited to prevent data exfiltration
    """
    try:
        from utils.db import get_db_connection, return_db_connection
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # Query 1: Get all team users (single query)
            cur.execute("""
                SELECT u.id, u.username, u.email, u.is_mlm_active,
                       u.commission_received_count, u.activation_date, u.created_at
                FROM users u
                WHERE u.activation_date IS NOT NULL AND u.role != 'admin'
                ORDER BY u.activation_date ASC
            """)
            users_rows = cur.fetchall()

            # Build user ID list for batch queries (keep as UUID, not string)
            user_ids = [row[0] for row in users_rows]

            if not user_ids:
                cur.close()
                return jsonify({'success': True, 'chain': [], 'total': 0}), 200

            # Query 2: Get ALL "pays to" relationships in ONE query (ALL receivers, not just first)
            cur.execute("""
                SELECT c.payer_id, c.receiver_id, u2.username, c.amount
                FROM commissions c
                JOIN users u2 ON c.receiver_id = u2.id
                WHERE c.payer_id = ANY(%s::uuid[])
                ORDER BY c.payer_id, c.created_at ASC
            """, (user_ids,))
            pays_to_rows = cur.fetchall()

            # Build pays_to lookup dict (list of all receivers per payer)
            pays_to_map = {}
            for row in pays_to_rows:
                payer_id = str(row[0])
                if payer_id not in pays_to_map:
                    pays_to_map[payer_id] = []
                pays_to_map[payer_id].append({
                    'user_id': str(row[1]),
                    'username': row[2],
                    'amount': float(row[3])
                })

            # Query 3: Get ALL "received from" relationships in ONE query
            cur.execute("""
                SELECT c.receiver_id, c.payer_id, u2.username, c.amount
                FROM commissions c
                JOIN users u2 ON c.payer_id = u2.id
                WHERE c.receiver_id = ANY(%s::uuid[])
                ORDER BY c.receiver_id, c.created_at ASC
            """, (user_ids,))
            received_from_rows = cur.fetchall()

            # Build received_from lookup dict (list per user)
            received_from_map = {}
            for row in received_from_rows:
                receiver_id = str(row[0])
                if receiver_id not in received_from_map:
                    received_from_map[receiver_id] = []
                received_from_map[receiver_id].append({
                    'user_id': str(row[1]),
                    'username': row[2],
                    'amount': float(row[3])
                })

            cur.close()

            # Build final response using lookup dicts (O(1) per user)
            users_data = []
            for idx, row in enumerate(users_rows):
                user_id = str(row[0])
                users_data.append({
                    'position': idx + 1,
                    'user_id': user_id,
                    'username': row[1],
                    'email': row[2],
                    'is_active': row[3],
                    'commission_received_count': row[4],
                    'activation_date': row[5].isoformat() if row[5] else None,
                    'created_at': row[6].isoformat() if row[6] else None,
                    'pays_commission_to': pays_to_map.get(user_id, []),
                    'received_commissions_from': received_from_map.get(user_id, [])
                })

            return jsonify({
                'success': True,
                'chain': users_data,
                'total': len(users_data)
            }), 200

        finally:
            return_db_connection(conn)

    except Exception as e:
        import traceback
        print(f"Error in get_chain_with_commissions: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch chain with commissions', 'details': str(e)}), 500


@team_bp.route('/stats/global', methods=['GET'])
@limiter.limit("20 per minute")
@admin_required
def get_global_stats():
    """Get global team statistics (admin only) - Rate limited"""
    try:
        from utils.db import get_db_connection, return_db_connection
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            cur.execute("SELECT COUNT(*) FROM users WHERE is_mlm_active = true")
            active_users = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM users WHERE activation_date IS NOT NULL")
            total_team_users = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*), COALESCE(SUM(amount), 0) FROM purchases")
            row = cur.fetchone()
            total_purchases = row[0]
            total_purchase_amount = float(row[1])

            cur.execute("SELECT COUNT(*), COALESCE(SUM(amount), 0) FROM commissions")
            row = cur.fetchone()
            total_commissions_count = row[0]
            total_commissions_amount = float(row[1])

            cur.execute("SELECT COUNT(*) FROM mlm_chain")
            chain_length = cur.fetchone()[0]

            cur.close()

            return jsonify({
                'success': True,
                'stats': {
                    'active_users': active_users,
                    'total_team_users': total_team_users,
                    'inactive_users': total_team_users - active_users,
                    'total_purchases': total_purchases,
                    'total_purchase_amount': total_purchase_amount,
                    'total_commissions_count': total_commissions_count,
                    'total_commissions_amount': total_commissions_amount,
                    'chain_length': chain_length,
                    'currency': TeamService.get_settings().get('currency', 'INR')
                }
            }), 200

        finally:
            return_db_connection(conn)

    except Exception:
        return jsonify({'error': 'Failed to fetch global stats'}), 500


@team_bp.route('/my-stats', methods=['GET'])
@token_required
def get_my_stats():
    """Get current user's team statistics"""
    try:
        user_id = get_current_user_id()
        stats = TeamService.get_dashboard_stats(user_id)

        if not stats:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'success': True,
            'stats': stats
        }), 200

    except Exception:
        return jsonify({'error': 'Failed to fetch stats'}), 500
