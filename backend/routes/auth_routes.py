"""Auth API routes: login, logout."""
import logging
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request, session

from services.auth_service import authenticate_user, DB_UNAVAILABLE

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate user and start a server-side session."""
    try:
        data = request.get_json() or {}
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

            # Initialize session for authenticated user
            now = datetime.now(timezone.utc).isoformat()
            session.clear()
            session["user_id"] = user.get("id")
            session["username"] = user.get("username")
            session["last_activity_utc"] = now
            session.permanent = True  # respect PERMANENT_SESSION_LIFETIME

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


@auth_bp.route("/keepalive", methods=["POST"])
def keepalive():
    """
    Refresh session activity timestamp to extend session.
    This endpoint is called when user confirms they want to continue their session.
    """
    try:
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"success": False, "message": "No active session"}), 401

        # Update last activity timestamp (this will be done by before_request too, but explicit here)
        from datetime import datetime, timezone
        session["last_activity_utc"] = datetime.now(timezone.utc).isoformat()
        session.permanent = True

        logger.info("Session refreshed for user_id=%r", user_id)
        return jsonify({"success": True}), 200
    except Exception as e:
        logger.exception("Keepalive error: %s", e)
        return jsonify({"success": False, "message": str(e)}), 500


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """
    Logout: invalidate current session.
    The frontend should also clear any locally cached user info, but backend
    enforcement is based on this server-side session state.
    """
    try:
        session.clear()
        return jsonify({"success": True}), 200
    except Exception as e:
        logger.exception("Logout error: %s", e)
        return jsonify({"success": False, "message": str(e)}), 500
