# Basic Information Page – Optional Features Design & Options

This document outlines design options for the three “optional later” features on the Basic Information page. The backend already supports all of them (PATCH accepts `additional_programs`, `participants`, and `travel_plans`).

---

## 1. Additional Program(s)

**Current state:** Dropdown + Add/Remove buttons exist; list is read-only from `basicInfo.additional_programs`. No persistence on Add/Remove.

**Goal:** User selects a program from the dropdown, clicks Add → it appears in the list; user can remove items. Saved with the rest of the form on Save.

### Option A – Inline list with chips (recommended)

- **UX:** Dropdown + “Add” adds the selected option to a list below. Each item is a **chip/tag** (label + “×” remove). No “select then Remove”; each chip has its own remove.
- **Data:** Store array of **values** (e.g. `["H76", "H89"]`). Display using options to get labels. Backend already stores JSONB array.
- **State:** Component state: `additionalPrograms: string[]`. On Add: append if not already in list. On Remove: filter out by value. Include in `buildPayloadFromForm` and send on Save.
- **Pros:** Simple, clear, no “select to remove” confusion. Matches existing UI hint (“select and click Add”).
- **Cons:** None significant.

### Option B – Dropdown + Add, “select from list to Remove”

- **UX:** As now: list shown as comma-separated or rows. A **second dropdown** is populated with current list items; user picks one and clicks “Remove”.
- **Data:** Same as A (array of values).
- **State:** Same as A.
- **Pros:** Mirrors the existing hint text literally (“select the Entity Number and click Remove” – we’d say “select the program”).
- **Cons:** Extra click (select then remove). Slightly more UI (second dropdown).

### Option C – Multi-select only (no Add/Remove buttons)

- **UX:** Single multi-select (listbox or checkbox group) of all programs. User checks/unchecks. No separate Add/Remove.
- **Data:** Same (array of values).
- **Pros:** Simplest interaction; one control.
- **Cons:** Diverges from current design (dropdown + Add/Remove); may need to reword hints.

**Recommendation:** **Option A** (chips) for best UX and minimal confusion.

---

## 2. Participant(s) / Traveler(s)

**Current state:** Read-only list from `basicInfo.participants`; Add / Update / Remove buttons do nothing.

**Goal:** Add names (e.g. staff/travelers), optionally edit, remove. Persist as array of strings.

### Option A – Simple list: Add (text field) + per-row Remove (recommended)

- **UX:** Text input + “Add” appends one participant (trimmed). List shows each participant with a small “Remove” (or ×). No “Update” in v1; user can remove and re-add to “edit”.
- **Data:** `participants: string[]` (e.g. `["Jane Doe", "John Smith"]`). Backend already stores JSONB array.
- **State:** Component state `participants: string[]`; include in payload on Save.
- **Pros:** Simple, no modal, matches “add/remove” mental model.
- **Cons:** No inline edit (remove + add is the edit).

### Option B – List + inline edit

- **UX:** List of participants; each row is either display + “Edit” / “Remove”, or (when editing) an input + “Save” / “Cancel”. Add via single text field + Add.
- **Data:** Same as A.
- **State:** Same plus “editingIndex: number | null” for which row is in edit mode.
- **Pros:** Edit in place without losing place in list.
- **Cons:** More UI and state (edit mode, validation).

### Option C – Modal for Add/Edit

- **UX:** “Add” opens a small modal (name field, maybe role/email later); “Edit” opens same modal pre-filled. List shows names with Edit / Remove.
- **Data:** Same as A (or later extend to `{ name, role? }[]` if needed).
- **State:** Modal open/closed, current participant for edit, list array.
- **Pros:** Room for future fields (email, role) without cluttering the page.
- **Cons:** Extra click and modal for simple “name only” today.

**Recommendation:** **Option A** for first version; add Option B (inline edit) later if users ask for it.

---

## 3. Travel Plan(s)

**Current state:** “Add Travel Plan” button and a read-only DataGrid of `basicInfo.travel_plans`. No add/edit/delete.

**Goal:** Add travel plan rows (travelers, locations, dates, cost, status), edit, delete. Backend already supports replace-all: send full `travel_plans` array in PATCH and it replaces all rows for that plan entity.

### Option A – Inline add row + editable grid (recommended)

- **UX:** “Add Travel Plan” inserts a new empty row **in the grid** (or at bottom). Grid cells are **editable** (inputs or contentEditable). Each row has “Delete” or ×. No modal.
- **Data:** Array of objects: `{ id?, number_of_travelers, travel_locations, travel_dates, travelers, travel_cost, status }`. Backend expects same; `id` only needed for stable keys in UI (new rows have no `id` until saved).
- **State:** Component state `travelPlans: TravelPlan[]`. On Save, send full array in payload; backend replaces all.
- **Pros:** Single place to see and edit; quick to add multiple rows. Backend already does replace-all.
- **Cons:** Grid can get wide; need to handle responsive or horizontal scroll (already have dataGridWrap).

### Option B – Modal form for Add/Edit

- **UX:** “Add Travel Plan” opens a modal with one form (number of travelers, locations, dates, travelers, cost, status). “Edit” on a row opens same modal pre-filled. List/grid is read-only with Edit / Delete.
- **Data:** Same as A.
- **State:** `travelPlans` array; modal state (open, editing index or null, form values).
- **Pros:** Cleaner layout on small screens; one row at a time.
- **Cons:** More clicks to add several rows; modal can feel heavy for simple rows.

### Option C – Expandable rows

- **UX:** Grid shows one line per travel plan. Row expands to show inline form for that row (edit). “Add Travel Plan” adds an empty expanded row at bottom.
- **Data:** Same as A.
- **State:** Same as A plus “expandedId” or “expandedIndex”.
- **Pros:** Edit in context without a modal.
- **Cons:** More complex table behavior; accordion/expand can be fiddly on mobile.

**Recommendation:** **Option A** (editable grid) for consistency with “grid of records” and minimal navigation. Option B is a good alternative if you want to keep the main grid read-only and avoid wide tables.

---

## Summary Table

| Feature                 | Recommended option | Alternative |
|------------------------|--------------------|-------------|
| Additional Program(s)  | A – Chips + Add/Remove per chip | B – Select from list to Remove |
| Participant(s)         | A – Text + Add, per-row Remove   | B – Inline edit |
| Travel Plan(s)         | A – Editable grid + Add row, Delete per row | B – Modal form for Add/Edit |

---

## Implementation Notes (for when you implement)

- **Additional programs:** Use existing `additionalProgramsOptions`; prevent adding same value twice; store values, display labels from options.
- **Participants:** Validate non-empty and optionally max length before add; optional uniqueness (e.g. same name twice allowed or not).
- **Travel plans:** New rows can have `id: undefined` or `id: 'new-' + index` for React keys; backend ignores `id` on insert and returns full basic info (with DB-generated ids) after save. On next load, `travel_plans` from API include ids for keys.

If you tell me which option you want for each feature (e.g. “A for all” or “A for programs, B for travel plans”), I can outline or implement the exact UI and state changes next.
