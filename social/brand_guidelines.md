# BERVOS Social Media Brand Guidelines

> Standard visual identity for all BERVOS Instagram posts and social media assets.

## Brand Identity

- **Brand Name**: BERVOS
- **Tagline**: "Building fuller experiences."
- **URL**: bervos.org
- **Owner**: Bernardo Lares (@laresbernardo)

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#080b12` | Main background (deep space navy) |
| `bg-card` | `#0c121d` | Card / panel background |
| `accent-indigo` | `#6366f1` | Primary accent (indigo-500) |
| `accent-cyan` | `#06b6d4` | Secondary accent (cyan-500) |
| `accent-gradient` | `linear-gradient(135deg, #6366f1, #06b6d4)` | Gradient for highlights, borders, titles |
| `text-primary` | `#f1f5f9` | Primary text (slate-100) |
| `text-secondary` | `#94a3b8` | Secondary / muted text (slate-400) |
| `text-mono` | `#a5b4fc` | Code / mono-spaced labels (indigo-300) |
| `status-online` | `#34d399` | Success / online indicators (emerald-400) |
| `status-warning` | `#fbbf24` | Warning / attention (amber-400) |
| `border-subtle` | `rgba(255, 255, 255, 0.05)` | Subtle borders |
| `border-accent` | `rgba(99, 102, 241, 0.3)` | Accent borders (indigo-500/30) |

## Typography

| Element | Font | Weight | Style |
|---------|------|--------|-------|
| Headlines | Inter or SF Pro Display | 900 (Black) | Uppercase, tracking-tight |
| Body text | Inter | 500 (Medium) | Normal case, relaxed leading |
| Code / labels | JetBrains Mono or SF Mono | 700 (Bold) | Uppercase, tracking-widest, 9-11px |
| Hook text | Inter | 800 (Extra Bold) | Title case |

## Visual Style

### Overall Aesthetic
- **Dark-first**: Always dark backgrounds (#080b12)
- **Tech HUD**: Inspired by heads-up displays — mono-spaced labels, status indicators, geometric borders
- **Minimal**: No clutter, generous whitespace, clear hierarchy
- **Glassmorphism**: Subtle backdrop-blur for overlay panels
- **Geometric accents**: Thin indigo/cyan border lines, corner markers, grid patterns

### Post Layout Templates

#### Single Image Post
```
┌─────────────────────────────────────┐
│ // MONO_LABEL // PROJECT_NAME       │
│                                     │
│         LARGE HEADLINE              │
│         with gradient accent        │
│                                     │
│    ┌─────────────────────────┐      │
│    │  Visual content area    │      │
│    │  (code, diagram, UI)    │      │
│    └─────────────────────────┘      │
│                                     │
│ bervos.org              BERVOS_LOGO │
└─────────────────────────────────────┘
```

#### Carousel Slide
```
┌─────────────────────────────────────┐
│ // SLIDE_01 // BEFORE               │
│                                     │
│  Slide title in bold white          │
│                                     │
│  Content area with illustration     │
│  or code block                      │
│                                     │
│ ──────────────────────── ●○○        │
│ bervos.org                          │
└─────────────────────────────────────┘
```

### Decorative Elements
- **Corner markers**: 1px indigo lines at bottom-left corners (L-shape, 20px each arm)
- **Top accent line**: Full-width 1px gradient line `from-transparent via-indigo-500/50 to-transparent`
- **Grid overlay**: Very subtle (opacity 5-10%) geometric grid in background
- **Glow effects**: Soft indigo glow behind headlines (`text-shadow: 0 0 40px rgba(99,102,241,0.3)`)

## AI Image Generation Prompt Prefix

When generating images with AI, **always** prepend this standard prefix:

```
Dark tech-aesthetic Instagram post for software engineering brand "BERVOS". 
Background: deep navy-black (#080b12). Accent colors: electric indigo (#6366f1) 
and cyan (#06b6d4) used sparingly for highlights, borders, and glow effects. 
Style: minimal, clean, HUD-inspired, no clutter. Typography: bold white sans-serif 
headlines, mono-spaced labels in indigo-300. No stock photos, no people, no hands. 
Professional and premium feel. Square format (1080x1080px).
```

Then append the post-specific content instruction.

## Logo Usage

- Always include the BERVOS logo (white variant) in the bottom-right corner
- Size: ~40-60px height
- Opacity: 60-80%
- Never stretch, rotate, or recolor the logo

## Hashtag Strategy

Always include 3-5 from this curated pool (pick the most relevant):

### Technical
`#BuildInPublic` `#IndieHacker` `#SideProject` `#WebDev` `#SwiftUI` `#Firebase` `#TypeScript` `#OpenSource` `#DevLife` `#CodeArchitecture`

### AI/ML
`#LocalLLM` `#Ollama` `#AIEngineering` `#MCPProtocol` `#GeminiAPI`

### Product
`#ShipIt` `#ProductEngineering` `#FullStackDev` `#SoloFounder` `#TechStartup`

## Tone of Voice

- **Do**: "We measured a 3x reduction in API calls." / "The bottleneck was annotation diffing."
- **Don't**: "Revolutionary AI-powered solution!" / "Game-changing technology!"
- First person plural ("we") or impersonal ("the system") — never second person marketing ("you'll love this")
- Technical specifics over vague claims
- Honest about trade-offs and decisions
