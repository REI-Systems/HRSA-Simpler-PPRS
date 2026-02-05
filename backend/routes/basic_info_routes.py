"""Basic Information page API routes."""
import logging
from flask import Blueprint, jsonify, request

from services.basic_info_service import (
    get_basic_info,
    get_basic_info_options,
    update_basic_info,
)

logger = logging.getLogger(__name__)

basic_info_bp = Blueprint("basic_info", __name__, url_prefix="/api/svp")


@basic_info_bp.route("/plans/<plan_id>/entities/<entity_id>/basic-info", methods=["GET"])
def api_svp_plan_entity_basic_info_get(plan_id, entity_id):
    """Get basic info for a plan entity (plan + entity context, tracking_number, form values)."""
    try:
        data = get_basic_info(plan_id, entity_id)
        if data is None:
            return jsonify({"error": "Plan or entity not found"}), 404
        return jsonify(data), 200
    except Exception as e:
        logger.exception("api_svp_plan_entity_basic_info_get: error %s", e)
        return jsonify({"error": "Failed to load basic information"}), 500


@basic_info_bp.route("/plans/<plan_id>/entities/<entity_id>/basic-info", methods=["PATCH"])
def api_svp_plan_entity_basic_info_patch(plan_id, entity_id):
    """Update basic info (stub in phase 1: returns current data)."""
    try:
        body = request.get_json(silent=True) or {}
        updated = update_basic_info(plan_id, entity_id, body)
        if updated is None:
            return jsonify({"error": "Plan or entity not found"}), 404
        return jsonify(updated), 200
    except Exception as e:
        logger.exception("api_svp_plan_entity_basic_info_patch: error %s", e)
        return jsonify({"error": "Failed to update basic information"}), 500


@basic_info_bp.route("/basic-info/options", methods=["GET"])
def api_svp_basic_info_options():
    """Get option lists for basic info form (dropdowns, checkboxes)."""
    try:
        options = get_basic_info_options()
        return jsonify(options), 200
    except Exception as e:
        logger.exception("api_svp_basic_info_options: error %s", e)
        return jsonify({"error": "Failed to load options"}), 500
