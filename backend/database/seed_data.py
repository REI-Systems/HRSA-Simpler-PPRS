"""
Seed initial data into the database
"""
import sys
import os
import json

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load .env from backend directory so DATABASE_URL is set when run as script
from dotenv import load_dotenv
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_backend_dir, ".env"))

from config.database import get_db_connection

# Path to static data used for seeding app_config and svp_plans
STATIC_DATA_PATH = os.path.join(_backend_dir, "data", "static_data.json")

DEFAULT_SECTIONS = [
    {"id": "cover_sheet", "name": "Cover Sheet", "status": "Not Started"},
    {"id": "selected_entities", "name": "Selected Entities", "status": "Not Started"},
    {"id": "identified_site_visits", "name": "Identified Site Visits", "status": "Not Started"},
]

def seed_welcome_data():
    """Insert initial welcome message"""
    conn = get_db_connection()
    
    if not conn:
        print("Failed to connect to database")
        return False
    
    try:
        cursor = conn.cursor()
        
        # Check if data already exists
        cursor.execute('SELECT COUNT(*) FROM public.welcome')
        count = cursor.fetchone()['count']
        
        if count > 0:
            print(f"Welcome table already has {count} record(s). Skipping seed.")
            cursor.close()
            conn.close()
            return True
        
        # Insert welcome message
        cursor.execute('''
            INSERT INTO public.welcome (title, message)
            VALUES (%s, %s)
        ''', (
            'Welcome to REI Systems',
            'Community Development!'
        ))
        
        conn.commit()
        print("Welcome data seeded successfully!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        if conn:
            conn.close()
        return False

def seed_users_data():
    """Insert initial test users. Ensures admin exists even if table already has other users."""
    conn = get_db_connection()
    
    if not conn:
        print("Failed to connect to database")
        return False
    
    try:
        cursor = conn.cursor()
        
        # Insert test users; skip only if each user already exists
        users = [
            ('admin', 'admin', 'admin@reisystems.com'),
            ('testuser', 'password', 'test@reisystems.com'),
        ]
        inserted = 0
        for username, password, email in users:
            cursor.execute('SELECT 1 FROM public.users WHERE username = %s', (username,))
            if cursor.fetchone():
                continue
            cursor.execute('''
                INSERT INTO public.users (username, password, email)
                VALUES (%s, %s, %s)
            ''', (username, password, email))
            inserted += 1
            print(f"Inserted user: {username}")
        
        conn.commit()
        # Ensure admin password is 'admin' (in case it was changed or created elsewhere)
        cursor.execute("UPDATE public.users SET password = %s WHERE username = 'admin' AND password != %s", ('admin', 'admin'))
        updated = cursor.rowcount
        conn.commit()
        if updated:
            print("Reset admin password to 'admin'.")

        if inserted > 0:
            print(f"{inserted} test user(s) seeded successfully!")
        elif not updated:
            print("Users table already has admin and testuser. No changes.")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error seeding users: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()


def _load_static_data():
    """Load static_data.json for seeding. Returns empty dict if file missing."""
    try:
        with open(STATIC_DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def seed_app_config_data():
    """Seed app_config with menu, header_nav, svp_config, svp_initiate_options from static_data.json."""
    data = _load_static_data()
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        # Upsert by key so re-running seed doesn't duplicate
        configs = [
            ("menu", data.get("menu", {})),
            ("header_nav", data.get("header_nav", {})),
            ("svp_config", {
                "columns": data.get("svp", {}).get("columns", []),
                "center_align_columns": data.get("svp", {}).get("center_align_columns", []),
                "row_actions": data.get("svp", {}).get("row_actions", []),
                "search_fields": data.get("svp", {}).get("search_fields", []),
                "default_search_values": data.get("svp", {}).get("default_search_values", {}),
            }),
            ("svp_initiate_options", data.get("svp_initiate", {})),
        ]
        for key, value in configs:
            cursor.execute(
                "INSERT INTO public.app_config (key, value) VALUES (%s, %s) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                (key, json.dumps(value))
            )
        conn.commit()
        print("app_config seeded successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error seeding app_config: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return False


def seed_svp_plans_data():
    """Seed svp_plans and svp_plan_sections from static_data.json."""
    data = _load_static_data()
    plans = data.get("svp", {}).get("plans", [])
    if not plans:
        print("No svp plans in static_data.json. Skipping svp_plans seed.")
        return True
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM public.svp_plans")
        if cursor.fetchone()["count"] > 0:
            print("svp_plans already has data. Skipping seed.")
            cursor.close()
            conn.close()
            return True
        for p in plans:
            plan_code = p.get("plan_code") or ("PSV-" + str(p.get("id", "")).zfill(6))
            cursor.execute("""
                INSERT INTO svp_plans (plan_code, plan_for, plan_period, plan_name, plan_description, site_visits, status, team_name, needs_attention)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                plan_code,
                p.get("plan_for") or "",
                p.get("plan_period") or "",
                p.get("plan_name") or "",
                p.get("plan_description") or "",
                p.get("site_visits") or "0",
                p.get("status") or "In Progress",
                p.get("team_name") or "",
                p.get("needs_attention") or "",
            ))
            row = cursor.fetchone()
            plan_id = row["id"]
            for sec in DEFAULT_SECTIONS:
                cursor.execute("""
                    INSERT INTO public.svp_plan_sections (plan_id, section_id, name, status)
                    VALUES (%s, %s, %s, %s)
                """, (plan_id, sec["id"], sec["name"], sec["status"]))
        conn.commit()
        print("svp_plans and svp_plan_sections seeded successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error seeding svp_plans: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return False


def ensure_tables_exist():
    """Exit with a clear message if required tables do not exist. Run init_db.py first."""
    conn = get_db_connection()
    if not conn:
        print("❌ Cannot connect to database. Check DATABASE_URL in .env")
        sys.exit(1)
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'app_config'
        """)
        if not cursor.fetchone():
            print("❌ Table public.app_config does not exist.")
            print("   Create tables first by running:  python database/init_db.py")
            print("   Then run:  python database/seed_data.py")
            cursor.close()
            conn.close()
            sys.exit(1)
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error checking tables: {e}")
        if conn:
            conn.close()
        sys.exit(1)


if __name__ == '__main__':
    print("Seeding database with initial data...")
    ensure_tables_exist()
    seed_welcome_data()
    seed_users_data()
    seed_app_config_data()
    seed_svp_plans_data()
