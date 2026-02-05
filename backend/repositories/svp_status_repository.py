"""SVP Status page repository: get plan by id, update section status."""
import logging

from config.database import get_db_connection
from repositories.svp_plan_repository import get_svp_plan_by_id

logger = logging.getLogger(__name__)


def update_plan_section_status(plan_id, section_id, status):
    """Update a plan section's status in svp_plan_sections. Returns updated plan dict or None."""
    plan_id_str = str(plan_id).strip()
    section_id_str = (section_id or "").strip()
    status_str = (status or "").strip()
    if not section_id_str or not status_str:
        return None
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
        try:
            cursor.execute(
                "UPDATE public.svp_plan_sections SET status = %s WHERE plan_id = %s AND section_id = %s",
                (status_str, plan_id_int, section_id_str),
            )
            if cursor.rowcount == 0:
                section_name = {"cover_sheet": "Cover Sheet", "selected_entities": "Selected Entities", "identified_site_visits": "Identified Site Visits"}.get(section_id_str, section_id_str)
                cursor.execute(
                    "INSERT INTO public.svp_plan_sections (plan_id, section_id, name, status) VALUES (%s, %s, %s, %s)",
                    (plan_id_int, section_id_str, section_name, status_str),
                )
            conn.commit()
            cursor.close()
            logger.info("update_plan_section_status: plan_id=%s section_id=%s status=%s", plan_id_str, section_id_str, status_str)
            return get_svp_plan_by_id(plan_id_str)
        except Exception as e:
            logger.exception("update_plan_section_status: failed %s", e)
            conn.rollback()
            cursor.close()
            return None
    except Exception as e:
        logger.exception("update_plan_section_status: error %s", e)
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()
