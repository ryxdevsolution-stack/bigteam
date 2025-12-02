"""
Post Routes - Content upload and management endpoints
All endpoints require proper authentication and authorization
"""
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import time
from uuid import uuid4
import os
from datetime import datetime

from utils.db import get_db_connection, return_db_connection, supabase
from utils.auth import token_required, admin_required, get_current_user_id, get_current_user_role
from utils.validators import sanitize_string, validate_media_type, validate_file_extension, validate_file_content

post_bp = Blueprint("posts", __name__)

ALLOWED_EXTENSIONS = {"mp4", "mov", "jpg", "jpeg", "png", "gif", "webp"}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
bucket_name = "bigteam-video"


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def ensure_bucket_exists():
    """Ensure the storage bucket exists in Supabase"""
    try:
        buckets = supabase.storage.list_buckets()
        bucket_exists = any(b.name == bucket_name for b in buckets)

        if not bucket_exists:
            supabase.storage.create_bucket(bucket_name, {
                'public': True,
                'allowed_mime_types': ['image/*', 'video/*']
            })
        return True
    except Exception:
        try:
            supabase.storage.create_bucket(bucket_name, public=True)
            return True
        except Exception:
            return True


ensure_bucket_exists()


@post_bp.route("/upload", methods=["POST"])
@token_required
def upload_post():
    """Upload a new post (authenticated users only)"""
    # Get current user from token
    current_user_id = get_current_user_id()

    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]
    title = sanitize_string(request.form.get("title", ""), max_length=255)
    content = sanitize_string(request.form.get("content", ""), max_length=5000)
    media_type = request.form.get("media_type", "").lower()
    thumbnail_file = request.files.get("thumbnail", None)
    thumbnail_url = None

    # Validate required fields
    if not file or file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not title:
        return jsonify({"error": "Title is required"}), 400

    # Validate media type
    is_valid, result = validate_media_type(media_type)
    if not is_valid:
        return jsonify({"error": result}), 400

    # Validate file extension
    is_valid, ext = validate_file_extension(file.filename, ALLOWED_EXTENSIONS)
    if not is_valid:
        return jsonify({"error": ext}), 400

    # Check file size
    file.seek(0, 2)
    file_size = file.tell()
    file.seek(0)

    if file_size > MAX_FILE_SIZE:
        return jsonify({"error": f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"}), 400

    # Create unique filename with folder structure
    base_filename = f"{media_type}_{uuid4().hex}_{int(time.time())}.{ext}"

    if media_type == "video":
        filename = f"video/{base_filename}"
    elif media_type == "image":
        filename = f"image/{base_filename}"
    elif media_type == "ad":
        # Only admins can upload ads
        if get_current_user_role() != 'admin':
            return jsonify({"error": "Only admins can upload advertisements"}), 403
        filename = f"Ad/{base_filename}"
    else:
        filename = base_filename

    file_content = file.read()

    # SECURITY: Validate file content matches claimed type (prevents extension spoofing)
    is_valid, content_result = validate_file_content(file_content, media_type)
    if not is_valid:
        return jsonify({"error": content_result}), 400

    # Upload thumbnail if provided (for videos)
    if thumbnail_file and media_type == "video":
        try:
            thumbnail_ext = "jpg"
            thumbnail_filename = f"video/thumbnail_{uuid4().hex}_{int(time.time())}.{thumbnail_ext}"
            thumbnail_file.seek(0)
            thumbnail_content = thumbnail_file.read()

            supabase.storage.from_(bucket_name).upload(
                path=thumbnail_filename,
                file=thumbnail_content,
                file_options={"content-type": "image/jpeg"}
            )
            thumbnail_url = supabase.storage.from_(bucket_name).get_public_url(thumbnail_filename)
        except Exception:
            thumbnail_url = None

    # Upload to Supabase Storage
    try:
        supabase.storage.from_(bucket_name).upload(
            path=filename,
            file=file_content,
            file_options={"content-type": file.content_type}
        )
        media_url = supabase.storage.from_(bucket_name).get_public_url(filename)

    except Exception as e:
        error_msg = str(e)

        if "duplicate" in error_msg.lower() or "already exists" in error_msg.lower():
            try:
                media_url = supabase.storage.from_(bucket_name).get_public_url(filename)
            except Exception:
                base_filename = f"{media_type}_{uuid4().hex}_{int(time.time())}_retry.{ext}"
                if media_type == "video":
                    filename = f"video/{base_filename}"
                elif media_type == "image":
                    filename = f"image/{base_filename}"
                elif media_type == "ad":
                    filename = f"Ad/{base_filename}"
                else:
                    filename = base_filename
                try:
                    supabase.storage.from_(bucket_name).upload(
                        path=filename,
                        file=file_content,
                        file_options={"content-type": file.content_type}
                    )
                    media_url = supabase.storage.from_(bucket_name).get_public_url(filename)
                except Exception as retry_error:
                    return jsonify({"error": "Upload failed"}), 500
        else:
            try:
                ensure_bucket_exists()
                base_filename = f"{media_type}_{int(time.time())}.{ext}"
                if media_type == "video":
                    filename = f"video/{base_filename}"
                elif media_type == "image":
                    filename = f"image/{base_filename}"
                elif media_type == "ad":
                    filename = f"Ad/{base_filename}"
                else:
                    filename = base_filename
                supabase.storage.from_(bucket_name).upload(filename, file_content)
                media_url = supabase.storage.from_(bucket_name).get_public_url(filename)

            except Exception:
                return jsonify({"error": "Upload failed"}), 500

    # Save post to database with authenticated user as creator
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO posts (title, content, media_type, media_url, thumbnail_url, created_by, is_published)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at;
        """, (title, content, media_type, media_url, thumbnail_url, current_user_id, True))

        result = cur.fetchone()
        post_id = str(result[0])
        created_at = result[1].isoformat() if result[1] else datetime.now().isoformat()

        conn.commit()

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "Failed to save post"}), 500
    finally:
        if conn:
            if 'cur' in locals():
                cur.close()
            return_db_connection(conn)

    if media_type == "image" and not thumbnail_url:
        thumbnail_url = media_url

    return jsonify({
        "message": "Post uploaded successfully",
        "post": {
            "id": post_id,
            "title": title,
            "content": content,
            "media_type": media_type,
            "media_url": media_url,
            "thumbnail_url": thumbnail_url or media_url,
            "created_by": current_user_id,
            "created_at": created_at
        }
    }), 201


@post_bp.route("/api/posts", methods=["GET"])
@token_required
def get_posts():
    """Get all posts (authenticated users only)"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT id, title, content, media_type, media_url, thumbnail_url,
                   created_by, created_at, is_published, likes_count, shares_count, views_count
            FROM posts
            WHERE is_published = true
            ORDER BY created_at DESC
        """)
        posts = cur.fetchall()
        cur.close()

        formatted_posts = []
        for post in posts:
            formatted_posts.append({
                "id": str(post[0]),
                "title": post[1] or "Untitled",
                "content": post[2] or "",
                "media_type": post[3] or "image",
                "media_url": post[4] or "",
                "thumbnail_url": post[5] or post[4] or "",
                "created_by": str(post[6]) if post[6] else "unknown",
                "created_at": post[7].isoformat() if post[7] else datetime.now().isoformat(),
                "is_published": post[8] if post[8] is not None else True,
                "likes_count": post[9] or 0,
                "shares_count": post[10] or 0,
                "views_count": post[11] or 0
            })

        return jsonify(formatted_posts), 200

    except Exception:
        return jsonify([]), 200
    finally:
        if conn:
            return_db_connection(conn)


@post_bp.route("/api/posts/<post_id>", methods=["GET"])
@token_required
def get_post(post_id):
    """Get single post by ID (authenticated users only)"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, title, content, media_type, media_url, thumbnail_url,
                   created_by, created_at, likes_count, shares_count, views_count
            FROM posts
            WHERE id = %s
        """, (post_id,))
        post = cur.fetchone()
        cur.close()

        if post:
            return jsonify({
                "id": str(post[0]),
                "title": post[1] or "Untitled",
                "content": post[2] or "",
                "media_type": post[3] or "image",
                "media_url": post[4] or "",
                "thumbnail_url": post[5] or post[4] or "",
                "created_by": str(post[6]) if post[6] else "unknown",
                "created_at": post[7].isoformat() if post[7] else datetime.now().isoformat(),
                "likes_count": post[8] or 0,
                "shares_count": post[9] or 0,
                "views_count": post[10] or 0
            }), 200
        else:
            return jsonify({"error": "Post not found"}), 404

    except Exception:
        return jsonify({"error": "Failed to fetch post"}), 500
    finally:
        if conn:
            return_db_connection(conn)


@post_bp.route("/api/admin/posts/<post_id>", methods=["PUT", "PATCH"])
@admin_required
def update_post(post_id):
    """Update post (admin only)"""
    conn = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        allowed_fields = ['title', 'content', 'is_published', 'thumbnail_url']
        update_fields = {}

        for key in allowed_fields:
            if key in data:
                if key in ['title', 'content']:
                    update_fields[key] = sanitize_string(str(data[key]), max_length=5000 if key == 'content' else 255)
                else:
                    update_fields[key] = data[key]

        if not update_fields:
            return jsonify({"error": "No valid fields to update"}), 400

        # SECURITY: Whitelist-based column name validation to prevent SQL injection
        ALLOWED_COLUMNS = {'title', 'content', 'is_published', 'thumbnail_url'}
        set_parts = []
        values = []

        for key, value in update_fields.items():
            if key in ALLOWED_COLUMNS:
                set_parts.append(f"{key} = %s")
                values.append(value)

        if not set_parts:
            return jsonify({"error": "No valid fields to update"}), 400

        set_clause = ', '.join(set_parts)
        values.append(post_id)

        cur.execute(f"""
            UPDATE posts
            SET {set_clause}, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING id, title, content, media_type, media_url, thumbnail_url,
                      created_by, created_at, updated_at, is_published,
                      likes_count, shares_count, views_count
        """, values)

        updated_post = cur.fetchone()

        if not updated_post:
            return jsonify({"error": "Post not found"}), 404

        conn.commit()
        cur.close()

        return jsonify({
            "id": str(updated_post[0]),
            "title": updated_post[1],
            "content": updated_post[2],
            "media_type": updated_post[3],
            "media_url": updated_post[4],
            "thumbnail_url": updated_post[5] or updated_post[4],
            "created_by": str(updated_post[6]) if updated_post[6] else None,
            "created_at": updated_post[7].isoformat() if updated_post[7] else None,
            "updated_at": updated_post[8].isoformat() if updated_post[8] else None,
            "is_published": updated_post[9],
            "likes_count": updated_post[10] or 0,
            "shares_count": updated_post[11] or 0,
            "views_count": updated_post[12] or 0
        }), 200

    except Exception:
        if conn:
            conn.rollback()
        return jsonify({"error": "Failed to update post"}), 500
    finally:
        if conn:
            return_db_connection(conn)


@post_bp.route("/api/posts/<post_id>", methods=["DELETE"])
@admin_required
def delete_post(post_id):
    """Delete a post (admin only)"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Check if post exists
        cur.execute("SELECT id FROM posts WHERE id = %s", (post_id,))
        if not cur.fetchone():
            return jsonify({"error": "Post not found"}), 404

        cur.execute("DELETE FROM posts WHERE id = %s", (post_id,))
        conn.commit()
        cur.close()

        return jsonify({"message": "Post deleted successfully"}), 200
    except Exception:
        return jsonify({"error": "Failed to delete post"}), 500
    finally:
        if conn:
            return_db_connection(conn)


@post_bp.route("/api/admin/posts/cleanup/test-data", methods=["DELETE"])
@admin_required
def cleanup_test_data():
    """Remove test data from posts table (admin only)"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            DELETE FROM posts
            WHERE LOWER(title) LIKE '%test%'
               OR LOWER(title) LIKE '%sample%'
               OR LOWER(content) LIKE '%test%'
               OR LOWER(content) LIKE '%lorem%'
               OR LOWER(content) LIKE '%ipsum%'
        """)
        affected = cur.rowcount
        conn.commit()
        cur.close()

        return jsonify({
            "message": f"Cleaned up {affected} test posts",
            "deleted_count": affected
        }), 200
    except Exception:
        return jsonify({"error": "Failed to cleanup test data"}), 500
    finally:
        if conn:
            return_db_connection(conn)
