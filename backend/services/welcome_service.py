"""
Welcome Service
Handles all business logic related to welcome messages
"""
from config.database import get_db_connection

def get_welcome_message():
    """
    Retrieve the welcome message from the database
    
    Returns:
        dict: Welcome message data with title and message
        None: If no message found or error occurred
    """
    conn = None
    try:
        conn = get_db_connection()
        
        if not conn:
            return None
        
        cursor = conn.cursor()
        cursor.execute('SELECT title, message FROM public.welcome LIMIT 1')
        result = cursor.fetchone()
        
        cursor.close()
        
        if result:
            return {
                'title': result['title'],
                'message': result['message']
            }
        return None
        
    except Exception as e:
        print(f"Error fetching welcome message: {e}")
        return None
    finally:
        if conn:
            conn.close()

def update_welcome_message(title, message):
    """
    Update the welcome message in the database
    
    Args:
        title (str): New title
        message (str): New message
        
    Returns:
        bool: True if successful, False otherwise
    """
    conn = None
    try:
        conn = get_db_connection()
        
        if not conn:
            return False
        
        cursor = conn.cursor()
        
        # Update the first record or insert if none exists
        cursor.execute('SELECT COUNT(*) FROM public.welcome')
        count = cursor.fetchone()['count']
        
        if count > 0:
            cursor.execute(
                'UPDATE welcome SET title = %s, message = %s WHERE id = (SELECT id FROM welcome LIMIT 1)',
                (title, message)
            )
        else:
            cursor.execute(
                'INSERT INTO public.welcome (title, message) VALUES (%s, %s)',
                (title, message)
            )
        
        conn.commit()
        cursor.close()
        return True
        
    except Exception as e:
        print(f"Error updating welcome message: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()
