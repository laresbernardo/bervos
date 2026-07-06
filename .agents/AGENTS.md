# BERVOS Workspace Agent Rules

This workspace uses a separation of concerns architecture. When executing tasks in this workspace, you must adhere to the following rules:

## Adding Projects to the Hub
1. **Dynamic Schema Parsing**: Never manually code project lists in the Hub's dashboard view. All projects must be dynamically parsed from the `index.html` JSON-LD schema graph.
2. **Metadata Sync**: Always run `python3 execution/generate_ai_metadata.py` after editing project data in `src/data/ecosystem.json`. This updates `index.html` and regenerates GEO sitemaps.
3. **Local Version Scanner**: Sibling directories in the `/Antigravity` parent folder (e.g. `Billio`, `Aura`, `Pinmage`) must have their versions dynamically read by scanning local package files or plist files. Map new directories inside `getLocalProjectVersion` in `functions/src/index.ts`.
4. **Git Log Retriever**: Commits must be extracted from the local git history when running on localhost. Resolve remote origin configurations using `git config --get remote.origin.url` to generate clickable links.
5. **Date Formats**: Render all dashboard dates (commits and release updates) in the strict **`YYYY-MM-DD`** format.

For step-by-step instructions on project synchronization, refer to [add_project_to_hub.md](file:///Users/bernardo/Library/CloudStorage/GoogleDrive-laresbernardo@gmail.com/My%20Drive/Documentos/Antigravity/BERVOS/BERVOS.org/directives/add_project_to_hub.md).
