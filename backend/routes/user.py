"""
User Routes - User-facing endpoints for profile, dashboard, and team members
All endpoints require authentication via JWT tokens
"""
from flask import Blueprint, request, jsonify
from services.team_service import TeamService
from utils.auth import token_required, get_current_user_id
from utils.validators import validate_full_name, validate_username

user_bp = Blueprint('user', __name__, url_prefix='/api/user')


@user_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    """Get user profile with team info"""
    try:
        # SECURITY: Always get user_id from JWT token - never from query params
        user_id = get_current_user_id()

        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401

        user = TeamService.get_user_by_id(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'success': True,
            'user': user
        }), 200

    except Exception:
        return jsonify({'error': 'Failed to fetch profile'}), 500


@user_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    """Update user profile"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body required'}), 400

        # Users can only update their own profile
        user_id = get_current_user_id()

        if not user_id:
            return jsonify({'error': 'User ID required'}), 400

        # Validate fields
        allowed_fields = ['full_name', 'username']
        update_data = {}

        if data.get('full_name'):
            is_valid, result = validate_full_name(data['full_name'])
            if not is_valid:
                return jsonify({'error': result}), 400
            update_data['full_name'] = result

        if data.get('username'):
            is_valid, result = validate_username(data['username'])
            if not is_valid:
                return jsonify({'error': result}), 400
            update_data['username'] = result

        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400

        from utils.db import get_db_connection, return_db_connection
        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # SECURITY: Whitelist-based column name validation to prevent SQL injection
            ALLOWED_COLUMNS = {'full_name', 'username'}
            set_parts = []
            values = []

            for key, value in update_data.items():
                if key in ALLOWED_COLUMNS:
                    set_parts.append(f"{key} = %s")
                    values.append(value)

            if not set_parts:
                return jsonify({'error': 'No valid fields to update'}), 400

            set_clause = ', '.join(set_parts)
            values.append(user_id)

            cur.execute(f"""
                UPDATE users
                SET {set_clause}, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id
            """, values)

            if cur.rowcount == 0:
                return jsonify({'error': 'User not found'}), 404

            conn.commit()
            cur.close()

            user = TeamService.get_user_by_id(user_id)

            return jsonify({
                'success': True,
                'message': 'Profile updated successfully',
                'user': user
            }), 200

        finally:
            return_db_connection(conn)

    except Exception as e:
        return jsonify({'error': 'Failed to update profile'}), 500


@user_bp.route('/dashboard-stats', methods=['GET'])
@token_required
def get_dashboard_stats():
    """Get dashboard statistics for user"""
    try:
        # SECURITY: Always get user_id from JWT token
        user_id = get_current_user_id()

        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401

        stats = TeamService.get_dashboard_stats(user_id)

        if not stats:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'success': True,
            'stats': stats
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch stats'}), 500


@user_bp.route('/team-members', methods=['GET'])
@token_required
def get_team_members():
    """Get user's direct team members"""
    try:
        # SECURITY: Always get user_id from JWT token
        user_id = get_current_user_id()

        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401

        team_members = TeamService.get_user_team_members(user_id)

        return jsonify({
            'success': True,
            'team_members': team_members,
            'total': len(team_members)
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch team members'}), 500


@user_bp.route('/commissions', methods=['GET'])
@token_required
def get_commissions():
    """Get user's commission history"""
    try:
        # SECURITY: Always get user_id from JWT token
        user_id = get_current_user_id()
        limit = min(int(request.args.get('limit', 50)), 100)  # Max 100

        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401

        commissions = TeamService.get_user_commissions(user_id, limit)

        return jsonify({
            'success': True,
            'commissions': commissions,
            'total': len(commissions)
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch commissions'}), 500


@user_bp.route('/settings/team', methods=['GET'])
@token_required
def get_team_settings():
    """Get team settings (activation amount, commission rate, etc.)"""
    try:
        settings = TeamService.get_settings()

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
        return jsonify({'error': 'Failed to fetch settings'}), 500


@user_bp.route('/home-data', methods=['GET'])
@token_required
def get_home_data():
    """Get all home page data in single call (videos, photos, ads, meetings)"""
    try:
        from utils.db import get_db_connection, return_db_connection
        from utils.validators import validate_pagination

        conn = get_db_connection()
        try:
            cur = conn.cursor()

            # Get random videos (limit 4) - using efficient offset-based sampling
            videos = []
            cur.execute("""
                WITH video_count AS (
                    SELECT GREATEST(COUNT(*) - 4, 0) AS max_offset
                    FROM posts WHERE media_type = 'video' AND is_published = TRUE
                )
                SELECT id, title, content, media_type, media_url, thumbnail_url,
                       created_by, created_at, likes_count, shares_count, views_count
                FROM posts
                WHERE media_type = 'video' AND is_published = TRUE
                ORDER BY created_at DESC
                LIMIT 4 OFFSET (SELECT floor(random() * max_offset) FROM video_count)
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

            # Get random photos (limit 4) - using efficient offset-based sampling
            photos = []
            cur.execute("""
                WITH photo_count AS (
                    SELECT GREATEST(COUNT(*) - 4, 0) AS max_offset
                    FROM posts WHERE media_type = 'image' AND is_published = TRUE
                )
                SELECT id, title, content, media_type, media_url, thumbnail_url,
                       created_by, created_at, likes_count, shares_count, views_count
                FROM posts
                WHERE media_type = 'image' AND is_published = TRUE
                ORDER BY created_at DESC
                LIMIT 4 OFFSET (SELECT floor(random() * max_offset) FROM photo_count)
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

            # Get active advertisements
            ads = []
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

            # Get upcoming meetings (limit 3 for home page)
            meetings = []
            cur.execute("""
                SELECT m.id, m.title, m.description, m.zoom_link, m.meeting_date,
                       m.meeting_time, m.duration_minutes, m.host_name
                FROM meetings m
                WHERE m.is_active = true
                  AND m.meeting_date >= CURRENT_DATE
                ORDER BY m.meeting_date ASC, m.meeting_time ASC
                LIMIT 3
            """)
            rows = cur.fetchall()
            for row in rows:
                meetings.append({
                    'id': str(row[0]),
                    'title': row[1] or '',
                    'description': row[2] or '',
                    'zoom_link': row[3] or '',
                    'meeting_date': row[4].isoformat() if row[4] else None,
                    'meeting_time': row[5].strftime("%H:%M") if row[5] else None,
                    'duration_minutes': row[6] or 60,
                    'host_name': row[7] or ''
                })

            cur.close()

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
        return jsonify({'error': 'Failed to fetch home data'}), 500
