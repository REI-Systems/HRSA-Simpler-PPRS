"""SVP Status page service: get plan, update section status."""
from repositories.svp_plan_repository import get_svp_plan_by_id
from repositories.svp_status_repository import update_plan_section_status as repo_update_section_status


def get_plan_by_id(plan_id):
    """Return a single SVP plan by id, or None."""
    return get_svp_plan_by_id(plan_id)


def update_section_status(plan_id, section_id, status):
    """Update a plan section's status. Returns updated plan dict or None."""
    return repo_update_section_status(plan_id, section_id, status)
