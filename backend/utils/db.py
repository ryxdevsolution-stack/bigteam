import os
import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor

load_dotenv()

def get_db_connection():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),         # e.g. db.njfxfctqhcculzqixyfg.supabase.co
        database=os.getenv("DB_NAME"),     # e.g. postgres
        user=os.getenv("DB_USER"),         # e.g. postgres
        password=os.getenv("DB_PASS"),     # e.g. Ryx@2025
        port=os.getenv("DB_PORT", 5432)
    )
    return conn
