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


def create_svp_entity_basic_info_table():
    """Create the svp_entity_basic_info table: one row per plan entity for Basic Information form data."""
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS public.svp_entity_basic_info (
                id SERIAL PRIMARY KEY,
                plan_entity_id INTEGER NOT NULL REFERENCES public.svp_plan_entities(id) ON DELETE CASCADE,
                start_date DATE,
                end_date DATE,
                conducted_by JSONB DEFAULT '[]',
                location VARCHAR(100),
                location_other TEXT,
                reason_types JSONB DEFAULT '[]',
                reason_other TEXT,
                justification TEXT,
                site_visit_type_primary VARCHAR(100),
                site_visit_type_primary_other TEXT,
                site_visit_type_secondary VARCHAR(100),
                site_visit_type_secondary_other TEXT,
                areas_of_review JSONB DEFAULT '[]',
                areas_of_review_other TEXT,
                default_assignee VARCHAR(200),
                optional_assignee_role VARCHAR(100),
                optional_assignee_team VARCHAR(100),
                optional_assignee_assignee VARCHAR(200),
                participants JSONB DEFAULT '[]',
                prioritization VARCHAR(50),
                additional_programs JSONB DEFAULT '[]',
                tracking_number VARCHAR(50),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(plan_entity_id)
            )
        ''')
        conn.commit()
        print("✅ svp_entity_basic_info table created successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error creating svp_entity_basic_info table: {e}")
        if conn:
            conn.close()
        return False


def create_basic_info_assignee_table():
    """Create the basic_info_assignee table for optional assignee dropdown (names fetched from DB)."""
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS public.basic_info_assignee (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0
            )
        ''')
        conn.commit()
        print("✅ basic_info_assignee table created successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error creating basic_info_assignee table: {e}")
        if conn:
            conn.close()
        return False


def create_svp_entity_travel_plans_table():
    """Create the svp_entity_travel_plans table: travel plan rows per plan entity."""
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS public.svp_entity_travel_plans (
                id SERIAL PRIMARY KEY,
                plan_entity_id INTEGER NOT NULL REFERENCES public.svp_plan_entities(id) ON DELETE CASCADE,
                number_of_travelers VARCHAR(20),
                travel_locations TEXT,
                travel_dates TEXT,
                travelers TEXT,
                travel_cost VARCHAR(50),
                status VARCHAR(50),
                created_at TIMESTAMP DEFAULT NOW()
            )
        ''')
        conn.commit()
        print("✅ svp_entity_travel_plans table created successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error creating svp_entity_travel_plans table: {e}")
        if conn:
            conn.close()
        return False


def create_menu_tables():
    """Create menu_item and menu_item_child tables for left sidebar menu."""
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS public.menu_item (
                id TEXT PRIMARY KEY,
                label TEXT NOT NULL,
                expanded BOOLEAN DEFAULT FALSE,
                sort_order INTEGER NOT NULL DEFAULT 0
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS public.menu_item_child (
                id SERIAL PRIMARY KEY,
                menu_item_id TEXT NOT NULL REFERENCES public.menu_item(id) ON DELETE CASCADE,
                child_id TEXT NOT NULL,
                label TEXT NOT NULL,
                href TEXT,
                is_header BOOLEAN DEFAULT FALSE,
                sort_order INTEGER NOT NULL DEFAULT 0,
                UNIQUE (menu_item_id, child_id)
            )
        ''')
        conn.commit()
        print("✅ Menu tables created successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error creating menu tables: {e}")
        if conn:
            conn.close()
        return False


def create_header_nav_table():
    """Create header_nav_item table for top navigation."""
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS public.header_nav_item (
                id TEXT PRIMARY KEY,
                label TEXT NOT NULL,
                href TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0
            )
        ''')
        conn.commit()
        print("✅ header_nav_item table created successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error creating header_nav_item table: {e}")
        if conn:
            conn.close()
        return False


def create_svp_config_tables():
    """Create SVP configuration tables: svp_column, svp_center_align_column, svp_row_action, svp_search_field, svp_default_search_values."""
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS public.svp_column (
                id SERIAL PRIMARY KEY,
                key TEXT NOT NULL UNIQUE,
                label TEXT NOT NULL,
                filterable BOOLEAN DEFAULT FALSE,
                filter_type TEXT,
                filter_options JSONB,
                sort_order INTEGER NOT NULL DEFAULT 0
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS public.svp_center_align_column (
                column_index INTEGER PRIMARY KEY
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS public.svp_row_action (
                id TEXT PRIMARY KEY,
                label TEXT NOT NULL,
                icon_left TEXT,
                icon_right TEXT,
                category TEXT NOT NULL,
                separator BOOLEAN DEFAULT FALSE,
                sort_order INTEGER NOT NULL DEFAULT 0
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS public.svp_search_field (
                id SERIAL PRIMARY KEY,
                key TEXT NOT NULL UNIQUE,
                label TEXT NOT NULL,
                type TEXT NOT NULL,
                options JSONB,
                filterable BOOLEAN DEFAULT FALSE,
                sort_order INTEGER NOT NULL DEFAULT 0
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS public.svp_default_search_values (
                id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
                bureau_name TEXT,
                plan_name_like TEXT,
                plan_period TEXT,
                programs JSONB,
                statuses JSONB,
                divisions JSONB,
                sort_method TEXT,
                search_name TEXT
            )
        ''')
        conn.commit()
        print("✅ SVP config tables created successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error creating SVP config tables: {e}")
        if conn:
            conn.close()
        return False


def create_svp_initiate_option_table():
    """Create svp_initiate_option table for dropdown/lookup options."""
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS public.svp_initiate_option (
                id SERIAL PRIMARY KEY,
                option_type TEXT NOT NULL CHECK (option_type IN ('bureau', 'division', 'program', 'team')),
                value TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                UNIQUE (option_type, value)
            )
        ''')
        conn.commit()
        print("✅ svp_initiate_option table created successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error creating svp_initiate_option table: {e}")
        if conn:
            conn.close()
        return False


def seed_menu_data():
    """Seed menu_item and menu_item_child tables with initial data."""
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        # Insert menu items
        menu_items = [
            ('general', 'General', False, 1),
            ('pao', 'PAO', False, 2),
            ('pga', 'PGA', False, 3),
            ('po', 'PO', False, 4),
            ('pqc', 'PQC', False, 5),
            ('ps', 'PS', False, 6),
            ('psvr', 'PSVR', False, 7),
            ('site-visit-staff', 'Site Visit Staff', False, 8),
            ('svp', 'SVP', False, 9),
        ]
        for item_id, label, expanded, sort_order in menu_items:
            cursor.execute('''
                INSERT INTO public.menu_item (id, label, expanded, sort_order)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            ''', (item_id, label, expanded, sort_order))
        
        # Insert menu item children
        menu_children = [
            ('general', 'general-review', 'Review', '#general-review', False, 1),
            ('pao', 'pao-review', 'Review', '#pao-review', False, 1),
            ('pga', 'pga-review', 'Review', '#pga-review', False, 1),
            ('po', 'po-review', 'Review', '#po-review', False, 1),
            ('pqc', 'pqc-review', 'Review', '#pqc-review', False, 1),
            ('ps', 'ps-review', 'Review', '#ps-review', False, 1),
            ('psvr', 'psvr-review', 'Review', '#psvr-review', False, 1),
            ('site-visit-staff', 'site-visit-staff-contribute', 'Contribute', '#site-visit-staff-contribute', False, 1),
            ('svp', 'svp-site-visit-plan', 'Site Visit Plan', None, True, 1),
            ('svp', 'svp-prepare', 'Prepare', '/svp/status', False, 2),
            ('svp', 'svp-initiate', 'Initiate', '/svp/initiate', False, 3),
            ('svp', 'svp-list', 'List', '/svp', False, 4),
            ('svp', 'svp-review', 'Review', '#svp-review', False, 5),
        ]
        for menu_item_id, child_id, label, href, is_header, sort_order in menu_children:
            cursor.execute('''
                INSERT INTO public.menu_item_child (menu_item_id, child_id, label, href, is_header, sort_order)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (menu_item_id, child_id) DO NOTHING
            ''', (menu_item_id, child_id, label, href, is_header, sort_order))
        
        conn.commit()
        print("✅ Menu data seeded successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error seeding menu data: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return False


def seed_header_nav_data():
    """Seed header_nav_item table with initial data."""
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        nav_items = [
            ('home', 'Home', '#home', 1),
            ('tasks', 'Tasks', '#tasks', 2),
            ('activities', 'Activities', '#activities', 3),
            ('program-oversight', 'Program Oversight', '#program-oversight', 4),
            ('dashboards', 'Dashboards', '#dashboards', 5),
            ('folders', 'Folders', '#folders', 6),
            ('reports', 'Reports', '#reports', 7),
            ('training', 'Training', '#training', 8),
        ]
        for item_id, label, href, sort_order in nav_items:
            cursor.execute('''
                INSERT INTO public.header_nav_item (id, label, href, sort_order)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            ''', (item_id, label, href, sort_order))
        
        conn.commit()
        print("✅ Header nav data seeded successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error seeding header nav data: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return False


def seed_svp_config_data():
    """Seed SVP configuration tables with initial data."""
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        import json
        
        # Seed svp_column
        columns = [
            ('plan_for', 'Plan For', True, None, None, 1),
            ('plan_period', 'Plan Period', True, None, None, 2),
            ('plan_name', 'Plan Name', True, None, None, 3),
            ('site_visits', 'Number of Site Visits', True, None, None, 4),
            ('status', 'Status', True, 'select', json.dumps(['All', 'Not Started', 'In Progress', 'Complete', 'Not Complete', 'Canceled']), 5),
            ('team_name', 'Team Name', True, None, None, 6),
            ('needs_attention', 'Needs Attention', True, None, None, 7),
        ]
        for key, label, filterable, filter_type, filter_options, sort_order in columns:
            cursor.execute('''
                INSERT INTO public.svp_column (key, label, filterable, filter_type, filter_options, sort_order)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (key) DO NOTHING
            ''', (key, label, filterable, filter_type, filter_options, sort_order))
        
        # Seed svp_center_align_column
        center_align_indices = [3, 5, 6]
        for col_index in center_align_indices:
            cursor.execute('''
                INSERT INTO public.svp_center_align_column (column_index)
                VALUES (%s)
                ON CONFLICT (column_index) DO NOTHING
            ''', (col_index,))
        
        # Seed svp_row_action
        row_actions = [
            ('edit', 'Edit Plan', 'bi-pencil-square', None, 'Action', False, 1),
            ('cancel', 'Cancel Plan', 'bi-x-lg', None, 'Action', True, 2),
            ('view', 'View Plan', None, 'bi-box-arrow-up-right', 'View', False, 3),
            ('bureau', 'Bureau Plan', None, 'bi-box-arrow-up-right', 'View', False, 4),
        ]
        for action_id, label, icon_left, icon_right, category, separator, sort_order in row_actions:
            cursor.execute('''
                INSERT INTO public.svp_row_action (id, label, icon_left, icon_right, category, separator, sort_order)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            ''', (action_id, label, icon_left, icon_right, category, separator, sort_order))
        
        # Seed svp_search_field
        search_fields = [
            ('bureauName', 'Bureau Name:', 'static', None, False, 1),
            ('planNameLike', 'Plan Name Like:', 'text', None, False, 2),
            ('planPeriod', 'Plan Period:', 'select', json.dumps(['All', 'CY-2026', 'CY-2025', 'CY-2024']), False, 3),
            ('programs', 'Plan For: Program', 'checkbox-group', json.dumps(['All', 'G24', 'H08', 'H12', 'H26', 'H5N', 'H89', 'HPC']), True, 4),
            ('statuses', 'Status:', 'checkbox-group', json.dumps(['All', 'Not Started', 'In Progress', 'Complete']), True, 5),
            ('divisions', 'Plan For: Division', 'checkbox-group', json.dumps(['All', 'DCHAP', 'DMHAP', 'DPD', 'DPSHB', 'DRHE']), True, 6),
        ]
        for key, label, field_type, options, filterable, sort_order in search_fields:
            cursor.execute('''
                INSERT INTO public.svp_search_field (key, label, type, options, filterable, sort_order)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (key) DO NOTHING
            ''', (key, label, field_type, options, filterable, sort_order))
        
        # Seed svp_default_search_values
        cursor.execute('''
            INSERT INTO public.svp_default_search_values (
                bureau_name, plan_name_like, plan_period, programs, statuses, divisions, sort_method, search_name
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s
            )
            ON CONFLICT (id) DO UPDATE SET
                bureau_name = EXCLUDED.bureau_name,
                plan_name_like = EXCLUDED.plan_name_like,
                plan_period = EXCLUDED.plan_period,
                programs = EXCLUDED.programs,
                statuses = EXCLUDED.statuses,
                divisions = EXCLUDED.divisions,
                sort_method = EXCLUDED.sort_method,
                search_name = EXCLUDED.search_name
        ''', ('HAB', '', 'All', json.dumps(['All']), json.dumps(['All']), json.dumps(['All']), 'Grid', ''))
        
        conn.commit()
        print("✅ SVP config data seeded successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error seeding SVP config data: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return False


def seed_svp_initiate_options():
    """Seed svp_initiate_option table with bureaus, divisions, programs, and teams."""
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        options = [
            # Bureaus
            ('bureau', 'HAB', 1), ('bureau', 'OGH', 2), ('bureau', 'BPHC', 3),
            ('bureau', 'CAT', 4), ('bureau', 'EHB', 5), ('bureau', 'BHW', 6),
            # Divisions
            ('division', 'DCHAP', 1), ('division', 'DMHAP', 2), ('division', 'DPD', 3),
            ('division', 'DSHAP', 4), ('division', 'GAP', 5), ('division', 'OPS', 6),
            # Programs
            ('program', 'G24', 1), ('program', 'H08', 2), ('program', 'H12', 3),
            ('program', 'H1J', 4), ('program', 'H1L', 5), ('program', 'H1X', 6),
            ('program', 'H3M', 7), ('program', 'H4A', 8), ('program', 'H52', 9),
            ('program', 'H65', 10), ('program', 'H6A', 11), ('program', 'H76', 12),
            ('program', 'H77', 13), ('program', 'H7C', 14),
        ]
        for option_type, value, sort_order in options:
            cursor.execute('''
                INSERT INTO public.svp_initiate_option (option_type, value, sort_order)
                VALUES (%s, %s, %s)
                ON CONFLICT (option_type, value) DO NOTHING
            ''', (option_type, value, sort_order))
        
        conn.commit()
        print("✅ SVP initiate options seeded successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error seeding SVP initiate options: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return False


def seed_basic_info_assignees():
    """Seed basic_info_assignee table with default assignee names."""
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        # Check if data already exists
        cursor.execute('SELECT COUNT(*) FROM public.basic_info_assignee')
        count = cursor.fetchone()['count']
        if count > 0:
            print("✅ basic_info_assignee already has data. Skipping seed.")
            cursor.close()
            conn.close()
            return True
        
        assignees = [
            ('Keo, Cybele', 1), ('Smith, Jane', 2), ('Johnson, Robert', 3),
            ('Williams, Maria', 4), ('Brown, David', 5), ('Davis, Sarah', 6),
            ('Miller, James', 7), ('Wilson, Emily', 8), ('Taylor, Michael', 9),
            ('Anderson, Lisa', 10), ('Thomas, Christopher', 11), ('Jackson, Amanda', 12),
            ('White, Daniel', 13), ('Harris, Jennifer', 14), ('Martin, Matthew', 15),
        ]
        for name, sort_order in assignees:
            cursor.execute('''
                INSERT INTO public.basic_info_assignee (name, sort_order)
                VALUES (%s, %s)
            ''', (name, sort_order))
        
        conn.commit()
        print("✅ basic_info_assignee seeded successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error seeding basic_info_assignee: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return False


def seed_entities_data():
    """Seed entities table with sample entity data."""
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    try:
        cursor = conn.cursor()
        entities = [
            ('H76HA54736', 'CENTRAL TEXAS COMMUNITY HEALTH CENTERS', 'Austin', 'TX', '2026-07-02', True, False, True, None),
            ('H76HA54737', 'COOK COUNTY HEALTH BUREAU', 'Chicago', 'IL', '2026-07-02', True, False, True, None),
            ('H76HA54738', 'WEST ALABAMA AIDS OUTREACH INC', 'TUSCALOOSA', 'AL', '2026-07-02', True, False, True, None),
            ('H76HA54745', 'INTERMOUNTAIN HEALTH CARE, INC.', 'Salt Lake City', 'UT', '2026-09-30', True, False, True, None),
            ('H76HA54760', 'CARE 4 U MANAGEMENT, INC', 'Miami', 'FL', '2026-10-30', False, False, True, '02/10/2026 - 02/12/2026 (Program Requirement Verification/Diagnostic)'),
            ('H76HA54761', 'QUALITY HOME CARE SERVICES', 'Charlotte', 'NC', '2026-10-30', False, False, True, None),
            ('H76HA55214', 'POSITIVE IMPACT HEALTH CENTERS INC', 'Atlanta', 'GA', '2027-01-15', False, False, True, '02/24/2026 - 02/26/2026 (Program Requirement Verification/Diagnostic)'),
            ('H76HA55315', 'MAINE GENERAL MEDICAL CENTER', 'Augusta', 'ME', '2026-06-16', True, False, True, None),
        ]
        for entity_number, entity_name, city, state, midpoint_current_pp, active_grant_no_site_visit, active_grant_1_year_pp, active_new_grant, recent_site_visit_dates in entities:
            cursor.execute('''
                INSERT INTO public.entities (
                    entity_number, entity_name, city, state, midpoint_current_pp,
                    active_grant_no_site_visit, active_grant_1_year_pp, active_new_grant, recent_site_visit_dates
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (entity_number) DO NOTHING
            ''', (entity_number, entity_name, city, state, midpoint_current_pp,
                  active_grant_no_site_visit, active_grant_1_year_pp, active_new_grant, recent_site_visit_dates))
        
        conn.commit()
        print("✅ Entities data seeded successfully!")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error seeding entities data: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return False


if __name__ == '__main__':
    print("Creating database tables...")
    # Core tables
    create_welcome_table()
    create_users_table()
    create_app_config_table()
    
    # SVP core tables
    create_svp_plans_table()
    create_svp_plan_access_table()
    create_svp_plan_sections_table()
    create_entities_table()
    create_svp_plan_entities_table()
    add_visit_started_to_svp_plan_entities()
    create_svp_entity_basic_info_table()
    create_basic_info_assignee_table()
    create_svp_entity_travel_plans_table()
    
    # Menu and navigation tables
    create_menu_tables()
    create_header_nav_table()
    
    # SVP configuration tables
    create_svp_config_tables()
    create_svp_initiate_option_table()
    
    print("\nSeeding initial data...")
    # Seed menu and navigation
    seed_menu_data()
    seed_header_nav_data()
    
    # Seed SVP configuration
    seed_svp_config_data()
    seed_svp_initiate_options()
    
    # Seed assignees and entities
    seed_basic_info_assignees()
    seed_entities_data()
    
    print("\n✅ Database initialization complete!")
