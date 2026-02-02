# Prompt: Site Visit Plan Initiate Page

Use this prompt with any LLM to reproduce the Site Visit Plan Initiate feature implementation.

---

## Context

You are working on a community-driven platform with:
- **Frontend**: Next.js 14 (App Router), React, CSS Modules
- **Backend**: Flask, Python
- **Data**: Central `backend/data/static_data.json` loaded via `backend/data_repository.py`
- **Navigation**: The app has a Site Visit Plan (SVP) list page at `/svp` with a "+ Initiate Plan" button currently linking to `#initiate`

## Task

Add a new page **"Site Visit Plan - Initiate"** that renders when the user clicks "+ Initiate Plan" on the Site Visit Plan list page. All dropdown options must be served from the backend via `static_data.json`; the frontend fetches data on page load.

## Requirements

### Page Layout and Form Fields

1. **Page title**: "Site Visit Plan - Initiate" with a clipboard/checklist icon
2. **Note**: "Fields with * are required" (red asterisk for required fields)
3. **Initiate In Context Of** (required): Dropdown. When teams array is empty, show "No Team" as default option.
4. **Section header** (blue background): "Provide Site Visit Planning Information"
5. **Site Visit Plan For** (required): Radio group with three mutually exclusive options:
   - **Bureau** + dropdown: HAB, OGH, BPHC, CAT, EHB, BHW
   - **Division** + dropdown: DCHAP, DMHAP, DPD, DSHAP, GAP, OPS (placeholder "Select a division")
   - **Program** + dropdown: G24, H08, H12, H1J, H1L, H1X, H3M, H4A, H52, H65, H6A, H76, H77, H7C (placeholder "Select a program")
   - Show "(OR)" between Bureau and Division/Program options
   - Only the selected type's dropdown is enabled; disable inactive dropdowns
6. **Site Visit Plan Period** (required): Radio group with two options:
   - **Fiscal Year** + dropdown: current year and next year (placeholder "Select a Fiscal Year")
   - **Calendar Year** + dropdown: current year and next year (placeholder "Select a Calendar Year")
   - Show "(OR)" between options
   - Only the selected type's dropdown is enabled
7. **Plan Name** (required): Text input field
8. **Create Plan** button: Blue, bottom-right

### Data Flow

- **Bureaus, divisions, programs, teams**: Stored in `static_data.json` under a new `svp_initiate` key
- **Fiscal years, calendar years**: Computed server-side as `[current_year, next_year]` (e.g., 2025, 2026)
- **teams**: Array can be empty initially (displays "No Team")

### Backend Changes

1. **static_data.json**: Add `svp_initiate` section:
   ```json
   "svp_initiate": {
     "bureaus": ["HAB", "OGH", "BPHC", "CAT", "EHB", "BHW"],
     "divisions": ["DCHAP", "DMHAP", "DPD", "DSHAP", "GAP", "OPS"],
     "programs": ["G24", "H08", "H12", "H1J", "H1L", "H1X", "H3M", "H4A", "H52", "H65", "H6A", "H76", "H77", "H7C"],
     "teams": []
   }
   ```

2. **static_data.json (menu)**: Add "Initiate" as a child of SVP:
   ```json
   { "id": "svp-initiate", "label": "Initiate", "href": "/svp/initiate" }
   ```

3. **data_repository.py**: Add `get_svp_initiate_options()` that returns `bureaus`, `divisions`, `programs`, `teams` from `svp_initiate`, and `fiscal_years`/`calendar_years` computed as `[current_year, next_year]`.

4. **app.py**: Add `GET /api/svp/initiate/options` endpoint returning the options object.

### Frontend Changes

1. **svpService.js**: Add `getInitiateOptions()` that calls `GET /api/svp/initiate/options`
2. **services/index.js**: Export `getInitiateOptions`
3. **SiteVisitPlanList.js**: Change Initiate Plan button href from `#initiate` to `/svp/initiate`
4. **New page**: `frontend/app/svp/initiate/page.js`:
   - Client component
   - Fetches `getMenu()`, `getHeaderNav()`, `getInitiateOptions()` on mount
   - Renders `InitiatePlanForm` inside `AppLayout`
   - Passes `options` to form and `onSubmit` callback
   - Handles loading/error states
   - Uses `defaultExpandedMenuIds={['svp']}` for sidebar
5. **New component**: `frontend/app/components/InitiatePlanForm/`:
   - `InitiatePlanForm.js`: Form component receiving `options` and `onSubmit` props; manages form state; validates required fields; disables inactive dropdowns based on radio selection
   - `InitiatePlanForm.module.css`: Styles matching existing SVP list (e.g., SiteVisitPlanList.module.css) for title, required star, section headers, form layout
   - `index.js`: Export default

### Form Behavior

- Single selection for "Plan For" (Bureau OR Division OR Program) and "Plan Period" (Fiscal Year OR Calendar Year)
- When user switches radio, clear or reset the corresponding dropdown; disable non-selected dropdowns
- Validate on submit: Plan For selection, Plan Period selection, Plan Name non-empty
- On valid submit: call `onSubmit(formData)` (implementation can stub with console.log or alert)

### File Summary

| Action | File |
|--------|------|
| Modify | `backend/data/static_data.json` |
| Modify | `backend/data_repository.py` |
| Modify | `backend/app.py` |
| Modify | `frontend/app/services/svpService.js` |
| Modify | `frontend/app/services/index.js` |
| Modify | `frontend/app/components/SiteVisitPlanList/SiteVisitPlanList.js` |
| Create | `frontend/app/svp/initiate/page.js` |
| Create | `frontend/app/components/InitiatePlanForm/InitiatePlanForm.js` |
| Create | `frontend/app/components/InitiatePlanForm/InitiatePlanForm.module.css` |
| Create | `frontend/app/components/InitiatePlanForm/index.js` |

### Architecture Notes

- Follow repository pattern: backend reads from `static_data.json` via `data_repository.py`
- Use existing `apiGet` from `frontend/app/services/api.js` for API calls
- Use existing `AppLayout` component with `menuItems`, `navItems`, `activeNavItem`, `defaultExpandedMenuIds`
- Bootstrap Icons are loaded in root layout (bi-card-checklist, etc.)
- Use CSS Modules (e.g., `styles.mainTitle`) for component styles
