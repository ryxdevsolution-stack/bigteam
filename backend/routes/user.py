"""
User Routes - User-facing endpoints for profile, dashboard, and referrals
"""
from flask import Blueprint, request, jsonify
from ..services.mlm_service import MLMService

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


@user_bp.route('/home-data', methods=['GET'])
def get_home_data():
    """Get all home page data in single call (videos, photos, ads, meetings)"""
    try:
        from utils.db import get_db_connection, return_db_connection

        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # Get 4 random videos
            videos = []
            try:
                cur.execute("""
                    SELECT id, title, content, media_type, media_url, thumbnail_url,
                           created_by, created_at, likes_count, shares_count, views_count
                    FROM posts
                    WHERE media_type = 'video' AND is_published = TRUE
                    ORDER BY RANDOM()
                    LIMIT 4
                """)
                rows = cur.fetchall()
                for row in rows:
                    videos.append({
                        'id': str(row[0]),
                        'title': row[1] or '',
                        'content': row[2] or '',
                        'media_type': row[3],
                        'media_url': row[4] or '',
                        'thumbnail_url': row[5] or '',
                        'created_by': str(row[6]) if row[6] else 'Unknown',
                        'created_at': row[7].isoformat() if row[7] else None,
                        'likes_count': row[8] or 0,
                        'shares_count': row[9] or 0,
                        'views_count': row[10] or 0,
                        'content_type': 'post'
                    })
            except Exception as e:
                print(f"Error fetching videos: {str(e)}")

            # Get 4 random photos
            photos = []
            try:
                cur.execute("""
                    SELECT id, title, content, media_type, media_url, thumbnail_url,
                           created_by, created_at, likes_count, shares_count, views_count
                    FROM posts
                    WHERE media_type = 'image' AND is_published = TRUE
                    ORDER BY RANDOM()
                    LIMIT 4
                """)
                rows = cur.fetchall()
                for row in rows:
                    photos.append({
                        'id': str(row[0]),
                        'title': row[1] or '',
                        'content': row[2] or '',
                        'media_type': row[3],
                        'media_url': row[4] or '',
                        'thumbnail_url': row[5] or '',
                        'created_by': str(row[6]) if row[6] else 'Unknown',
                        'created_at': row[7].isoformat() if row[7] else None,
                        'likes_count': row[8] or 0,
                        'shares_count': row[9] or 0,
                        'views_count': row[10] or 0,
                        'content_type': 'post'
                    })
            except Exception as e:
                print(f"Error fetching photos: {str(e)}")

            # Get active advertisements
            ads = []
            try:
                cur.execute("""
                    SELECT id, title, description, media_type, media_url,
                           link_url, start_date, end_date
                    FROM advertisements
                    WHERE status = 'active'
                    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
                    ORDER BY created_at DESC
                """)
                rows = cur.fetchall()
                for row in rows:
                    ads.append({
                        'id': str(row[0]),
                        'title': row[1] or '',
                        'description': row[2] or '',
                        'media_type': row[3] or '',
                        'media_url': row[4] or '',
                        'link_url': row[5] or '',
                        'start_date': row[6].isoformat() if row[6] else None,
                        'end_date': row[7].isoformat() if row[7] else None
                    })
            except Exception as e:
                print(f"Error fetching ads: {str(e)}")

            cur.close()

            # Meetings - empty for now (dummy/placeholder)
            meetings = []

            return jsonify({
                'success': True,
                'data': {
                    'videos': videos,
                    'photos': photos,
                    'ads': ads,
                    'meetings': meetings
                }
            }), 200

        finally:
            return_db_connection(conn)

    except Exception as e:
        print(f"Error in get_home_data: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to fetch home data: {str(e)}'}), 500
