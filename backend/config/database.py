import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_database_url():
    """Get database connection string from environment variable"""
    return os.environ.get(
        'DATABASE_URL',
        'postgresql://admin:admin@localhost:5432/rei_community_dev'
    )

def get_db_connection():
    """Create and return a database connection"""
    try:
        database_url = get_database_url()
        conn = psycopg2.connect(database_url, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def test_connection():
    """Test if database connection works"""
    conn = get_db_connection()
    if conn:
        print("✅ Database connection successful!")
        conn.close()
        return True
    else:
        print("❌ Database connection failed!")
        return False
