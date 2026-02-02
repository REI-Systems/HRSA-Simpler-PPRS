"""
Seed initial data into the database
"""
import sys
import os

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import get_db_connection

def seed_welcome_data():
    """Insert initial welcome message"""
    conn = get_db_connection()
    
    if not conn:
        print("❌ Failed to connect to database")
        return False
    
    try:
        cursor = conn.cursor()
        
        # Check if data already exists
        cursor.execute('SELECT COUNT(*) FROM welcome')
        count = cursor.fetchone()['count']
        
        if count > 0:
            print(f"ℹ️  Welcome table already has {count} record(s). Skipping seed.")
            cursor.close()
            conn.close()
            return True
        
        # Insert welcome message
        cursor.execute('''
            INSERT INTO welcome (title, message)
            VALUES (%s, %s)
        ''', (
            'Welcome to REI Systems',
            'Community Development!'
        ))
        
        conn.commit()
        print("✅ Welcome data seeded successfully!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        if conn:
            conn.close()
        return False

def seed_users_data():
    """Insert initial test users"""
    conn = get_db_connection()
    
    if not conn:
        print("❌ Failed to connect to database")
        return False
    
    try:
        cursor = conn.cursor()
        
        # Check if users already exist
        cursor.execute('SELECT COUNT(*) FROM users')
        count = cursor.fetchone()['count']
        
        if count > 0:
            print(f"ℹ️  Users table already has {count} record(s). Skipping seed.")
            cursor.close()
            conn.close()
            return True
        
        # Insert test users
        users = [
            ('admin', 'admin', 'admin@reisystems.com'),
            ('testuser', 'password', 'test@reisystems.com'),
        ]
        
        for username, password, email in users:
            cursor.execute('''
                INSERT INTO users (username, password, email)
                VALUES (%s, %s, %s)
            ''', (username, password, email))
        
        conn.commit()
        print(f"✅ {len(users)} test users seeded successfully!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error seeding users: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    print("Seeding database with initial data...")
    seed_welcome_data()
    seed_users_data()
