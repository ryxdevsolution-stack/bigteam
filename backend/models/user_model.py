"""
User Model - Database operations for user management
Handles CRUD operations with proper validation and security
"""
from utils.db import get_db_connection, return_db_connection
from psycopg2.extras import RealDictCursor


def create_user(full_name, email, username, password_hash, role='customer', amount=0.00):
    """
    Create a new user with optional team activation
    Team activation is handled here ONLY - no duplicate calls
    Returns (user_id, error)
    """
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Check if email exists
        cur.execute("SELECT id FROM users WHERE email=%s", (email,))
        if cur.fetchone():
            return None, "Email already exists"

        # Check if username exists
        cur.execute("SELECT id FROM users WHERE username=%s", (username,))
        if cur.fetchone():
            return None, "Username already exists"

        # Insert new user - always start with is_mlm_active=false
        cur.execute("""
            INSERT INTO users (full_name, username, email, password_hash, role, amount,
                             is_mlm_active, activation_date, commission_received_count)
            VALUES (%s, %s, %s, %s, %s, %s, false, NULL, 0)
            RETURNING id;
        """, (full_name, username, email, password_hash, role, amount))

        user_id = cur.fetchone()[0]
        conn.commit()

        # If amount > 0 and not admin, activate in team system (ONLY place this happens)
        if amount > 0 and role != 'admin':
            from services.team_service import TeamService
            from decimal import Decimal

            success, message, data = TeamService.activate_user(
                str(user_id),
                Decimal(str(amount))
            )
            # Log activation result but don't fail user creation
            if not success:
                # Use proper logging in production
                pass

        return user_id, None

    except Exception:
        conn.rollback()
        return None, "Failed to create user"
    finally:
        cur.close()
        return_db_connection(conn)


def get_user_by_email(email):
    """Get user by email address"""
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        cur.close()
        return user
    finally:
        return_db_connection(conn)


def get_user_by_username(username):
    """Get user by username"""
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cur.fetchone()
        cur.close()
        return user
    finally:
        return_db_connection(conn)


def get_all_users():
    """Get all users with team-relevant fields"""
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT id, full_name, username, email, role, created_at, is_active,
                   is_mlm_active as is_active_member, total_earnings,
                   activation_date, amount, commission_received_count
            FROM users
            ORDER BY created_at ASC
        """)
        users = cur.fetchall()
        cur.close()
        return users
    finally:
        return_db_connection(conn)


def get_user_by_id(user_id):
    """Get user by ID"""
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        cur.close()
        return user
    finally:
        return_db_connection(conn)


def update_user(user_id, full_name=None, email=None, username=None, role=None, amount=None, is_active=None):
    """
    Update user fields
    Returns (updated_user, error)
    """
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Check if user exists
        cur.execute("SELECT id FROM users WHERE id=%s", (user_id,))
        if not cur.fetchone():
            return None, "User not found"

        # Build dynamic update query
        update_fields = []
        values = []

        if full_name is not None:
            update_fields.append("full_name = %s")
            values.append(full_name)

        if email is not None:
            # Check if email is already taken by another user
            cur.execute("SELECT id FROM users WHERE email=%s AND id != %s", (email, user_id))
            if cur.fetchone():
                return None, "Email already exists"
            update_fields.append("email = %s")
            values.append(email)

        if username is not None:
            # Check if username is already taken by another user
            cur.execute("SELECT id FROM users WHERE username=%s AND id != %s", (username, user_id))
            if cur.fetchone():
                return None, "Username already exists"
            update_fields.append("username = %s")
            values.append(username)

        if role is not None:
            update_fields.append("role = %s")
            values.append(role)

        if amount is not None:
            update_fields.append("amount = %s")
            values.append(amount)

        if is_active is not None:
            update_fields.append("is_active = %s")
            values.append(is_active)

        if not update_fields:
            return None, "No fields to update"

        # Execute update
        values.append(user_id)
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s RETURNING id"
        cur.execute(query, values)

        updated_user_id = cur.fetchone()['id']
        conn.commit()

        # Fetch and return updated user
        cur.execute("""
            SELECT id, full_name, username, email, role, created_at, is_active,
                   is_mlm_active as is_active_member, total_earnings,
                   activation_date, amount, commission_received_count
            FROM users WHERE id = %s
        """, (updated_user_id,))
        user = cur.fetchone()

        return user, None

    except Exception:
        conn.rollback()
        return None, "Failed to update user"
    finally:
        cur.close()
        return_db_connection(conn)


def delete_user(user_id):
    """
    Delete user by ID
    Returns (success, error)
    """
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Check if user exists
        cur.execute("SELECT id FROM users WHERE id=%s", (user_id,))
        if not cur.fetchone():
            return False, "User not found"

        # Delete user (cascade will handle related records if configured)
        cur.execute("DELETE FROM users WHERE id=%s", (user_id,))
        conn.commit()
        return True, None

    except Exception:
        conn.rollback()
        return False, "Failed to delete user"
    finally:
        cur.close()
        return_db_connection(conn)
