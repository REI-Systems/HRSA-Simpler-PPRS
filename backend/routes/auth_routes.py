"""Auth API routes: login, logout."""
import logging
from flask import Blueprint, jsonify, request

from services.auth_service import authenticate_user, DB_UNAVAILABLE

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate user."""
    try:
        data = request.get_json()
        username = (data.get("username") or "").strip()
        password = (data.get("password") or "").strip()

        logger.info("Login attempt username=%r (password present=%s)", username, bool(password))

        if not username or not password:
            logger.warning("Login rejected: missing username or password")
            return jsonify({
                "success": False,
                "message": "Username and password are required"
            }), 400

        user = authenticate_user(username, password)

        if user is DB_UNAVAILABLE:
            logger.error("Login failed: database unavailable (username=%r)", username)
            return jsonify({
                "success": False,
                "message": "Database unavailable. Check that the database is running and seeded (run init_db.py and seed_data.py)."
            }), 503
        if user:
            logger.info("Login success username=%r user_id=%s", user.get("username"), user.get("id"))
            return jsonify({
                "success": True,
                "user": user
            }), 200
        logger.warning("Login failed: invalid credentials username=%r", username)
        return jsonify({
            "success": False,
            "message": "Invalid username or password"
        }), 401

    except Exception as e:
        logger.exception("Login error: %s", e)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """Logout: invalidate current session (stateless auth: client clears local state)."""
    return jsonify({"success": True}), 200
