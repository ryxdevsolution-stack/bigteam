from ..utils.db import get_db_connection, return_db_connection
from psycopg2.extras import RealDictCursor

def create_user(full_name, email, username, password_hash, role='customer', amount=0.00):
    conn = get_db_connection()
    cur = conn.cursor()

    # Check if email exists
    cur.execute("SELECT id FROM users WHERE email=%s", (email,))
    if cur.fetchone():
        cur.close()
        return_db_connection(conn)
        return None, "Email already exists"

    # Check if username exists
    cur.execute("SELECT id FROM users WHERE username=%s", (username,))
    if cur.fetchone():
        cur.close()
        return_db_connection(conn)
        return None, "Username already exists"

    # Insert new user - DON'T auto-activate MLM here
    # MLM activation should be done through the MLM service which handles chain and commissions
    cur.execute("""
        INSERT INTO users (full_name, username, email, password_hash, role, amount, is_mlm_active, activation_date, commission_received_count)
        VALUES (%s, %s, %s, %s, %s, %s, false, NULL, 0)
        RETURNING id;
    """, (full_name, username, email, password_hash, role, amount))

    user_id = cur.fetchone()[0]
    conn.commit()

    # If amount > 0 and not admin, activate in MLM system
    if amount > 0 and role != 'admin':
        from services.mlm_service import MLMService
        from decimal import Decimal

        success, message, data = MLMService.activate_user(str(user_id), Decimal(str(amount)))
        if not success:
            print(f"Warning: MLM activation failed for {username}: {message}")

    cur.close()
    return_db_connection(conn)
    return user_id, None



def get_user_by_email(email):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    cur.close()
    return_db_connection(conn)
    return user

def get_user_by_username(username):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cur.fetchone()
    cur.close()
    return_db_connection(conn)
    return user

def get_all_users():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, full_name, username, email, role, created_at, is_active,
               sponsored_by, is_mlm_active, total_earnings,
               referral_code, activation_date, amount, commission_received_count
        FROM users
        ORDER BY created_at DESC
    """)
    users = cur.fetchall()
    cur.close()
    return_db_connection(conn)
    return users

def get_user_by_id(user_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    cur.close()
    return_db_connection(conn)
    return user

def update_user(user_id, full_name=None, email=None, username=None, role=None, amount=None, is_active=None):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Check if user exists
    cur.execute("SELECT id FROM users WHERE id=%s", (user_id,))
    if not cur.fetchone():
        cur.close()
        return_db_connection(conn)
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
            cur.close()
            return_db_connection(conn)
            return None, "Email already exists"
        update_fields.append("email = %s")
        values.append(email)

    if username is not None:
        # Check if username is already taken by another user
        cur.execute("SELECT id FROM users WHERE username=%s AND id != %s", (username, user_id))
        if cur.fetchone():
            cur.close()
            return_db_connection(conn)
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
        cur.close()
        return_db_connection(conn)
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
               sponsored_by, is_mlm_active, total_earnings,
               referral_code, activation_date, amount, commission_received_count
        FROM users WHERE id = %s
    """, (updated_user_id,))
    user = cur.fetchone()

    cur.close()
    return_db_connection(conn)
    return user, None

def delete_user(user_id):
    conn = get_db_connection()
    cur = conn.cursor()

    # Check if user exists
    cur.execute("SELECT id FROM users WHERE id=%s", (user_id,))
    if not cur.fetchone():
        cur.close()
        return_db_connection(conn)
        return False, "User not found"

    # Delete user
    cur.execute("DELETE FROM users WHERE id=%s", (user_id,))
    conn.commit()
    cur.close()
    return_db_connection(conn)
    return True, None
