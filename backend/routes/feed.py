"""
Feed Routes - Content feed and interaction endpoints
Provides mixed feed of posts and advertisements with interaction tracking
"""
from flask import Blueprint, request, jsonify
from utils.db import get_db_connection, return_db_connection
from utils.auth import token_required, get_current_user_id
from utils.validators import validate_pagination, validate_interaction_type
from utils.rate_limiter import limiter
from datetime import datetime

feed_bp = Blueprint("feed", __name__)


@feed_bp.route("/api/feed", methods=["GET"])
@token_required
def get_feed():
    """Get mixed feed of posts and advertisements with pagination"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Validate pagination parameters
        page, limit = validate_pagination(
            request.args.get('page', 1),
            request.args.get('limit', 10),
            max_limit=50
        )
        offset = (page - 1) * limit

        # Calculate posts needed (accounting for ads inserted every 5 posts)
        # For 10 items with 1 ad per 5 posts, we need ~8-9 posts
        ad_interval = 5
        posts_per_page = limit - (limit // (ad_interval + 1))
        posts_offset = offset - (offset // (ad_interval + 1))

        # Get total posts count for pagination
        cur.execute("SELECT COUNT(*) FROM posts WHERE is_published = true")
        total_posts = cur.fetchone()[0]

        # Get published posts with SQL-level pagination
        cur.execute("""
            SELECT
                id, title, content, media_type, media_url,
                thumbnail_url, created_by, created_at,
                likes_count, shares_count, views_count,
                'post' as content_type
            FROM posts
            WHERE is_published = true
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """, (posts_per_page + 2, posts_offset))  # Fetch a few extra to ensure we have enough
        posts = cur.fetchall()

        # Get active advertisements (usually few, OK to fetch all active)
        cur.execute("""
            SELECT
                id, title, '' as content, media_type, media_url,
                media_url as thumbnail_url, NULL as created_by, created_at,
                0 as likes_count, 0 as shares_count, 0 as views_count,
                'ad' as content_type, ad_type
            FROM advertisements
            WHERE status = 'active'
            AND (start_date IS NULL OR start_date <= CURRENT_DATE)
            AND (end_date IS NULL OR end_date >= CURRENT_DATE)
            ORDER BY created_at DESC
            LIMIT 10
        """)
        ads = cur.fetchall()

        # Format posts
        formatted_content = []
        for post in posts:
            formatted_content.append({
                "id": str(post[0]),
                "title": post[1] or "",
                "content": post[2] or "",
                "media_type": post[3],
                "media_url": post[4],
                "thumbnail_url": post[5] or post[4],
                "created_by": str(post[6]) if post[6] else "BigTreat",
                "created_at": post[7].isoformat() if post[7] else datetime.now().isoformat(),
                "likes_count": post[8] or 0,
                "shares_count": post[9] or 0,
                "views_count": post[10] or 0,
                "content_type": post[11]
            })

        # Format ads
        formatted_ads = []
        for ad in ads:
            formatted_ads.append({
                "id": str(ad[0]),
                "title": ad[1] or "Advertisement",
                "content": ad[2] or "",
                "media_type": ad[3],
                "media_url": ad[4],
                "thumbnail_url": ad[5],
                "created_by": "Sponsored",
                "created_at": ad[7].isoformat() if ad[7] else datetime.now().isoformat(),
                "likes_count": 0,
                "shares_count": 0,
                "views_count": 0,
                "content_type": "ad",
                "ad_type": ad[12] if len(ad) > 12 else "banner"
            })

        # Mix ads into posts (1 ad every 5 posts)
        mixed_feed = []
        ad_index = 0
        ad_interval = 5

        for i, post in enumerate(formatted_content):
            mixed_feed.append(post)

            # Insert ad every N posts if ads available
            if (i + 1) % ad_interval == 0 and ad_index < len(formatted_ads):
                mixed_feed.append(formatted_ads[ad_index])
                ad_index += 1

        # Add remaining ads at the end
        while ad_index < len(formatted_ads):
            mixed_feed.append(formatted_ads[ad_index])
            ad_index += 1

        # Apply final limit to mixed feed (already paginated at SQL level)
        paginated_feed = mixed_feed[:limit]

        # Calculate total items including ads
        total_ads = len(ads)
        total_items = total_posts + (total_posts // ad_interval)

        cur.close()

        return jsonify({
            "feed": paginated_feed,
            "page": page,
            "limit": limit,
            "total": total_items,
            "has_more": (offset + limit) < total_items
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch feed"}), 500
    finally:
        if conn:
            if 'cur' in locals():
                cur.close()
            return_db_connection(conn)


@feed_bp.route("/api/feed/<content_id>/interact", methods=["POST"])
@limiter.limit("60 per minute")
@token_required
def interact_with_content(content_id):
    """
    Record user interaction with content (like, share, view)
    Prevents duplicate interactions from same user
    """
    conn = None
    try:
        data = request.json or {}
        interaction_type = data.get('type', '').lower()

        # Validate interaction type
        is_valid, error = validate_interaction_type(interaction_type)
        if not is_valid:
            return jsonify({"error": error}), 400

        user_id = get_current_user_id()
        if not user_id:
            return jsonify({"error": "Authentication required"}), 401

        conn = get_db_connection()
        cur = conn.cursor()

        # Check if post exists
        cur.execute("SELECT id FROM posts WHERE id = %s", (content_id,))
        if not cur.fetchone():
            return jsonify({"error": "Content not found"}), 404

        # Check for existing interaction (prevent duplicates for likes)
        if interaction_type == 'like':
            cur.execute("""
                SELECT id FROM user_interactions
                WHERE user_id = %s AND content_id = %s AND interaction_type = 'like'
            """, (user_id, content_id))

            if cur.fetchone():
                # User already liked - remove the like (toggle behavior)
                cur.execute("""
                    DELETE FROM user_interactions
                    WHERE user_id = %s AND content_id = %s AND interaction_type = 'like'
                """, (user_id, content_id))

                cur.execute("""
                    UPDATE posts
                    SET likes_count = GREATEST(likes_count - 1, 0)
                    WHERE id = %s
                    RETURNING likes_count
                """, (content_id,))

                new_count = cur.fetchone()[0]
                conn.commit()

                return jsonify({
                    "success": True,
                    "action": "unliked",
                    "new_count": new_count
                }), 200

        # Record interaction
        cur.execute("""
            INSERT INTO user_interactions (user_id, content_id, interaction_type)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id, content_id, interaction_type) DO NOTHING
        """, (user_id, content_id, interaction_type))

        # Update the appropriate counter
        if interaction_type == 'like':
            cur.execute("""
                UPDATE posts
                SET likes_count = likes_count + 1
                WHERE id = %s
                RETURNING likes_count
            """, (content_id,))
            new_count = cur.fetchone()[0]
        elif interaction_type == 'share':
            cur.execute("""
                UPDATE posts
                SET shares_count = shares_count + 1
                WHERE id = %s
                RETURNING shares_count
            """, (content_id,))
            new_count = cur.fetchone()[0]
        else:  # view
            cur.execute("""
                UPDATE posts
                SET views_count = views_count + 1
                WHERE id = %s
                RETURNING views_count
            """, (content_id,))
            new_count = cur.fetchone()[0]

        conn.commit()

        return jsonify({
            "success": True,
            "action": interaction_type,
            "new_count": new_count
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "Failed to record interaction"}), 500
    finally:
        if conn:
            if 'cur' in locals():
                cur.close()
            return_db_connection(conn)


@feed_bp.route("/api/feed/<content_id>/interactions", methods=["GET"])
@token_required
def get_user_interactions(content_id):
    """Get current user's interactions with a piece of content"""
    conn = None
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({"error": "Authentication required"}), 401

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT interaction_type FROM user_interactions
            WHERE user_id = %s AND content_id = %s
        """, (user_id, content_id))

        interactions = [row[0] for row in cur.fetchall()]
        cur.close()

        return jsonify({
            "success": True,
            "interactions": interactions,
            "has_liked": 'like' in interactions,
            "has_shared": 'share' in interactions
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch interactions"}), 500
    finally:
        if conn:
            return_db_connection(conn)
