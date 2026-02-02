# Agent Prompts: Replicate This Platform on Other LLMs

These prompts are written so **any LLM** (e.g. Claude, GPT, etc.) can reproduce the same implementation when given the repo and the prompt. Use them in order if rebuilding from scratch.

---

## 1. List Page & Shared UI (Layout, DataGrid, Sort, Search)

**File:** [PROMPT_SITE_VISIT_PLAN_LIST_AND_UI.md](./PROMPT_SITE_VISIT_PLAN_LIST_AND_UI.md)

**Use when:** You need the Site Visit Plan **List** page with reusable layout (Header, Sidebar, Footer, AppLayout), generic **DataGrid** (multi-column sort, sort-order banner, blank/empty handling, animation), and **SearchModal** wired to the grid.

**Covers:** LayoutContext, AppLayout, Header, Sidebar, Footer, DataGrid (pagination, inline filters, multi-column sort, sort banner, animation), SearchModal integration, SVP list page state and API usage.

---

## 2. Initiate Page

**File:** [PROMPT_SITE_VISIT_PLAN_INITIATE.md](./PROMPT_SITE_VISIT_PLAN_INITIATE.md)

**Use when:** You need the **Site Visit Plan - Initiate** page (form with Plan For, Plan Period, Plan Name, etc.) and the `/svp/initiate` route.

**Covers:** Initiate form, backend `svp_initiate` options, menu entry, InitiatePlanForm component, page and API.

---

## How to Use

- **Full replication:** Run **Prompt 1** first (List + UI), then **Prompt 2** (Initiate). Ensure backend and frontend structure (e.g. `data_repository`, `apiGet`, `AppLayout`) exist as described.
- **Only List/Grid:** Use Prompt 1.
- **Only Initiate:** Use Prompt 2 (assumes AppLayout and services already exist).

Copy the chosen prompt’s full markdown into the LLM; point it at this repo (or the relevant files). The prompts are self-contained with context, task, requirements, and file lists.
