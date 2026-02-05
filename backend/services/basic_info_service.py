"""Basic Information page service: get basic info and options; update basic info (stub in phase 1)."""
from repositories.basic_info_repository import get_basic_info as repo_get_basic_info

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
}


def get_basic_info(plan_id, entity_id):
    """Return basic info payload for plan/entity or None if not found."""
    return repo_get_basic_info(plan_id, entity_id)


def get_basic_info_options():
    """Return option lists for dropdowns and checkboxes."""
    return DEFAULT_OPTIONS.copy()


def update_basic_info(plan_id, entity_id, payload):
    """Stub: accept payload and return current basic info (no persistence in phase 1)."""
    current = repo_get_basic_info(plan_id, entity_id)
    if current is None:
        return None
    return current
