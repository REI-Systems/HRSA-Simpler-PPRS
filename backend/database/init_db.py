"""
Database initialization script
Creates the welcome table
"""
import sys
import os

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import get_db_connection

def create_welcome_table():
    """Create the welcome table if it doesn't exist"""
    conn = get_db_connection()
    
    if not conn:
        print("❌ Failed to connect to database")
        return False
    
    try:
        cursor = conn.cursor()
        
        # Create welcome table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS welcome (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        ''')
        
        conn.commit()
        print("✅ Welcome table created successfully!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating welcome table: {e}")
        if conn:
            conn.close()
        return False

def create_users_table():
    """Create the users table if it doesn't exist"""
    conn = get_db_connection()
    
    if not conn:
        print("❌ Failed to connect to database")
        return False
    
    try:
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email VARCHAR(100),
                created_at TIMESTAMP DEFAULT NOW()
            )
        ''')
        
        conn.commit()
        print("✅ Users table created successfully!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating users table: {e}")
        if conn:
            conn.close()
        return False

if __name__ == '__main__':
    print("Creating database tables...")
    create_welcome_table()
    create_users_table()
