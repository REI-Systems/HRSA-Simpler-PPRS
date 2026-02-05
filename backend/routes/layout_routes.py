"""Layout API routes: menu and header nav."""
from flask import Blueprint, jsonify

from services.layout_service import get_menu, get_header_nav

layout_bp = Blueprint("layout", __name__, url_prefix="/api")


@layout_bp.route("/menu", methods=["GET"])
def api_menu():
    """Return sidebar menu items."""
    try:
        items = get_menu()
        return jsonify({"items": items})
    except Exception:
        return jsonify({"error": "Failed to load menu"}), 500


@layout_bp.route("/layout/header-nav", methods=["GET"])
def api_header_nav():
    """Return header navigation items."""
    try:
        items = get_header_nav()
        return jsonify({"items": items})
    except Exception:
        return jsonify({"error": "Failed to load header nav"}), 500
