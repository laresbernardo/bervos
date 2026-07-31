---
name: "add-project-to-bervos"
description: "Comprehensive step-by-step procedure for adding any new project type (Web App, R Package, macOS App, Desktop Utility, Open Source) to BERVOS.org. Covers ecosystem registration, dynamic versioning, hub integration, custom subdomains, landing page setup with dynamic favicons, automatic OpenGraph social link preview handling, and GEO/metadata sync."
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
  "applicationCategory": "WebApplication",
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

---

### Step 3: Server-Side OpenGraph & Social Link Preview Engine (`ssrHandler` & `firebase.json`)

**Critical Learning**: Social media platforms (Telegram, WhatsApp, LinkedIn, Twitter/X, Facebook, iMessage) scrape HTML link previews **without executing client-side JavaScript**. If requests land on a generic `index.html`, scrapers see default main site meta tags instead of the project logo.

1. **Dynamic SSR Function (`functions/src/index.ts`)**:
   The `ssrHandler` Cloud Function automatically intercepts request headers (`req.headers.host`), matches the domain or path against `src/data/ecosystem.json`, and dynamically injects the project's exact title, description, and OpenGraph logo URL (`og:image`, `twitter:image`):
   ```ts
   // ssrHandler reads ecosystem.json and dynamically maps:
   // - title -> `${match.title} | ${match.description}`
   // - og:image -> `https://bervos.org${match.logo}`
   // - og:description -> match.description
   ```

2. **Wildcard Rewrites (`firebase.json`)**:
   Ensure `firebase.json` routes wildcard HTML requests to `ssrHandler`:
   ```json
   {
     "hosting": {
       "rewrites": [
         { "source": "/api/**", "function": "hubApi" },
         { "source": "**", "function": "ssrHandler" }
       ]
     }
   }
   ```

---

### Step 4: Hub Dashboard Sync & Deduplication (`src/components/hub/HubDashboard.tsx`)

1. **Repo Mapping (`GIT_REPO_MAP`)**:
   ```ts
   'projectkey': 'laresbernardo/ProjectRepo'
   ```

2. **Deduplication Safeguard**:
   All metrics state initializers and API response handlers must wrap project collections in `deduplicateMetrics()` to prevent duplicate initiative cards when merging static and live API payloads.

---

### Step 5: Dedicated Landing Page & Favicon Setup

1. **Modular Folder**:
   Create `src/components/<projectkey>/<Project>LandingPage.tsx`.

2. **Dynamic Favicon & DOM Meta Tags**:
   Set 1:1 ratio square favicon (`public/<projectkey>-favicon.png`) and DOM meta tags on mount, restoring defaults on unmount.

3. **Subdomain Routing & DNS**:
   - `src/App.tsx`: Route `window.location.hostname.includes('projectkey')`.
   - GoDaddy / DNS: CNAME `projectkey` -> `bervos-official-5df71.web.app`.
   - Firebase Console: Add custom domain `projectkey.bervos.org`.

---

### Step 6: Metadata Sync & Build Verification

```bash
python3 execution/generate_ai_metadata.py
cd functions && npm run build && cd .. && npm run build
npx -y firebase-tools@latest deploy --only hosting,functions --project bervos-official
```
