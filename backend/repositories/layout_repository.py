"""Layout repository: menu and header nav from database."""
from config.database import get_db_connection


def get_menu():
    """Return sidebar menu (items with children) from menu_item and menu_item_child."""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return []
        cursor = conn.cursor()
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
        cursor.close()
        return items
    except Exception:
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
