# Adding a New Project to the BERVOS Hub

This document defines the Standard Operating Procedure (SOP) for adding a new project (Solution or Open Source module) to the BERVOS ecosystem. It details the Hub's dynamic autodiscovery design and how metadata, versions, and git history are synchronized.

---

## 1. Architecture Overview

The Hub operates on a fully automated, dynamic autodiscovery architecture. It avoids manual HTML coding by dynamically loading initiatives from the local `index.html` JSON-LD schema graph.

```mermaid
graph TD
    A[ecosystem.json] -->|1. Sync Command| B(generate_ai_metadata.py)
    B -->|2. Inject Schema| C[index.html JSON-LD]
    C -->|3. Dynamically Parse| D[getInitiativesFromSchema()]
    D -->|4. Query Stats & Commits| E[fetchFreshMetrics()]
    E -->|5. Render Dashboard| F[HubDashboard.tsx]
```

1. **Source of Truth**: `src/data/ecosystem.json` holds the raw configuration list of all solutions.
2. **SEO & Schema Compiler**: `execution/generate_ai_metadata.py` compiles the projects in `ecosystem.json` and injects them into the `index.html` schema graph, sitemaps, robots.txt, and LLM text files.
3. **Autodiscovery Backend**: The backend Cloud Function reads and parses the JSON-LD schema inside `index.html` dynamically at runtime, creating the card registry.
4. **Metadata & Commit Gatherer**: For each initiative found in the schema, the backend retrieves real-time statistics (Stars, issues, user list telemetry) and the last 3 commits.
5. **Dashboard Rendering**: The React frontend (`HubDashboard.tsx`) displays the cards with real-time stats, clickable commit IDs, and advanced search/filtering controls.

---

## 2. Step-by-Step checklist for adding a project

### Step 1: Append to `src/data/ecosystem.json`
Add the new project object to the array in `src/data/ecosystem.json`. Set the appropriate metadata, operating system, and category:

```json
{
  "title": "MyNewProject",
  "description": "Short project summary.",
  "link": "https://mynewproject.bervos.org/",
  "tags": ["AI", "React", "Firebase"],
  "logo": "/mynewproject-logo.png",
  "category": "productivity",
  "applicationCategory": "WebApplication" 
}
```
*Use `WebApplication` for Web Apps, `UtilitiesApplication` for Desktop utility apps, or `SoftwareSourceCode` for Open Source modules/R packages.*

### Step 2: Compile SEO & JSON-LD Schema
Run the metadata synchronization script to inject the new project into `index.html` and compile GEO sitemaps:
```bash
python3 execution/generate_ai_metadata.py
```

### Step 3: Configure Sibling Folder Mapping (for Local Development)
If you want to view real development versions and commits on localhost, update the folder name mappings in the Cloud Function backend (`functions/src/index.ts`):
1. **Version Scanner (`getLocalProjectVersion`)**:
   Add the lowercase-to-folder-name mapping in `directoryNames` so the backend can locate the folder and read `src/version.json` or `package.json`:
   ```typescript
   'mynewproject': 'MyNewProject'
   ```
2. **Git Commit Retriever (`getRepoCommits`)**:
   Add the same folder name mapping inside the `directoryNames` registry of `getRepoCommits` to fetch the local git logs.

### Step 4: Configure Firebase Target ID (if Web Solution)
If the project is a Firebase Web App and you want to count unique user statistics:
1. Map the project name to its actual Firebase Project ID inside the `getProjectId()` mapping helper in `functions/src/index.ts`:
   ```typescript
   if (name === 'mynewproject') return 'mynewproject-firebase-id';
   ```
2. Add the corresponding service account private key to the `FIREBASE_PROJECTS_CONFIG` variable inside `functions/.env` to allow Auth queries.

### Step 5: Rebuild and Restart Server
Compile all frontend assets and backend cloud functions, and run the local emulator suite:
```bash
npm run build && npm run build:functions
npx firebase-tools emulators:start --only functions,hosting
```

---

## 3. Core Automation Rules

* **Formatting Dates**: All dates (commits, last-update indicators) must be formatted as absolute **`YYYY-MM-DD`** strings. 
* **Safe Delimiters**: When running local `git log` commands, use the custom `__DELIM__` separator (e.g. `git log -n 3 --pretty=format:"%h__DELIM__%an__DELIM__%ad__DELIM__%aI__DELIM__%s"`) to prevent pipes (`|`) inside commit messages from breaking index offsets.
* **Clickable Commits**: The backend resolves the remote URL `git config --get remote.origin.url` for local workspaces, converting SSH addresses (`git@github.com:...`) to web-accessible URLs (`https://github.com/...`) and appending `/commit/{hash}` to enable clickable commit IDs.
