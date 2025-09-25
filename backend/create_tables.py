"""
Create database tables for BigTeam application
"""
import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Fix encoding for Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

def create_tables():
    """Create all necessary tables in the database"""

    conn = None
    cur = None

    try:
        # Connect to database
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            port=os.getenv("DB_PORT", 5432)
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        # Create posts table if not exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS posts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(255) NOT NULL,
                content TEXT,
                media_type VARCHAR(50) NOT NULL CHECK (media_type IN ('video', 'image', 'ad')),
                media_url TEXT NOT NULL,
                thumbnail_url TEXT,
                created_by UUID,
                is_published BOOLEAN DEFAULT false,
                likes_count INTEGER DEFAULT 0,
                shares_count INTEGER DEFAULT 0,
                views_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ Posts table created/verified")

        # Create indexes for better performance
        cur.execute("CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_posts_media_type ON posts(media_type)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_posts_created_by ON posts(created_by)")
        print("✅ Indexes created/verified")

        # Check if table exists and has data
        cur.execute("SELECT COUNT(*) FROM posts")
        count = cur.fetchone()[0]
        print(f"📊 Current posts in database: {count}")

        # Show recent posts
        cur.execute("""
            SELECT id, title, media_type, created_at
            FROM posts
            ORDER BY created_at DESC
            LIMIT 5
        """)
        recent_posts = cur.fetchall()

        if recent_posts:
            print("\n📋 Recent posts:")
            for post in recent_posts:
                print(f"  - {post[1]} ({post[2]}) - {post[3]}")

        print("\n✅ Database tables ready!")

    except Exception as e:
        print(f"❌ Error creating tables: {str(e)}")
        if cur:
            # Try to get more details
            cur.execute("SELECT current_database()")
            db_name = cur.fetchone()[0]
            print(f"📍 Connected to database: {db_name}")

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    create_tables()