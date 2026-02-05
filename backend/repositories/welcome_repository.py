"""Welcome page repository: welcome content from database."""
from config.database import get_db_connection


def get_welcome():
    """Return welcome content from welcome table."""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return {}
        cursor = conn.cursor()
        cursor.execute("SELECT title, message FROM public.welcome LIMIT 1")
        row = cursor.fetchone()
        cursor.close()
        if row:
            return {"title": row["title"], "message": row["message"]}
        return {}
    except Exception:
        return {}
    finally:
        if conn:
            conn.close()
