# Page Plans (Prompt Format for LLMs)

This folder contains **per-page plans** for the HRSA Simpler PPRS frontend, written in a **prompt format** so other LLM models can understand, implement, or modify each page.

## Format

Each plan file (`.plan.md`) includes:

- **YAML frontmatter:** `name`, `route`, `overview`, `todos`, `isProject`
- **Goal:** What the page should do
- **Current State:** Route, behavior, and main dependencies
- **Key Files:** Table of frontend/backend files involved
- **Prompt-Style Instructions:** Step-by-step instructions for an LLM to implement or change the page
- **Data / API:** Request/response shapes and endpoints used

## Index of Plans

| Page | Route | Plan File |
|------|--------|-----------|
| Home | `/` | [home_page.plan.md](home_page.plan.md) |
| Login | `/login` | [login_page.plan.md](login_page.plan.md) |
| Welcome | `/welcome` | [welcome_page.plan.md](welcome_page.plan.md) |
| SVP List | `/svp` | [svp_list_page.plan.md](svp_list_page.plan.md) |
| SVP Initiate | `/svp/initiate` | [svp_initiate_page.plan.md](svp_initiate_page.plan.md) |
| SVP Status Index | `/svp/status` | [svp_status_index_page.plan.md](svp_status_index_page.plan.md) |
| SVP Status Overview | `/svp/status/[id]` | [svp_status_overview_page.plan.md](svp_status_overview_page.plan.md) |
| SVP Coversheet | `/svp/status/[id]/coversheet` | [svp_coversheet_page.plan.md](svp_coversheet_page.plan.md) |
| SVP Basic Info | `/svp/status/[id]/basic-info/[entityId]` | [svp_basic_info_page.plan.md](svp_basic_info_page.plan.md) |
| SVP Identified Site Visits | `/svp/status/[id]/identified-site-visits` | [svp_identified_site_visits_page.plan.md](svp_identified_site_visits_page.plan.md) |
| SVP Selected Entities | `/svp/status/[id]/selected-entities` | [svp_selected_entities_page.plan.md](svp_selected_entities_page.plan.md) |

## How to Use

- **For implementation:** Give an LLM the relevant `.plan.md` and ask it to implement or update that page.
- **For consistency:** Plans reference the same backend (repository pattern, snake_case) and frontend (AppLayout, services) conventions.
- **For onboarding:** New contributors or models can read a single file to understand one page’s scope, files, and APIs.
