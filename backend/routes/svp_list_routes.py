"""SVP List page API routes."""
import logging
from flask import Blueprint, jsonify, request

from services.svp_list_service import get_plans, record_access, get_config

logger = logging.getLogger(__name__)

svp_list_bp = Blueprint("svp_list", __name__, url_prefix="/api/svp")


@svp_list_bp.route("/plans", methods=["GET"])
def api_svp_plans():
    """Return site visit plans list. Optional query param username= for per-user last_accessed_at."""
    try:
        username = request.args.get("username") or None
        plans = get_plans(username=username)
        return jsonify({"plans": plans})
    except Exception:
        return jsonify({"error": "Failed to load SVP plans"}), 500


@svp_list_bp.route("/plans/<plan_id>/access", methods=["POST"])
def api_svp_plan_record_access(plan_id):
    """Record that the current user accessed this plan (for recent-plans ordering). Body: { \"username\": \"...\" }."""
    try:
        data = request.get_json(silent=True) or {}
        username = (data.get("username") or "").strip()
        if not username:
            return jsonify({"error": "username is required"}), 400
        if record_access(username, plan_id):
            return jsonify({"success": True}), 200
        return jsonify({"error": "Failed to record plan access"}), 500
    except Exception as e:
        logger.exception("record_plan_access: %s", e)
        return jsonify({"error": "Failed to record plan access"}), 500


@svp_list_bp.route("/config", methods=["GET"])
def api_svp_config():
    """Return SVP grid and search form config."""
    try:
        config = get_config()
        return jsonify(config)
    except Exception:
        return jsonify({"error": "Failed to load SVP config"}), 500
