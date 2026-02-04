"""
Repository for application data. Fetches from Postgres using connection string from .env (config.database).
SVP plans use a single table: public.svp_plans (with public.svp_plan_sections for section status).
Also reads: menu_item, menu_item_child, header_nav_item, svp_column, svp_center_align_column,
svp_row_action, svp_search_field, svp_default_search_values, svp_initiate_option.
"""
import logging
from datetime import datetime

from config.database import get_db_connection

logger = logging.getLogger(__name__)

# Display order: Cover Sheet, Selected Entities, Identified Site Visits (all three tracked in svp_plan_sections)
DEFAULT_SECTIONS = [
    {"id": "cover_sheet", "name": "Cover Sheet", "status": "Not Started"},
    {"id": "selected_entities", "name": "Selected Entities", "status": "Not Started"},
    {"id": "identified_site_visits", "name": "Identified Site Visits", "status": "Not Started"},
]
SECTION_ORDER = ["cover_sheet", "selected_entities", "identified_site_visits"]


def _sections_from_db_rows(section_rows):
    """Build sections list in display order; merge with DEFAULT_SECTIONS so all three are always present with tracked status."""
    by_id = {r["section_id"]: {"id": r["section_id"], "name": r["name"], "status": r["status"] or "Not Started"} for r in (section_rows or [])}
    result = []
    for sec_id in SECTION_ORDER:
        default = next((s for s in DEFAULT_SECTIONS if s["id"] == sec_id), None)
        if not default:
            continue
        if sec_id in by_id:
            result.append(by_id[sec_id])
        else:
            result.append({"id": default["id"], "name": default["name"], "status": default["status"]})
    return result


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


def get_menu():
    """Return sidebar menu (items with children) from menu_item and menu_item_child."""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return []
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, label, expanded, sort_order FROM public.menu_item ORDER BY sort_order"
        )
        parents = cursor.fetchall()
        items = []
        for p in parents:
            cursor.execute(
                """SELECT child_id, label, href, is_header, sort_order
                   FROM public.menu_item_child WHERE menu_item_id = %s ORDER BY sort_order""",
                (p["id"],)
            )
            children_rows = cursor.fetchall()
            children = []
            for c in children_rows:
                child = {
                    "id": c["child_id"],
                    "label": c["label"],
                }
                if c.get("href") is not None:
                    child["href"] = c["href"]
                if c.get("is_header"):
                    child["header"] = True
                children.append(child)
            items.append({
                "id": p["id"],
                "label": p["label"],
                "expanded": bool(p.get("expanded", False)),
                "children": children,
            })
        cursor.close()
        return items
    except Exception:
        return []
    finally:
        if conn:
            conn.close()


def get_header_nav():
    """Return header navigation items from header_nav_item."""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return []
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, label, href FROM public.header_nav_item ORDER BY sort_order"
        )
        rows = cursor.fetchall()
        cursor.close()
        return [{"id": r["id"], "label": r["label"], "href": r["href"]} for r in rows]
    except Exception:
        return []
    finally:
        if conn:
            conn.close()


def get_svp_config():
    """Return SVP grid/form config from svp_column, svp_center_align_column, svp_row_action, svp_search_field, svp_default_search_values."""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return _empty_svp_config()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT key, label, filterable, filter_type, filter_options FROM public.svp_column ORDER BY sort_order"
        )
        columns = []
        for r in cursor.fetchall():
            col = {"key": r["key"], "label": r["label"], "filterable": bool(r.get("filterable", False))}
            if r.get("filter_type"):
                col["filterType"] = r["filter_type"]
            if r.get("filter_options") is not None:
                col["filterOptions"] = r["filter_options"]
            columns.append(col)

        cursor.execute("SELECT column_index FROM public.svp_center_align_column ORDER BY column_index")
        center_align_columns = [r["column_index"] for r in cursor.fetchall()]

        cursor.execute(
            "SELECT id, label, icon_left, icon_right, category, separator FROM public.svp_row_action ORDER BY sort_order"
        )
        row_actions = []
        for r in cursor.fetchall():
            ra = {"id": r["id"], "label": r["label"], "category": r["category"]}
            if r.get("icon_left"):
                ra["iconLeft"] = r["icon_left"]
            if r.get("icon_right"):
                ra["iconRight"] = r["icon_right"]
            if r.get("separator"):
                ra["separator"] = True
            row_actions.append(ra)

        cursor.execute(
            "SELECT key, label, type, options, filterable FROM public.svp_search_field ORDER BY sort_order"
        )
        search_fields = []
        for r in cursor.fetchall():
            sf = {"key": r["key"], "label": r["label"], "type": r["type"]}
            if r.get("options") is not None:
                sf["options"] = r["options"]
            if r.get("filterable"):
                sf["filterable"] = True
            search_fields.append(sf)

        cursor.execute(
            "SELECT bureau_name, plan_name_like, plan_period, programs, statuses, divisions, sort_method, search_name "
            "FROM public.svp_default_search_values LIMIT 1"
        )
        default_row = cursor.fetchone()
        default_search_values = {}
        if default_row:
            default_search_values = {
                "bureauName": default_row.get("bureau_name") or "",
                "planNameLike": default_row.get("plan_name_like") or "",
                "planPeriod": default_row.get("plan_period") or "All",
                "programs": default_row.get("programs") or ["All"],
                "statuses": default_row.get("statuses") or ["All"],
                "divisions": default_row.get("divisions") or ["All"],
                "sortMethod": default_row.get("sort_method") or "Grid",
                "searchName": default_row.get("search_name") or "",
            }

        cursor.close()
        return {
            "columns": columns,
            "center_align_columns": center_align_columns,
            "row_actions": row_actions,
            "search_fields": search_fields,
            "default_search_values": default_search_values,
        }
    except Exception:
        return _empty_svp_config()
    finally:
        if conn:
            conn.close()


def _empty_svp_config():
    return {
        "columns": [],
        "center_align_columns": [],
        "row_actions": [],
        "search_fields": [],
        "default_search_values": {},
    }


def get_svp_initiate_options():
    """Return options for SVP initiate form from svp_initiate_option (bureaus, divisions, programs, teams) plus years."""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return _empty_svp_initiate_options()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT option_type, value FROM public.svp_initiate_option ORDER BY option_type, sort_order"
        )
        rows = cursor.fetchall()
        cursor.close()
        bureaus, divisions, programs, teams = [], [], [], []
        for r in rows:
            v = r["value"]
            if r["option_type"] == "bureau":
                bureaus.append(v)
            elif r["option_type"] == "division":
                divisions.append(v)
            elif r["option_type"] == "program":
                programs.append(v)
            elif r["option_type"] == "team":
                teams.append(v)
        current_year = datetime.now().year
        next_year = current_year + 1
        return {
            "bureaus": bureaus,
            "divisions": divisions,
            "programs": programs,
            "teams": teams,
            "fiscal_years": [current_year, next_year],
            "calendar_years": [current_year, next_year],
        }
    except Exception:
        return _empty_svp_initiate_options()
    finally:
        if conn:
            conn.close()


def _empty_svp_initiate_options():
    current_year = datetime.now().year
    return {
        "bureaus": [],
        "divisions": [],
        "programs": [],
        "teams": [],
        "fiscal_years": [current_year, current_year + 1],
        "calendar_years": [current_year, current_year + 1],
    }


def get_svp_plans():
    """Return SVP plans list from public.svp_plans. Uses autocommit so list always sees latest committed data."""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return []
        conn.autocommit = True
        cursor = conn.cursor()
        try:
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


def _plan_row_from_svp_plans(row):
    """Build API-style plan dict from svp_plans row (id INTEGER, plan_code VARCHAR)."""
    plan_id = str(row["id"])
    plan_code = (row.get("plan_code") or "PSV-" + plan_id.zfill(6)).strip()
    return {
        "id": plan_id,
        "plan_code": plan_code,
        "plan_for": row.get("plan_for") or "",
        "plan_period": row.get("plan_period") or "",
        "plan_name": row.get("plan_name") or "",
        "plan_description": row.get("plan_description") or "",
        "site_visits": str(row.get("site_visits") or "0") if row.get("site_visits") is not None else "0",
        "status": row.get("status") or "In Progress",
        "team_name": row.get("team_name") or "",
        "needs_attention": row.get("needs_attention") or "",
        "sections": list(DEFAULT_SECTIONS),
    }


def get_svp_plan_by_id(plan_id):
    """Return a single SVP plan by id from public.svp_plans. None if not found. Uses autocommit so read always sees latest committed data."""
    plan_id_str = str(plan_id).strip()
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return None
        conn.autocommit = True
        cursor = conn.cursor()
        try:
            if plan_id_str.isdigit():
                cursor.execute(
                    "SELECT id, plan_code, plan_for, plan_period, plan_name, plan_description, site_visits, status, team_name, needs_attention "
                    "FROM public.svp_plans WHERE id = %s",
                    (int(plan_id_str),)
                )
            else:
                cursor.execute(
                    "SELECT id, plan_code, plan_for, plan_period, plan_name, plan_description, site_visits, status, team_name, needs_attention "
                    "FROM public.svp_plans WHERE plan_code = %s",
                    (plan_id_str,)
                )
            row = cursor.fetchone()
            if not row:
                cursor.close()
                return None
            r = dict(row)
            if r.get("plan_description") is None:
                r["plan_description"] = ""
            plan_dict = _plan_row_from_svp_plans(r)
            try:
                pid = int(r["id"])
                cursor.execute(
                    "SELECT section_id, name, status FROM public.svp_plan_sections WHERE plan_id = %s",
                    (pid,)
                )
                section_rows = cursor.fetchall()
                plan_dict["sections"] = _sections_from_db_rows([dict(s) for s in section_rows])
            except Exception:
                plan_dict["sections"] = list(DEFAULT_SECTIONS)
            cursor.close()
            return plan_dict
        except Exception:
            conn.rollback()
        cursor.close()
        return None
    except Exception:
        return None
    finally:
        if conn:
            conn.close()


def _create_plan_payload_from_request(payload):
    """Build plan_for, plan_period, plan_name, team_name from initiate form payload."""
    plan_for_type = (payload.get("planForType") or "").strip().lower()
    bureau = (payload.get("bureau") or "").strip()
    division = (payload.get("division") or "").strip()
    program = (payload.get("program") or "").strip()
    if plan_for_type == "bureau" and bureau:
        plan_for = f"Bureau - {bureau}"
    elif plan_for_type == "division" and division:
        plan_for = f"Division - {division}"
    elif plan_for_type == "program" and program:
        plan_for = f"Program - {program}"
    else:
        plan_for = ""

    period_type = (payload.get("periodType") or "").strip().lower()
    fiscal_year = payload.get("fiscalYear")
    calendar_year = payload.get("calendarYear")
    if period_type == "fiscal" and fiscal_year:
        plan_period = f"FY-{fiscal_year}"
    elif period_type == "calendar" and calendar_year:
        plan_period = f"CY-{calendar_year}"
    else:
        plan_period = ""

    plan_name = (payload.get("planName") or "").strip()
    team_name = (payload.get("team") or "").strip()
    return plan_for, plan_period, plan_name, team_name


def create_svp_plan(payload):
    """Create a new SVP plan in public.svp_plans and public.svp_plan_sections. Returns new plan dict with sections."""
    plan_for, plan_period, plan_name, team_name = _create_plan_payload_from_request(payload)
    logger.info("create_svp_plan: plan_for=%r plan_period=%r plan_name=%r", plan_for, plan_period, plan_name)

    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return None
        cursor = conn.cursor()
        try:
            cursor.execute(
                """INSERT INTO public.svp_plans (plan_code, plan_for, plan_period, plan_name, plan_description, site_visits, status, team_name, needs_attention)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                ("PSV-000000", plan_for, plan_period, plan_name, "", "0", "In Progress", team_name, "")
            )
            row = cursor.fetchone()
            if not row:
                conn.rollback()
                cursor.close()
                return None
            new_id = row["id"]
            plan_code = "PSV-" + str(new_id).zfill(6)
            cursor.execute(
                "UPDATE public.svp_plans SET plan_code = %s WHERE id = %s",
                (plan_code, new_id)
            )
            for sec in DEFAULT_SECTIONS:
                cursor.execute(
                    "INSERT INTO public.svp_plan_sections (plan_id, section_id, name, status) VALUES (%s, %s, %s, %s)",
                    (new_id, sec["id"], sec["name"], sec["status"])
                )
            conn.commit()
            cursor.close()
            logger.info("create_svp_plan: success id=%s plan_code=%s", new_id, plan_code)
            return {
                "id": str(new_id),
                "plan_code": plan_code,
                "plan_for": plan_for,
                "plan_period": plan_period,
                "plan_name": plan_name,
                "plan_description": "",
                "site_visits": "0",
                "status": "In Progress",
                "team_name": team_name,
                "needs_attention": "",
                "sections": list(DEFAULT_SECTIONS),
            }
        except Exception as e:
            logger.exception("create_svp_plan: failed %s", e)
            if conn:
                conn.rollback()
            return None
    except Exception as e:
        logger.exception("create_svp_plan: error %s", e)
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()


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
                       active_grant_no_site_visit, active_grant_1_year_pp, active_new_grant, status, recent_site_visit_dates
                       FROM public.svp_plan_entities WHERE plan_id = %s ORDER BY entity_number""",
                    (int(plan_id_str),)
                )
            else:
                # Look up plan_id from plan_code
                cursor.execute("SELECT id FROM public.svp_plans WHERE plan_code = %s", (plan_id_str,))
                row = cursor.fetchone()
                if not row:
                    cursor.close()
                    return []
                cursor.execute(
                    """SELECT id, plan_id, entity_number, entity_name, city, state, midpoint_current_pp,
                       active_grant_no_site_visit, active_grant_1_year_pp, active_new_grant, status, recent_site_visit_dates
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
    }


def get_available_entities(plan_id, search_params=None):
    """Get entities not yet in plan (from entities table) for Add Grants modal.
    search_params can include: entity_number, entity_name, city, state."""
    plan_id_str = str(plan_id).strip()
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return []
        conn.autocommit = True
        cursor = conn.cursor()
        try:
            # Get plan_id if plan_code was provided
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
                return []
            
            # Get entity_numbers already in plan
            cursor.execute(
                "SELECT entity_number FROM public.svp_plan_entities WHERE plan_id = %s",
                (plan_id_int,)
            )
            existing_numbers = {r["entity_number"] for r in cursor.fetchall()}
            
            # Build query for available entities
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
            
            # Filter out entities already in plan
            available = []
            for row in rows:
                entity_num = row["entity_number"]
                if entity_num not in existing_numbers:
                    available.append(_available_entity_row_to_dict(dict(row)))
            
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


def _sync_plan_site_visits_count(cursor, plan_id_int):
    """Set plan's site_visits to the count of entities in svp_plan_entities for this plan."""
    cursor.execute(
        """UPDATE public.svp_plans SET site_visits = (
            SELECT COUNT(*)::text FROM public.svp_plan_entities WHERE plan_id = %s
        ) WHERE id = %s""",
        (plan_id_int, plan_id_int),
    )


def _set_section_status_in_progress(cursor, plan_id_int, section_id):
    """Set a plan section's status to 'In Progress'. Inserts row if missing (e.g. legacy plan)."""
    cursor.execute(
        """UPDATE public.svp_plan_sections SET status = 'In Progress'
           WHERE plan_id = %s AND section_id = %s""",
        (plan_id_int, section_id),
    )
    if cursor.rowcount == 0:
        # Section row may not exist for older plans; insert it
        section_name = {"cover_sheet": "Cover Sheet", "selected_entities": "Selected Entities", "identified_site_visits": "Identified Site Visits"}.get(section_id, section_id)
        cursor.execute(
            """INSERT INTO public.svp_plan_sections (plan_id, section_id, name, status)
               VALUES (%s, %s, %s, 'In Progress')""",
            (plan_id_int, section_id, section_name),
        )


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
            # Get plan_id if plan_code was provided
            plan_id_int = None
            if plan_id_str.isdigit():
                plan_id_int = int(plan_id_str)
            else:
                cursor.execute("SELECT id FROM public.svp_plans WHERE plan_code = %s", (plan_id_str,))
                row = cursor.fetchone()
                if row:
                    plan_id_int = row["id"]
            
            if plan_id_int is None:
                conn.rollback()
                cursor.close()
                return None
            
            # Get entity from entities table
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
            
            # Insert into svp_plan_entities
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
                new_id = result["id"]
                _sync_plan_site_visits_count(cursor, plan_id_int)
                _set_section_status_in_progress(cursor, plan_id_int, "selected_entities")
                conn.commit()
                cursor.close()
                logger.info("add_entity_to_plan: success plan_id=%s entity_id=%s", plan_id_str, entity_id_str)
                return get_plan_entities(plan_id_str)
            else:
                # Entity already exists in plan
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
            # Get plan_id if plan_code was provided
            plan_id_int = None
            if plan_id_str.isdigit():
                plan_id_int = int(plan_id_str)
            else:
                cursor.execute("SELECT id FROM public.svp_plans WHERE plan_code = %s", (plan_id_str,))
                row = cursor.fetchone()
                if row:
                    plan_id_int = row["id"]
            
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


def update_entity_status(plan_id, entity_id, status):
    """Update entity status in svp_plan_entities."""
    plan_id_str = str(plan_id).strip()
    entity_id_str = str(entity_id).strip()
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return None
        cursor = conn.cursor()
        try:
            # Get plan_id if plan_code was provided
            plan_id_int = None
            if plan_id_str.isdigit():
                plan_id_int = int(plan_id_str)
            else:
                cursor.execute("SELECT id FROM public.svp_plans WHERE plan_code = %s", (plan_id_str,))
                row = cursor.fetchone()
                if row:
                    plan_id_int = row["id"]
            
            if plan_id_int is None:
                conn.rollback()
                cursor.close()
                return None
            
            cursor.execute(
                "UPDATE public.svp_plan_entities SET status = %s WHERE plan_id = %s AND id = %s",
                (status, plan_id_int, int(entity_id_str))
            )
            updated = cursor.rowcount > 0
            conn.commit()
            cursor.close()
            if updated:
                logger.info("update_entity_status: success plan_id=%s entity_id=%s status=%s", plan_id_str, entity_id_str, status)
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
