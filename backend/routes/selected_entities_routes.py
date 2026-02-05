"""Selected Entities page API routes."""
import logging
from flask import Blueprint, jsonify, request

from services.selected_entities_service import (
    get_plan,
    get_entities,
    get_available,
    add_entity,
    remove_entity,
    update_entity_status,
)

logger = logging.getLogger(__name__)

selected_entities_bp = Blueprint("selected_entities", __name__, url_prefix="/api/svp")


@selected_entities_bp.route("/plans/<plan_id>/entities", methods=["GET"])
def api_svp_plan_entities(plan_id):
    """Get entities for a plan."""
    try:
        plan = get_plan(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        entities = get_entities(plan_id)
        return jsonify({"entities": entities}), 200
    except Exception as e:
        logger.exception("api_svp_plan_entities: error %s", e)
        return jsonify({"error": "Failed to load entities"}), 500


@selected_entities_bp.route("/plans/<plan_id>/entities/available", methods=["GET"])
def api_svp_plan_available_entities(plan_id):
    """Get available entities not yet in plan (for Add Grants modal)."""
    try:
        plan = get_plan(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        search_params = {}
        entity_number = request.args.get("entity_number", "").strip()
        entity_name = request.args.get("entity_name", "").strip()
        city = request.args.get("city", "").strip()
        state = request.args.get("state", "").strip()
        if entity_number:
            search_params["entity_number"] = entity_number
        if entity_name:
            search_params["entity_name"] = entity_name
        if city:
            search_params["city"] = city
        if state:
            search_params["state"] = state
        entities = get_available(plan_id, search_params if search_params else None)
        return jsonify({"entities": entities}), 200
    except Exception as e:
        logger.exception("api_svp_plan_available_entities: error %s", e)
        return jsonify({"error": "Failed to load available entities"}), 500


@selected_entities_bp.route("/plans/<plan_id>/entities", methods=["POST"])
def api_svp_plan_add_entity(plan_id):
    """Add an entity to a plan."""
    try:
        plan = get_plan(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        body = request.get_json(silent=True) or {}
        entity_id = body.get("entityId")
        if not entity_id:
            return jsonify({"error": "entityId is required"}), 400
        entities = add_entity(plan_id, entity_id)
        if entities is None:
            return jsonify({"error": "Failed to add entity"}), 500
        return jsonify({"entities": entities}), 200
    except Exception as e:
        logger.exception("api_svp_plan_add_entity: error %s", e)
        return jsonify({"error": "Failed to add entity"}), 500


@selected_entities_bp.route("/plans/<plan_id>/entities/<entity_id>", methods=["DELETE"])
def api_svp_plan_remove_entity(plan_id, entity_id):
    """Remove an entity from a plan."""
    try:
        plan = get_plan(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        deleted = remove_entity(plan_id, entity_id)
        if not deleted:
            return jsonify({"error": "Entity not found"}), 404
        return jsonify({"success": True}), 200
    except Exception as e:
        logger.exception("api_svp_plan_remove_entity: error %s", e)
        return jsonify({"error": "Failed to remove entity"}), 500


@selected_entities_bp.route("/plans/<plan_id>/entities/<entity_id>", methods=["PATCH"])
def api_svp_plan_update_entity_status(plan_id, entity_id):
    """Update entity status in a plan."""
    try:
        plan = get_plan(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        body = request.get_json(silent=True) or {}
        status = body.get("status")
        if not status:
            return jsonify({"error": "status is required"}), 400
        entities = update_entity_status(plan_id, entity_id, status)
        if entities is None:
            return jsonify({"error": "Failed to update entity status"}), 500
        return jsonify({"entities": entities}), 200
    except Exception as e:
        logger.exception("api_svp_plan_update_entity_status: error %s", e)
        return jsonify({"error": "Failed to update entity status"}), 500
