"""SVP Initiate page API routes."""
import logging
from flask import Blueprint, jsonify, request

from services.svp_initiate_service import get_initiate_options, create_plan

logger = logging.getLogger(__name__)

svp_initiate_bp = Blueprint("svp_initiate", __name__, url_prefix="/api/svp")


@svp_initiate_bp.route("/initiate/options", methods=["GET"])
def api_svp_initiate_options():
    """Return options for SVP initiate form."""
    try:
        options = get_initiate_options()
        return jsonify(options)
    except Exception:
        return jsonify({"error": "Failed to load SVP initiate options"}), 500


@svp_initiate_bp.route("/plans", methods=["POST"])
def api_svp_plans_create():
    """Create a new site visit plan from initiate form payload."""
    try:
        body = request.get_json(silent=True) or {}
        logger.info("CREATE plan: request payload planFor=%r planPeriod=%r planName=%r", body.get("planFor"), body.get("planPeriod"), body.get("planName"))
        plan = create_plan(body)
        if plan is None:
            logger.error("CREATE plan: failed (repository returned None)")
            return jsonify({"error": "Failed to create plan"}), 500
        logger.info("CREATE plan: success id=%s plan_code=%s", plan.get("id"), plan.get("plan_code"))
        return jsonify(plan), 201
    except Exception as e:
        logger.exception("CREATE plan: error %s", e)
        return jsonify({"error": "Failed to create plan"}), 500
