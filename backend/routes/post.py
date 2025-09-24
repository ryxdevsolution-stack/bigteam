from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import time
from uuid import uuid4

from utils.db import get_db_connection, supabase  # Your existing db.py

post_bp = Blueprint("posts", __name__)

ALLOWED_EXTENSIONS = {"mp4", "mov", "jpg", "jpeg", "png", "gif"}
bucket_name = "bigteam-video"

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

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
    thumbnail_url = request.form.get("thumbnail_url", None)  # optional

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
    file_stream = file.read()

    # Upload to Supabase Storage
    try:
        res = supabase.storage.from_(bucket_name).upload(filename, file_stream)
    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

    # Generate public URL
    media_url = supabase.storage.from_(bucket_name).get_public_url(filename)

    # Save post info to DB
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO posts (title, content, media_type, media_url, thumbnail_url, created_by)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, created_at;
        """, (title, content, media_type, media_url, thumbnail_url, created_by))
        post_id, created_at = cur.fetchone()
        conn.commit()
    except Exception as e:
        return jsonify({"error": f"DB insert failed: {str(e)}"}), 500
    finally:
        cur.close()
        conn.close()

    # Return response
    return jsonify({
        "message": "Post uploaded successfully",
        "post": {
            "id": post_id,
            "title": title,
            "content": content,
            "media_type": media_type,
            "media_url": media_url,
            "thumbnail_url": thumbnail_url,
            "created_by": created_by,
            "created_at": created_at
        }
    }), 201
