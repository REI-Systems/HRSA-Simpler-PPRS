"""
Coversheet page service: update coversheet fields (via repository) and attachment file storage.
Merge of coversheet_repository usage and former coversheet_attachment_service logic.
"""
import logging
import os
import re
import uuid

from repositories.svp_plan_repository import get_svp_plan_by_id
from repositories.coversheet_repository import update_svp_plan_coversheet as repo_update_coversheet

logger = logging.getLogger(__name__)

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB
MAX_FILES_PER_PLAN = 10


def _sanitize(s):
    """Replace spaces/slashes and unsafe chars with single underscore."""
    if s is None:
        return ""
    t = str(s).strip()
    t = re.sub(r"[\s/\\]+", "_", t)
    t = re.sub(r"[^\w\-_.]", "", t)
    return t or "unknown"


def get_base_upload_path():
    """Base path for SVP coversheet uploads (temp)."""
    return os.environ.get("SVP_UPLOADS_TEMP") or os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "data",
        "coversheet_uploads",
    )


def get_plan_upload_dir(base_path, plan):
    """Return the absolute directory path for this plan's attachments."""
    plan_for = _sanitize(plan.get("plan_for"))
    plan_period = _sanitize(plan.get("plan_period"))
    site_visits = _sanitize(plan.get("site_visits") or "0")
    plan_id = str(plan.get("id") or "")
    folder_name = f"{plan_for}_{plan_period}_{site_visits}_{plan_id}"
    return os.path.join(base_path, folder_name)


def _list_attachments_in_dir(plan_dir):
    """List files in plan dir; return list of {name, stored_name, size}."""
    if not os.path.isdir(plan_dir):
        return []
    result = []
    for stored_name in os.listdir(plan_dir):
        path = os.path.join(plan_dir, stored_name)
        if os.path.isfile(path):
            try:
                size = os.path.getsize(path)
            except OSError:
                size = 0
            result.append({
                "name": stored_name,
                "stored_name": stored_name,
                "size": size,
            })
    return result


def get_plan(plan_id):
    """Return plan by id (for coversheet page)."""
    return get_svp_plan_by_id(plan_id)


def update_coversheet(plan_id, plan_name=None, plan_description=None, action=None):
    """Update coversheet fields and optional section status. Returns updated plan dict or None."""
    return repo_update_coversheet(plan_id, plan_name=plan_name, plan_description=plan_description, action=action)


def save_attachment(plan, file_storage):
    """
    Save uploaded file to plan's folder. Enforces 25 MB and max 10 files.
    Returns dict with name, size, stored_name (unique). Raises ValueError on validation.
    """
    if not file_storage or not file_storage.filename:
        raise ValueError("No file provided")
    file_storage.seek(0, os.SEEK_END)
    size = file_storage.tell()
    file_storage.seek(0)
    if size > MAX_FILE_SIZE_BYTES:
        raise ValueError("File exceeds 25 MB limit")
    base = get_base_upload_path()
    plan_dir = get_plan_upload_dir(base, plan)
    existing = _list_attachments_in_dir(plan_dir)
    if len(existing) >= MAX_FILES_PER_PLAN:
        raise ValueError("Maximum 10 attachments per plan")
    os.makedirs(plan_dir, exist_ok=True)
    safe_name = file_storage.filename
    if not safe_name or safe_name.strip() == "":
        safe_name = "attachment"
    safe_name = re.sub(r"[^\w\-. ]", "", safe_name)
    if not safe_name:
        safe_name = "attachment"
    base_name, ext = os.path.splitext(safe_name)
    stored_name = f"{base_name}_{uuid.uuid4().hex[:8]}{ext}"
    path = os.path.join(plan_dir, stored_name)
    logger.info("save_attachment: plan_id=%s filename=%r stored_name=%s size=%d", plan.get("id"), file_storage.filename, stored_name, size)
    file_storage.save(path)
    logger.info("save_attachment: success plan_id=%s stored_name=%s", plan.get("id"), stored_name)
    return {"name": file_storage.filename, "stored_name": stored_name, "size": size}


def list_attachments(plan):
    """Return list of {name, stored_name, size} for plan's folder."""
    base = get_base_upload_path()
    plan_dir = get_plan_upload_dir(base, plan)
    return _list_attachments_in_dir(plan_dir)


def delete_attachment(plan, filename):
    """
    Remove one file by stored_name from plan's folder.
    Returns True if removed, False if not found. Raises ValueError if path escape.
    """
    logger.info("delete_attachment: plan_id=%s filename=%s", plan.get("id"), filename)
    base = get_base_upload_path()
    plan_dir = get_plan_upload_dir(base, plan)
    if not os.path.isdir(plan_dir):
        logger.warning("delete_attachment: plan dir not found plan_id=%s", plan.get("id"))
        return False
    safe = os.path.basename(filename)
    if safe != filename or ".." in filename:
        raise ValueError("Invalid filename")
    path = os.path.join(plan_dir, safe)
    if not os.path.isfile(path):
        logger.warning("delete_attachment: file not found plan_id=%s filename=%s", plan.get("id"), filename)
        return False
    os.remove(path)
    logger.info("delete_attachment: success plan_id=%s filename=%s", plan.get("id"), filename)
    return True
