"""Basic Information page service: get basic info and options; update basic info (persisted to DB)."""
from repositories.basic_info_repository import (
    get_basic_info as repo_get_basic_info,
    upsert_basic_info as repo_upsert_basic_info,
    get_assignees as repo_get_assignees,
)
from services.selected_entities_service import update_entity_status as update_plan_entity_status

# Static option lists for dropdowns/checkboxes (phase 1; can move to app_config or static_data later)
DEFAULT_OPTIONS = {
    "additional_programs": [
        {"value": "H76", "label": "Ryan White Part C (H76)"},
        {"value": "H89", "label": "Other Program (H89)"},
    ],
    "site_visit_locations": [
        {"value": "on_site", "label": "On-Site"},
        {"value": "virtual", "label": "Virtual"},
        {"value": "hybrid", "label": "Hybrid"},
        {"value": "other", "label": "Other"},
    ],
    "reason_types": [
        {"value": "follow_up", "label": "Follow-up"},
        {"value": "new_start", "label": "New Start/Initial/Newly Funded"},
        {"value": "periodic", "label": "Periodic"},
        {"value": "other", "label": "Other"},
    ],
    "site_visit_types_primary": [
        {"value": "comprehensive", "label": "Comprehensive"},
        {"value": "focused", "label": "Focused"},
        {"value": "other", "label": "Other"},
    ],
    "site_visit_types_secondary": [
        {"value": "comprehensive", "label": "Comprehensive"},
        {"value": "focused", "label": "Focused"},
        {"value": "other", "label": "Other"},
    ],
    "areas_of_review": [
        "Administrative Management",
        "Clinical Performance/Improvement",
        "Financial/Fiscal Performance/Improvement",
        "Governance",
        "Planning Council",
    ],
    "roles": [
        {"value": "consultant", "label": "Consultant"},
        {"value": "lead", "label": "Lead"},
    ],
    "prioritization": [
        {"value": "High", "label": "High"},
        {"value": "Medium", "label": "Medium"},
        {"value": "Low", "label": "Low"},
    ],
    "assignees": [],  # populated from DB in get_basic_info_options()
}

# Fallback assignee list when DB table is empty or unavailable
DEFAULT_ASSIGNEES = [
    {"value": "Keo, Cybele", "label": "Keo, Cybele"},
    {"value": "Smith, Jane", "label": "Smith, Jane"},
    {"value": "Johnson, Robert", "label": "Johnson, Robert"},
]


def get_basic_info(plan_id, entity_id):
    """Return basic info payload for plan/entity or None if not found."""
    return repo_get_basic_info(plan_id, entity_id)


def get_basic_info_options():
    """Return option lists for dropdowns and checkboxes. Assignees are fetched from DB (basic_info_assignee)."""
    options = DEFAULT_OPTIONS.copy()
    assignees = repo_get_assignees()
    options["assignees"] = assignees if assignees else DEFAULT_ASSIGNEES
    return options


def update_basic_info(plan_id, entity_id, payload, plan_entity_id=None):
    """Persist basic info from payload and return updated full basic info. Payload may include action (save, save_and_continue, mark_complete) plus all form fields.
    When plan_entity_id is provided (e.g. from route after resolution), repo skips resolution.
    When action is mark_complete, also set the plan entity status to 'Complete' so Identified Site Visits shows it."""
    updated = repo_upsert_basic_info(plan_id, entity_id, payload, plan_entity_id=plan_entity_id)
    if updated and payload.get("action") == "mark_complete":
        update_plan_entity_status(plan_id, entity_id, status="Complete")
    return updated
