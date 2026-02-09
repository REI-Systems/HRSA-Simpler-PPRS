"""Layout repository: menu and header nav from database."""
import json
from config.database import get_db_connection


def _get_menu_from_app_config(cursor):
    """Fallback: return menu items from app_config key 'menu' (value.items). Used when menu_item tables are missing or empty."""
    try:
        cursor.execute("SELECT value FROM public.app_config WHERE key = %s LIMIT 1", ("menu",))
        row = cursor.fetchone()
        if not row or not row.get("value"):
            return []
        val = row["value"]
        if isinstance(val, dict):
            items = val.get("items", [])
        elif isinstance(val, str):
            data = json.loads(val)
            items = data.get("items", []) if isinstance(data, dict) else []
        else:
            return []
        return list(items) if items else []
    except Exception:
        return []


def get_menu():
    """Return sidebar menu (items with children) from menu_item and menu_item_child. Falls back to app_config.menu if tables missing or empty."""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return []
        cursor = conn.cursor()
        try:
            cursor.execute(
                "SELECT id, label, expanded, sort_order FROM public.menu_item ORDER BY sort_order"
            )
            parents = cursor.fetchall()
            items = []
            for p in parents:
                cursor.execute(
                    """SELECT child_id, label, href, is_header, sort_order
                       FROM public.menu_item_child WHERE menu_item_id = %s ORDER BY sort_order""",
                    (p["id"],)
                )
                children_rows = cursor.fetchall()
                children = []
                for c in children_rows:
                    child = {
                        "id": c["child_id"],
                        "label": c["label"],
                    }
                    if c.get("href") is not None:
                        child["href"] = c["href"]
                    if c.get("is_header"):
                        child["header"] = True
                    children.append(child)
                items.append({
                    "id": p["id"],
                    "label": p["label"],
                    "expanded": bool(p.get("expanded", False)),
                    "children": children,
                })
            if items:
                return items
        except Exception:
            pass
        finally:
            cursor.close()
        # Fallback: app_config.menu (when menu_item tables missing or empty)
        cursor = conn.cursor()
        try:
            return _get_menu_from_app_config(cursor)
        finally:
            cursor.close()
    except Exception:
        try:
            conn = get_db_connection()
            if conn:
                cursor = conn.cursor()
                try:
                    return _get_menu_from_app_config(cursor)
                finally:
                    cursor.close()
                    conn.close()
        except Exception:
            pass
        return []
    finally:
        if conn:
            conn.close()


def get_header_nav():
    """Return header navigation items from header_nav_item."""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return []
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, label, href FROM public.header_nav_item ORDER BY sort_order"
        )
        rows = cursor.fetchall()
        cursor.close()
        return [{"id": r["id"], "label": r["label"], "href": r["href"]} for r in rows]
    except Exception:
        return []
    finally:
        if conn:
            conn.close()
