"""SVP Status page API routes."""
import logging
from flask import Blueprint, jsonify, request

from services.svp_status_service import get_plan_by_id, update_plan_status, update_section_status

logger = logging.getLogger(__name__)

svp_status_bp = Blueprint("svp_status", __name__, url_prefix="/api/svp")


@svp_status_bp.route("/plans/<plan_id>", methods=["GET"])
def api_svp_plan_by_id(plan_id):
    """Return a single site visit plan by id. Disable caching so clients always get latest data."""
    try:
        plan = get_plan_by_id(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        response = jsonify(plan)
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        return response
    except Exception:
        return jsonify({"error": "Failed to load plan"}), 500


@svp_status_bp.route("/plans/<plan_id>", methods=["PATCH"])
def api_svp_plan_update(plan_id):
    """Update plan fields (e.g. status to 'Complete'). Body: { \"status\": \"Complete\" }."""
    try:
        plan = get_plan_by_id(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        body = request.get_json(silent=True) or {}
        status = body.get("status")
        if not status:
            return jsonify({"error": "status is required"}), 400
        # When completing the plan, require all sections to be Complete
        if status.strip().lower() == "complete":
            sections = plan.get("sections") or []
            incomplete = [
                (s.get("name") or s.get("id") or "Section")
                for s in sections
                if (s.get("status") or "").strip() != "Complete"
            ]
            if incomplete:
                return (
                    jsonify({
                        "error": "All sections must be completed before completing the plan.",
                        "incomplete_sections": incomplete,
                    }),
                    400,
                )
        updated = update_plan_status(plan_id, status)
        if updated is None:
            return jsonify({"error": "Failed to update plan status"}), 500
        return jsonify(updated), 200
    except Exception as e:
        logger.exception("api_svp_plan_update: error %s", e)
        return jsonify({"error": "Failed to update plan status"}), 500


@svp_status_bp.route("/plans/<plan_id>/sections/<section_id>", methods=["PATCH"])
def api_svp_plan_section(plan_id, section_id):
    """Update a plan section's status (e.g. selected_entities -> Complete)."""
    try:
        plan = get_plan_by_id(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        body = request.get_json(silent=True) or {}
        status = body.get("status")
        if not status:
            return jsonify({"error": "status is required"}), 400
        updated = update_section_status(plan_id, section_id, status)
        if updated is None:
            return jsonify({"error": "Failed to update section status"}), 500
        return jsonify(updated), 200
    except Exception as e:
        logger.exception("api_svp_plan_section: error %s", e)
        return jsonify({"error": "Failed to update section status"}), 500
