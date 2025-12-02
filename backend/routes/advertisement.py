"""
Advertisement Routes - Admin-only endpoints for ad management
All endpoints require admin authentication
"""
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import time
from uuid import uuid4
import os
from datetime import datetime

from utils.db import get_db_connection, return_db_connection, supabase
from utils.auth import admin_required, get_current_user_id
from utils.validators import sanitize_string, validate_url, validate_file_extension, validate_file_content

ad_bp = Blueprint("advertisements", __name__)

ALLOWED_EXTENSIONS = {"mp4", "mov", "jpg", "jpeg", "png", "gif", "webp"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
bucket_name = "bigteam-video"


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@ad_bp.route("/api/ads", methods=["POST"])
@admin_required
def create_ad():
    """Create new advertisement with file upload (admin only)"""

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    title = sanitize_string(request.form.get("title", ""), max_length=200)
    description = sanitize_string(request.form.get("description", ""), max_length=1000)
    link_url = request.form.get("link_url", "").strip()
    ad_type = request.form.get("ad_type", "banner").lower()
    status = request.form.get("status", "active").lower()
    start_date = request.form.get("start_date")
    end_date = request.form.get("end_date")

    # Validate required fields
    if not file or file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not title:
        return jsonify({"error": "Title is required"}), 400

    # Validate ad_type
    if ad_type not in ["banner", "in_stream"]:
        return jsonify({"error": "Invalid ad type. Must be 'banner' or 'in_stream'"}), 400

    # Validate status
    if status not in ["active", "inactive", "scheduled"]:
        return jsonify({"error": "Invalid status. Must be 'active', 'inactive', or 'scheduled'"}), 400

    # Validate file extension
    is_valid, ext = validate_file_extension(file.filename, ALLOWED_EXTENSIONS)
    if not is_valid:
        return jsonify({"error": ext}), 400

    # Validate link_url if provided
    if link_url:
        is_valid, error = validate_url(link_url)
        if not is_valid:
            return jsonify({"error": error}), 400

    # Check file size
    file.seek(0, 2)
    file_size = file.tell()
    file.seek(0)

    if file_size > MAX_FILE_SIZE:
        return jsonify({"error": f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"}), 400

    # Create unique filename for storage
    media_type = "video" if ext in ["mp4", "mov"] else "image"
    filename = f"ad/ad_{uuid4().hex}_{int(time.time())}.{ext}"

    # Upload to Supabase Storage
    try:
        file_content = file.read()

        # SECURITY: Validate file content matches claimed type (prevents extension spoofing)
        is_valid, content_result = validate_file_content(file_content, media_type)
        if not is_valid:
            return jsonify({"error": content_result}), 400

        supabase.storage.from_(bucket_name).upload(
            path=filename,
            file=file_content,
            file_options={"content-type": file.content_type}
        )

        media_url = supabase.storage.from_(bucket_name).get_public_url(filename)

    except Exception:
        return jsonify({"error": "Upload failed"}), 500

    # Save to database
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO advertisements (title, description, media_type, media_url, link_url, ad_type, status, start_date, end_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at;
        """, (title, description, media_type, media_url, link_url or None, ad_type, status, start_date or None, end_date or None))

        result = cur.fetchone()
        ad_id = str(result[0])
        created_at = result[1].isoformat() if result[1] else datetime.now().isoformat()

        conn.commit()
        cur.close()

        return jsonify({
            "message": "Advertisement created successfully",
            "ad": {
                "id": ad_id,
                "title": title,
                "description": description,
                "media_type": media_type,
                "media_url": media_url,
                "link_url": link_url,
                "ad_type": ad_type,
                "status": status,
                "start_date": start_date,
                "end_date": end_date,
                "created_at": created_at
            }
        }), 201

    except Exception:
        if conn:
            conn.rollback()
        return jsonify({"error": "Failed to save advertisement"}), 500
    finally:
        if conn:
            return_db_connection(conn)


@ad_bp.route("/api/ads", methods=["GET"])
@admin_required
def get_ads():
    """Get all advertisements (admin only)"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Get filter parameters
        status = request.args.get('status', '').lower()
        ad_type = request.args.get('type', '').lower()

        # Build query with parameterized inputs
        query = """
            SELECT id, title, description, media_type, media_url, link_url, ad_type,
                   status, start_date, end_date, created_at
            FROM advertisements
            WHERE 1=1
        """
        params = []

        if status and status in ['active', 'inactive', 'scheduled']:
            query += " AND status = %s"
            params.append(status)

        if ad_type and ad_type in ['banner', 'in_stream']:
            query += " AND ad_type = %s"
            params.append(ad_type)

        query += " ORDER BY created_at DESC"

        cur.execute(query, params)
        ads = cur.fetchall()
        cur.close()

        formatted_ads = []
        for ad in ads:
            formatted_ads.append({
                "id": str(ad[0]),
                "title": ad[1],
                "description": ad[2],
                "media_type": ad[3],
                "media_url": ad[4],
                "link_url": ad[5],
                "ad_type": ad[6],
                "status": ad[7],
                "start_date": ad[8].isoformat() if ad[8] else None,
                "end_date": ad[9].isoformat() if ad[9] else None,
                "created_at": ad[10].isoformat() if ad[10] else None
            })

        return jsonify(formatted_ads), 200

    except Exception:
        return jsonify({"error": "Failed to fetch advertisements"}), 500
    finally:
        if conn:
            return_db_connection(conn)


@ad_bp.route("/api/ads/<ad_id>", methods=["GET"])
@admin_required
def get_ad(ad_id):
    """Get single advertisement by ID (admin only)"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT id, title, description, media_type, media_url, link_url, ad_type,
                   status, start_date, end_date, created_at
            FROM advertisements
            WHERE id = %s
        """, (ad_id,))

        ad = cur.fetchone()
        cur.close()

        if not ad:
            return jsonify({"error": "Advertisement not found"}), 404

        return jsonify({
            "id": str(ad[0]),
            "title": ad[1],
            "description": ad[2],
            "media_type": ad[3],
            "media_url": ad[4],
            "link_url": ad[5],
            "ad_type": ad[6],
            "status": ad[7],
            "start_date": ad[8].isoformat() if ad[8] else None,
            "end_date": ad[9].isoformat() if ad[9] else None,
            "created_at": ad[10].isoformat() if ad[10] else None
        }), 200

    except Exception:
        return jsonify({"error": "Failed to fetch advertisement"}), 500
    finally:
        if conn:
            return_db_connection(conn)


@ad_bp.route("/api/ads/<ad_id>", methods=["PUT", "PATCH"])
@admin_required
def update_ad(ad_id):
    """Update advertisement (admin only)"""
    conn = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        # Check if ad exists
        cur.execute("SELECT id FROM advertisements WHERE id = %s", (ad_id,))
        if not cur.fetchone():
            return jsonify({"error": "Advertisement not found"}), 404

        # Build update query
        update_fields = {}

        if 'title' in data:
            update_fields['title'] = sanitize_string(str(data['title']), max_length=200)

        if 'description' in data:
            update_fields['description'] = sanitize_string(str(data['description']), max_length=1000)

        if 'link_url' in data:
            link_url = data['link_url'].strip() if data['link_url'] else ''
            if link_url:
                is_valid, error = validate_url(link_url)
                if not is_valid:
                    return jsonify({"error": error}), 400
            update_fields['link_url'] = link_url or None

        if 'ad_type' in data:
            ad_type = str(data['ad_type']).lower()
            if ad_type not in ['banner', 'in_stream']:
                return jsonify({"error": "Invalid ad type"}), 400
            update_fields['ad_type'] = ad_type

        if 'status' in data:
            status = str(data['status']).lower()
            if status not in ['active', 'inactive', 'scheduled']:
                return jsonify({"error": "Invalid status"}), 400
            update_fields['status'] = status

        if 'start_date' in data:
            update_fields['start_date'] = data['start_date'] or None

        if 'end_date' in data:
            update_fields['end_date'] = data['end_date'] or None

        if not update_fields:
            return jsonify({"error": "No valid fields to update"}), 400

        # SECURITY: Whitelist-based column name validation to prevent SQL injection
        ALLOWED_COLUMNS = {'title', 'description', 'link_url', 'ad_type', 'status', 'start_date', 'end_date'}
        set_parts = []
        values = []

        for key, value in update_fields.items():
            if key in ALLOWED_COLUMNS:
                set_parts.append(f"{key} = %s")
                values.append(value)

        if not set_parts:
            return jsonify({"error": "No valid fields to update"}), 400

        set_clause = ', '.join(set_parts)
        values.append(ad_id)

        cur.execute(f"""
            UPDATE advertisements
            SET {set_clause}, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING id, title, description, media_type, media_url, link_url, ad_type,
                      status, start_date, end_date, created_at
        """, values)

        ad = cur.fetchone()
        conn.commit()
        cur.close()

        return jsonify({
            "message": "Advertisement updated successfully",
            "ad": {
                "id": str(ad[0]),
                "title": ad[1],
                "description": ad[2],
                "media_type": ad[3],
                "media_url": ad[4],
                "link_url": ad[5],
                "ad_type": ad[6],
                "status": ad[7],
                "start_date": ad[8].isoformat() if ad[8] else None,
                "end_date": ad[9].isoformat() if ad[9] else None,
                "created_at": ad[10].isoformat() if ad[10] else None
            }
        }), 200

    except Exception:
        if conn:
            conn.rollback()
        return jsonify({"error": "Failed to update advertisement"}), 500
    finally:
        if conn:
            return_db_connection(conn)


@ad_bp.route("/api/ads/<ad_id>", methods=["DELETE"])
@admin_required
def delete_ad(ad_id):
    """Delete advertisement (admin only)"""
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
        cur.close()

        # Try to delete from storage (optional, ignore errors)
        try:
            media_url = result[0]
            if media_url and 'ad/' in media_url:
                filename = media_url.split('ad/')[-1].split('?')[0]
                supabase.storage.from_(bucket_name).remove([f"ad/{filename}"])
        except Exception:
            pass

        return jsonify({"message": "Advertisement deleted successfully"}), 200

    except Exception:
        if conn:
            conn.rollback()
        return jsonify({"error": "Failed to delete advertisement"}), 500
    finally:
        if conn:
            return_db_connection(conn)


@ad_bp.route("/api/ads/<ad_id>/toggle", methods=["PATCH"])
@admin_required
def toggle_ad(ad_id):
    """Toggle advertisement status between active and inactive (admin only)"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            UPDATE advertisements
            SET status = CASE
                WHEN status = 'active' THEN 'inactive'
                ELSE 'active'
            END,
            updated_at = NOW()
            WHERE id = %s
            RETURNING status;
        """, (ad_id,))

        result = cur.fetchone()
        if not result:
            return jsonify({"error": "Advertisement not found"}), 404

        conn.commit()
        cur.close()

        return jsonify({
            "message": "Status updated successfully",
            "status": result[0]
        }), 200

    except Exception:
        if conn:
            conn.rollback()
        return jsonify({"error": "Failed to toggle advertisement"}), 500
    finally:
        if conn:
            return_db_connection(conn)
