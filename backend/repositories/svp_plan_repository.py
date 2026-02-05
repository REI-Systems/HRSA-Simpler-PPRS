"""
Shared SVP plan repository: get_svp_plan_by_id and section/plan helpers.
Used by svp_status, coversheet, and selected_entities repositories.
"""
from config.database import get_db_connection

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


def _plan_row_from_svp_plans(row):
    """Build API-style plan dict from svp_plans row (id INTEGER, plan_code VARCHAR). Optionally includes last_accessed_at from join."""
    plan_id = str(row["id"])
    plan_code = (row.get("plan_code") or "PSV-" + plan_id.zfill(6)).strip()
    out = {
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
    if row.get("last_accessed_at") is not None:
        out["last_accessed_at"] = row["last_accessed_at"].isoformat() if hasattr(row["last_accessed_at"], "isoformat") else str(row["last_accessed_at"])
    return out


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
