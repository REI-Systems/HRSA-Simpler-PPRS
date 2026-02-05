"""
Database initialization script
Creates the welcome table
"""
import sys
import os

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load .env from backend directory so DATABASE_URL is set when run as script
from dotenv import load_dotenv
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_backend_dir, ".env"))

from config.database import get_db_connection

def create_welcome_table():
    """Create the welcome table if it doesn't exist"""
    conn = get_db_connection()
    
    if not conn:
        print("❌ Failed to connect to database")
        return False
    
    try:
        cursor = conn.cursor()
        
        # Create welcome table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS public.welcome (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        ''')
        
        conn.commit()
        print("✅ Welcome table created successfully!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating welcome table: {e}")
        if conn:
            conn.close()
        return False

def create_users_table():
    """Create the users table if it doesn't exist"""
    conn = get_db_connection()
    
    if not conn:
        print("❌ Failed to connect to database")
        return False
    
    try:
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS public.users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email VARCHAR(100),
                created_at TIMESTAMP DEFAULT NOW()
            )
        ''')
        
        conn.commit()
        print("✅ Users table created successfully!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating users table: {e}")
        if conn:
            conn.close()
        return False


def create_app_config_table():
    """Create the app_config table for menu, header_nav, svp_config, svp_initiate_options (JSONB)."""
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS public.app_config (
                key VARCHAR(100) PRIMARY KEY,
                value JSONB NOT NULL
            )
        ''')
        conn.commit()
        print("✅ app_config table created successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error creating app_config table: {e}")
        if conn:
            conn.close()
        return False


def create_svp_plans_table():
    """Create the svp_plans table for site visit plans."""
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS svp_plans (
                id SERIAL PRIMARY KEY,
                plan_code VARCHAR(50) NOT NULL,
                plan_for TEXT,
                plan_period TEXT,
                plan_name TEXT,
                plan_description TEXT DEFAULT NULL,
                site_visits VARCHAR(20) DEFAULT '0',
                status VARCHAR(50) DEFAULT 'In Progress',
                team_name TEXT,
                needs_attention TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        ''')
        cursor.execute('ALTER TABLE public.svp_plans ADD COLUMN IF NOT EXISTS plan_description TEXT DEFAULT NULL')
        conn.commit()
        print("✅ svp_plans table created successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error creating svp_plans table: {e}")
        if conn:
            conn.close()
        return False


def create_svp_plan_access_table():
    """Create the svp_plan_access table for per-user last-accessed plan tracking."""
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS public.svp_plan_access (
                username VARCHAR(100) NOT NULL,
                plan_id INTEGER NOT NULL REFERENCES public.svp_plans(id) ON DELETE CASCADE,
                last_accessed_at TIMESTAMP DEFAULT NOW() NOT NULL,
                PRIMARY KEY (username, plan_id)
            )
        ''')
        conn.commit()
        print("✅ svp_plan_access table created successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error creating svp_plan_access table: {e}")
        if conn:
            conn.close()
        return False


def create_svp_plan_sections_table():
    """Create the svp_plan_sections table for plan section status."""
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS public.svp_plan_sections (
                id SERIAL PRIMARY KEY,
                plan_id INTEGER NOT NULL REFERENCES public.svp_plans(id) ON DELETE CASCADE,
                section_id VARCHAR(50) NOT NULL,
                name TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'Not Started'
            )
        ''')
        conn.commit()
        print("✅ svp_plan_sections table created successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error creating svp_plan_sections table: {e}")
        if conn:
            conn.close()
        return False


def create_entities_table():
    """Create the entities table for available entities pool."""
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS public.entities (
                id SERIAL PRIMARY KEY,
                entity_number VARCHAR(50) UNIQUE NOT NULL,
                entity_name TEXT NOT NULL,
                city VARCHAR(100),
                state VARCHAR(2),
                midpoint_current_pp DATE,
                active_grant_no_site_visit BOOLEAN DEFAULT FALSE,
                active_grant_1_year_pp BOOLEAN DEFAULT FALSE,
                active_new_grant BOOLEAN DEFAULT FALSE,
                recent_site_visit_dates TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        ''')
        conn.commit()
        print("✅ entities table created successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error creating entities table: {e}")
        if conn:
            conn.close()
        return False


def create_svp_plan_entities_table():
    """Create the svp_plan_entities table for entities associated with plans."""
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS public.svp_plan_entities (
                id SERIAL PRIMARY KEY,
                plan_id INTEGER NOT NULL REFERENCES public.svp_plans(id) ON DELETE CASCADE,
                entity_number VARCHAR(50) NOT NULL,
                entity_name TEXT NOT NULL,
                city VARCHAR(100),
                state VARCHAR(2),
                midpoint_current_pp DATE,
                active_grant_no_site_visit BOOLEAN DEFAULT FALSE,
                active_grant_1_year_pp BOOLEAN DEFAULT FALSE,
                active_new_grant BOOLEAN DEFAULT FALSE,
                status VARCHAR(50) DEFAULT 'Not in Plan',
                recent_site_visit_dates TEXT,
                visit_started BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(plan_id, entity_number)
            )
        ''')
        conn.commit()
        print("✅ svp_plan_entities table created successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error creating svp_plan_entities table: {e}")
        if conn:
            conn.close()
        return False


def add_visit_started_to_svp_plan_entities():
    """Safe migration: add visit_started column to svp_plan_entities if missing (e.g. existing DBs)."""
    conn = get_db_connection()
    if not conn:
        return False
    try:
        cursor = conn.cursor()
        cursor.execute(
            "ALTER TABLE public.svp_plan_entities ADD COLUMN IF NOT EXISTS visit_started BOOLEAN DEFAULT FALSE"
        )
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Warning: add_visit_started migration: {e}")
        if conn:
            conn.close()
        return False


if __name__ == '__main__':
    print("Creating database tables...")
    create_welcome_table()
    create_users_table()
    create_app_config_table()
    create_svp_plans_table()
    create_svp_plan_access_table()
    create_svp_plan_sections_table()
    create_entities_table()
    create_svp_plan_entities_table()
    add_visit_started_to_svp_plan_entities()
