"""Coversheet page repository: update coversheet fields and section status."""
import logging

from config.database import get_db_connection
from repositories.svp_plan_repository import get_svp_plan_by_id

logger = logging.getLogger(__name__)


def update_svp_plan_coversheet(plan_id, plan_name=None, plan_description=None, action=None):
    """Update coversheet fields in public.svp_plans and section status in public.svp_plan_sections.
    Optional action: save | save_and_continue | mark_complete. Returns updated plan dict or None."""
    plan_id_str = str(plan_id).strip()
    mark_complete = (action or "").strip().lower() == "mark_complete"
    logger.info("update_svp_plan_coversheet: plan_id=%s action=%r plan_name=%r", plan_id_str, action, plan_name)
    plan_status = "Complete" if mark_complete else "In Progress"
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return None
        cursor = conn.cursor()
        plan_id_int = None
        if plan_id_str.isdigit():
            plan_id_int = int(plan_id_str)
        else:
            cursor.execute("SELECT id FROM public.svp_plans WHERE plan_code = %s", (plan_id_str,))
            row = cursor.fetchone()
            if row:
                plan_id_int = row["id"]
        if plan_id_int is None:
            cursor.close()
            return None
        committed = False
        try:
            if plan_name is not None and plan_description is not None:
                cursor.execute(
                    "UPDATE public.svp_plans SET plan_name = %s, plan_description = %s, status = %s WHERE id = %s",
                    (plan_name, plan_description, plan_status, plan_id_int)
                )
            elif plan_name is not None:
                cursor.execute(
                    "UPDATE public.svp_plans SET plan_name = %s, status = %s WHERE id = %s",
                    (plan_name, plan_status, plan_id_int)
                )
            elif plan_description is not None:
                cursor.execute(
                    "UPDATE public.svp_plans SET plan_description = %s, status = %s WHERE id = %s",
                    (plan_description, plan_status, plan_id_int)
                )
            else:
                cursor.execute(
                    "UPDATE public.svp_plans SET status = %s WHERE id = %s",
                    (plan_status, plan_id_int)
                )
            rows_updated = cursor.rowcount
            if rows_updated != 1:
                logger.error("update_svp_plan_coversheet: UPDATE svp_plans affected %d rows (expected 1) plan_id=%s", rows_updated, plan_id_int)
                conn.rollback()
                cursor.close()
                return None
            if mark_complete:
                cursor.execute(
                    "UPDATE public.svp_plan_sections SET status = %s WHERE plan_id = %s AND section_id = %s",
                    ("Complete", plan_id_int, "cover_sheet")
                )
            else:
                cursor.execute(
                    """UPDATE public.svp_plan_sections SET status = %s
                       WHERE plan_id = %s AND section_id = %s AND (status IS NULL OR status != %s)""",
                    ("In Progress", plan_id_int, "cover_sheet", "Complete")
                )
            conn.commit()
            committed = True
            logger.info("update_svp_plan_coversheet: success plan_id=%s", plan_id_str)
        except Exception as e:
            logger.exception("update_svp_plan_coversheet: failed plan_id=%s %s", plan_id_str, e)
            conn.rollback()
        cursor.close()
        if not committed:
            return None
        return get_svp_plan_by_id(plan_id_str)
    except Exception as e:
        logger.exception("update_svp_plan_coversheet: error plan_id=%s %s", plan_id_str, e)
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()
