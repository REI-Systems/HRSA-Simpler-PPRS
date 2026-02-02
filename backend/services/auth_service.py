"""
Authentication Service
Handles user authentication logic
"""
import logging
from config.database import get_db_connection

logger = logging.getLogger(__name__)

# Sentinel to distinguish "DB unavailable" from "wrong credentials"
DB_UNAVAILABLE = object()


def authenticate_user(username, password):
    """
    Authenticate a user with username and password

    Args:
        username (str): Username
        password (str): Password (plain text for POC - should be hashed in production)

    Returns:
        dict: User data if authentication successful
        None: If authentication failed (wrong credentials)
        DB_UNAVAILABLE: If database connection failed
    """
    conn = None
    try:
        conn = get_db_connection()

        if not conn:
            logger.error("authenticate_user: database connection failed (username=%r)", username)
            return DB_UNAVAILABLE

        cursor = conn.cursor()
        cursor.execute(
            'SELECT id, username, email FROM public.users WHERE username = %s AND password = %s',
            (username, password)
        )
        result = cursor.fetchone()
        cursor.close()

        if result:
            logger.debug("authenticate_user: match for username=%r id=%s", username, result['id'])
            return {
                'id': result['id'],
                'username': result['username'],
                'email': result['email']
            }
        logger.info("authenticate_user: no matching user/password for username=%r", username)
        return None

    except Exception as e:
        logger.exception("authenticate_user: exception for username=%r: %s", username, e)
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
            'INSERT INTO public.users (username, password, email) VALUES (%s, %s, %s)',
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
