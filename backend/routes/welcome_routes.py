"""Welcome page API routes."""
from datetime import datetime
from flask import Blueprint, jsonify

from services.welcome_service import get_welcome_message

welcome_bp = Blueprint("welcome", __name__, url_prefix="/api")


@welcome_bp.route("/welcome", methods=["GET"])
def get_welcome():
    """Get welcome message from database."""
    try:
        data = get_welcome_message()
        if data:
            return jsonify({
                "title": data["title"],
                "message": data["message"],
                "timestamp": datetime.now().isoformat()
            }), 200
        return jsonify({"error": "No welcome message found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
