"""SVP List page repository: list plans, record access."""
from repositories.svp_plan_repository import _plan_row_from_svp_plans
from config.database import get_db_connection


def get_svp_plans(username=None):
    """Return SVP plans list from public.svp_plans. When username is set, left-joins svp_plan_access to include last_accessed_at for that user."""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return []
        conn.autocommit = True
        cursor = conn.cursor()
        try:
            if username and str(username).strip():
                cursor.execute(
                    """SELECT p.id, p.plan_code, p.plan_for, p.plan_period, p.plan_name, p.plan_description,
                              p.site_visits, p.status, p.team_name, p.needs_attention, a.last_accessed_at
                       FROM public.svp_plans p
                       LEFT JOIN public.svp_plan_access a ON a.plan_id = p.id AND a.username = %s
                       ORDER BY p.id""",
                    (str(username).strip(),)
                )
            else:
                cursor.execute(
                    "SELECT id, plan_code, plan_for, plan_period, plan_name, plan_description, site_visits, status, team_name, needs_attention "
                    "FROM public.svp_plans ORDER BY id"
                )
            rows = cursor.fetchall()
            cursor.close()
            return [_plan_row_from_svp_plans(dict(row)) for row in rows] if rows else []
        except Exception:
            conn.rollback()
        cursor.close()
        return []
    except Exception:
        return []
    finally:
        if conn:
            conn.close()


def record_plan_access(username, plan_id):
    """Record that the given user accessed the plan (upsert last_accessed_at). Returns True on success."""
    if not username or not str(username).strip():
        return False
    plan_id_str = str(plan_id).strip()
    plan_id_int = None
    if plan_id_str.isdigit():
        plan_id_int = int(plan_id_str)
    else:
        conn = None
        try:
            conn = get_db_connection()
            if not conn:
                return False
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM public.svp_plans WHERE plan_code = %s", (plan_id_str,))
            row = cursor.fetchone()
            cursor.close()
            if row:
                plan_id_int = row["id"]
        finally:
            if conn:
                conn.close()
        if plan_id_int is None:
            return False
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return False
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO public.svp_plan_access (username, plan_id, last_accessed_at)
               VALUES (%s, %s, NOW())
               ON CONFLICT (username, plan_id) DO UPDATE SET last_accessed_at = NOW()""",
            (str(username).strip(), plan_id_int)
        )
        conn.commit()
        cursor.close()
        return True
    except Exception:
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()
