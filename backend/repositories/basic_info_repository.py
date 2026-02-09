"""Basic Information page repository: get/upsert basic info and travel plans for a plan entity; fetch assignee options."""
import json
import logging

from config.database import get_db_connection
from repositories.svp_plan_repository import get_svp_plan_by_id
from repositories.selected_entities_repository import get_plan_entities

logger = logging.getLogger(__name__)


def get_assignees():
    """Return list of assignee options from basic_info_assignee table for Select Assignee dropdown. Each item is {value, label}."""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return []
        conn.autocommit = True
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, name FROM public.basic_info_assignee ORDER BY sort_order, name"
        )
        rows = cursor.fetchall()
        cursor.close()
        return [{"value": str(r["name"]), "label": str(r["name"])} for r in (rows or [])]
    except Exception as e:
        logger.exception("get_assignees: error %s", e)
        return []
    finally:
        if conn:
            conn.close()


def _plan_entity_id_from_entity_id(plan_id, entity_id):
    """Resolve plan_entity_id: entity_id from API is svp_plan_entities.id (or entity_number as fallback). Verify it belongs to plan_id."""
    plan_id_str = str(plan_id).strip()
    entity_id_str = str(entity_id).strip() if entity_id is not None else ""
    if not entity_id_str:
        logger.warning("_plan_entity_id_from_entity_id: empty entity_id (plan_id=%s)", plan_id_str)
        return None
    entities = get_plan_entities(plan_id_str)
    if not entities:
        logger.warning("_plan_entity_id_from_entity_id: no entities for plan_id=%s", plan_id_str)
        return None
    entity_ids = [str(e.get("id")) for e in entities]
    # Match by svp_plan_entities.id (compare as string; id from DB may be int or str in dict)
    entity = next((e for e in entities if str(e.get("id")) == entity_id_str), None)
    # Fallback: match by entity_number (in case frontend or URL uses entity_number)
    if entity is None:
        entity = next((e for e in entities if (e.get("entity_number") or "").strip() == entity_id_str), None)
    if entity is None:
        logger.warning(
            "_plan_entity_id_from_entity_id: entity_id=%s not in plan_id=%s (plan has entity ids: %s)",
            entity_id_str, plan_id_str, entity_ids
        )
        return None
    return int(entity["id"])


def get_plan_entity_id_or_reason(plan_id, entity_id):
    """Resolve plan_entity_id; if not found return (None, reason_string) for 404 detail."""
    plan_id_str = str(plan_id).strip()
    entity_id_str = str(entity_id).strip() if entity_id is not None else ""
    if not entity_id_str:
        return None, "entity_id is missing"
    entities = get_plan_entities(plan_id_str)
    if not entities:
        return None, "plan has no entities"
    entity_ids = [str(e.get("id")) for e in entities]
    entity = next((e for e in entities if str(e.get("id")) == entity_id_str), None)
    if entity is None:
        entity = next((e for e in entities if (e.get("entity_number") or "").strip() == entity_id_str), None)
    if entity is None:
        return None, f"entity_id {entity_id_str!r} not in plan (plan has entity ids: {entity_ids})"
    return int(entity["id"]), None


def _row_to_basic_info_dict(row):
    """Convert svp_entity_basic_info row to API-style dict (snake_case, JSONB as list)."""
    if not row:
        return None
    out = {}
    for key, value in row.items():
        if key in ("id", "plan_entity_id", "created_at", "updated_at"):
            continue
        if key in ("conducted_by", "reason_types", "areas_of_review", "participants", "additional_programs"):
            if value is None:
                out[key] = []
            elif isinstance(value, str):
                try:
                    out[key] = json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    out[key] = []
            else:
                out[key] = list(value) if value else []
        elif hasattr(value, "strftime"):
            out[key] = value.strftime("%Y-%m-%d") if value else None
        else:
            out[key] = value
    return out


def _travel_row_to_dict(row):
    """Convert svp_entity_travel_plans row to API-style dict."""
    if not row:
        return None
    return {
        "id": row.get("id"),
        "number_of_travelers": row.get("number_of_travelers"),
        "travel_locations": row.get("travel_locations"),
        "travel_dates": row.get("travel_dates"),
        "travelers": row.get("travelers"),
        "travel_cost": row.get("travel_cost"),
        "status": row.get("status"),
    }


def get_basic_info_row(plan_entity_id):
    """Get a single svp_entity_basic_info row by plan_entity_id, or None."""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return None
        conn.autocommit = True
        cursor = conn.cursor()
        cursor.execute(
            """SELECT id, plan_entity_id, start_date, end_date, conducted_by, location, location_other,
                      reason_types, reason_other, justification, site_visit_type_primary, site_visit_type_primary_other,
                      site_visit_type_secondary, site_visit_type_secondary_other, areas_of_review, areas_of_review_other,
                      default_assignee, optional_assignee_role, optional_assignee_team, optional_assignee_assignee,
                      participants, prioritization, additional_programs, tracking_number
               FROM public.svp_entity_basic_info WHERE plan_entity_id = %s""",
            (plan_entity_id,),
        )
        row = cursor.fetchone()
        cursor.close()
        return dict(row) if row else None
    except Exception as e:
        logger.exception("get_basic_info_row: error %s", e)
        return None
    finally:
        if conn:
            conn.close()


def get_travel_plans(plan_entity_id):
    """Get all travel plan rows for a plan entity."""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return []
        conn.autocommit = True
        cursor = conn.cursor()
        cursor.execute(
            """SELECT id, plan_entity_id, number_of_travelers, travel_locations, travel_dates, travelers, travel_cost, status
               FROM public.svp_entity_travel_plans WHERE plan_entity_id = %s ORDER BY id""",
            (plan_entity_id,),
        )
        rows = cursor.fetchall()
        cursor.close()
        return [_travel_row_to_dict(dict(r)) for r in rows] if rows else []
    except Exception as e:
        logger.exception("get_travel_plans: error %s", e)
        return []
    finally:
        if conn:
            conn.close()


def get_basic_info(plan_id, entity_id):
    """Return full basic info payload for the given plan and entity. Merges DB row (if any) with plan + entity context."""
    plan_id_str = str(plan_id).strip()
    entity_id_str = str(entity_id).strip()
    plan = get_svp_plan_by_id(plan_id_str)
    if plan is None:
        return None
    entities = get_plan_entities(plan_id_str)
    entity = next((e for e in entities if str(e.get("id")) == entity_id_str), None)
    if entity is None:
        return None

    plan_entity_id = int(entity_id_str)
    db_row = get_basic_info_row(plan_entity_id)
    travel_plans = get_travel_plans(plan_entity_id)

    tracking_number = f"SV-{plan_id_str}-{entity_id_str}"
    city = (entity.get("city") or "").strip()
    state = (entity.get("state") or "").strip()
    grant_label = ": ".join(filter(None, [entity.get("entity_number"), entity.get("entity_name")]))
    if city or state:
        grant_label += ", " + ", ".join(filter(None, [city, state]))
    site_visit_initiated_for = f"Ryan White Part C Outpatient EIS Program (H76) - {entity.get('entity_number') or ''}"

    base = {
        "plan": plan,
        "entity": entity,
        "tracking_number": db_row.get("tracking_number") if db_row else tracking_number,
        "grant_label": grant_label,
        "site_visit_initiated_for": site_visit_initiated_for,
        "additional_programs": [],
        "start_date": None,
        "end_date": None,
        "conducted_by": [],
        "location": None,
        "location_other": None,
        "reason_types": [],
        "reason_other": None,
        "justification": None,
        "site_visit_type_primary": None,
        "site_visit_type_primary_other": None,
        "site_visit_type_secondary": None,
        "site_visit_type_secondary_other": None,
        "areas_of_review": [],
        "areas_of_review_other": None,
        "default_assignee": "Keo, Cybele",
        "optional_assignee_role": None,
        "optional_assignee_team": None,
        "optional_assignee_assignee": None,
        "participants": [],
        "prioritization": "Medium",
        "travel_plans": travel_plans,
    }

    if db_row:
        info = _row_to_basic_info_dict(db_row)
        for key in base:
            if key in ("plan", "entity", "grant_label", "site_visit_initiated_for", "travel_plans"):
                continue
            if key == "tracking_number":
                base[key] = info.get("tracking_number") or base[key]
                continue
            if key in info and info[key] is not None:
                base[key] = info[key]
    return base


def _date_or_none(s):
    """Parse YYYY-MM-DD string to date or None."""
    if s is None or (isinstance(s, str) and not s.strip()):
        return None
    if hasattr(s, "strftime"):
        return s
    try:
        from datetime import datetime
        return datetime.strptime(s.strip()[:10], "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


def _merge_payload_with_row(payload, existing_row):
    """Merge payload into existing row so only keys present in payload overwrite. Ignore 'action'."""
    out = dict(existing_row) if existing_row else {}
    skip = {"action", "plan", "entity", "grant_label", "site_visit_initiated_for", "travel_plans"}
    for key, value in payload.items():
        if key in skip:
            continue
        out[key] = value
    return out


def upsert_basic_info(plan_id, entity_id, payload, plan_entity_id=None):
    """Insert or update svp_entity_basic_info and optionally replace travel_plans. Returns updated full payload or None.
    Merges payload with existing row so only provided fields overwrite.
    When plan_entity_id is provided (e.g. from route after resolution), skip resolution."""
    if plan_entity_id is None:
        plan_entity_id = _plan_entity_id_from_entity_id(plan_id, entity_id)
        if plan_entity_id is None:
            return None

    existing = get_basic_info_row(plan_entity_id)
    existing_dict = _row_to_basic_info_dict(existing) if existing else {}
    merged = _merge_payload_with_row(payload, existing_dict)

    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            raise RuntimeError("Database connection unavailable")
        cursor = conn.cursor()

        start_date = _date_or_none(merged.get("start_date"))
        end_date = _date_or_none(merged.get("end_date"))
        conducted_by = merged.get("conducted_by")
        if not isinstance(conducted_by, list):
            conducted_by = []
        location = (merged.get("location") or "").strip() or None
        location_other = (merged.get("location_other") or "").strip() or None
        reason_types = merged.get("reason_types")
        if not isinstance(reason_types, list):
            reason_types = []
        reason_other = (merged.get("reason_other") or "").strip() or None
        justification = (merged.get("justification") or "").strip() or None
        site_visit_type_primary = (merged.get("site_visit_type_primary") or "").strip() or None
        site_visit_type_primary_other = (merged.get("site_visit_type_primary_other") or "").strip() or None
        site_visit_type_secondary = (merged.get("site_visit_type_secondary") or "").strip() or None
        site_visit_type_secondary_other = (merged.get("site_visit_type_secondary_other") or "").strip() or None
        areas_of_review = merged.get("areas_of_review")
        if not isinstance(areas_of_review, list):
            areas_of_review = []
        areas_of_review_other = (merged.get("areas_of_review_other") or "").strip() or None
        default_assignee = (merged.get("default_assignee") or "").strip() or None
        optional_assignee_role = (merged.get("optional_assignee_role") or "").strip() or None
        optional_assignee_team = (merged.get("optional_assignee_team") or "").strip() or None
        optional_assignee_assignee = (merged.get("optional_assignee_assignee") or "").strip() or None
        participants = merged.get("participants")
        if not isinstance(participants, list):
            participants = []
        prioritization = (merged.get("prioritization") or "").strip() or None
        additional_programs = merged.get("additional_programs")
        if not isinstance(additional_programs, list):
            additional_programs = []
        tracking_number = (merged.get("tracking_number") or "").strip() or None

        cursor.execute(
            """
            INSERT INTO public.svp_entity_basic_info (
                plan_entity_id, start_date, end_date, conducted_by, location, location_other,
                reason_types, reason_other, justification, site_visit_type_primary, site_visit_type_primary_other,
                site_visit_type_secondary, site_visit_type_secondary_other, areas_of_review, areas_of_review_other,
                default_assignee, optional_assignee_role, optional_assignee_team, optional_assignee_assignee,
                participants, prioritization, additional_programs, tracking_number, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW()
            )
            ON CONFLICT (plan_entity_id) DO UPDATE SET
                start_date = EXCLUDED.start_date,
                end_date = EXCLUDED.end_date,
                conducted_by = EXCLUDED.conducted_by,
                location = EXCLUDED.location,
                location_other = EXCLUDED.location_other,
                reason_types = EXCLUDED.reason_types,
                reason_other = EXCLUDED.reason_other,
                justification = EXCLUDED.justification,
                site_visit_type_primary = EXCLUDED.site_visit_type_primary,
                site_visit_type_primary_other = EXCLUDED.site_visit_type_primary_other,
                site_visit_type_secondary = EXCLUDED.site_visit_type_secondary,
                site_visit_type_secondary_other = EXCLUDED.site_visit_type_secondary_other,
                areas_of_review = EXCLUDED.areas_of_review,
                areas_of_review_other = EXCLUDED.areas_of_review_other,
                default_assignee = EXCLUDED.default_assignee,
                optional_assignee_role = EXCLUDED.optional_assignee_role,
                optional_assignee_team = EXCLUDED.optional_assignee_team,
                optional_assignee_assignee = EXCLUDED.optional_assignee_assignee,
                participants = EXCLUDED.participants,
                prioritization = EXCLUDED.prioritization,
                additional_programs = EXCLUDED.additional_programs,
                tracking_number = EXCLUDED.tracking_number,
                updated_at = NOW()
            """,
            (
                plan_entity_id, start_date, end_date, json.dumps(conducted_by), location, location_other,
                json.dumps(reason_types), reason_other, justification, site_visit_type_primary, site_visit_type_primary_other,
                site_visit_type_secondary, site_visit_type_secondary_other, json.dumps(areas_of_review), areas_of_review_other,
                default_assignee, optional_assignee_role, optional_assignee_team, optional_assignee_assignee,
                json.dumps(participants), prioritization, json.dumps(additional_programs), tracking_number,
            ),
        )
        conn.commit()

        # Replace travel plans if provided
        travel_plans_payload = payload.get("travel_plans")
        if isinstance(travel_plans_payload, list):
            cursor.execute("DELETE FROM public.svp_entity_travel_plans WHERE plan_entity_id = %s", (plan_entity_id,))
            for tp in travel_plans_payload:
                if not isinstance(tp, dict):
                    continue
                cursor.execute(
                    """INSERT INTO public.svp_entity_travel_plans
                       (plan_entity_id, number_of_travelers, travel_locations, travel_dates, travelers, travel_cost, status)
                       VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                    (
                        plan_entity_id,
                        (tp.get("number_of_travelers") or "").strip() or None,
                        (tp.get("travel_locations") or "").strip() or None,
                        (tp.get("travel_dates") or "").strip() or None,
                        (tp.get("travelers") or "").strip() or None,
                        (tp.get("travel_cost") or "").strip() or None,
                        (tp.get("status") or "").strip() or None,
                    ),
                )
            conn.commit()

        cursor.close()
        return get_basic_info(plan_id, entity_id)
    except Exception as e:
        logger.exception("upsert_basic_info: error %s", e)
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()
