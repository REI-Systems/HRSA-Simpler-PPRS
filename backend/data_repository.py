"""
Repository for application data. Fetches from Postgres using connection string from .env (config.database).
Reads from schema created by init_static_data.sql: menu_item, menu_item_child, header_nav_item,
svp_column, svp_center_align_column, svp_row_action, svp_search_field, svp_default_search_values,
svp_plan, svp_initiate_option.
"""
from datetime import datetime

from config.database import get_db_connection

DEFAULT_SECTIONS = [
    {"id": "cover_sheet", "name": "Cover Sheet", "status": "Not Started"},
    {"id": "selected_entities", "name": "Selected Entities", "status": "Not Started"},
    {"id": "identified_site_visits", "name": "Identified Site Visits", "status": "Not Started"},
]


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


def _plan_row_to_dict(row, sections=None):
    """Build API-style plan dict from svp_plan row (id is TEXT)."""
    plan_id = str(row["id"])
    plan_code = "PSV-" + plan_id.zfill(6)
    plan = {
        "id": plan_id,
        "plan_code": plan_code,
        "plan_for": row.get("plan_for") or "",
        "plan_period": row.get("plan_period") or "",
        "plan_name": row.get("plan_name") or "",
        "site_visits": row.get("site_visits") or "0",
        "status": row.get("status") or "In Progress",
        "team_name": row.get("team_name") or "",
        "needs_attention": row.get("needs_attention") or "",
    }
    plan["sections"] = sections if sections is not None else list(DEFAULT_SECTIONS)
    return plan


def get_svp_plans():
    """Return SVP plans list from svp_plan (id TEXT; no sections table — use DEFAULT_SECTIONS)."""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return []
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, plan_for, plan_period, plan_name, site_visits, status, team_name, needs_attention "
            "FROM public.svp_plan ORDER BY id::int"
        )
        rows = cursor.fetchall()
        cursor.close()
        return [_plan_row_to_dict(row) for row in rows]
    except Exception:
        return []
    finally:
        if conn:
            conn.close()


def get_svp_plan_by_id(plan_id):
    """Return a single SVP plan by id from svp_plan. None if not found."""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return None
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, plan_for, plan_period, plan_name, site_visits, status, team_name, needs_attention "
            "FROM public.svp_plan WHERE id = %s",
            (str(plan_id),)
        )
        row = cursor.fetchone()
        cursor.close()
        if not row:
            return None
        return _plan_row_to_dict(row)
    except Exception:
        return None
    finally:
        if conn:
            conn.close()


def create_svp_plan(payload):
    """Create a new SVP plan in svp_plan (id TEXT). Returns new plan dict with sections."""
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

    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return None
        cursor = conn.cursor()
        cursor.execute(
            "SELECT COALESCE(MAX(id::integer), 0) + 1 AS next_id FROM public.svp_plan"
        )
        next_id = cursor.fetchone()["next_id"]
        new_id = str(next_id)
        cursor.execute(
            """INSERT INTO public.svp_plan (id, plan_for, plan_period, plan_name, site_visits, status, team_name, needs_attention)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (new_id, plan_for, plan_period, plan_name, "0", "In Progress", team_name, "")
        )
        conn.commit()
        cursor.close()
        plan_code = "PSV-" + new_id.zfill(6)
        return {
            "id": new_id,
            "plan_code": plan_code,
            "plan_for": plan_for,
            "plan_period": plan_period,
            "plan_name": plan_name,
            "site_visits": "0",
            "status": "In Progress",
            "team_name": team_name,
            "needs_attention": "",
            "sections": list(DEFAULT_SECTIONS),
        }
    except Exception:
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()
