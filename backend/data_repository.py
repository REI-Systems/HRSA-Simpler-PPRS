"""
Repository for static data. Loads from central static_data.json.
"""
import json
from datetime import datetime
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent / "data"
STATIC_DATA_PATH = DATA_DIR / "static_data.json"

_cached_data = None
_cached_mtime = None


def _load_static_data():
    """Load static data from JSON. Cached in memory; reloads if file changed."""
    global _cached_data, _cached_mtime
    try:
        mtime = STATIC_DATA_PATH.stat().st_mtime
    except OSError:
        mtime = None
    if _cached_data is None or _cached_mtime != mtime:
        _cached_mtime = mtime
        try:
            with open(STATIC_DATA_PATH, "r", encoding="utf-8") as f:
                _cached_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            _cached_data = {}
    return _cached_data


def get_welcome():
    """Return welcome content."""
    data = _load_static_data()
    return data.get("welcome", {})


def get_menu():
    """Return sidebar menu (items list)."""
    data = _load_static_data()
    menu = data.get("menu", {})
    return menu.get("items", [])


def get_header_nav():
    """Return header navigation items."""
    data = _load_static_data()
    nav = data.get("header_nav", {})
    return nav.get("items", [])


def get_svp_plans():
    """Return SVP plans list (static + in-memory created)."""
    data = _load_static_data()
    svp = data.get("svp", {})
    static = list(svp.get("plans", []))
    return static + list(_created_plans)


def get_svp_config():
    """Return SVP grid/form config (columns, row_actions, search_fields, etc.)."""
    data = _load_static_data()
    svp = data.get("svp", {})
    return {
        "columns": svp.get("columns", []),
        "center_align_columns": svp.get("center_align_columns", []),
        "row_actions": svp.get("row_actions", []),
        "search_fields": svp.get("search_fields", []),
        "default_search_values": svp.get("default_search_values", {}),
    }


def get_svp_initiate_options():
    """Return options for SVP initiate form (bureaus, divisions, programs, teams, years)."""
    data = _load_static_data()
    svp_initiate = data.get("svp_initiate", {})
    current_year = datetime.now().year
    next_year = current_year + 1
    return {
        "bureaus": svp_initiate.get("bureaus", []),
        "divisions": svp_initiate.get("divisions", []),
        "programs": svp_initiate.get("programs", []),
        "teams": svp_initiate.get("teams", []),
        "fiscal_years": [current_year, next_year],
        "calendar_years": [current_year, next_year],
    }


# In-memory store for plans created via POST (not persisted to file).
_created_plans = []

DEFAULT_SECTIONS = [
    {"id": "cover_sheet", "name": "Cover Sheet", "status": "Not Started"},
    {"id": "selected_entities", "name": "Selected Entities", "status": "Not Started"},
    {"id": "identified_site_visits", "name": "Identified Site Visits", "status": "Not Started"},
]


def _all_svp_plans():
    """Static plans plus in-memory created plans."""
    return get_svp_plans()


def _attach_sections(plan):
    """Ensure plan has a sections list (for static plans that do not)."""
    out = dict(plan)
    if "sections" not in out or not out["sections"]:
        out["sections"] = list(DEFAULT_SECTIONS)
    return out


def get_svp_plan_by_id(plan_id):
    """Return a single SVP plan by id, with sections. None if not found."""
    plans = _all_svp_plans()
    plan_id_str = str(plan_id)
    for p in plans:
        if str(p.get("id")) == plan_id_str:
            return _attach_sections(p)
    return None


def create_svp_plan(payload):
    """Create a new SVP plan from initiate form payload. Returns new plan dict with sections."""
    all_plans = _all_svp_plans()
    max_id = 0
    for p in all_plans:
        try:
            max_id = max(max_id, int(p.get("id", 0)))
        except (TypeError, ValueError):
            pass
    new_id = str(max_id + 1)
    plan_code = "PSV-" + new_id.zfill(6)

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

    new_plan = {
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
    _created_plans.append(new_plan)
    return _attach_sections(new_plan)
