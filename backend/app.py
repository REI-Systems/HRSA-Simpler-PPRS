"""
Flask backend API for the community-driven platform.
Authentication, welcome content from database, static data via repository, and health check.
"""
import logging
import os
from datetime import datetime

# Load .env first so DATABASE_URL / AZURE_DB_* are set before any DB code runs
from dotenv import load_dotenv
_load_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(_load_env_path)

from flask import Flask, jsonify, request
from flask_cors import CORS
from services.welcome_service import get_welcome_message
from services.auth_service import authenticate_user, DB_UNAVAILABLE

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

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
CORS(app)  # Enable CORS for all routes

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user"""
    try:
        data = request.get_json()
        username = (data.get('username') or '').strip()
        password = (data.get('password') or '').strip()

        logger.info("Login attempt username=%r (password present=%s)", username, bool(password))

        if not username or not password:
            logger.warning("Login rejected: missing username or password")
            return jsonify({
                'success': False,
                'message': 'Username and password are required'
            }), 400

        user = authenticate_user(username, password)

        if user is DB_UNAVAILABLE:
            logger.error("Login failed: database unavailable (username=%r)", username)
            return jsonify({
                'success': False,
                'message': 'Database unavailable. Check that the database is running and seeded (run init_db.py and seed_data.py).'
            }), 503
        if user:
            logger.info("Login success username=%r user_id=%s", user.get('username'), user.get('id'))
            return jsonify({
                'success': True,
                'user': user
            }), 200
        logger.warning("Login failed: invalid credentials username=%r", username)
        return jsonify({
            'success': False,
            'message': 'Invalid username or password'
        }), 401

    except Exception as e:
        logger.exception("Login error: %s", e)
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout: invalidate current session (all devices/tabs when server sessions are used)."""
    # Stateless auth: no server session to clear. Return success so client can clear local state.
    return jsonify({'success': True}), 200


@app.route('/api/welcome', methods=['GET'])
def get_welcome():
    """Get welcome message from database"""
    try:
        data = get_welcome_message()
        
        if data:
            return jsonify({
                'title': data['title'],
                'message': data['message'],
                'timestamp': datetime.now().isoformat()
            }), 200
        else:
            return jsonify({'error': 'No welcome message found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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


@app.route('/health', methods=['GET'])
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'python-backend'}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=port, debug=False)
