"""
Flask backend API for the community-driven platform.
Serves static data from central static_data.json via repository.
"""
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS

from data_repository import (
    get_welcome as repo_get_welcome,
    get_menu,
    get_header_nav,
    get_svp_plans,
    get_svp_plan_by_id,
    create_svp_plan,
    get_svp_config,
    get_svp_initiate_options,
)

app = Flask(__name__)
CORS(app)


@app.route("/api/welcome", methods=["GET"])
def api_welcome():
    """Return welcome message and features."""
    try:
        data = repo_get_welcome()
        return jsonify(data)
    except Exception:
        return jsonify({"error": "Failed to load content"}), 500


@app.route("/api/menu", methods=["GET"])
def api_menu():
    """Return sidebar menu items."""
    try:
        items = get_menu()
        return jsonify({"items": items})
    except Exception:
        return jsonify({"error": "Failed to load menu"}), 500


@app.route("/api/layout/header-nav", methods=["GET"])
def api_header_nav():
    """Return header navigation items."""
    try:
        items = get_header_nav()
        return jsonify({"items": items})
    except Exception:
        return jsonify({"error": "Failed to load header nav"}), 500


@app.route("/api/svp/plans", methods=["GET"])
def api_svp_plans():
    """Return site visit plans list."""
    try:
        plans = get_svp_plans()
        return jsonify({"plans": plans})
    except Exception:
        return jsonify({"error": "Failed to load SVP plans"}), 500


@app.route("/api/svp/plans", methods=["POST"])
def api_svp_plans_create():
    """Create a new site visit plan from initiate form payload."""
    try:
        body = request.get_json(silent=True) or {}
        plan = create_svp_plan(body)
        return jsonify(plan), 201
    except Exception:
        return jsonify({"error": "Failed to create plan"}), 500


@app.route("/api/svp/plans/<plan_id>", methods=["GET"])
def api_svp_plan_by_id(plan_id):
    """Return a single site visit plan by id."""
    try:
        plan = get_svp_plan_by_id(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        return jsonify(plan)
    except Exception:
        return jsonify({"error": "Failed to load plan"}), 500


@app.route("/api/svp/config", methods=["GET"])
def api_svp_config():
    """Return SVP grid and search form config."""
    try:
        config = get_svp_config()
        return jsonify(config)
    except Exception:
        return jsonify({"error": "Failed to load SVP config"}), 500


@app.route("/api/svp/initiate/options", methods=["GET"])
def api_svp_initiate_options():
    """Return options for SVP initiate form."""
    try:
        options = get_svp_initiate_options()
        return jsonify(options)
    except Exception:
        return jsonify({"error": "Failed to load SVP initiate options"}), 500


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify(
        {"status": "OK", "timestamp": datetime.utcnow().isoformat() + "Z"}
    )


if __name__ == "__main__":
    port = int(__import__("os").environ.get("PORT", 3001))
    app.run(host="0.0.0.0", port=port, debug=True)
