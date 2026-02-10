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

from flask import Flask, jsonify, request, g
from flask_cors import CORS

from utils.jwt_utils import decode_token, extract_token_from_header

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

# JWT Authentication - no session cookies needed
# JWT tokens are sent in Authorization header, works across any domains

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
def enforce_jwt_authentication():
    """
    Global guard to ensure:
    - All /api/* endpoints (except health + login) require a valid JWT token
    """
    request_path = request.path or ""

    # Skip non-API routes and explicitly public endpoints
    if _is_public_path(request_path) or not request_path.startswith("/api/"):
        return None

    # Skip authentication check for OPTIONS requests (CORS preflight)
    if request.method == "OPTIONS":
        return None

    # Extract and validate JWT token
    auth_header = request.headers.get("Authorization")
    token = extract_token_from_header(auth_header)
    
    if not token:
        logger.info("Unauthorized access to %s: no token", request_path)
        return jsonify({"success": False, "message": "Authentication required"}), 401
    
    payload = decode_token(token)
    if not payload:
        logger.info("Unauthorized access to %s: invalid/expired token", request_path)
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401
    
    # Store user info in request context for use in route handlers
    g.user_id = payload.get("user_id")
    g.username = payload.get("username")
    
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
