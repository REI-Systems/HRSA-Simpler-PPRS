"""Basic Information page repository: get basic info payload for a plan entity (skeleton; no new DB columns in phase 1)."""
import logging

from repositories.svp_plan_repository import get_svp_plan_by_id
from repositories.selected_entities_repository import get_plan_entities

logger = logging.getLogger(__name__)


def get_basic_info(plan_id, entity_id):
    """Return basic info payload for the given plan and entity. Builds from plan + entity; tracking_number computed.
    Form field values are placeholders (null/empty) until DB columns exist."""
    plan_id_str = str(plan_id).strip()
    entity_id_str = str(entity_id).strip()
    plan = get_svp_plan_by_id(plan_id_str)
    if plan is None:
        return None
    entities = get_plan_entities(plan_id_str)
    entity = next((e for e in entities if str(e.get("id")) == entity_id_str), None)
    if entity is None:
        return None
    tracking_number = f"SV-{plan_id_str}-{entity_id_str}"
    city = (entity.get("city") or "").strip()
    state = (entity.get("state") or "").strip()
    location_parts = [entity.get("entity_number") or "", entity.get("entity_name") or ""]
    if city or state:
        location_parts.append(", ".join(filter(None, [city, state])))
    grant_label = ": ".join(filter(None, [entity.get("entity_number"), entity.get("entity_name")]))
    if location_parts and (city or state):
        grant_label += ", " + ", ".join(filter(None, [city, state]))
    site_visit_initiated_for = f"Ryan White Part C Outpatient EIS Program (H76) - {entity.get('entity_number') or ''}"
    return {
        "plan": plan,
        "entity": entity,
        "tracking_number": tracking_number,
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
        "travel_plans": [],
    }
