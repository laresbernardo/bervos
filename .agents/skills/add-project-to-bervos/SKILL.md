---
name: "add-project-to-bervos"
description: "Comprehensive step-by-step procedure for adding any new project type (Web App, R Package, macOS App, Desktop Utility, Open Source) to BERVOS.org. Covers ecosystem registration, dynamic versioning, hub integration, custom subdomains, landing page setup with dynamic favicons, and GEO/metadata sync."
---

# Add Project to BERVOS.org Skill

This skill defines the mandatory, step-by-step workflow for integrating any new solution or project into the BERVOS Ecosystem (`BERVOS.org`). Follow this guide whenever a new project is created, onboarded, or hosted.

---

## 1. Project Type Taxonomy

Determine the solution type before starting:
- **Web App (Firebase Auth)**: Web applications with user logins (e.g., *Billio*, *Chessverse*, *tripitdown*). User metrics track **Total Registered Users** & **30d Active Users**.
- **Desktop / macOS / Utility App**: Native apps or browser extensions (e.g., *Aura*, *Pinmage*, *YT2MP3*). User metrics track **Telemetry Downloads / File Hits**.
- **Enterprise / Private Self-Hosted App**: Standalone R/Shiny or containerized business tools (e.g., *Rosa*). User metrics track **Repository Collaborator Access Count**.
- **Open Source Package / Library**: R or Python libraries (e.g., *Robyn*, *lares*). Metrics track **CRAN/GitHub Downloads, Stars, Forks, & Issues**.

---

## 2. Step-by-Step Integration Workflow

### Step 1: Ecosystem Registration (`src/data/ecosystem.json`)
Add a new JSON object entry under the `"projects"` array:

```json
{
  "title": "ProjectName",
  "description": "Short, punchy 1-2 sentence description of the solution.",
  "link": "https://project.bervos.org/",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "logo": "/project-logo.png",
  "category": "productivity",
  "applicationCategory": "WebApplication", // or "BusinessApplication", "UtilitiesApplication", "FinanceApplication", etc.
  "updated": "YYYY-MM-DD",
  "version": "1.0.0"
}
```

---

### Step 2: Backend & Cloud Functions Registration (`functions/src/index.ts`)

1. **Folder & Repository Mapping (`getLocalProjectVersion`)**:
   Add mapping under `directoryNames`:
   ```ts
   'projectkey': 'ProjectFolderName'
   ```
   *Note: Version detection automatically scans `package.json`, `version.json`, `DESCRIPTION` (for R packages), `manifest.json`, and `Info.plist`.*

2. **Git Commit & Repository URL Mapping (`getRepoCommits` & `gitUrlMap`)**:
   Add repo URL under `gitUrlMap`:
   ```ts
   'projectkey': 'https://github.com/laresbernardo/ProjectRepo.git'
   ```

3. **Social Pipeline Registration (`REPOS_FOR_PIPELINE`)**:
   Add to `REPOS_FOR_PIPELINE` array:
   ```ts
   { name: 'ProjectName', repo: 'laresbernardo/ProjectRepo' }
   ```

4. **Metrics / Users Resolution (`fetchInitiativeMetrics`)**:
   - For **Enterprise / Private Apps** (like *Rosa*): User metric resolves to repository collaborator / access list count (`getRepoCollaboratorCount`).
   - For **Web Apps**: Resolves to Firebase Auth users (`getAppUserMetrics`).
   - For **Utilities**: Resolves to Telemetry download hits (`getTelemetryHits`).

---

### Step 3: Hub Dashboard & Social Manager Sync

1. **Hub Dashboard (`src/components/hub/HubDashboard.tsx`)**:
   Add key mapping to `GIT_REPO_MAP`:
   ```ts
   'projectkey': 'laresbernardo/ProjectRepo'
   ```

2. **Social Media Pipeline (`src/components/social/SocialManager.tsx`)**:
   Add prompt direction to `ORIGINAL_VISUAL_DIRECTIONS`:
   ```ts
   'projectkey': 'Branded architecture/interface diagram description for AI visual generation.'
   ```

---

### Step 4: Dedicated Landing Page & Custom Subdomain (If Applicable)

If the project has a custom landing page (like `rosa.bervos.org`):

1. **Modular Folder Structure**:
   Create a clean module folder under `src/components/<projectkey>/`:
   - `src/components/<projectkey>/<Project>LandingPage.tsx`
   - Modals, background animations, and custom assets.

2. **Dynamic Favicon Setup (1:1 Aspect Ratio)**:
   - **Important**: Browser tabs force favicons into a square 1:1 canvas. Generate a square PNG (`public/<projectkey>-favicon.png` e.g., 512x512) centered with transparent background to prevent horizontal stretching.
   - In `<Project>LandingPage.tsx`, dynamically set favicon on mount and clean up on unmount:
     ```tsx
     useEffect(() => {
       document.title = "Project Title | Description";
       const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
       const previousHref = favicon ? favicon.href : '/favicon.svg';
       const previousType = favicon ? favicon.type : 'image/svg+xml';

       if (favicon) {
         favicon.href = '/projectkey-favicon.png';
         favicon.type = 'image/png';
       }

       return () => {
         document.title = "BERVOS | Digital Solutions, Systems & Open Source";
         if (favicon) {
           favicon.href = previousHref;
           favicon.type = previousType;
         }
       };
     }, []);
     ```

3. **Subdomain Routing & DNS**:
   - **`src/App.tsx`**: Add route / hostname check for `projectkey.bervos.org` or `/projectkey`.
   - **GoDaddy / DNS**: Create CNAME record `projectkey` pointing to Firebase Hosting default domain (e.g. `bervos-official-5df71.web.app`).
   - **Firebase Console**: Add Custom Domain `projectkey.bervos.org`.

---

### Step 5: Metadata Sync, Verification & Deployment

1. **Run Metadata Generator**:
   ```bash
   python3 execution/generate_ai_metadata.py
   ```
   *Injects schema into `index.html` and regenerates `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt`.*

2. **Build Applications**:
   ```bash
   cd functions && npm run build && cd .. && npm run build
   ```

3. **Commit & Deploy**:
   ```bash
   git add .
   git commit -m "feat(ecosystem): add ProjectName to BERVOS ecosystem"
   git push origin main
   ```
   *GitHub Actions automatically builds and deploys to Firebase Hosting & Functions.*
