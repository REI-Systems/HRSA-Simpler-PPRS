"""
Welcome Service
Handles business logic for welcome page; uses welcome_repository for data access.
"""
from config.database import get_db_connection
from repositories.welcome_repository import get_welcome


def get_welcome_message():
    """
    Retrieve the welcome message from the database.

    Returns:
        dict: Welcome message data with title and message, or empty dict.
        None: If error occurred (repository returns {} on no row/error).
    """
    data = get_welcome()
    if data:
        return {"title": data["title"], "message": data["message"]}
    return None

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
