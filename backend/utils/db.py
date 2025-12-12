"""
Database Connection Pool - Optimized for 1000+ concurrent users
Uses ThreadedConnectionPool for thread-safe connection management
"""
import os
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor
from supabase import create_client, Client
import time
import threading

load_dotenv()

# =============================================================================
# CONNECTION POOL CONFIGURATION - Optimized for high concurrency
# =============================================================================
# Pool sizing based on: workers × threads × 2 buffer
# With 4 workers × 8 threads = 32 concurrent, we need ~64-100 connections
DB_POOL_MIN = int(os.getenv("DB_POOL_MIN", 10))
DB_POOL_MAX = int(os.getenv("DB_POOL_MAX", 100))
DB_CONNECT_TIMEOUT = int(os.getenv("DB_CONNECT_TIMEOUT", 10))

# Create a thread-safe connection pool for better performance
connection_pool = None
_pool_lock = threading.Lock()

def init_connection_pool():
    """Initialize thread-safe connection pool with optimized settings"""
    global connection_pool
    with _pool_lock:
        if connection_pool is not None:
            return  # Already initialized
        try:
            # Use ThreadedConnectionPool for thread-safety (required for gunicorn threads)
            connection_pool = psycopg2.pool.ThreadedConnectionPool(
                DB_POOL_MIN,
                DB_POOL_MAX,
                host=os.getenv("DB_HOST"),
                database=os.getenv("DB_NAME"),
                user=os.getenv("DB_USER"),
                password=os.getenv("DB_PASS"),
                port=os.getenv("DB_PORT", 5432),
                connect_timeout=DB_CONNECT_TIMEOUT,
                # Connection options for performance
                options="-c statement_timeout=30000"  # 30 second query timeout
            )
            print(f"DB Pool initialized: min={DB_POOL_MIN}, max={DB_POOL_MAX}")
        except Exception as e:
            print(f"Error creating connection pool: {e}")
            connection_pool = None

def get_db_connection():
    """
    Get a connection from the pool with performance timing and error handling.

    SECURITY: Does NOT fall back to direct connections to prevent:
    - Connection pool exhaustion DoS attacks
    - Unbounded database connections
    - PostgreSQL max_connections overflow
    """
    start_time = time.time()

    # Initialize pool if not exists (thread-safe)
    if connection_pool is None:
        init_connection_pool()

    if connection_pool is None:
        raise RuntimeError("Database connection pool not initialized - check DB credentials")

    try:
        conn = connection_pool.getconn()
        if conn is None:
            raise pool.PoolError("No available connections in pool")

        # Ensure connection is alive and reset state
        conn.autocommit = False

        elapsed = (time.time() - start_time) * 1000
        if elapsed > 100:  # Log slow connections
            print(f"⚠️ DB connection took {elapsed:.2f}ms")
        return conn

    except pool.PoolError as e:
        # SECURITY: Do NOT fall back to direct connections!
        # This prevents unbounded connection growth under DoS attacks
        elapsed = (time.time() - start_time) * 1000
        print(f"🔴 Connection pool exhausted after {elapsed:.2f}ms: {e}")
        raise RuntimeError(
            "Database temporarily unavailable (connection pool exhausted). "
            "Please try again in a few seconds."
        )

def return_db_connection(conn):
    """Return connection to the pool safely"""
    if conn is None:
        return
    try:
        if connection_pool:
            # Reset connection state before returning
            conn.rollback()
            connection_pool.putconn(conn)
        else:
            conn.close()
    except Exception as e:
        print(f"Error returning connection: {e}")
        try:
            conn.close()
        except Exception:
            pass

# Initialize pool on module load
init_connection_pool()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)