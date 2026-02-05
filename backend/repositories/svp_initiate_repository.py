"""SVP Initiate page repository: create plan, config, initiate options."""
import json
import logging
from datetime import datetime

from config.database import get_db_connection
from repositories.svp_plan_repository import DEFAULT_SECTIONS

logger = logging.getLogger(__name__)


def _empty_svp_config():
    return {
        "columns": [],
        "center_align_columns": [],
        "row_actions": [],
        "search_fields": [],
        "default_search_values": {},
    }


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


def _get_svp_config_from_app_config(conn):
    """Return SVP config from app_config.svp_config when svp_* tables are not used."""
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT value FROM public.app_config WHERE key = %s LIMIT 1",
            ("svp_config",)
        )
        row = cursor.fetchone()
        cursor.close()
        if not row or not row.get("value"):
            return None
        val = row["value"]
        if isinstance(val, str):
            val = json.loads(val)
        return {
            "columns": val.get("columns", []),
            "center_align_columns": val.get("center_align_columns", []),
            "row_actions": val.get("row_actions", []),
            "search_fields": val.get("search_fields", []),
            "default_search_values": val.get("default_search_values", {}),
        }
    except Exception:
        if cursor:
            try:
                cursor.close()
            except Exception:
                pass
        return None


def get_svp_config():
    """Return SVP grid/form config from svp_column, svp_center_align_column, svp_row_action, svp_search_field, svp_default_search_values. Falls back to app_config.svp_config if tables missing or empty."""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return _empty_svp_config()
        cursor = conn.cursor()

        try:
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
        except Exception:
            columns = []

        if not columns:
            cursor.close()
            cfg = _get_svp_config_from_app_config(conn)
            if cfg:
                return cfg
            return _empty_svp_config()

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
        try:
            if conn:
                cfg = _get_svp_config_from_app_config(conn)
                if cfg:
                    return cfg
        except Exception:
            pass
        return _empty_svp_config()
    finally:
        if conn:
            conn.close()


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
