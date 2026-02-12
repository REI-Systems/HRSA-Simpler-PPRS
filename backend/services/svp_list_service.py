"""SVP List page service: list plans, record access, config, cancel plan."""
from repositories.svp_list_repository import get_svp_plans, record_plan_access
from repositories.svp_initiate_repository import get_svp_config
from repositories.svp_plan_repository import update_svp_plan_status as repo_update_plan_status


def get_plans(username=None):
    """Return SVP plans list, optionally with last_accessed_at for username."""
    return get_svp_plans(username=username)


def record_access(username, plan_id):
    """Record that the user accessed the plan. Returns True on success."""
    return record_plan_access(username, plan_id)


def get_config():
    """Return SVP grid/form config."""
    return get_svp_config()


def cancel_plan(plan_id):
    """Set a plan's status to 'Canceled' (soft cancel). Returns True if updated, False if not found or error."""
    updated = repo_update_plan_status(plan_id, "Canceled")
    return updated is not None
