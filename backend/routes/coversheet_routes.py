"""Coversheet page API routes."""
import logging
from flask import Blueprint, jsonify, request

from services.coversheet_service import (
    get_plan,
    update_coversheet,
    list_attachments,
    save_attachment,
    delete_attachment,
)

logger = logging.getLogger(__name__)

coversheet_bp = Blueprint("coversheet", __name__, url_prefix="/api/svp")


@coversheet_bp.route("/plans/<plan_id>/coversheet", methods=["PATCH"])
def api_svp_plan_coversheet(plan_id):
    """Update coversheet fields (plan name, plan description) and optional action: save | save_and_continue | mark_complete."""
    try:
        plan = get_plan(plan_id)
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
        updated = update_coversheet(
            plan_id,
            plan_name=plan_name,
            plan_description=plan_description,
            action=action,
        )
        if updated is None:
            logger.error("UPDATE coversheet: failed plan_id=%s", plan_id)
            return jsonify({"error": "Failed to update coversheet"}), 500
        logger.info("UPDATE coversheet: success plan_id=%s", plan_id)
        updated["plan_name"] = plan_name
        updated["plan_description"] = plan_description
        if action == "save_and_continue":
            return jsonify({"plan": updated, "nextUrl": f"/svp/status/{plan_id}"}), 200
        return jsonify(updated), 200
    except Exception as e:
        logger.exception("UPDATE coversheet: error %s", e)
        return jsonify({"error": "Failed to update coversheet"}), 500


@coversheet_bp.route("/plans/<plan_id>/coversheet/attachments", methods=["GET"])
def api_svp_plan_coversheet_attachments_list(plan_id):
    """List coversheet attachments for a plan."""
    try:
        plan = get_plan(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        files = list_attachments(plan)
        return jsonify({"attachments": files}), 200
    except Exception:
        return jsonify({"error": "Failed to list attachments"}), 500


@coversheet_bp.route("/plans/<plan_id>/coversheet/attachments", methods=["POST"])
def api_svp_plan_coversheet_attachments_upload(plan_id):
    """Upload a single file to plan's coversheet attachments. Max 25 MB per file, 10 files per plan."""
    try:
        plan = get_plan(plan_id)
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


@coversheet_bp.route("/plans/<plan_id>/coversheet/attachments/<path:filename>", methods=["DELETE"])
def api_svp_plan_coversheet_attachments_delete(plan_id, filename):
    """Remove one coversheet attachment by stored filename."""
    try:
        plan = get_plan(plan_id)
        if plan is None:
            return jsonify({"error": "Plan not found"}), 404
        logger.info("DELETE attachment: plan_id=%s filename=%s", plan_id, filename)
        deleted = delete_attachment(plan, filename)
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
