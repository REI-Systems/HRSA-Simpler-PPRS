import os
import psycopg2
from psycopg2.extras import RealDictCursor
from urllib.parse import quote_plus

def get_database_url():
    """Get database connection string from environment variable"""
    # Check for Azure-specific environment variables first
    azure_host = os.environ.get('AZURE_DB_HOST')
    azure_password = os.environ.get('AZURE_DB_PASSWORD')
    
    if azure_host and azure_password:
        # Build Azure connection string with proper encoding
        password_encoded = quote_plus(azure_password)
        db_user = os.environ.get('AZURE_DB_USER', 'admin')
        db_name = os.environ.get('AZURE_DB_NAME', 'rei_pprs_dev')
        db_port = os.environ.get('AZURE_DB_PORT', '5432')
        return f"postgresql://{db_user}:{password_encoded}@{azure_host}:{db_port}/{db_name}"
    
    # Otherwise use DATABASE_URL or default
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
