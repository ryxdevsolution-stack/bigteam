from flask import Blueprint, request, jsonify
from utils.db import get_db_connection, return_db_connection
from datetime import datetime

feed_bp = Blueprint("feed", __name__)

@feed_bp.route("/api/feed", methods=["GET"])
def get_feed():
    """Get mixed feed of posts and advertisements"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Get page and limit from query params
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        offset = (page - 1) * limit

        # Get all posts (published or all if no published flag)
        cur.execute("""
            SELECT
                id, title, content, media_type, media_url,
                thumbnail_url, created_by, created_at,
                likes_count, shares_count, views_count,
                'post' as content_type
            FROM posts
            WHERE is_published = true OR is_published IS NULL
            ORDER BY created_at DESC
        """)
        posts = cur.fetchall()

        # First, check all ads without date filtering for debugging
        try:
            cur.execute("""
                SELECT id, title, is_active, start_date, end_date
                FROM advertisements
            """)
            all_ads_debug = cur.fetchall()
            print(f"DEBUG: Total ads in database: {len(all_ads_debug)}")
            for ad in all_ads_debug:
                print(f"  Ad: {ad[1]}, Active: {ad[2]}, Start: {ad[3]}, End: {ad[4]}")
        except Exception as e:
            print(f"DEBUG ERROR checking all ads: {e}")

        # Get all active advertisements (simplified query - only check is_active)
        try:
            cur.execute("""
                SELECT
                    id, title, '' as content, media_type, media_url,
                    media_url as thumbnail_url, NULL as created_by, created_at,
                    0 as likes_count, 0 as shares_count, 0 as views_count,
                    'ad' as content_type, ad_type
                FROM advertisements
                WHERE is_active = true OR is_active IS NULL
                ORDER BY created_at DESC
            """)
            ads = cur.fetchall()
        except Exception as e:
            print(f"DEBUG ERROR fetching ads: {e}")
            ads = []

        # Debug: Print ad query results
        print(f"DEBUG: Found {len(ads)} active advertisements (ignoring dates)")
        for ad in ads[:3]:  # Print first 3 ads for debugging
            print(f"  Ad: {ad[1]} - Type: {ad[3]} - Active check passed")

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
                "created_by": str(post[6]) if post[6] else "BigTeam",
                "created_at": post[7].isoformat() if post[7] else datetime.now().isoformat(),
                "likes_count": post[8] if post[8] is not None else 0,
                "shares_count": post[9] if post[9] is not None else 0,
                "views_count": post[10] if post[10] is not None else 0,
                "content_type": post[11]
            })

        # Format ads
        formatted_ads = []
        print(f"DEBUG: Processing {len(ads)} ads for formatting")
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
        print(f"DEBUG: Mixing {len(formatted_ads)} ads into {len(formatted_content)} posts")

        for i, post in enumerate(formatted_content):
            mixed_feed.append(post)

            # Insert ad every 5 posts if ads available
            if (i + 1) % 5 == 0 and ad_index < len(formatted_ads):
                print(f"DEBUG: Inserting ad at position {len(mixed_feed)} after post {i+1}")
                mixed_feed.append(formatted_ads[ad_index])
                ad_index += 1

        # Add remaining ads at the end if any
        while ad_index < len(formatted_ads):
            mixed_feed.append(formatted_ads[ad_index])
            ad_index += 1

        # Paginate the mixed feed
        start = offset
        end = offset + limit
        paginated_feed = mixed_feed[start:end]

        # Debug: Check content types in paginated feed
        content_types = [item['content_type'] for item in paginated_feed]
        print(f"DEBUG: Page {page} content types: {content_types}")
        print(f"DEBUG: Returning {len(paginated_feed)} items (offset: {start}, limit: {limit})")

        # Update view counts for returned content
        for content in paginated_feed:
            if content['content_type'] == 'post':
                try:
                    cur.execute("""
                        UPDATE posts
                        SET views_count = views_count + 1
                        WHERE id = %s
                    """, (content['id'],))
                    content['views_count'] += 1
                except:
                    pass  # Ignore view count update errors

        conn.commit()

        return jsonify({
            "feed": paginated_feed,
            "page": page,
            "limit": limit,
            "total": len(mixed_feed),
            "has_more": end < len(mixed_feed)
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to fetch feed: {str(e)}"}), 500
    finally:
        if conn:
            if 'cur' in locals():
                cur.close()
            return_db_connection(conn)

@feed_bp.route("/api/feed/<content_id>/interact", methods=["POST"])
def interact_with_content(content_id):
    """Record user interaction with content"""
    conn = None
    try:
        interaction_type = request.json.get('type')  # 'like', 'share'

        if interaction_type not in ['like', 'share']:
            return jsonify({"error": "Invalid interaction type"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        # Update the appropriate counter
        if interaction_type == 'like':
            cur.execute("""
                UPDATE posts
                SET likes_count = likes_count + 1
                WHERE id = %s
                RETURNING likes_count
            """, (content_id,))
        else:  # share
            cur.execute("""
                UPDATE posts
                SET shares_count = shares_count + 1
                WHERE id = %s
                RETURNING shares_count
            """, (content_id,))

        result = cur.fetchone()
        conn.commit()

        if result:
            return jsonify({
                "success": True,
                "new_count": result[0]
            }), 200
        else:
            return jsonify({"error": "Content not found"}), 404

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Failed to record interaction: {str(e)}"}), 500
    finally:
        if conn:
            if 'cur' in locals():
                cur.close()
            return_db_connection(conn)