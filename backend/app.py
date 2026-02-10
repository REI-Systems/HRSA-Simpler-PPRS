"""
Flask backend API for the community-driven platform.
Separation of concerns: routes by page/feature (auth, welcome, layout, SVP list, initiate, status, coversheet, selected entities).
"""
import logging
import os
from datetime import datetime, timedelta, timezone

# Load .env first so DATABASE_URL / AZURE_DB_* are set before any DB code runs
from dotenv import load_dotenv
_load_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(_load_env_path)

from flask import Flask, jsonify, request, session
from flask_cors import CORS

from routes.auth_routes import auth_bp
from routes.welcome_routes import welcome_bp
from routes.layout_routes import layout_bp
from routes.svp_list_routes import svp_list_bp
from routes.svp_initiate_routes import svp_initiate_bp
from routes.svp_status_routes import svp_status_bp
from routes.coversheet_routes import coversheet_bp
from routes.selected_entities_routes import selected_entities_bp
from routes.basic_info_routes import basic_info_bp

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Session / security configuration
# SECRET_KEY should be provided via environment for production deployments.
app.config["SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY", "change-me-in-prod")
# 15-minute inactivity timeout (sliding expiration handled in before_request)
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(minutes=15)
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

# CORS configuration - allow frontend to send cookies with API calls
# When using credentials, CORS requires explicit origins (no wildcards)
# Default to common Next.js dev ports, can be overridden via FRONTEND_URL env var
default_origins = [
    "http://localhost:3000",
    "http://localhost:3001",  # In case frontend runs on same port
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]
env_origins = os.environ.get("FRONTEND_URL", "").strip()
if env_origins:
    # Allow multiple origins separated by comma
    frontend_origins = [origin.strip() for origin in env_origins.split(",") if origin.strip()]
else:
    frontend_origins = default_origins

logger.info("CORS configured with allowed origins: %s", frontend_origins)

CORS(
    app,
    origins=frontend_origins,
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
)


def _is_public_path(path: str) -> bool:
    """
    Return True if the requested path should be accessible without authentication.
    """
    if path in ("/health", "/api/health"):
        return True
    # Allow login endpoint to be accessed without a session
    if path.startswith("/api/auth/login"):
        return True
    return False


@app.before_request
def enforce_authentication_and_timeout():
    """
    Global guard to ensure:
    - All /api/* endpoints (except health + login) require an authenticated session
    - Session expires after 15 minutes of inactivity
    """
    request_path = request.path or ""

    # Skip non-API routes and explicitly public endpoints
    if _is_public_path(request_path) or not request_path.startswith("/api/"):
        return None

    # Skip authentication check for OPTIONS requests (CORS preflight)
    if request.method == "OPTIONS":
        return None

    user_id = session.get("user_id")
    last_activity_ts = session.get("last_activity_utc")

    if not user_id:
        logger.info("Unauthorized access to %s: no session", request_path)
        return jsonify({"success": False, "message": "Authentication required"}), 401

    # Enforce inactivity timeout
    try:
        # last_activity_utc is stored as ISO string
        if last_activity_ts:
            last_activity = datetime.fromisoformat(last_activity_ts)
        else:
            last_activity = None
    except Exception:
        last_activity = None

    now = datetime.now(timezone.utc)
    if not last_activity:
        # If missing/invalid, treat as expired to be safe
        session.clear()
        logger.info("Session missing last_activity, expiring for user_id=%r", user_id)
        return jsonify({"success": False, "message": "Session expired. Please log in again."}), 401

    idle_duration = now - last_activity
    if idle_duration > timedelta(minutes=15):
        # Inactivity exceeded: clear session and reject
        session.clear()
        logger.info(
            "Session timeout for user_id=%r after %s of inactivity", user_id, idle_duration
        )
        return jsonify({"success": False, "message": "Session expired due to inactivity."}), 401

    # Sliding expiration: update last_activity on each valid request
    session["last_activity_utc"] = now.isoformat()
    session.permanent = True
    return None


# Register blueprints (endpoints organized by page/action)
app.register_blueprint(auth_bp)
app.register_blueprint(welcome_bp)
app.register_blueprint(layout_bp)
app.register_blueprint(svp_list_bp)
app.register_blueprint(svp_initiate_bp)
app.register_blueprint(svp_status_bp)
app.register_blueprint(coversheet_bp)
app.register_blueprint(selected_entities_bp)
app.register_blueprint(basic_info_bp)


@app.route("/health", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "service": "python-backend"}), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3001))
    app.run(host="0.0.0.0", port=port, debug=False)
