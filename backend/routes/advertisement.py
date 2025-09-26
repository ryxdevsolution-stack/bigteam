from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import time
from uuid import uuid4
import os
from datetime import datetime

from utils.db import get_db_connection, return_db_connection, supabase

ad_bp = Blueprint("advertisements", __name__)

ALLOWED_EXTENSIONS = {"mp4", "mov", "jpg", "jpeg", "png", "gif"}
bucket_name = "bigteam-video"

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@ad_bp.route("/api/ads", methods=["POST"])
def create_ad():
    """Create new advertisement with file upload"""

    # Validate file
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    title = request.form.get("title")
    ad_type = request.form.get("ad_type", "banner")  # banner or in_stream
    start_date = request.form.get("start_date")
    end_date = request.form.get("end_date")

    # Validate required fields
    if not file or file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    if not title:
        return jsonify({"error": "Title is required"}), 400
    if ad_type not in ["banner", "in_stream"]:
        return jsonify({"error": "Invalid ad type"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed"}), 400

    # Create unique filename for storage
    ext = file.filename.rsplit(".", 1)[1].lower()
    media_type = "video" if ext in ["mp4", "mov"] else "image"
    filename = f"ad/ad_{uuid4().hex}_{int(time.time())}.{ext}"

    # Upload to Supabase Storage
    try:
        file.seek(0)
        file_content = file.read()

        response = supabase.storage.from_(bucket_name).upload(
            path=filename,
            file=file_content,
            file_options={"content-type": file.content_type}
        )

        media_url = supabase.storage.from_(bucket_name).get_public_url(filename)

    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

    # Save to database
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO advertisements (title, media_type, media_url, ad_type, start_date, end_date)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, created_at;
        """, (title, media_type, media_url, ad_type, start_date, end_date))

        result = cur.fetchone()
        ad_id = str(result[0])
        created_at = result[1].isoformat() if result[1] else datetime.now().isoformat()

        conn.commit()

        return jsonify({
            "message": "Advertisement created successfully",
            "ad": {
                "id": ad_id,
                "title": title,
                "media_type": media_type,
                "media_url": media_url,
                "ad_type": ad_type,
                "is_active": True,
                "start_date": start_date,
                "end_date": end_date,
                "created_at": created_at
            }
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if conn:
            if 'cur' in locals():
                cur.close()
            return_db_connection(conn)

@ad_bp.route("/api/ads", methods=["GET"])
def get_ads():
    """Get all advertisements"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Get filter parameters
        is_active = request.args.get('active')
        ad_type = request.args.get('type')

        # Build query
        query = """
            SELECT id, title, media_type, media_url, ad_type,
                   is_active, start_date, end_date, created_at
            FROM advertisements
            WHERE 1=1
        """
        params = []

        if is_active is not None:
            query += " AND is_active = %s"
            params.append(is_active == 'true')

        if ad_type:
            query += " AND ad_type = %s"
            params.append(ad_type)

        query += " ORDER BY created_at DESC"

        cur.execute(query, params)
        ads = cur.fetchall()

        # Format response
        formatted_ads = []
        for ad in ads:
            formatted_ads.append({
                "id": str(ad[0]),
                "title": ad[1],
                "media_type": ad[2],
                "media_url": ad[3],
                "ad_type": ad[4],
                "is_active": ad[5],
                "start_date": ad[6].isoformat() if ad[6] else None,
                "end_date": ad[7].isoformat() if ad[7] else None,
                "created_at": ad[8].isoformat() if ad[8] else None
            })

        return jsonify(formatted_ads), 200

    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if conn:
            if 'cur' in locals():
                cur.close()
            return_db_connection(conn)

@ad_bp.route("/api/ads/<ad_id>", methods=["DELETE"])
def delete_ad(ad_id):
    """Delete advertisement"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Get ad info first to delete file from storage
        cur.execute("SELECT media_url FROM advertisements WHERE id = %s", (ad_id,))
        result = cur.fetchone()

        if not result:
            return jsonify({"error": "Advertisement not found"}), 404

        # Delete from database
        cur.execute("DELETE FROM advertisements WHERE id = %s", (ad_id,))
        conn.commit()

        # Try to delete from storage (optional, ignore errors)
        try:
            media_url = result[0]
            # Extract filename from URL
            if media_url and 'ad/' in media_url:
                filename = media_url.split('ad/')[-1].split('?')[0]
                supabase.storage.from_(bucket_name).remove([f"ad/{filename}"])
        except:
            pass  # Ignore storage deletion errors

        return jsonify({"message": "Advertisement deleted successfully"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if conn:
            if 'cur' in locals():
                cur.close()
            return_db_connection(conn)

@ad_bp.route("/api/ads/<ad_id>/toggle", methods=["PATCH"])
def toggle_ad(ad_id):
    """Toggle advertisement active status"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Toggle the is_active status
        cur.execute("""
            UPDATE advertisements
            SET is_active = NOT is_active
            WHERE id = %s
            RETURNING is_active;
        """, (ad_id,))

        result = cur.fetchone()
        if not result:
            return jsonify({"error": "Advertisement not found"}), 404

        conn.commit()

        return jsonify({
            "message": "Status updated successfully",
            "is_active": result[0]
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if conn:
            if 'cur' in locals():
                cur.close()
            return_db_connection(conn)