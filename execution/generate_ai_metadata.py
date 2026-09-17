#!/usr/bin/env python3
"""
generate_ai_metadata.py
Deterministic builder for SEO, GEO, and AI indexing files.
Parses src/data/ecosystem.json and updates:
- index.html (injected schema.org JSON-LD graph)
- public/robots.txt (AI crawler pointers)
- public/sitemap.xml (XML sitemap including llms.txt)
- public/llms.txt (Standard table of contents for LLM agents)
- public/llms-full.txt (Detailed ecosystem reference dossier for LLM agents)
"""

import json
import os
import re
from datetime import datetime

import subprocess
import urllib.request

# Setup absolute paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_FILE = os.path.join(PROJECT_ROOT, 'src', 'data', 'ecosystem.json')
FUNCTIONS_DATA_FILE = os.path.join(PROJECT_ROOT, 'functions', 'ecosystem.json')
FUNCTIONS_LIB_DATA_FILE = os.path.join(PROJECT_ROOT, 'functions', 'lib', 'ecosystem.json')
HTML_FILE = os.path.join(PROJECT_ROOT, 'index.html')
ROBOTS_FILE = os.path.join(PROJECT_ROOT, 'public', 'robots.txt')
SITEMAP_FILE = os.path.join(PROJECT_ROOT, 'public', 'sitemap.xml')
LLMS_TXT_FILE = os.path.join(PROJECT_ROOT, 'public', 'llms.txt')
LLMS_FULL_TXT_FILE = os.path.join(PROJECT_ROOT, 'public', 'llms-full.txt')

FOLDER_MAP = {
    'billio': 'Billio',
    'chessverse': 'Chessverse',
    'tripitdown': 'tripitdown',
    'aura': 'Aura',
    'scribo': 'Scribo',
    'laresdj': 'LaresDJ',
    'pinmage': 'Pinmage',
    'tonaly': 'tonaly',
    'yt2mp3': 'YT2MP3',
    'rosa': 'Rosa',
    'sonder': 'Rutinas',
    'rutinas': 'Rutinas',
    'bervos': 'BERVOS',
}

GITHUB_REPO_MAP = {
    'billio': 'laresbernardo/Billio',
    'chessverse': 'laresbernardo/Chessverse',
    'tripitdown': 'laresbernardo/tripitdown',
    'aura': 'laresbernardo/aura',
    'scribo': 'laresbernardo/Scribo',
    'laresdj': 'laresbernardo/laresdj.com',
    'pinmage': 'laresbernardo/pinmage',
    'tonaly': 'laresbernardo/tonaly',
    'yt2mp3': 'laresbernardo/YT2MP3',
    'rosa': 'laresbernardo/Rosa',
    'sonder': 'laresbernardo/rutinas',
    'rutinas': 'laresbernardo/rutinas',
    'bervos': 'laresbernardo/bervos',
    'robyn': 'facebookexperimental/Robyn',
    'lares': 'laresbernardo/lares',
}

def get_candidate_parent_dirs():
    return [
        os.path.dirname(PROJECT_ROOT),
        os.path.dirname(os.path.dirname(PROJECT_ROOT)),
        os.path.abspath(os.path.join(PROJECT_ROOT, '..')),
        os.path.abspath(os.path.join(PROJECT_ROOT, '../..')),
    ]

def find_local_project_dir(folder_name):
    for parent in get_candidate_parent_dirs():
        candidate = os.path.join(parent, folder_name)
        if os.path.isdir(candidate):
            return candidate
    return None

def get_local_git_date(project_dir):
    if not project_dir or not os.path.isdir(os.path.join(project_dir, '.git')):
        return None
    try:
        res = subprocess.run(
            ['git', 'log', '-1', '--format=%cs'],
            cwd=project_dir,
            capture_output=True,
            text=True,
            timeout=5
        )
        if res.returncode == 0 and res.stdout.strip():
            return res.stdout.strip()
    except Exception:
        pass
    return None

def get_local_project_version(project_dir):
    if not project_dir:
        return None
    pkg_paths = [
        os.path.join(project_dir, 'package.json'),
        os.path.join(project_dir, 'website', 'package.json'),
        os.path.join(project_dir, 'src', 'version.json'),
        os.path.join(project_dir, 'web', 'package.json'),
        os.path.join(project_dir, 'frontend', 'package.json'),
    ]
    for p in pkg_paths:
        if os.path.isfile(p):
            try:
                with open(p, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if data.get('version'):
                        return str(data['version']).lstrip('v')
            except Exception:
                pass
    desc_paths = [
        os.path.join(project_dir, 'DESCRIPTION'),
        os.path.join(project_dir, 'R', 'DESCRIPTION'),
    ]
    for p in desc_paths:
        if os.path.isfile(p):
            try:
                with open(p, 'r', encoding='utf-8') as f:
                    content = f.read()
                    m = re.search(r'^Version:\s*(\S+)', content, re.MULTILINE)
                    if m:
                        return m.group(1).lstrip('v')
            except Exception:
                pass
    for plist in [os.path.join(project_dir, 'AuraApp', 'Info.plist'), os.path.join(project_dir, 'PinmageApp', 'Info.plist')]:
        if os.path.isfile(plist):
            try:
                with open(plist, 'r', encoding='utf-8') as f:
                    content = f.read()
                    m = re.search(r'<key>CFBundleShortVersionString</key>\s*<string>([^<]+)</string>', content)
                    if m:
                        return m.group(1).lstrip('v')
            except Exception:
                pass
    return None

def get_remote_github_pushed_date(repo_full_name):
    if not repo_full_name:
        return None
    try:
        url = f"https://api.github.com/repos/{repo_full_name}"
        headers = {'User-Agent': 'bervos-metadata-sync'}
        token = os.environ.get('GITHUB_TOKEN')
        if token:
            headers['Authorization'] = f"token {token}"
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.load(resp)
            pushed = data.get('pushed_at')
            if pushed and 'T' in pushed:
                return pushed.split('T')[0]
    except Exception:
        pass
    return None

def sync_ecosystem_timestamps(data):
    """
    Scans local sibling directories and GitHub repositories to dynamically update
    'updated' timestamps and 'version' properties before generating AI metadata.
    """
    updated_count = 0
    projects = data.get('projects', [])
    for p in projects:
        key = p.get('title', '').strip().lower()
        folder_name = FOLDER_MAP.get(key, p.get('title', ''))
        
        # 1. Check local directory
        local_dir = PROJECT_ROOT if key == 'bervos' else find_local_project_dir(folder_name)
        local_date = get_local_git_date(local_dir)
        local_version = get_local_project_version(local_dir)
        
        # 2. Check remote GitHub repo if local date unavailable
        remote_date = None
        repo_slug = GITHUB_REPO_MAP.get(key)
        if not repo_slug and p.get('codeRepository'):
            m = re.search(r'github\.com/([^/]+/[^/]+?)(?:\.git|/|$)', p['codeRepository'])
            if m:
                repo_slug = m.group(1)
        if not local_date and repo_slug:
            remote_date = get_remote_github_pushed_date(repo_slug)
            
        best_date = local_date or remote_date
        current_date = p.get('updated', '')
        
        if best_date and best_date > current_date:
            print(f"  [Auto-Sync] {p['title']}: updated timestamp changed from {current_date} -> {best_date}")
            p['updated'] = best_date
            updated_count += 1
            
        if local_version and local_version != p.get('version'):
            print(f"  [Auto-Sync] {p['title']}: version updated from {p.get('version')} -> {local_version}")
            p['version'] = local_version
            updated_count += 1

    # Also check open-source packages
    open_source = data.get('openSource', [])
    for pkg in open_source:
        key = pkg.get('name', '').strip().lower()
        repo_slug = GITHUB_REPO_MAP.get(key)
        if not repo_slug and pkg.get('link'):
            m = re.search(r'github\.com/([^/]+/[^/]+?)(?:\.git|/|$)', pkg['link'])
            if m:
                repo_slug = m.group(1)
        if repo_slug:
            remote_date = get_remote_github_pushed_date(repo_slug)
            if remote_date:
                pkg['updated'] = remote_date

    # Persist updated ecosystem data if changes occurred
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')
        
    for mirror_path in [FUNCTIONS_DATA_FILE, FUNCTIONS_LIB_DATA_FILE]:
        if os.path.exists(os.path.dirname(mirror_path)):
            try:
                with open(mirror_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                    f.write('\n')
            except Exception:
                pass
                
    print(f"✓ Dynamic ecosystem sync complete ({updated_count} updates applied)")
    return data

def load_ecosystem_data():
    if not os.path.exists(DATA_FILE):
        raise FileNotFoundError(f"Source file not found at: {DATA_FILE}")
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_json_ld(data):
    owner = data['owner']
    org = data['organization']
    projects = data['projects']
    open_source = data['openSource']
    
    graph = [
        {
            "@type": "Person",
            "@id": f"{org['url']}#person",
            "name": owner['name'],
            "url": owner['website'],
            "sameAs": [
                owner['github'],
                owner['linkedin']
            ],
            "jobTitle": "Software Engineer & Creator",
            "worksFor": {
                "@id": f"{org['url']}#organization"
            }
        },
        {
            "@type": "Organization",
            "@id": f"{org['url']}#organization",
            "name": org['name'],
            "url": org['url'],
            "logo": org['logo'],
            "description": org['description'],
            "founder": {
                "@id": f"{org['url']}#person"
            }
        },
        {
            "@type": "WebSite",
            "@id": f"{org['url']}#website",
            "url": org['url'],
            "name": org['name'],
            "description": org['description'],
            "publisher": {
                "@id": f"{org['url']}#organization"
            }
        }
    ]
    
    # Inject Projects
    for project in projects:
        graph.append({
            "@type": "SoftwareApplication",
            "@id": f"{project['link']}#software",
            "name": project['title'],
            "description": project['description'],
            "url": project['link'],
            "applicationCategory": project.get('applicationCategory', 'WebApplication'),
            "operatingSystem": "All",
            "softwareVersion": project.get('version', '1.0.0'),
            "author": {
                "@id": f"{org['url']}#person"
            },
            "publisher": {
                "@id": f"{org['url']}#organization"
            }
        })
        
    # Inject Open Source
    for pkg in open_source:
        graph.append({
            "@type": "SoftwareSourceCode",
            "@id": f"{pkg['link']}#source",
            "name": pkg['name'],
            "description": pkg['description'],
            "codeRepository": pkg['link'],
            "programmingLanguage": {
                "@type": "ComputerLanguage",
                "name": "R"
            },
            "author": {
                "@type": "Person",
                "name": "Bernardo Lares"
            } if pkg['name'] == 'lares' else {
                "@type": "Organization",
                "name": "Meta Marketing Science"
            }
        })
        
    return {
        "@context": "https://schema.org",
        "@graph": graph
    }

def inject_json_ld(schema_data):
    if not os.path.exists(HTML_FILE):
        raise FileNotFoundError(f"HTML file not found at: {HTML_FILE}")
        
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        html_content = f.read()
        
    json_ld_str = json.dumps(schema_data, indent=2, ensure_ascii=False)
    
    # Use re.sub with a lambda to safely inject without string escaping issues
    updated_html = re.sub(
        r'(<script type="application/ld\+json" id="schema-jsonld">)(.*?)(</script>)',
        lambda m: f"{m.group(1)}\n{json_ld_str}\n{m.group(3)}",
        html_content,
        flags=re.DOTALL
    )
    
    with open(HTML_FILE, 'w', encoding='utf-8') as f:
        f.write(updated_html)
    print("✓ Schema JSON-LD successfully injected into index.html")

def generate_llms_txt(data):
    org = data['organization']
    owner = data['owner']
    projects = data['projects']
    open_source = data['openSource']
    
    lines = [
        f"# {org['name']}",
        "",
        f"> {org['description']}",
        "",
        "## Ecosystem Projects",
        ""
    ]
    
    for p in projects:
        lines.append(f"- [{p['title']}]({p['link']}): {p['description']}")
    
    lines.extend([
        "",
        "## Open Source Libraries",
        ""
    ])
    
    for os_lib in open_source:
        lines.append(f"- [{os_lib['name']}]({os_lib['link']}): {os_lib['description']}")
        
    lines.extend([
        "",
        "## Core Information",
        "",
        f"- [Full LLM Dossier](/llms-full.txt): Deep developer-oriented resource on architecture, philosophy, and detailed project outlines.",
        f"- [GitHub Profile]({owner['github']})",
        f"- [LinkedIn Profile]({owner['linkedin']})"
    ])
    
    with open(LLMS_TXT_FILE, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines) + "\n")
    print("✓ Created public/llms.txt")

def generate_llms_full_txt(data):
    org = data['organization']
    owner = data['owner']
    projects = data['projects']
    open_source = data['openSource']
    
    lines = [
        f"# {org['name']} - Full Ecosystem Reference",
        "",
        "> This document provides complete structured information about BERVOS, its projects, and open source packages for AI agents and LLMs.",
        "",
        "## Creator Profile",
        f"- **Name**: {owner['name']}",
        "- **Role**: Software Engineer, Data Scientist, and Digital Architect",
        f"- **GitHub**: {owner['github']}",
        f"- **LinkedIn**: {owner['linkedin']}",
        f"- **Email**: {owner['email']}",
        "",
        "## Brand Philosophy & Naming",
        "The name **BERVOS** represents three distinct architectural layers of the ecosystem:",
        "1. **Action Angle (Ber + Verbos)**: In Spanish, *verbos* means verbs (actions). BERVOS signifies digital tools engineered to execute, optimize, and drive tangible results rather than serve as passive portfolios.",
        "2. **Enterprise System (B.E.R.V.O.S.)**: Business Effectiveness & Resource Visualization Optimization System. An analytical blueprint for structuring high-impact assets.",
        "3. **Client-Centric (Ber-Vos)**: Derived from the Spanish pronoun *vos* (you), meaning 'Ber for You'—indicating hyper-personalized solutions tailored to the end-user.",
        "",
        "## Ecosystem Projects (Production Apps)",
        ""
    ]
    
    for p in projects:
        lines.extend([
            f"### {p['title']}",
            f"- **Deployment URL**: [{p['link']}]({p['link']})",
            f"- **Category**: {p['category'].title()} ({p.get('applicationCategory', '')})",
            f"- **Tags**: {', '.join(p['tags'])}",
            f"- **Description**: {p['description']}",
            ""
        ])
        
    lines.append("## Open Source Software")
    for os_lib in open_source:
        lines.extend([
            f"### {os_lib['name']}",
            f"- **Repository**: [{os_lib['link']}]({os_lib['link']})",
            f"- **Description**: {os_lib['description']}",
            f"- **Initial Metrics**: Stars: {os_lib['stars']}, Forks: {os_lib['forks']}, Downloads: {os_lib['downloads']}, Contributors: {os_lib['contributors']}",
            ""
        ])
        
    lines.extend([
        "## Technology Stack & Infrastructure",
        "- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite",
        "- **Motion**: Framer Motion",
        "- **Icons**: Lucide React & React Icons",
        "- **Hosting & Analytics**: Firebase, Google Analytics (GTag), Formspree for forms",
        ""
    ])
    
    with open(LLMS_FULL_TXT_FILE, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines) + "\n")
    print("✓ Created public/llms-full.txt")

def update_robots_txt():
    robots_content = """User-agent: *
Allow: /

# LLM Crawler Discovery
# llms.txt: https://bervos.org/llms.txt
# llms-full.txt: https://bervos.org/llms-full.txt

Sitemap: https://bervos.org/sitemap.xml
"""
    with open(ROBOTS_FILE, 'w', encoding='utf-8') as f:
        f.write(robots_content)
    print("✓ Updated public/robots.txt")

def update_sitemap_xml():
    today = datetime.now().strftime('%Y-%m-%d')
    sitemap_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bervos.org/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://bervos.org/concept</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://bervos.org/privacy</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://bervos.org/terms</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://bervos.org/contact</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://bervos.org/llms.txt</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://bervos.org/llms-full.txt</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
"""
    with open(SITEMAP_FILE, 'w', encoding='utf-8') as f:
        f.write(sitemap_content)
    print("✓ Updated public/sitemap.xml")

def main():
    print("Starting AI/GEO metadata generation...")
    try:
        data = load_ecosystem_data()
        data = sync_ecosystem_timestamps(data)
        schema_data = generate_json_ld(data)
        inject_json_ld(schema_data)
        generate_llms_txt(data)
        generate_llms_full_txt(data)
        update_robots_txt()
        update_sitemap_xml()
        print("AI/GEO metadata generation successfully completed!")
    except Exception as e:
        print(f"Error occurred: {e}")
        exit(1)

if __name__ == '__main__':
    main()
