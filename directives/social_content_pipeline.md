# Social Content Pipeline

> SOP for generating, reviewing, and publishing Instagram content for the BERVOS ecosystem.

## Overview

This directive describes how to produce build-in-public Instagram posts from the engineering work across **all** BERVOS ecosystem projects. It can be re-triggered at any time by the user or a scheduled task.

## 1. Trigger

Run this pipeline whenever the user requests new social content, or on a recurring cadence (e.g., bi-weekly). The trigger phrase is:

> "Generate social content" or "Run the social pipeline"

## 2. Queue Review & Revision (Step 1)

1. Read `social/bervos_social_queue.json` from the workspace root.
2. Look for any objects where:
   - `user_feedback` is a non-empty string, OR
   - `status` equals `"Needs AI Revision"`
3. If found:
   - Revise captions / visual instructions per the feedback text.
   - Clear `user_feedback` to `""`.
   - Set `status` to `"Draft"`.
4. **Never** overwrite, regenerate, or delete posts with status `"Approved"`, `"Published"`, or any post the user has not flagged for revision.

## 3. Workspace Analysis (Step 2)

### Scanning all ecosystem projects

The parent directory containing all BERVOS projects is:

```
/Users/bernardo/Library/CloudStorage/GoogleDrive-laresbernardo@gmail.com/My Drive/Documentos/Antigravity/
```

Known project directories (scan these):

| Directory | Project Name |
|-----------|-------------|
| `Billio/` | Billio |
| `Aura/` | Aura |
| `Pinmage/` | Pinmage |
| `tripitdown/` | tripitdown |
| `Chessverse/` | Chessverse |
| `Scribo/` | Scribo |
| `Tonaly/` | Tonaly |
| `YT2MP3/` | YT2MP3 |
| `LaresDJ/` | LaresDJ |
| `WAme/` | WAme |
| `BERVOS/BERVOS.org/` | BERVOS Hub |

### Commands to run

For **each** project directory:

```bash
git log --since="30 days ago" --pretty=format:"%h - %s (%cr)" --stat -n 15
```

### Identifying post-worthy updates

Look for commits related to:
- **Architecture**: MCP enablement, Firebase data structures, API pipelines
- **AI/ML**: Ollama integrations, Gemini API, local LLM workflows
- **UI/UX**: Minimalist design, SVG updates, animation components
- **Performance**: Refactors, caching, query optimization
- **New features**: Major capabilities, new language support, new tools
- **DevOps**: CI/CD, deployment automation, SEO/GEO readiness

Select the **3-8 most significant** updates across all projects. Use `git show <commit-hash>` on top candidates to understand specific diffs, logic hurdles, and code patterns worth showcasing.

## 4. Content Generation (Step 3)

Draft 4-8 new Instagram posts distributed across these formats:

### Format A: "Before & After" Carousel (3 slides)
- **Slide 1**: The bottleneck / pain point
- **Slide 2**: The approach / architecture decision
- **Slide 3**: The effectiveness / performance gain

### Format B: "Under the Hood"
- Deep dive into a technical architecture (e.g., local LLM prompting, geocoding cascades, MCP pipelines)

### Format C: "Vibe Coding Reality"
- Transparent look at a logic hurdle, testing phase, or design evolution

## 5. Formatting Rules (Step 4)

### Tone
- Professional, direct, and transparent
- Sound like a senior engineer discussing effectiveness and measurement with peers
- **Absolutely NO**: "Revolutionize," "Game-changer," "Unlock," "Supercharge," "Cutting-edge," or any generic AI marketing jargon

### Language
- Main caption in **English**
- End with a clear, one-sentence **Spanish summary**

### Structure
1. Start with a **technical hook** (1 line, attention-grabbing)
2. Explain the **"why"** (problem context)
3. Frame the **impact** (efficiency / speed / scale / reliability)
4. End with a soft pointer to **bervos.org**
5. Include **3-5 relevant, niche hashtags**

## 6. Visual Asset Directions (Step 5)

### Brand Guidelines
Always follow `social/brand_guidelines.md` for visual consistency.

### Asset types
- **Code screenshots**: Specify exactly which 5-10 lines to screenshot using Ray.so (dark theme, padding 32, language auto-detect)
- **Architecture diagrams**: Provide valid, copy-pasteable Mermaid.js flowcharts
- **UI captures**: Specify exactly which screen or component to capture
- **AI-generated images**: Use the image generation tool with the brand prompt prefix from `brand_guidelines.md`

## 7. Data Export (Step 6)

### JSON structure

Output to `social/bervos_social_queue.json`:

```json
[
  {
    "id": "unique-timestamp-or-hash",
    "status": "Draft",
    "post_type": "carousel_before_after | under_the_hood | vibe_coding_reality",
    "hook": "The attention-grabbing first line",
    "caption_english": "Full English caption with hashtags",
    "caption_spanish": "One-sentence Spanish summary",
    "visual_instruction": "Detailed instructions for visual assets",
    "mermaid_code": "graph TD; ... (or null)",
    "suggested_date": "YYYY-MM-DD",
    "user_feedback": "",
    "project": "Project name this post relates to",
    "created_at": "ISO 8601 timestamp",
    "updated_at": "ISO 8601 timestamp"
  }
]
```

### Firestore sync

After generating the JSON, the posts should also be written to the `social_posts` Firestore collection via `POST /api/social/import`. The Hub's Social Manager reads from Firestore.

## 8. Re-triggering

To re-run this entire pipeline:
1. User says: "Generate social content" or "Run the social pipeline"
2. Agent reads this directive
3. Executes steps 1-7 sequentially
4. Outputs updated `bervos_social_queue.json` and syncs to Firestore

The pipeline is idempotent: existing approved/published posts are preserved; only new posts are appended and revision-flagged posts are updated.
