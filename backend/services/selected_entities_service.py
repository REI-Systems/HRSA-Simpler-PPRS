"""Selected Entities page service: entities CRUD and available entities."""
from repositories.svp_plan_repository import get_svp_plan_by_id
from repositories.selected_entities_repository import (
    get_plan_entities as repo_get_plan_entities,
    get_available_entities as repo_get_available_entities,
    add_entity_to_plan as repo_add_entity,
    remove_entity_from_plan as repo_remove_entity,
    update_entity_status as repo_update_entity_status,
)


def get_plan(plan_id):
    """Return plan by id (for 404 check)."""
    return get_svp_plan_by_id(plan_id)


def get_entities(plan_id):
    """Get entities for a plan."""
    return repo_get_plan_entities(plan_id)


def get_available(plan_id, search_params=None):
    """Get available entities not yet in plan."""
    return repo_get_available_entities(plan_id, search_params=search_params)


def add_entity(plan_id, entity_id):
    """Add an entity to a plan. Returns updated entities list or None."""
    return repo_add_entity(plan_id, entity_id)


def remove_entity(plan_id, entity_id):
    """Remove an entity from a plan. Returns True if removed."""
    return repo_remove_entity(plan_id, entity_id)


def update_entity_status(plan_id, entity_id, status=None, visit_started=None):
    """Update entity status and/or visit_started. Returns updated entities list or None."""
    return repo_update_entity_status(plan_id, entity_id, status=status, visit_started=visit_started)
