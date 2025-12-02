"""
Meetings Routes - Zoom link sharing and meeting management
Allows admins to share Zoom meeting links with users
"""
from flask import Blueprint, request, jsonify
from datetime import datetime, date, time

from utils.db import get_db_connection, return_db_connection
from utils.auth import token_required, admin_required, get_current_user_id
from utils.validators import sanitize_string

meetings_bp = Blueprint("meetings", __name__)


@meetings_bp.route("/api/meetings", methods=["GET"])
@token_required
def get_meetings():
    """Get all upcoming active meetings (authenticated users)"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Get upcoming meetings (today and future)
        cur.execute("""
            SELECT m.id, m.title, m.description, m.zoom_link, m.meeting_date,
                   m.meeting_time, m.duration_minutes, m.host_name, m.is_active,
                   m.created_at, u.full_name as created_by_name
            FROM meetings m
            LEFT JOIN users u ON m.created_by = u.id
            WHERE m.is_active = true
              AND m.meeting_date >= CURRENT_DATE
            ORDER BY m.meeting_date ASC, m.meeting_time ASC
        """)
        meetings = cur.fetchall()
        cur.close()

        formatted_meetings = []
        for meeting in meetings:
            formatted_meetings.append({
                "id": str(meeting[0]),
                "title": meeting[1],
                "description": meeting[2] or "",
                "zoom_link": meeting[3],
                "meeting_date": meeting[4].isoformat() if meeting[4] else None,
                "meeting_time": meeting[5].strftime("%H:%M") if meeting[5] else None,
                "duration_minutes": meeting[6] or 60,
                "host_name": meeting[7] or "",
                "is_active": meeting[8],
                "created_at": meeting[9].isoformat() if meeting[9] else None,
                "created_by_name": meeting[10] or "Admin"
            })

        return jsonify(formatted_meetings), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch meetings"}), 500
    finally:
        if conn:
            return_db_connection(conn)


@meetings_bp.route("/api/meetings/all", methods=["GET"])
@admin_required
def get_all_meetings():
    """Get all meetings including past ones (admin only)"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT m.id, m.title, m.description, m.zoom_link, m.meeting_date,
                   m.meeting_time, m.duration_minutes, m.host_name, m.is_active,
                   m.created_at, m.updated_at, u.full_name as created_by_name
            FROM meetings m
            LEFT JOIN users u ON m.created_by = u.id
            ORDER BY m.meeting_date DESC, m.meeting_time DESC
        """)
        meetings = cur.fetchall()
        cur.close()

        formatted_meetings = []
        for meeting in meetings:
            formatted_meetings.append({
                "id": str(meeting[0]),
                "title": meeting[1],
                "description": meeting[2] or "",
                "zoom_link": meeting[3],
                "meeting_date": meeting[4].isoformat() if meeting[4] else None,
                "meeting_time": meeting[5].strftime("%H:%M") if meeting[5] else None,
                "duration_minutes": meeting[6] or 60,
                "host_name": meeting[7] or "",
                "is_active": meeting[8],
                "created_at": meeting[9].isoformat() if meeting[9] else None,
                "updated_at": meeting[10].isoformat() if meeting[10] else None,
                "created_by_name": meeting[11] or "Admin"
            })

        return jsonify(formatted_meetings), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch meetings"}), 500
    finally:
        if conn:
            return_db_connection(conn)


@meetings_bp.route("/api/admin/meetings", methods=["POST"])
@admin_required
def create_meeting():
    """Create a new meeting (admin only)"""
    conn = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Required fields validation
        title = sanitize_string(data.get("title", ""), max_length=200)
        zoom_link = data.get("zoom_link", "").strip()
        meeting_date = data.get("meeting_date")
        meeting_time = data.get("meeting_time")

        if not title:
            return jsonify({"error": "Title is required"}), 400
        if not zoom_link:
            return jsonify({"error": "Zoom link is required"}), 400
        if not meeting_date:
            return jsonify({"error": "Meeting date is required"}), 400
        if not meeting_time:
            return jsonify({"error": "Meeting time is required"}), 400

        # Validate Zoom link format
        if not zoom_link.startswith(("https://zoom.us/", "https://us02web.zoom.us/", "https://us04web.zoom.us/", "https://us05web.zoom.us/", "https://us06web.zoom.us/")):
            # Allow custom domain zoom links as well
            if "zoom" not in zoom_link.lower():
                return jsonify({"error": "Please provide a valid Zoom meeting link"}), 400

        # Optional fields
        description = sanitize_string(data.get("description", ""), max_length=1000)
        duration_minutes = data.get("duration_minutes", 60)
        host_name = sanitize_string(data.get("host_name", ""), max_length=100)

        current_user_id = get_current_user_id()

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO meetings (title, description, zoom_link, meeting_date, meeting_time,
                                  duration_minutes, host_name, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (title, description, zoom_link, meeting_date, meeting_time,
              duration_minutes, host_name, current_user_id))

        result = cur.fetchone()
        meeting_id = str(result[0])
        created_at = result[1].isoformat() if result[1] else None

        conn.commit()
        cur.close()

        return jsonify({
            "message": "Meeting created successfully",
            "meeting": {
                "id": meeting_id,
                "title": title,
                "description": description,
                "zoom_link": zoom_link,
                "meeting_date": meeting_date,
                "meeting_time": meeting_time,
                "duration_minutes": duration_minutes,
                "host_name": host_name,
                "is_active": True,
                "created_at": created_at
            }
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "Failed to create meeting"}), 500
    finally:
        if conn:
            return_db_connection(conn)


@meetings_bp.route("/api/admin/meetings/<meeting_id>", methods=["PUT", "PATCH"])
@admin_required
def update_meeting(meeting_id):
    """Update a meeting (admin only)"""
    conn = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        # Check if meeting exists
        cur.execute("SELECT id FROM meetings WHERE id = %s", (meeting_id,))
        if not cur.fetchone():
            return jsonify({"error": "Meeting not found"}), 404

        # Build update query dynamically based on provided fields
        allowed_fields = ['title', 'description', 'zoom_link', 'meeting_date',
                         'meeting_time', 'duration_minutes', 'host_name', 'is_active']
        update_fields = {}

        for key in allowed_fields:
            if key in data:
                if key in ['title', 'description', 'host_name']:
                    max_len = 200 if key == 'title' else (1000 if key == 'description' else 100)
                    update_fields[key] = sanitize_string(str(data[key]), max_length=max_len)
                else:
                    update_fields[key] = data[key]

        if not update_fields:
            return jsonify({"error": "No valid fields to update"}), 400

        # Build SQL
        set_parts = []
        values = []
        for key, value in update_fields.items():
            set_parts.append(f"{key} = %s")
            values.append(value)

        set_clause = ', '.join(set_parts)
        values.append(meeting_id)

        cur.execute(f"""
            UPDATE meetings
            SET {set_clause}, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING id, title, description, zoom_link, meeting_date, meeting_time,
                      duration_minutes, host_name, is_active, created_at, updated_at
        """, values)

        updated = cur.fetchone()
        conn.commit()
        cur.close()

        return jsonify({
            "message": "Meeting updated successfully",
            "meeting": {
                "id": str(updated[0]),
                "title": updated[1],
                "description": updated[2] or "",
                "zoom_link": updated[3],
                "meeting_date": updated[4].isoformat() if updated[4] else None,
                "meeting_time": updated[5].strftime("%H:%M") if updated[5] else None,
                "duration_minutes": updated[6] or 60,
                "host_name": updated[7] or "",
                "is_active": updated[8],
                "created_at": updated[9].isoformat() if updated[9] else None,
                "updated_at": updated[10].isoformat() if updated[10] else None
            }
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "Failed to update meeting"}), 500
    finally:
        if conn:
            return_db_connection(conn)


@meetings_bp.route("/api/admin/meetings/<meeting_id>", methods=["DELETE"])
@admin_required
def delete_meeting(meeting_id):
    """Delete a meeting (admin only)"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Check if meeting exists
        cur.execute("SELECT id FROM meetings WHERE id = %s", (meeting_id,))
        if not cur.fetchone():
            return jsonify({"error": "Meeting not found"}), 404

        cur.execute("DELETE FROM meetings WHERE id = %s", (meeting_id,))
        conn.commit()
        cur.close()

        return jsonify({"message": "Meeting deleted successfully"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "Failed to delete meeting"}), 500
    finally:
        if conn:
            return_db_connection(conn)
