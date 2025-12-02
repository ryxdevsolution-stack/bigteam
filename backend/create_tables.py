"""
Database Schema Creation and Migration
Creates all necessary tables for the BigTeam application
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

        # Create users table (core authentication)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                full_name VARCHAR(100) NOT NULL,
                username VARCHAR(30) UNIQUE NOT NULL,
                email VARCHAR(254) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
                amount DECIMAL(12, 2) DEFAULT 0.00,
                is_active BOOLEAN DEFAULT true,
                sponsored_by UUID REFERENCES users(id) ON DELETE SET NULL,
                is_mlm_active BOOLEAN DEFAULT false,
                total_earnings DECIMAL(12, 2) DEFAULT 0.00,
                available_balance DECIMAL(12, 2) DEFAULT 0.00,
                pending_balance DECIMAL(12, 2) DEFAULT 0.00,
                referral_code VARCHAR(10) UNIQUE,
                activation_date TIMESTAMP,
                commission_received_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Users table created/verified")

        # Create posts table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS posts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(255) NOT NULL,
                content TEXT,
                media_type VARCHAR(50) NOT NULL CHECK (media_type IN ('video', 'image', 'ad')),
                media_url TEXT NOT NULL,
                thumbnail_url TEXT,
                created_by UUID REFERENCES users(id) ON DELETE SET NULL,
                is_published BOOLEAN DEFAULT false,
                likes_count INTEGER DEFAULT 0,
                shares_count INTEGER DEFAULT 0,
                views_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Posts table created/verified")

        # Create advertisements table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS advertisements (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(200) NOT NULL,
                description TEXT,
                media_type VARCHAR(20) NOT NULL,
                media_url VARCHAR(500) NOT NULL,
                link_url VARCHAR(500),
                ad_type VARCHAR(20) CHECK (ad_type IN ('banner', 'in_stream')),
                status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'scheduled')),
                start_date TIMESTAMP,
                end_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
        print("Advertisements table created/verified")

        # Create user_interactions table for tracking likes/shares/views
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_interactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content_id UUID NOT NULL,
                interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('like', 'share', 'view')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, content_id, interaction_type)
            )
        """)
        print("User interactions table created/verified")

        # Create purchases table for MLM
        cur.execute("""
            CREATE TABLE IF NOT EXISTS purchases (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                product_name VARCHAR(200) NOT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                purchase_type VARCHAR(20) CHECK (purchase_type IN ('activation', 'reactivation', 'product')),
                status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Purchases table created/verified")

        # Create commissions table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS commissions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                payer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
                amount DECIMAL(12, 2) NOT NULL,
                commission_level INTEGER DEFAULT 1,
                status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Commissions table created/verified")

        # Create MLM chain table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS mlm_chain (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                position INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT true,
                deactivated_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("MLM chain table created/verified")

        # Create MLM settings table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS mlm_settings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                setting_key VARCHAR(50) UNIQUE NOT NULL,
                setting_value VARCHAR(200) NOT NULL,
                description TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("MLM settings table created/verified")

        # Create meetings table for Zoom link sharing
        cur.execute("""
            CREATE TABLE IF NOT EXISTS meetings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(200) NOT NULL,
                description TEXT,
                zoom_link VARCHAR(500) NOT NULL,
                meeting_date DATE NOT NULL,
                meeting_time TIME NOT NULL,
                duration_minutes INTEGER DEFAULT 60,
                host_name VARCHAR(100),
                is_active BOOLEAN DEFAULT true,
                created_by UUID REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Meetings table created/verified")

        # Insert default MLM settings if not exists
        cur.execute("""
            INSERT INTO mlm_settings (setting_key, setting_value, description)
            VALUES
                ('activation_amount', '1000', 'Minimum amount required for MLM activation'),
                ('commission_rate', '0.15', 'Commission rate (15%)'),
                ('commission_limit', '2', 'Number of commissions before deactivation'),
                ('currency', 'INR', 'Default currency')
            ON CONFLICT (setting_key) DO NOTHING
        """)
        print("Default MLM settings inserted")

        # Create indexes for better performance
        cur.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_users_sponsored_by ON users(sponsored_by)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_posts_media_type ON posts(media_type)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_posts_created_by ON posts(created_by)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_posts_is_published ON posts(is_published)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_ads_status ON advertisements(status)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_ads_dates ON advertisements(start_date, end_date)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_interactions_user ON user_interactions(user_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_interactions_content ON user_interactions(content_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_commissions_receiver ON commissions(receiver_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_commissions_payer ON commissions(payer_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_mlm_chain_user ON mlm_chain(user_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_mlm_chain_position ON mlm_chain(position)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_mlm_chain_active ON mlm_chain(is_active)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_meetings_active ON meetings(is_active)")
        print("Indexes created/verified")

        # Show table counts
        tables = ['users', 'posts', 'advertisements', 'user_interactions', 'purchases', 'commissions', 'mlm_chain', 'mlm_settings', 'meetings']
        print("\nTable row counts:")
        for table in tables:
            try:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                count = cur.fetchone()[0]
                print(f"  {table}: {count} rows")
            except Exception:
                print(f"  {table}: (table may not exist)")

        print("\nDatabase schema ready!")

    except Exception as e:
        print(f"Error creating tables: {str(e)}")
        import traceback
        traceback.print_exc()

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


if __name__ == "__main__":
    create_tables()
