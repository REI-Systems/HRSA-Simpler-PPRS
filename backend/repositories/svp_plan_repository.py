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


def update_svp_plan_status(plan_id, status):
    """Update a plan's status in svp_plans (e.g. to 'Complete'). When status is Complete, all plan sections are set to Complete. Returns updated plan dict or None."""
    plan_id_str = str(plan_id).strip()
    status_str = (status or "").strip()
    if not status_str:
        return None
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return None
        cursor = conn.cursor()
        try:
            if plan_id_str.isdigit():
                cursor.execute(
                    "UPDATE public.svp_plans SET status = %s WHERE id = %s",
                    (status_str, int(plan_id_str)),
                )
                plan_id_int = int(plan_id_str) if cursor.rowcount > 0 else None
            else:
                cursor.execute(
                    "UPDATE public.svp_plans SET status = %s WHERE plan_code = %s",
                    (status_str, plan_id_str),
                )
                plan_id_int = None
                if cursor.rowcount > 0:
                    cursor.execute("SELECT id FROM public.svp_plans WHERE plan_code = %s", (plan_id_str,))
                    row = cursor.fetchone()
                    if row:
                        plan_id_int = row["id"]
            if plan_id_int is None:
                cursor.close()
                return None
            # When plan is marked Complete, set all section statuses to Complete
            if status_str.strip().lower() == "complete":
                cursor.execute(
                    "UPDATE public.svp_plan_sections SET status = %s WHERE plan_id = %s",
                    ("Complete", plan_id_int),
                )
            conn.commit()
            cursor.close()
            return get_svp_plan_by_id(plan_id_str)
        except Exception:
            if conn:
                conn.rollback()
            cursor.close()
            return None
    except Exception:
        return None
    finally:
        if conn:
            conn.close()


def delete_svp_plan(plan_id):
    """Delete a site visit plan by id (numeric or plan_code). Child rows (sections, entities, access, etc.) are removed by DB CASCADE. Returns True if deleted, False if not found or error."""
    plan_id_str = str(plan_id).strip()
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return False
        cursor = conn.cursor()
        try:
            if plan_id_str.isdigit():
                cursor.execute("DELETE FROM public.svp_plans WHERE id = %s", (int(plan_id_str),))
            else:
                cursor.execute("DELETE FROM public.svp_plans WHERE plan_code = %s", (plan_id_str,))
            deleted = cursor.rowcount > 0
            conn.commit()
            cursor.close()
            return deleted
        except Exception:
            if conn:
                conn.rollback()
            cursor.close()
            return False
    except Exception:
        return False
    finally:
        if conn:
            conn.close()
