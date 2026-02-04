# Wiki source for GitHub Wiki

This folder contains the **source for the project's GitHub Wiki**. You can either copy these pages into the wiki or clone the wiki repo and replace its content.

---

## How to use with GitHub Wiki

### Option 1: Create pages manually

1. On GitHub, open your repository.
2. Click **Wiki** (or go to `https://github.com/<owner>/<repo>/wiki`).
3. Click **New Page**.
4. Create a page with the same **title** as the filename (without `.md`), e.g.:
   - `Home` (from `Home.md`)
   - `Architecture` (from `Architecture.md`)
   - `Getting-Started` (from `Getting-Started.md`)
   - etc.
5. Paste the contents of the corresponding `.md` file from this folder and save.

### Option 2: Clone the wiki repo and push these files

GitHub stores the wiki in a separate git repository.

1. **Clone the wiki** (replace with your repo URL):
   ```bash
   git clone https://github.com/<owner>/<repo>.wiki.git
   cd <repo>.wiki
   ```

2. **Copy this folder’s `.md` files** into the wiki repo:
   - Copy each `*.md` from `wiki/` into the wiki repo root.
   - **Important:** Copy **`_Sidebar.md`** as well — GitHub Wiki shows this file as the custom sidebar on every page.
   - Use **Home.md** as the wiki’s home (GitHub uses `Home` as the default start page if the file is named `Home.md`).

3. **Commit and push**:
   ```bash
   git add .
   git commit -m "Add wiki pages from wiki folder"
   git push origin master
   ```

### Option 3: Keep wiki in main repo (this folder)

You can keep this `wiki/` folder in the main repo as the single source of truth and:
- Refer to it from the main **README** (“Documentation: see `/wiki`”).
- When updating the GitHub Wiki, copy updated files from `wiki/` into the wiki repo (Option 2) or paste into the browser (Option 1).

---

## Page list

| File | Suggested wiki title | Description |
|------|----------------------|-------------|
| `_Sidebar.md` | — | **Custom sidebar** (copy to wiki root; GitHub displays it automatically) |
| `Home.md` | Home | Overview and quick links |
| `Architecture.md` | Architecture | High-level architecture and structure |
| `Getting-Started.md` | Getting-Started | Prerequisites and local setup |
| `Backend.md` | Backend | Flask API and backend structure |
| `Frontend.md` | Frontend | Next.js app and components |
| `Database.md` | Database | Schema and initialization |
| `Site-Visit-Plans-(SVP).md` | Site-Visit-Plans-(SVP) | SVP feature |
| `API-Reference.md` | API-Reference | REST API endpoints |
| `Deployment.md` | Deployment | Docker and Azure |
| `Environment-Configuration.md` | Environment-Configuration | .env and config |

Internal links in the markdown use wiki page names (e.g. `[Architecture](Architecture)`). After uploading, use the same page names in GitHub so links resolve.
