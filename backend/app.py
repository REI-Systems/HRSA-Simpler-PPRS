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
from services.coversheet_attachment_service import (
    save_attachment,
    list_attachments,
    delete_attachment as delete_coversheet_attachment,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

from data_repository import (
    get_welcome as repo_get_welcome,
    get_menu,
    get_header_nav,
    get_svp_plans,
    get_svp_plan_by_id,
    create_svp_plan,
    update_svp_plan_coversheet,
    update_plan_section_status,
    get_svp_config,
    get_svp_initiate_options,
    get_plan_entities,
    get_available_entities,
    add_entity_to_plan,
    remove_entity_from_plan,
    update_entity_status,
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
        logger.info("CREATE plan: request payload planFor=%r planPeriod=%r planName=%r", body.get("planFor"), body.get("planPeriod"), body.get("planName"))
        plan = create_svp_plan(body)
        if plan is None:
            logger.error("CREATE plan: failed (repository returned None)")
            return jsonify({"error": "Failed to create plan"}), 500
        logger.info("CREATE plan: success id=%s plan_code=%s", plan.get("id"), plan.get("plan_code"))
        return jsonify(plan), 201
    except Exception as e:
        logger.exception("CREATE plan: error %s", e)
        return jsonify({"error": "Failed to create plan"}), 500


@app.route("/api/svp/plans/<plan_id>", methods=["GET"])
def api_svp_plan_by_id(plan_id):
    """Return a single site visit plan by id. Disable caching so clients always get latest data."""
    try:
        plan = get_svp_plan_by_id(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        response = jsonify(plan)
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        return response
    except Exception:
        return jsonify({"error": "Failed to load plan"}), 500


@app.route("/api/svp/plans/<plan_id>/coversheet", methods=["PATCH"])
def api_svp_plan_coversheet(plan_id):
    """Update coversheet fields (plan name, plan description) and optional action: save | save_and_continue | mark_complete."""
    try:
        plan = get_svp_plan_by_id(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        body = request.get_json(silent=True) or {}
        action = (body.get("action") or "").strip().lower() or None
        plan_name = body.get("planName")
        plan_description = body.get("planDescription")
        if plan_name is None and plan_description is None and action not in ("save", "save_and_continue", "mark_complete"):
            return jsonify(plan), 200
        plan_name = (plan_name.strip() if isinstance(plan_name, str) else (plan.get("plan_name") or plan.get("planName") or ""))
        plan_description = (plan_description if isinstance(plan_description, str) else (plan.get("plan_description") or plan.get("planDescription") or ""))
        logger.info("UPDATE coversheet: plan_id=%s action=%r plan_name=%r plan_description_len=%d", plan_id, action, plan_name, len(plan_description or ""))
        updated = update_svp_plan_coversheet(
            plan_id,
            plan_name=plan_name,
            plan_description=plan_description,
            action=action,
        )
        if updated is None:
            logger.error("UPDATE coversheet: failed plan_id=%s", plan_id)
            return jsonify({"error": "Failed to update coversheet"}), 500
        logger.info("UPDATE coversheet: success plan_id=%s", plan_id)
        # Ensure response contains the values we just saved (re-read may return stale data from another table)
        updated["plan_name"] = plan_name
        updated["plan_description"] = plan_description
        if action == "save_and_continue":
            return jsonify({"plan": updated, "nextUrl": f"/svp/status/{plan_id}"}), 200
        return jsonify(updated), 200
    except Exception as e:
        logger.exception("UPDATE coversheet: error %s", e)
        return jsonify({"error": "Failed to update coversheet"}), 500


@app.route("/api/svp/plans/<plan_id>/coversheet/attachments", methods=["GET"])
def api_svp_plan_coversheet_attachments_list(plan_id):
    """List coversheet attachments for a plan."""
    try:
        plan = get_svp_plan_by_id(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        files = list_attachments(plan)
        return jsonify({"attachments": files}), 200
    except Exception:
        return jsonify({"error": "Failed to list attachments"}), 500


@app.route("/api/svp/plans/<plan_id>/coversheet/attachments", methods=["POST"])
def api_svp_plan_coversheet_attachments_upload(plan_id):
    """Upload a single file to plan's coversheet attachments. Max 25 MB per file, 10 files per plan."""
    try:
        plan = get_svp_plan_by_id(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        if "file" not in request.files:
            return jsonify({"error": "No file in request"}), 400
        file_storage = request.files["file"]
        if not file_storage.filename:
            return jsonify({"error": "No file selected"}), 400
        logger.info("SAVE attachment: plan_id=%s filename=%s", plan_id, file_storage.filename)
        info = save_attachment(plan, file_storage)
        logger.info("SAVE attachment: success plan_id=%s stored_name=%s", plan_id, info.get("stored_name"))
        files = list_attachments(plan)
        return jsonify({"attachments": files, "uploaded": info}), 201
    except ValueError as e:
        msg = str(e)
        logger.warning("SAVE attachment: validation failed plan_id=%s error=%s", plan_id, msg)
        if "25 MB" in msg:
            return jsonify({"error": msg}), 413
        return jsonify({"error": msg}), 400
    except Exception as e:
        logger.exception("SAVE attachment: error plan_id=%s %s", plan_id, e)
        return jsonify({"error": "Failed to upload attachment"}), 500


@app.route("/api/svp/plans/<plan_id>/coversheet/attachments/<path:filename>", methods=["DELETE"])
def api_svp_plan_coversheet_attachments_delete(plan_id, filename):
    """Remove one coversheet attachment by stored filename."""
    try:
        plan = get_svp_plan_by_id(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        logger.info("DELETE attachment: plan_id=%s filename=%s", plan_id, filename)
        deleted = delete_coversheet_attachment(plan, filename)
        if not deleted:
            logger.warning("DELETE attachment: file not found plan_id=%s filename=%s", plan_id, filename)
            return jsonify({"error": "File not found"}), 404
        logger.info("DELETE attachment: success plan_id=%s filename=%s", plan_id, filename)
        return jsonify({"success": True}), 200
    except ValueError as e:
        logger.warning("DELETE attachment: validation failed plan_id=%s error=%s", plan_id, e)
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.exception("DELETE attachment: error plan_id=%s %s", plan_id, e)
        return jsonify({"error": "Failed to delete attachment"}), 500


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


@app.route("/api/svp/plans/<plan_id>/entities", methods=["GET"])
def api_svp_plan_entities(plan_id):
    """Get entities for a plan."""
    try:
        plan = get_svp_plan_by_id(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        entities = get_plan_entities(plan_id)
        return jsonify({"entities": entities}), 200
    except Exception as e:
        logger.exception("api_svp_plan_entities: error %s", e)
        return jsonify({"error": "Failed to load entities"}), 500


@app.route("/api/svp/plans/<plan_id>/entities/available", methods=["GET"])
def api_svp_plan_available_entities(plan_id):
    """Get available entities not yet in plan (for Add Grants modal)."""
    try:
        plan = get_svp_plan_by_id(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        search_params = {}
        entity_number = request.args.get("entity_number", "").strip()
        entity_name = request.args.get("entity_name", "").strip()
        city = request.args.get("city", "").strip()
        state = request.args.get("state", "").strip()
        if entity_number:
            search_params["entity_number"] = entity_number
        if entity_name:
            search_params["entity_name"] = entity_name
        if city:
            search_params["city"] = city
        if state:
            search_params["state"] = state
        entities = get_available_entities(plan_id, search_params if search_params else None)
        return jsonify({"entities": entities}), 200
    except Exception as e:
        logger.exception("api_svp_plan_available_entities: error %s", e)
        return jsonify({"error": "Failed to load available entities"}), 500


@app.route("/api/svp/plans/<plan_id>/entities", methods=["POST"])
def api_svp_plan_add_entity(plan_id):
    """Add an entity to a plan."""
    try:
        plan = get_svp_plan_by_id(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        body = request.get_json(silent=True) or {}
        entity_id = body.get("entityId")
        if not entity_id:
            return jsonify({"error": "entityId is required"}), 400
        entities = add_entity_to_plan(plan_id, entity_id)
        if entities is None:
            return jsonify({"error": "Failed to add entity"}), 500
        return jsonify({"entities": entities}), 200
    except Exception as e:
        logger.exception("api_svp_plan_add_entity: error %s", e)
        return jsonify({"error": "Failed to add entity"}), 500


@app.route("/api/svp/plans/<plan_id>/entities/<entity_id>", methods=["DELETE"])
def api_svp_plan_remove_entity(plan_id, entity_id):
    """Remove an entity from a plan."""
    try:
        plan = get_svp_plan_by_id(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        deleted = remove_entity_from_plan(plan_id, entity_id)
        if not deleted:
            return jsonify({"error": "Entity not found"}), 404
        return jsonify({"success": True}), 200
    except Exception as e:
        logger.exception("api_svp_plan_remove_entity: error %s", e)
        return jsonify({"error": "Failed to remove entity"}), 500


@app.route("/api/svp/plans/<plan_id>/entities/<entity_id>", methods=["PATCH"])
def api_svp_plan_update_entity_status(plan_id, entity_id):
    """Update entity status in a plan."""
    try:
        plan = get_svp_plan_by_id(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        body = request.get_json(silent=True) or {}
        status = body.get("status")
        if not status:
            return jsonify({"error": "status is required"}), 400
        entities = update_entity_status(plan_id, entity_id, status)
        if entities is None:
            return jsonify({"error": "Failed to update entity status"}), 500
        return jsonify({"entities": entities}), 200
    except Exception as e:
        logger.exception("api_svp_plan_update_entity_status: error %s", e)
        return jsonify({"error": "Failed to update entity status"}), 500


@app.route("/api/svp/plans/<plan_id>/sections/<section_id>", methods=["PATCH"])
def api_svp_plan_section(plan_id, section_id):
    """Update a plan section's status (e.g. selected_entities -> Complete)."""
    try:
        plan = get_svp_plan_by_id(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        body = request.get_json(silent=True) or {}
        status = body.get("status")
        if not status:
            return jsonify({"error": "status is required"}), 400
        updated = update_plan_section_status(plan_id, section_id, status)
        if updated is None:
            return jsonify({"error": "Failed to update section status"}), 500
        return jsonify(updated), 200
    except Exception as e:
        logger.exception("api_svp_plan_section: error %s", e)
        return jsonify({"error": "Failed to update section status"}), 500


@app.route('/health', methods=['GET'])
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'python-backend'}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=port, debug=False)
