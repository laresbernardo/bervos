#!/usr/bin/env python3
import os
import json
import subprocess
import urllib.request
import urllib.error
from datetime import datetime

# Setup absolute paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
QUEUE_PATH = os.path.join(PROJECT_ROOT, 'social', 'bervos_social_queue.json')
ENV_PATH = os.path.join(PROJECT_ROOT, 'functions', '.env')

PROJECTS_DIR = '/Users/bernardo/Library/CloudStorage/GoogleDrive-laresbernardo@gmail.com/My Drive/Documentos/Antigravity'

KNOWN_PROJECTS = {
    'Billio': os.path.join(PROJECTS_DIR, 'Billio'),
    'Aura': os.path.join(PROJECTS_DIR, 'Aura'),
    'Pinmage': os.path.join(PROJECTS_DIR, 'Pinmage'),
    'tripitdown': os.path.join(PROJECTS_DIR, 'tripitdown'),
    'Chessverse': os.path.join(PROJECTS_DIR, 'Chessverse'),
    'Scribo': os.path.join(PROJECTS_DIR, 'Scribo'),
    'Tonaly': os.path.join(PROJECTS_DIR, 'Tonaly'),
    'YT2MP3': os.path.join(PROJECTS_DIR, 'YT2MP3'),
    'LaresDJ': os.path.join(PROJECTS_DIR, 'LaresDJ'),
    'WAme': os.path.join(PROJECTS_DIR, 'WAme'),
    'BERVOS Hub': PROJECT_ROOT
}

def load_gemini_api_key():
    if not os.path.exists(ENV_PATH):
        raise FileNotFoundError(f"Missing environment file at: {ENV_PATH}")
    with open(ENV_PATH, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('GEMINI_API_KEY='):
                return line.strip().split('=', 1)[1]
    raise ValueError("GEMINI_API_KEY not found in functions/.env")

def get_recent_commits():
    project_commits = {}
    for name, path in KNOWN_PROJECTS.items():
        if os.path.exists(path) and os.path.exists(os.path.join(path, '.git')):
            try:
                # Get commit log in the last 60 days
                out = subprocess.check_output(
                    ['git', 'log', '--since="60 days ago"', '--pretty=format:%h - %s (%cr)', '--stat', '-n', '15'],
                    cwd=path, text=True, stderr=subprocess.DEVNULL
                ).strip()
                if out:
                    project_commits[name] = out
            except Exception as e:
                print(f"[Warning] Failed to read git log for {name}: {e}")
    return project_commits

def load_existing_posts():
    if os.path.exists(QUEUE_PATH):
        try:
            with open(QUEUE_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"[Warning] Failed to parse existing queue JSON: {e}")
    return []

def main():
    print("Starting Social Content Pipeline...")
    api_key = load_gemini_api_key()
    
    # 1. Workspace Analysis (Step 2)
    print("Scanning workspaces for git history (last 60 days)...")
    commits = get_recent_commits()
    if not commits:
        print("No recent commits found in any repository. Exiting.")
        return
        
    print(f"Found updates in {len(commits)} projects.")

    # 2. Load existing queue items (Step 1 & Step 6 tracking)
    existing_posts = load_existing_posts()
    
    # Format existing posts summaries to pass to the AI prompt to avoid duplication
    existing_summaries = []
    for post in existing_posts:
        existing_summaries.append({
            "project": post.get("project"),
            "hook": post.get("hook"),
            "id": post.get("id")
        })

    # 3. Construct prompt for Gemini
    prompt = f"""You are Antigravity, a senior software engineer building the BERVOS ecosystem.
Your job is to draft 3-6 new Instagram posts from the recent engineering updates across the projects.
Follow these brand guidelines and structural rules strictly.

--- BRAND GUIDELINES & STYLE ---
1. Tone: Professional, direct, senior engineer discussing implementation, trade-offs, and metrics.
2. Absolutely NO AI marketing jargon: Do not use "Revolutionize," "Game-changer," "Unlock," "Supercharge," "Cutting-edge," "Empower," "Streamline," etc. Be concrete.
3. Language: Captions must be in English. At the very end of caption_english, add a clear, one-sentence Spanish summary as the caption_spanish field.
4. Structure:
   - Technical hook (1 line, attention-grabbing, no fluff)
   - Explain the "why" (problem context)
   - Frame the impact (efficiency / speed / scale / reliability)
   - End with a soft pointer to bervos.org or project site (e.g. bervos.org, tripitdown.bervos.org, etc.)
   - Include 3-5 relevant niche hashtags (e.g. #BuildInPublic, #IndieHacker, #React, #TypeScript, #SwiftUI, #LocalLLM, #Ollama, #MCPProtocol, #GeminiAPI)
5. Visual Directions:
   - Must specify brand prefix from guidelines for AI generated images:
     "Dark tech-aesthetic Instagram post for software engineering brand \"BERVOS\". Background: deep navy-black (#080b12). Accent colors: electric indigo (#6366f1) and cyan (#06b6d4) used sparingly for highlights, borders, and glow effects. Style: minimal, clean, HUD-inspired, no clutter. Typography: bold white sans-serif headlines, mono-spaced labels in indigo-300. No stock photos, no people, no hands. Professional and premium feel. Square format (1080x1080px)."
   - Include visual instructions for code screenshots (referencing Ray.so dark theme), architecture diagrams (using valid Mermaid.js flowcharts), or UI captures.
6. Post Formats:
   - Format A: "Before & After" Carousel (3 slides)
   - Format B: "Under the Hood" (Deep dive into technical architecture)
   - Format C: "Vibe Coding Reality" (Hurdle, design evolution, or testing phase)

--- DATA INPUT ---
Here is the JSON of existing posts in the queue to avoid repeating the exact same updates/hooks:
{json.dumps(existing_summaries, indent=2)}

Here are the recent commit logs (last 60 days) for the ecosystem projects:
{json.dumps(commits, indent=2)}

--- TASK ---
Generate between 3 to 6 new, unique, and compelling social posts based on the recent commits that are not already covered in the existing posts.
Make sure you write posts for projects that are underrepresented (e.g., WAme, YT2MP3, tripitdown, Scribo, Aura, Billio, Pinmage) using their latest updates.

Return a JSON array of post objects adhering to this schema:
[
  {{
    "id": "unique-kebab-case-string-like-YYYYMMDD-project-topic",
    "status": "Draft",
    "post_type": "carousel_before_after" | "under_the_hood" | "vibe_coding_reality",
    "hook": "attention-grabbing first line",
    "caption_english": "Full English caption with paragraph spacing and 3-5 hashtags",
    "caption_spanish": "One-sentence Spanish summary",
    "visual_instruction": "Detailed visual layout instructions including the required BERVOS prompt prefix if generating an image",
    "mermaid_code": "valid Mermaid.js flowchart string (or null)",
    "suggested_date": "YYYY-MM-DD",
    "user_feedback": "",
    "project": "Project Name",
    "created_at": "ISO 8601 string (current time)",
    "updated_at": "ISO 8601 string (current time)"
  }}
]
Do not include markdown code block formatting in your response. Return ONLY valid JSON.
"""

    print("Requesting Gemini 3.5 Flash...")
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    req = urllib.request.Request(
        api_url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            text_result = res_data['candidates'][0]['content']['parts'][0]['text']
            new_posts = json.loads(text_result)
            print(f"Gemini generated {len(new_posts)} new posts.")
            
            # Append new posts to existing queue
            combined_queue = existing_posts + new_posts
            
            # Save back to file
            os.makedirs(os.path.dirname(QUEUE_PATH), exist_ok=True)
            with open(QUEUE_PATH, 'w', encoding='utf-8') as f:
                json.dump(combined_queue, f, indent=2, ensure_ascii=False)
            print(f"Successfully saved updated queue to {QUEUE_PATH}.")
            
            # Sync to Firestore using import_queue_rest.py
            print("Syncing queue to Firestore...")
            import_script = os.path.join(SCRIPT_DIR, 'import_queue_rest.py')
            result = subprocess.run(['python3', import_script], capture_output=True, text=True)
            print(result.stdout)
            if result.returncode != 0:
                print(f"[Error] Sync failed: {result.stderr}")
            else:
                print("Sync completed successfully.")
                
    except urllib.error.HTTPError as e:
        print(f"[Error] API call failed: {e.code} - {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"[Error] {e}")

if __name__ == '__main__':
    main()
