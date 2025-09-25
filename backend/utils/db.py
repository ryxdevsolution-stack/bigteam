import os
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor
from supabase import create_client, Client
import time

load_dotenv()

# Create a connection pool for better performance
connection_pool = None

def init_connection_pool():
    global connection_pool
    try:
        connection_pool = psycopg2.pool.SimpleConnectionPool(
            1, 20,  # min and max connections
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            port=os.getenv("DB_PORT", 5432)
        )
    except Exception as e:
        print(f"Error creating connection pool: {e}")

def get_db_connection():
    """Get a connection from the pool with performance timing"""
    start_time = time.time()

    # Initialize pool if not exists
    if connection_pool is None:
        init_connection_pool()

    # Get connection from pool
    if connection_pool:
        conn = connection_pool.getconn()
        elapsed = (time.time() - start_time) * 1000  # Convert to ms
        if elapsed > 100:  # Log slow connections
            print(f"DB connection took {elapsed:.2f}ms")
        return conn
    else:
        # Fallback to direct connection
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            port=os.getenv("DB_PORT", 5432)
        )
        return conn

def return_db_connection(conn):
    """Return connection to the pool"""
    if connection_pool:
        connection_pool.putconn(conn)

# Initialize pool on module load
init_connection_pool()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)