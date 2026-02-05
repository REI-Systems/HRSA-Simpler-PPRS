"""SVP Initiate page service: create plan, initiate options."""
from repositories.svp_initiate_repository import (
    get_svp_initiate_options as repo_get_initiate_options,
    create_svp_plan as repo_create_svp_plan,
)


def get_initiate_options():
    """Return options for SVP initiate form."""
    return repo_get_initiate_options()


def create_plan(payload):
    """Create a new SVP plan from initiate form payload. Returns plan dict or None."""
    return repo_create_svp_plan(payload)
