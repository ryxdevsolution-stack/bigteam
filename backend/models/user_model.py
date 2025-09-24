from utils.db import get_db_connection
from psycopg2.extras import RealDictCursor

def create_user(full_name, email, username, password_hash, role='customer'):
    conn = get_db_connection()
    cur = conn.cursor()

    # Check if email exists
    cur.execute("SELECT id FROM users WHERE email=%s", (email,))
    if cur.fetchone():
        cur.close()
        conn.close()
        return None, "Email already exists"

    # Check if username exists
    cur.execute("SELECT id FROM users WHERE username=%s", (username,))
    if cur.fetchone():
        cur.close()
        conn.close()
        return None, "Username already exists"

    # Insert new user
    cur.execute("""
        INSERT INTO users (full_name, username, email, password_hash, role)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id;
    """, (full_name, username, email, password_hash, role))

    user_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return user_id, None



def get_user_by_email(email):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    return user

def get_all_users():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, full_name, username, email, role, created_at, is_active
        FROM users
        WHERE role = 'customer'
        ORDER BY created_at DESC
    """)
    users = cur.fetchall()
    cur.close()
    conn.close()
    return users
