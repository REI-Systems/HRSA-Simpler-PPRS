"""SVP List page service: list plans, record access, config."""
from repositories.svp_list_repository import get_svp_plans, record_plan_access
from repositories.svp_initiate_repository import get_svp_config


def get_plans(username=None):
    """Return SVP plans list, optionally with last_accessed_at for username."""
    return get_svp_plans(username=username)


def record_access(username, plan_id):
    """Record that the user accessed the plan. Returns True on success."""
    return record_plan_access(username, plan_id)


def get_config():
    """Return SVP grid/form config."""
    return get_svp_config()
