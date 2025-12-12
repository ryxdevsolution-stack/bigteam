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
    """
    Get all home page data in single optimized call (videos, photos, ads, meetings)
    Uses a single query with CTEs to minimize database round-trips
    """
    try:
        from utils.db import get_db_connection, return_db_connection
        from psycopg2.extras import RealDictCursor

        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)

            # Single optimized query using CTEs - fetches all data in one round-trip
            cur.execute("""
                WITH videos AS (
                    SELECT id, title, content, media_type, media_url, thumbnail_url,
                           created_by, created_at, likes_count, shares_count, views_count,
                           'video' as data_type
                    FROM posts
                    WHERE media_type = 'video' AND is_published = TRUE
                    ORDER BY created_at DESC
                    LIMIT 4
                ),
                photos AS (
                    SELECT id, title, content, media_type, media_url, thumbnail_url,
                           created_by, created_at, likes_count, shares_count, views_count,
                           'photo' as data_type
                    FROM posts
                    WHERE media_type = 'image' AND is_published = TRUE
                    ORDER BY created_at DESC
                    LIMIT 4
                ),
                active_ads AS (
                    SELECT id, title, description, media_type, media_url,
                           link_url, start_date, end_date,
                           NULL::bigint as likes_count, NULL::bigint as shares_count,
                           NULL::bigint as views_count, NULL::uuid as created_by,
                           NULL::timestamp as created_at, NULL::text as content,
                           NULL::text as thumbnail_url,
                           'ad' as data_type
                    FROM advertisements
                    WHERE status = 'active'
                    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
                    ORDER BY created_at DESC
                    LIMIT 10
                ),
                upcoming_meetings AS (
                    SELECT id, title, description, zoom_link, meeting_date,
                           meeting_time, duration_minutes, host_name,
                           NULL::bigint as likes_count, NULL::bigint as shares_count,
                           NULL::bigint as views_count, NULL::uuid as created_by,
                           NULL::timestamp as created_at, NULL::text as content,
                           NULL::text as thumbnail_url, NULL::text as media_type,
                           NULL::text as media_url, NULL::text as link_url,
                           NULL::date as start_date, NULL::date as end_date,
                           'meeting' as data_type
                    FROM meetings
                    WHERE is_active = true AND meeting_date >= CURRENT_DATE
                    ORDER BY meeting_date ASC, meeting_time ASC
                    LIMIT 3
                )
                -- Videos
                SELECT id, title, content, media_type, media_url, thumbnail_url,
                       created_by, created_at, likes_count, shares_count, views_count,
                       data_type, NULL as description, NULL as link_url,
                       NULL as start_date, NULL as end_date,
                       NULL as zoom_link, NULL as meeting_date, NULL as meeting_time,
                       NULL as duration_minutes, NULL as host_name
                FROM videos
                UNION ALL
                -- Photos
                SELECT id, title, content, media_type, media_url, thumbnail_url,
                       created_by, created_at, likes_count, shares_count, views_count,
                       data_type, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
                FROM photos
                UNION ALL
                -- Ads
                SELECT id, title, content, media_type, media_url, thumbnail_url,
                       created_by, created_at, likes_count, shares_count, views_count,
                       data_type, description, link_url, start_date, end_date,
                       NULL, NULL, NULL, NULL, NULL
                FROM active_ads
                UNION ALL
                -- Meetings
                SELECT id, title, content, media_type, media_url, thumbnail_url,
                       created_by, created_at, likes_count, shares_count, views_count,
                       data_type, description, link_url, start_date, end_date,
                       zoom_link, meeting_date, meeting_time, duration_minutes, host_name
                FROM upcoming_meetings
            """)

            rows = cur.fetchall()
            cur.close()

            # Organize results by data_type
            videos = []
            photos = []
            ads = []
            meetings = []

            for row in rows:
                data_type = row['data_type']

                if data_type == 'video':
                    videos.append({
                        'id': str(row['id']),
                        'title': row['title'] or '',
                        'content': row['content'] or '',
                        'media_type': row['media_type'],
                        'media_url': row['media_url'] or '',
                        'thumbnail_url': row['thumbnail_url'] or '',
                        'created_by': str(row['created_by']) if row['created_by'] else 'Unknown',
                        'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                        'likes_count': row['likes_count'] or 0,
                        'shares_count': row['shares_count'] or 0,
                        'views_count': row['views_count'] or 0,
                        'content_type': 'post'
                    })
                elif data_type == 'photo':
                    photos.append({
                        'id': str(row['id']),
                        'title': row['title'] or '',
                        'content': row['content'] or '',
                        'media_type': row['media_type'],
                        'media_url': row['media_url'] or '',
                        'thumbnail_url': row['thumbnail_url'] or '',
                        'created_by': str(row['created_by']) if row['created_by'] else 'Unknown',
                        'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                        'likes_count': row['likes_count'] or 0,
                        'shares_count': row['shares_count'] or 0,
                        'views_count': row['views_count'] or 0,
                        'content_type': 'post'
                    })
                elif data_type == 'ad':
                    ads.append({
                        'id': str(row['id']),
                        'title': row['title'] or '',
                        'description': row['description'] or '',
                        'media_type': row['media_type'] or '',
                        'media_url': row['media_url'] or '',
                        'link_url': row['link_url'] or '',
                        'start_date': row['start_date'].isoformat() if row['start_date'] else None,
                        'end_date': row['end_date'].isoformat() if row['end_date'] else None
                    })
                elif data_type == 'meeting':
                    meetings.append({
                        'id': str(row['id']),
                        'title': row['title'] or '',
                        'description': row['description'] or '',
                        'zoom_link': row['zoom_link'] or '',
                        'meeting_date': row['meeting_date'].isoformat() if row['meeting_date'] else None,
                        'meeting_time': row['meeting_time'].strftime("%H:%M") if row['meeting_time'] else None,
                        'duration_minutes': row['duration_minutes'] or 60,
                        'host_name': row['host_name'] or ''
                    })

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

    except Exception:
        return jsonify({'error': 'Failed to fetch home data'}), 500
