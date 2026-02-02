"""
Authentication Service
Handles user authentication logic
"""
from config.database import get_db_connection

def authenticate_user(username, password):
    """
    Authenticate a user with username and password
    
    Args:
        username (str): Username
        password (str): Password (plain text for POC - should be hashed in production)
        
    Returns:
        dict: User data if authentication successful
        None: If authentication failed
    """
    conn = None
    try:
        conn = get_db_connection()
        
        if not conn:
            return None
        
        cursor = conn.cursor()
        cursor.execute(
            'SELECT id, username, email FROM users WHERE username = %s AND password = %s',
            (username, password)
        )
        result = cursor.fetchone()
        
        cursor.close()
        
        if result:
            return {
                'id': result['id'],
                'username': result['username'],
                'email': result['email']
            }
        return None
        
    except Exception as e:
        print(f"Error authenticating user: {e}")
        return None
    finally:
        if conn:
            conn.close()

def create_user(username, password, email):
    """
    Create a new user
    
    Args:
        username (str): Username
        password (str): Password (plain text for POC)
        email (str): Email address
        
    Returns:
        bool: True if successful, False otherwise
    """
    conn = None
    try:
        conn = get_db_connection()
        
        if not conn:
            return False
        
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO users (username, password, email) VALUES (%s, %s, %s)',
            (username, password, email)
        )
        
        conn.commit()
        cursor.close()
        return True
        
    except Exception as e:
        print(f"Error creating user: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()
