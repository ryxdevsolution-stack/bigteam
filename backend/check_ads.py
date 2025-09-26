"""
Check advertisements in database
"""
import os
import sys
from dotenv import load_dotenv
import psycopg2
from datetime import datetime

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

def check_ads():
    conn = None
    cur = None

    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            port=os.getenv("DB_PORT", 5432)
        )
        cur = conn.cursor()

        # Check if advertisements table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'advertisements'
            )
        """)
        exists = cur.fetchone()[0]
        print(f"✅ Advertisements table exists: {exists}")

        if exists:
            # Count ads
            cur.execute("SELECT COUNT(*) FROM advertisements")
            count = cur.fetchone()[0]
            print(f"📊 Total advertisements: {count}")

            # Check active ads
            cur.execute("""
                SELECT COUNT(*) FROM advertisements
                WHERE (is_active = true OR is_active IS NULL)
                    AND (start_date IS NULL OR start_date <= NOW())
                    AND (end_date IS NULL OR end_date >= NOW())
            """)
            active_count = cur.fetchone()[0]
            print(f"✅ Active advertisements: {active_count}")

            # Show all ads
            cur.execute("""
                SELECT id, title, media_type, ad_type, is_active, start_date, end_date
                FROM advertisements
                ORDER BY created_at DESC
            """)
            ads = cur.fetchall()

            if ads:
                print("\n📋 All advertisements:")
                for ad in ads:
                    print(f"  - {ad[1]} ({ad[2]}/{ad[3]}) - Active: {ad[4]}")
                    if ad[5]:
                        print(f"    Start: {ad[5]}, End: {ad[6]}")
            else:
                print("\n⚠️  No advertisements found in database")

            # Check posts count
            cur.execute("SELECT COUNT(*) FROM posts WHERE is_published = true OR is_published IS NULL")
            post_count = cur.fetchone()[0]
            print(f"\n📊 Total published posts: {post_count}")

    except Exception as e:
        print(f"❌ Error: {str(e)}")

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    check_ads()