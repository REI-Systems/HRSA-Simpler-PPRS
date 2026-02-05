"""Selected Entities page repository: plan entities CRUD and available entities."""
import logging

from config.database import get_db_connection

logger = logging.getLogger(__name__)


def _entity_row_to_dict(row):
    """Convert entity row to API-style dict."""
    midpoint = row.get("midpoint_current_pp")
    midpoint_str = None
    if midpoint:
        if isinstance(midpoint, str):
            midpoint_str = midpoint
        else:
            midpoint_str = midpoint.strftime("%m/%d/%Y")
    return {
        "id": str(row["id"]),
        "plan_id": str(row.get("plan_id", "")),
        "entity_number": row.get("entity_number") or "",
        "entity_name": row.get("entity_name") or "",
        "city": row.get("city") or "",
        "state": row.get("state") or "",
        "midpoint_current_pp": midpoint_str or "",
        "active_grant_no_site_visit": "Yes" if row.get("active_grant_no_site_visit") else "No",
        "active_grant_1_year_pp": "Yes" if row.get("active_grant_1_year_pp") else "No",
        "active_new_grant": "Yes" if row.get("active_new_grant") else "No",
        "status": row.get("status") or "Not in Plan",
        "recent_site_visit_dates": row.get("recent_site_visit_dates") or "",
        "visit_started": bool(row.get("visit_started", False)),
    }


def _available_entity_row_to_dict(row):
    """Convert available entity row to API-style dict."""
    midpoint = row.get("midpoint_current_pp")
    midpoint_str = None
    if midpoint:
        if isinstance(midpoint, str):
            midpoint_str = midpoint
        else:
            midpoint_str = midpoint.strftime("%m/%d/%Y")
    return {
        "id": str(row["id"]),
        "entity_number": row.get("entity_number") or "",
        "entity_name": row.get("entity_name") or "",
        "city": row.get("city") or "",
        "state": row.get("state") or "",
        "midpoint_current_pp": midpoint_str or "",
        "active_grant_no_site_visit": "Yes" if row.get("active_grant_no_site_visit") else "No",
        "active_grant_1_year_pp": "Yes" if row.get("active_grant_1_year_pp") else "No",
        "active_new_grant": "Yes" if row.get("active_new_grant") else "No",
        "recent_site_visit_dates": row.get("recent_site_visit_dates") or "",
    }


def _sync_plan_site_visits_count(cursor, plan_id_int):
    """Set plan's site_visits to the count of entities in svp_plan_entities for this plan."""
    cursor.execute(
        """UPDATE public.svp_plans SET site_visits = (
            SELECT COUNT(*)::text FROM public.svp_plan_entities WHERE plan_id = %s
        ) WHERE id = %s""",
        (plan_id_int, plan_id_int),
    )


def _set_section_status_in_progress(cursor, plan_id_int, section_id):
    """Set a plan section's status to 'In Progress'. Inserts row if missing."""
    cursor.execute(
        """UPDATE public.svp_plan_sections SET status = 'In Progress'
           WHERE plan_id = %s AND section_id = %s""",
        (plan_id_int, section_id),
    )
    if cursor.rowcount == 0:
        section_name = {"cover_sheet": "Cover Sheet", "selected_entities": "Selected Entities", "identified_site_visits": "Identified Site Visits"}.get(section_id, section_id)
        cursor.execute(
            """INSERT INTO public.svp_plan_sections (plan_id, section_id, name, status)
               VALUES (%s, %s, %s, 'In Progress')""",
            (plan_id_int, section_id, section_name),
        )


def _resolve_plan_id_int(cursor, plan_id_str):
    """Return integer plan_id from plan_id_str (id or plan_code)."""
    if plan_id_str.isdigit():
        return int(plan_id_str)
    cursor.execute("SELECT id FROM public.svp_plans WHERE plan_code = %s", (plan_id_str,))
    row = cursor.fetchone()
    return row["id"] if row else None


def get_plan_entities(plan_id):
    """Get entities for a specific plan from svp_plan_entities."""
    plan_id_str = str(plan_id).strip()
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return []
        conn.autocommit = True
        cursor = conn.cursor()
        try:
            if plan_id_str.isdigit():
                cursor.execute(
                    """SELECT id, plan_id, entity_number, entity_name, city, state, midpoint_current_pp,
                       active_grant_no_site_visit, active_grant_1_year_pp, active_new_grant, status, recent_site_visit_dates,
                       visit_started
                       FROM public.svp_plan_entities WHERE plan_id = %s ORDER BY entity_number""",
                    (int(plan_id_str),)
                )
            else:
                cursor.execute("SELECT id FROM public.svp_plans WHERE plan_code = %s", (plan_id_str,))
                row = cursor.fetchone()
                if not row:
                    cursor.close()
                    return []
                cursor.execute(
                    """SELECT id, plan_id, entity_number, entity_name, city, state, midpoint_current_pp,
                       active_grant_no_site_visit, active_grant_1_year_pp, active_new_grant, status, recent_site_visit_dates,
                       visit_started
                       FROM public.svp_plan_entities WHERE plan_id = %s ORDER BY entity_number""",
                    (row["id"],)
                )
            rows = cursor.fetchall()
            cursor.close()
            return [_entity_row_to_dict(dict(row)) for row in rows] if rows else []
        except Exception as e:
            logger.exception("get_plan_entities: error %s", e)
            conn.rollback()
        cursor.close()
        return []
    except Exception:
        return []
    finally:
        if conn:
            conn.close()


def get_available_entities(plan_id, search_params=None):
    """Get entities not yet in plan (from entities table) for Add Grants modal."""
    plan_id_str = str(plan_id).strip()
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return []
        conn.autocommit = True
        cursor = conn.cursor()
        try:
            plan_id_int = _resolve_plan_id_int(cursor, plan_id_str)
            if plan_id_int is None:
                cursor.close()
                return []
            cursor.execute(
                "SELECT entity_number FROM public.svp_plan_entities WHERE plan_id = %s",
                (plan_id_int,)
            )
            existing_numbers = {r["entity_number"] for r in cursor.fetchall()}
            query = """SELECT id, entity_number, entity_name, city, state, midpoint_current_pp,
                      active_grant_no_site_visit, active_grant_1_year_pp, active_new_grant, recent_site_visit_dates
                      FROM public.entities WHERE 1=1"""
            params = []
            if search_params:
                entity_number = search_params.get("entity_number", "").strip()
                entity_name = search_params.get("entity_name", "").strip()
                city = search_params.get("city", "").strip()
                state = search_params.get("state", "").strip()
                if entity_number:
                    query += " AND entity_number ILIKE %s"
                    params.append(f"%{entity_number}%")
                if entity_name:
                    query += " AND entity_name ILIKE %s"
                    params.append(f"%{entity_name}%")
                if city:
                    query += " AND city ILIKE %s"
                    params.append(f"%{city}%")
                if state:
                    query += " AND state = %s"
                    params.append(state)
            query += " ORDER BY entity_number"
            cursor.execute(query, params)
            rows = cursor.fetchall()
            available = []
            for row in rows:
                r = dict(row)
                if r.get("entity_number") not in existing_numbers:
                    available.append(_available_entity_row_to_dict(r))
            cursor.close()
            return available
        except Exception as e:
            logger.exception("get_available_entities: error %s", e)
            conn.rollback()
        cursor.close()
        return []
    except Exception:
        return []
    finally:
        if conn:
            conn.close()


def get_entity_by_id(entity_id):
    """Get a single entity from entities table by id."""
    entity_id_str = str(entity_id).strip()
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return None
        conn.autocommit = True
        cursor = conn.cursor()
        try:
            cursor.execute(
                """SELECT id, entity_number, entity_name, city, state, midpoint_current_pp,
                   active_grant_no_site_visit, active_grant_1_year_pp, active_new_grant, recent_site_visit_dates
                   FROM public.entities WHERE id = %s""",
                (int(entity_id_str),)
            )
            row = cursor.fetchone()
            cursor.close()
            if row:
                return _available_entity_row_to_dict(dict(row))
            return None
        except Exception as e:
            logger.exception("get_entity_by_id: error %s", e)
            conn.rollback()
        cursor.close()
        return None
    except Exception:
        return None
    finally:
        if conn:
            conn.close()


def add_entity_to_plan(plan_id, entity_id):
    """Add an entity to a plan by copying from entities table to svp_plan_entities."""
    plan_id_str = str(plan_id).strip()
    entity_id_str = str(entity_id).strip()
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return None
        cursor = conn.cursor()
        try:
            plan_id_int = _resolve_plan_id_int(cursor, plan_id_str)
            if plan_id_int is None:
                conn.rollback()
                cursor.close()
                return None
            cursor.execute(
                """SELECT entity_number, entity_name, city, state, midpoint_current_pp,
                   active_grant_no_site_visit, active_grant_1_year_pp, active_new_grant, recent_site_visit_dates
                   FROM public.entities WHERE id = %s""",
                (int(entity_id_str),)
            )
            entity_row = cursor.fetchone()
            if not entity_row:
                conn.rollback()
                cursor.close()
                return None
            entity = dict(entity_row)
            cursor.execute(
                """INSERT INTO public.svp_plan_entities
                   (plan_id, entity_number, entity_name, city, state, midpoint_current_pp,
                    active_grant_no_site_visit, active_grant_1_year_pp, active_new_grant, status, recent_site_visit_dates)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                   ON CONFLICT (plan_id, entity_number) DO NOTHING
                   RETURNING id""",
                (
                    plan_id_int,
                    entity["entity_number"],
                    entity["entity_name"],
                    entity.get("city"),
                    entity.get("state"),
                    entity.get("midpoint_current_pp"),
                    entity.get("active_grant_no_site_visit", False),
                    entity.get("active_grant_1_year_pp", False),
                    entity.get("active_new_grant", False),
                    "Not in Plan",
                    entity.get("recent_site_visit_dates"),
                )
            )
            result = cursor.fetchone()
            if result:
                _sync_plan_site_visits_count(cursor, plan_id_int)
                _set_section_status_in_progress(cursor, plan_id_int, "selected_entities")
                conn.commit()
                cursor.close()
                logger.info("add_entity_to_plan: success plan_id=%s entity_id=%s", plan_id_str, entity_id_str)
                return get_plan_entities(plan_id_str)
            else:
                conn.rollback()
                cursor.close()
                return get_plan_entities(plan_id_str)
        except Exception as e:
            logger.exception("add_entity_to_plan: error %s", e)
            conn.rollback()
        cursor.close()
        return None
    except Exception:
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()


def remove_entity_from_plan(plan_id, entity_id):
    """Remove an entity from a plan."""
    plan_id_str = str(plan_id).strip()
    entity_id_str = str(entity_id).strip()
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return False
        cursor = conn.cursor()
        try:
            plan_id_int = _resolve_plan_id_int(cursor, plan_id_str)
            if plan_id_int is None:
                conn.rollback()
                cursor.close()
                return False
            cursor.execute(
                "DELETE FROM public.svp_plan_entities WHERE plan_id = %s AND id = %s",
                (plan_id_int, int(entity_id_str))
            )
            deleted = cursor.rowcount > 0
            if deleted:
                _sync_plan_site_visits_count(cursor, plan_id_int)
            conn.commit()
            cursor.close()
            logger.info("remove_entity_from_plan: success plan_id=%s entity_id=%s", plan_id_str, entity_id_str)
            return deleted
        except Exception as e:
            logger.exception("remove_entity_from_plan: error %s", e)
            conn.rollback()
        cursor.close()
        return False
    except Exception:
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()


def update_entity_status(plan_id, entity_id, status=None, visit_started=None):
    """Update entity status and/or visit_started in svp_plan_entities."""
    plan_id_str = str(plan_id).strip()
    entity_id_str = str(entity_id).strip()
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return None
        cursor = conn.cursor()
        try:
            plan_id_int = _resolve_plan_id_int(cursor, plan_id_str)
            if plan_id_int is None:
                conn.rollback()
                cursor.close()
                return None
            updates = []
            params = []
            if status is not None:
                updates.append("status = %s")
                params.append(status)
            if visit_started is not None:
                updates.append("visit_started = %s")
                params.append(bool(visit_started))
            if not updates:
                cursor.close()
                return get_plan_entities(plan_id_str)
            params.extend([plan_id_int, int(entity_id_str)])
            cursor.execute(
                "UPDATE public.svp_plan_entities SET " + ", ".join(updates) + " WHERE plan_id = %s AND id = %s",
                params
            )
            updated = cursor.rowcount > 0
            conn.commit()
            cursor.close()
            if updated:
                logger.info(
                    "update_entity_status: success plan_id=%s entity_id=%s status=%s visit_started=%s",
                    plan_id_str, entity_id_str, status, visit_started,
                )
                return get_plan_entities(plan_id_str)
            return None
        except Exception as e:
            logger.exception("update_entity_status: error %s", e)
            conn.rollback()
        cursor.close()
        return None
    except Exception:
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()
