-- PostgreSQL script: menu, header nav, SVP config, SVP plans, SVP initiate options (schema: public)
-- Run with: psql -U <user> -d <database> -f init_static_data.sql
-- Or: psql $DATABASE_URL -f init_static_data.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- Menu (left sidebar menu items and children)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_item (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    expanded BOOLEAN DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.menu_item_child (
    id SERIAL PRIMARY KEY,
    menu_item_id TEXT NOT NULL REFERENCES public.menu_item(id) ON DELETE CASCADE,
    child_id TEXT NOT NULL,
    label TEXT NOT NULL,
    href TEXT,
    is_header BOOLEAN DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE (menu_item_id, child_id)
);

-- ---------------------------------------------------------------------------
-- Header navigation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.header_nav_item (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    href TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- SVP (Site Visit Plan) configuration and data
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.svp_column (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    filterable BOOLEAN DEFAULT FALSE,
    filter_type TEXT,
    filter_options JSONB,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.svp_center_align_column (
    column_index INTEGER PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS public.svp_row_action (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    icon_left TEXT,
    icon_right TEXT,
    category TEXT NOT NULL,
    separator BOOLEAN DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.svp_search_field (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    type TEXT NOT NULL,
    options JSONB,
    filterable BOOLEAN DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0
);

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
);

CREATE TABLE IF NOT EXISTS public.svp_plan (
    id TEXT PRIMARY KEY,
    plan_for TEXT NOT NULL,
    plan_period TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    site_visits TEXT,
    status TEXT NOT NULL,
    team_name TEXT,
    needs_attention TEXT
);

-- ---------------------------------------------------------------------------
-- SVP Initiate (dropdown/lookup options)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.svp_initiate_option (
    id SERIAL PRIMARY KEY,
    option_type TEXT NOT NULL CHECK (option_type IN ('bureau', 'division', 'program', 'team')),
    value TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE (option_type, value)
);

-- ---------------------------------------------------------------------------
-- INSERT: menu_item
-- ---------------------------------------------------------------------------
INSERT INTO public.menu_item (id, label, expanded, sort_order) VALUES
    ('general', 'General', FALSE, 1),
    ('pao', 'PAO', FALSE, 2),
    ('pga', 'PGA', FALSE, 3),
    ('po', 'PO', FALSE, 4),
    ('pqc', 'PQC', FALSE, 5),
    ('ps', 'PS', FALSE, 6),
    ('psvr', 'PSVR', FALSE, 7),
    ('site-visit-staff', 'Site Visit Staff', FALSE, 8),
    ('svp', 'SVP', FALSE, 9)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- INSERT: menu_item_child
-- ---------------------------------------------------------------------------
INSERT INTO public.menu_item_child (menu_item_id, child_id, label, href, is_header, sort_order) VALUES
    ('general', 'general-review', 'Review', '#general-review', FALSE, 1),
    ('pao', 'pao-review', 'Review', '#pao-review', FALSE, 1),
    ('pga', 'pga-review', 'Review', '#pga-review', FALSE, 1),
    ('po', 'po-review', 'Review', '#po-review', FALSE, 1),
    ('pqc', 'pqc-review', 'Review', '#pqc-review', FALSE, 1),
    ('ps', 'ps-review', 'Review', '#ps-review', FALSE, 1),
    ('psvr', 'psvr-review', 'Review', '#psvr-review', FALSE, 1),
    ('site-visit-staff', 'site-visit-staff-contribute', 'Contribute', '#site-visit-staff-contribute', FALSE, 1),
    ('svp', 'svp-site-visit-plan', 'Site Visit Plan', NULL, TRUE, 1),
    ('svp', 'svp-prepare', 'Prepare', '/svp/status', FALSE, 2),
    ('svp', 'svp-initiate', 'Initiate', '/svp/initiate', FALSE, 3),
    ('svp', 'svp-list', 'List', '/svp', FALSE, 4),
    ('svp', 'svp-review', 'Review', '#svp-review', FALSE, 5)
ON CONFLICT (menu_item_id, child_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- INSERT: header_nav_item
-- ---------------------------------------------------------------------------
INSERT INTO public.header_nav_item (id, label, href, sort_order) VALUES
    ('home', 'Home', '#home', 1),
    ('tasks', 'Tasks', '#tasks', 2),
    ('activities', 'Activities', '#activities', 3),
    ('program-oversight', 'Program Oversight', '#program-oversight', 4),
    ('dashboards', 'Dashboards', '#dashboards', 5),
    ('folders', 'Folders', '#folders', 6),
    ('reports', 'Reports', '#reports', 7),
    ('training', 'Training', '#training', 8)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- INSERT: svp_column
-- ---------------------------------------------------------------------------
INSERT INTO public.svp_column (key, label, filterable, filter_type, filter_options, sort_order) VALUES
    ('plan_for', 'Plan For', TRUE, NULL, NULL, 1),
    ('plan_period', 'Plan Period', TRUE, NULL, NULL, 2),
    ('plan_name', 'Plan Name', TRUE, NULL, NULL, 3),
    ('site_visits', 'Number of Site Visits', TRUE, NULL, NULL, 4),
    ('status', 'Status', TRUE, 'select', '["All", "Not Started", "In Progress", "Complete", "Not Complete", "Canceled"]'::jsonb, 5),
    ('team_name', 'Team Name', TRUE, NULL, NULL, 6),
    ('needs_attention', 'Needs Attention', TRUE, NULL, NULL, 7)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- INSERT: svp_center_align_column
-- ---------------------------------------------------------------------------
INSERT INTO public.svp_center_align_column (column_index) VALUES (3), (5), (6)
ON CONFLICT (column_index) DO NOTHING;

-- ---------------------------------------------------------------------------
-- INSERT: svp_row_action
-- ---------------------------------------------------------------------------
INSERT INTO public.svp_row_action (id, label, icon_left, icon_right, category, separator, sort_order) VALUES
    ('edit', 'Edit Plan', 'bi-pencil-square', NULL, 'Action', FALSE, 1),
    ('cancel', 'Cancel Plan', 'bi-x-lg', NULL, 'Action', TRUE, 2),
    ('view', 'View Plan', NULL, 'bi-box-arrow-up-right', 'View', FALSE, 3),
    ('bureau', 'Bureau Plan', NULL, 'bi-box-arrow-up-right', 'View', FALSE, 4)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- INSERT: svp_search_field
-- ---------------------------------------------------------------------------
INSERT INTO svp_search_field (key, label, type, options, filterable, sort_order) VALUES
    ('bureauName', 'Bureau Name:', 'static', NULL, FALSE, 1),
    ('planNameLike', 'Plan Name Like:', 'text', NULL, FALSE, 2),
    ('planPeriod', 'Plan Period:', 'select', '["All", "CY-2026", "CY-2025", "CY-2024"]'::jsonb, FALSE, 3),
    ('programs', 'Plan For: Program', 'checkbox-group', '["All", "G24", "H08", "H12", "H26", "H5N", "H89", "HPC"]'::jsonb, TRUE, 4),
    ('statuses', 'Status:', 'checkbox-group', '["All", "Not Started", "In Progress", "Complete"]'::jsonb, TRUE, 5),
    ('divisions', 'Plan For: Division', 'checkbox-group', '["All", "DCHAP", "DMHAP", "DPD", "DPSHB", "DRHE"]'::jsonb, TRUE, 6)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- INSERT: svp_default_search_values (single row)
-- ---------------------------------------------------------------------------
INSERT INTO public.svp_default_search_values (
    bureau_name, plan_name_like, plan_period, programs, statuses, divisions, sort_method, search_name
) VALUES (
    'HAB', '', 'All', '["All"]'::jsonb, '["All"]'::jsonb, '["All"]'::jsonb, 'Grid', ''
)
ON CONFLICT (id) DO UPDATE SET
    bureau_name = EXCLUDED.bureau_name,
    plan_name_like = EXCLUDED.plan_name_like,
    plan_period = EXCLUDED.plan_period,
    programs = EXCLUDED.programs,
    statuses = EXCLUDED.statuses,
    divisions = EXCLUDED.divisions,
    sort_method = EXCLUDED.sort_method,
    search_name = EXCLUDED.search_name;

-- ---------------------------------------------------------------------------
-- INSERT: svp_plan
-- ---------------------------------------------------------------------------
INSERT INTO svp_plan (id, plan_for, plan_period, plan_name, site_visits, status, team_name, needs_attention) VALUES
    ('1', 'Bureau - HAB', 'CY-2026', 'Test', 'N/A', 'In Progress', '', ''),
    ('2', 'Bureau - HAB', 'CY-2025', 'HAB Annual Plan', '12', 'Complete', 'Team Alpha', ''),
    ('3', 'Bureau - PCO', 'CY-2026', 'PCO Site Visits', '8', 'In Progress', 'Team Beta', 'Yes'),
    ('4', 'Bureau - PCO', 'CY-2025', 'Prior Year PCO', '10', 'Complete', 'Team Beta', ''),
    ('5', 'Division - DCHAP', 'CY-2026', 'DCHAP 2026', 'N/A', 'Not Started', '', ''),
    ('6', 'Division - DCHAP', 'CY-2025', 'DCHAP Review', '15', 'Complete', 'Team Gamma', ''),
    ('7', 'Bureau - HAB', 'CY-2026', 'Q1 Site Visits', '4', 'In Progress', 'Team Alpha', 'Yes'),
    ('8', 'Division - OPS', 'CY-2026', 'Operations Plan', '6', 'Not Started', '', ''),
    ('9', 'Bureau - PCO', 'CY-2024', 'Legacy PCO', '14', 'Complete', 'Team Beta', ''),
    ('10', 'Bureau - HAB', 'CY-2026', 'HAB Pilot', '2', 'In Progress', 'Team Alpha', ''),
    ('11', 'Division - GAP', 'CY-2025', 'GAP Assessment', 'N/A', 'Not Complete', '', 'Yes'),
    ('12', 'Bureau - HAB', 'CY-2026', 'Annual Review', '20', 'In Progress', 'Team Alpha', ''),
    ('13', 'Division - DSHAP', 'CY-2026', 'DSHAP Plan', '7', 'Not Started', 'Team Delta', ''),
    ('14', 'Bureau - PCO', 'CY-2026', 'PCO 2026', '9', 'In Progress', 'Team Beta', ''),
    ('15', 'Division - OPS', 'CY-2025', 'OPS Follow-up', '5', 'Complete', 'Team Gamma', ''),
    ('16', 'Bureau - HAB', 'CY-2026', 'Special Initiative', '3', 'Canceled', '', ''),
    ('17', 'Division - DMHAP', 'CY-2026', 'DMHAP List', '11', 'In Progress', 'Team Delta', 'Yes'),
    ('18', 'Bureau - PCO', 'CY-2025', 'PCO Annual', '16', 'Complete', 'Team Beta', '')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- INSERT: svp_initiate_option (bureaus, divisions, programs, teams)
-- ---------------------------------------------------------------------------
INSERT INTO public.svp_initiate_option (option_type, value, sort_order) VALUES
    ('bureau', 'HAB', 1), ('bureau', 'OGH', 2), ('bureau', 'BPHC', 3), ('bureau', 'CAT', 4), ('bureau', 'EHB', 5), ('bureau', 'BHW', 6),
    ('division', 'DCHAP', 1), ('division', 'DMHAP', 2), ('division', 'DPD', 3), ('division', 'DSHAP', 4), ('division', 'GAP', 5), ('division', 'OPS', 6),
    ('program', 'G24', 1), ('program', 'H08', 2), ('program', 'H12', 3), ('program', 'H1J', 4), ('program', 'H1L', 5), ('program', 'H1X', 6),
    ('program', 'H3M', 7), ('program', 'H4A', 8), ('program', 'H52', 9), ('program', 'H65', 10), ('program', 'H6A', 11), ('program', 'H76', 12), ('program', 'H77', 13), ('program', 'H7C', 14)
ON CONFLICT (option_type, value) DO NOTHING;

COMMIT;
