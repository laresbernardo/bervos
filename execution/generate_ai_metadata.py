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

# Setup absolute paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_FILE = os.path.join(PROJECT_ROOT, 'src', 'data', 'ecosystem.json')
HTML_FILE = os.path.join(PROJECT_ROOT, 'index.html')
ROBOTS_FILE = os.path.join(PROJECT_ROOT, 'public', 'robots.txt')
SITEMAP_FILE = os.path.join(PROJECT_ROOT, 'public', 'sitemap.xml')
LLMS_TXT_FILE = os.path.join(PROJECT_ROOT, 'public', 'llms.txt')
LLMS_FULL_TXT_FILE = os.path.join(PROJECT_ROOT, 'public', 'llms-full.txt')

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
