from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import time
from uuid import uuid4
import os
from datetime import datetime
import ssl
import certifi
import base64

from utils.db import get_db_connection, return_db_connection, supabase  # Your existing db.py

post_bp = Blueprint("posts", __name__)

ALLOWED_EXTENSIONS = {"mp4", "mov", "jpg", "jpeg", "png", "gif"}
bucket_name = "bigteam-video"

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def ensure_bucket_exists():
    """Ensure the storage bucket exists in Supabase"""
    try:
        # Try to list buckets to check if our bucket exists
        buckets = supabase.storage.list_buckets()
        bucket_exists = any(b.name == bucket_name for b in buckets)

        if not bucket_exists:
            # Create the bucket if it doesn't exist
            supabase.storage.create_bucket(bucket_name, {
                'public': True,  # Make bucket public for media access
                'allowed_mime_types': ['image/*', 'video/*']
            })
            print(f"Created bucket: {bucket_name}")
        return True
    except Exception as e:
        print(f"Error checking/creating bucket: {str(e)}")
        # Try alternative method to create bucket
        try:
            supabase.storage.create_bucket(bucket_name, public=True)
            print(f"Created bucket: {bucket_name} (alternative method)")
            return True
        except:
            # Bucket might already exist, continue
            return True

# Ensure bucket exists on startup
ensure_bucket_exists()

@post_bp.route("/upload", methods=["POST"])
def upload_post():
    # Validate file existence
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]
    title = request.form.get("title")
    content = request.form.get("content", "")
    media_type = request.form.get("media_type")  # 'video' or 'image'
    created_by = request.form.get("created_by")  # user UUID
    thumbnail_file = request.files.get("thumbnail", None)  # optional thumbnail file
    thumbnail_url = None

    # Validate required fields
    if not file or file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    if not title or not media_type or not created_by:
        return jsonify({"error": "Missing required fields"}), 400
    if media_type not in ["video", "image", "ad"]:
        return jsonify({"error": "Invalid media_type"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed"}), 400

    # Create a unique filename
    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"{media_type}_{uuid4().hex}_{int(time.time())}.{ext}"

    # Read file content
    file.seek(0)  # Ensure we're at the beginning of the file
    file_content = file.read()

    # Upload thumbnail first if provided (for videos)
    if thumbnail_file and media_type == "video":
        try:
            thumbnail_ext = "jpg"
            thumbnail_filename = f"thumbnail_{uuid4().hex}_{int(time.time())}.{thumbnail_ext}"
            thumbnail_file.seek(0)
            thumbnail_content = thumbnail_file.read()

            # Upload thumbnail to Supabase
            thumbnail_response = supabase.storage.from_(bucket_name).upload(
                path=thumbnail_filename,
                file=thumbnail_content,
                file_options={"content-type": "image/jpeg"}
            )
            thumbnail_url = supabase.storage.from_(bucket_name).get_public_url(thumbnail_filename)
            print(f"Thumbnail uploaded successfully: {thumbnail_filename}")
        except Exception as e:
            print(f"Thumbnail upload failed (continuing without thumbnail): {str(e)}")
            thumbnail_url = None

    # Upload to Supabase Storage
    try:
        # Method 1: Direct upload with file bytes
        response = supabase.storage.from_(bucket_name).upload(
            path=filename,
            file=file_content,
            file_options={"content-type": file.content_type}
        )

        # Get public URL
        media_url = supabase.storage.from_(bucket_name).get_public_url(filename)
        print(f"File uploaded successfully to Supabase: {filename}")

    except Exception as e:
        error_msg = str(e)
        print(f"Supabase upload error: {error_msg}")

        # If it's a duplicate file error, try to get the existing URL
        if "duplicate" in error_msg.lower() or "already exists" in error_msg.lower():
            try:
                media_url = supabase.storage.from_(bucket_name).get_public_url(filename)
                print(f"File already exists, using existing URL: {media_url}")
            except:
                # Generate a new filename and retry
                filename = f"{media_type}_{uuid4().hex}_{int(time.time())}_retry.{ext}"
                try:
                    response = supabase.storage.from_(bucket_name).upload(
                        path=filename,
                        file=file_content,
                        file_options={"content-type": file.content_type}
                    )
                    media_url = supabase.storage.from_(bucket_name).get_public_url(filename)
                    print(f"Uploaded with new filename: {filename}")
                except Exception as retry_error:
                    return jsonify({"error": f"Upload failed after retry: {str(retry_error)}"}), 500
        else:
            # Try alternative upload method
            try:
                # Ensure bucket exists
                ensure_bucket_exists()

                # Try with a simpler approach
                filename = f"{media_type}_{int(time.time())}.{ext}"
                response = supabase.storage.from_(bucket_name).upload(filename, file_content)
                media_url = supabase.storage.from_(bucket_name).get_public_url(filename)
                print(f"Uploaded using alternative method: {filename}")

            except Exception as alt_error:
                return jsonify({
                    "error": "Supabase upload failed. Please check your Supabase configuration.",
                    "details": str(alt_error)
                }), 500

    # Generate a unique post ID
    post_id = str(uuid4())
    created_at = datetime.now().isoformat()

    # Save post info to DB (REQUIRED - don't continue without saving)
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Ensure created_by is a valid UUID or use NULL
        if not created_by or created_by == '1':
            created_by = None  # Use NULL for anonymous posts

        cur.execute("""
            INSERT INTO posts (title, content, media_type, media_url, thumbnail_url, created_by, is_published)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at;
        """, (title, content, media_type, media_url, thumbnail_url, created_by, True))

        result = cur.fetchone()
        if result:
            post_id = str(result[0])
            created_at = result[1].isoformat() if result[1] else datetime.now().isoformat()

        conn.commit()
        print(f"Post saved to database with ID: {post_id}")

    except Exception as e:
        print(f"Database error: {str(e)}")
        if conn:
            conn.rollback()
        # Return error - don't continue without saving to database
        return jsonify({
            "error": "Failed to save post to database",
            "details": str(e)
        }), 500
    finally:
        if conn:
            if 'cur' in locals():
                cur.close()
            return_db_connection(conn)

    # For images, use the image URL as thumbnail if no thumbnail provided
    if media_type == "image" and not thumbnail_url:
        thumbnail_url = media_url

    # Return response
    return jsonify({
        "message": "Post uploaded successfully",
        "post": {
            "id": post_id,
            "title": title,
            "content": content,
            "media_type": media_type,
            "media_url": media_url,
            "thumbnail_url": thumbnail_url or media_url,  # Use media_url as thumbnail if not provided
            "created_by": created_by,
            "created_at": created_at
        }
    }), 201

# Removed local file serving - using Supabase storage only

@post_bp.route("/api/storage/check", methods=["GET"])
def check_storage():
    """Check Supabase storage configuration"""
    try:
        # List all buckets
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets] if buckets else []

        # Check if our bucket exists
        bucket_exists = bucket_name in bucket_names

        # Try to create bucket if it doesn't exist
        if not bucket_exists:
            try:
                supabase.storage.create_bucket(bucket_name, public=True)
                message = f"Bucket '{bucket_name}' created successfully"
                bucket_exists = True
            except Exception as create_error:
                message = f"Bucket creation failed: {str(create_error)}"
        else:
            message = f"Bucket '{bucket_name}' already exists"

        return jsonify({
            "buckets": bucket_names,
            "target_bucket": bucket_name,
            "bucket_exists": bucket_exists,
            "message": message,
            "supabase_url": os.getenv("SUPABASE_URL", "Not configured")
        }), 200
    except Exception as e:
        return jsonify({
            "error": str(e),
            "message": "Failed to connect to Supabase storage"
        }), 500

@post_bp.route("/api/posts", methods=["GET"])
def get_posts():
    """Get all posts from database"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Fetch all posts from database
        cur.execute("""
            SELECT id, title, content, media_type, media_url, thumbnail_url,
                   created_by, created_at, is_published
            FROM posts
            ORDER BY created_at DESC
        """)
        posts = cur.fetchall()
        cur.close()

        # Format posts for response
        formatted_posts = []
        for post in posts:
            formatted_posts.append({
                "id": str(post[0]) if post[0] else str(uuid4()),
                "title": post[1] or "Untitled",
                "content": post[2] or "",
                "media_type": post[3] or "image",
                "media_url": post[4] or "",
                "thumbnail_url": post[5] or post[4] or "",
                "created_by": str(post[6]) if post[6] else "unknown",
                "created_at": post[7].isoformat() if post[7] else datetime.now().isoformat(),
                "updated_at": post[7].isoformat() if post[7] else datetime.now().isoformat(),
                "is_published": post[8] if len(post) > 8 else True,
                "likes_count": 0,
                "shares_count": 0,
                "views_count": 0
            })

        print(f"Returning {len(formatted_posts)} posts from database")
        return jsonify(formatted_posts), 200

    except Exception as e:
        print(f"Database error in get_posts: {str(e)}")
        # Return empty array if database fails
        return jsonify([]), 200
    finally:
        if conn:
            return_db_connection(conn)

@post_bp.route("/api/posts/<post_id>", methods=["GET"])
def get_post(post_id):
    """Get single post by ID from database"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, title, content, media_type, media_url, thumbnail_url,
                   created_by, created_at
            FROM posts
            WHERE id = %s
        """, (post_id,))
        post = cur.fetchone()
        cur.close()
        conn.close()

        if post:
            return jsonify({
                "id": str(post[0]) if post[0] else post_id,
                "title": post[1] or "Untitled",
                "content": post[2] or "",
                "media_type": post[3] or "image",
                "media_url": post[4] or "",
                "thumbnail_url": post[5] or post[4] or "",
                "created_by": str(post[6]) if post[6] else "unknown",
                "created_at": post[7].isoformat() if post[7] else datetime.now().isoformat(),
                "updated_at": post[7].isoformat() if post[7] else datetime.now().isoformat(),
                "is_published": True,
                "likes_count": 0,
                "shares_count": 0,
                "views_count": 0
            }), 200
        else:
            return jsonify({"error": "Post not found"}), 404

    except Exception as e:
        print(f"Database error: {str(e)}")
        return jsonify({"error": "Failed to fetch post"}), 500

@post_bp.route("/api/posts/<post_id>", methods=["DELETE"])
def delete_post(post_id):
    """Delete a post from database"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM posts WHERE id = %s", (post_id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Post deleted successfully"}), 200
    except Exception as e:
        print(f"Database error: {str(e)}")
        return jsonify({"error": "Failed to delete post"}), 500

@post_bp.route("/api/posts/cleanup/test-data", methods=["DELETE"])
def cleanup_test_data():
    """Remove all test data from posts table"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        # Delete posts with obvious test data patterns
        cur.execute("""
            DELETE FROM posts
            WHERE LOWER(title) LIKE '%test%'
               OR LOWER(title) LIKE '%sample%'
               OR LOWER(content) LIKE '%test%'
               OR LOWER(content) LIKE '%lorem%'
               OR LOWER(content) LIKE '%ipsum%'
               OR title IN ('sample file 1', 'sample file 2', 'test file')
        """)
        affected = cur.rowcount
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({
            "message": f"Cleaned up {affected} test posts",
            "deleted_count": affected
        }), 200
    except Exception as e:
        print(f"Database error: {str(e)}")
        return jsonify({"error": "Failed to cleanup test data"}), 500
