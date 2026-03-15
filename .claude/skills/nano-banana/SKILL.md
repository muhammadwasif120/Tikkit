---
name: nano-banana
description: "AI image generation and editing using Google's Nano Banana (Gemini) models. Actions: generate, edit, restore, icon, diagram, pattern, story. Use for: event cover images, hero banners, ticket art, pass badges, UI mockups, icons, backgrounds. Models: gemini-2.5-flash-image (Nano Banana 2, ~$0.04/image), gemini-3-pro-image-preview (Nano Banana Pro, ~$0.06/image). Output saved to ./nanobanana-output/"
---

# Nano Banana — AI Image Generation

Claude Code skill for generating and editing images using Google's Nano Banana (Gemini) image generation models. Integrated via the Gemini CLI.

## When to Apply

Use this skill when the user asks to:
- Generate images, artwork, or visuals of any kind
- Create event cover photos, hero banners, or backgrounds
- Design icons, logos, or app assets
- Edit or modify existing images
- Create UI mockups or design references
- Generate ticket art, pass badges, or promotional materials
- Create patterns, textures, or abstract backgrounds
- Build sequential or story-based image sets

## Models Available

| Model | Alias | Cost | Best For |
|-------|-------|------|----------|
| `gemini-2.5-flash-image` | Nano Banana 2 | ~$0.04/image | Fast generation, everyday use |
| `gemini-3-pro-image-preview` | Nano Banana Pro | ~$0.06/image | Max fidelity, complex scenes |

**Default:** Use Nano Banana 2 (`gemini-2.5-flash-image`) unless the user explicitly needs Pro quality.

## Prerequisites

Before using this skill, ensure:

```bash
# 1. Install Gemini CLI globally
npm install -g @google/gemini-cli

# 2. Set your Gemini API key (get from https://aistudio.google.com/apikey)
export NANOBANANA_GEMINI_API_KEY=your-api-key-here

# 3. Install the nanobanana extension via Gemini CLI
gemini extensions install nanobanana
```

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):
```bash
export NANOBANANA_GEMINI_API_KEY=your-api-key-here
```

## How to Generate Images

When the user requests image generation, use the Gemini CLI with the nanobanana extension:

```bash
# Basic generation (Nano Banana 2 — default)
gemini nanobanana generate "your detailed prompt here"

# High quality (Nano Banana Pro)
gemini nanobanana generate --model=gemini-3-pro-image-preview "your prompt"

# Multiple variants
gemini nanobanana generate --count=4 "your prompt"

# High resolution (2K or 4K)
gemini nanobanana generate --resolution=2k "your prompt"
gemini nanobanana generate --resolution=4k "your prompt"

# Edit existing image
gemini nanobanana edit --image=./path/to/image.png "editing instructions"

# Preview without saving
gemini nanobanana generate --preview "your prompt"
```

Output is automatically saved to `./nanobanana-output/` in the current working directory.

## Prompt Best Practices

Nano Banana understands intent, physics, and composition. Use natural language like briefing a human artist — not keyword lists.

**Good prompt structure:**
```
[Subject/Scene] + [Style/Mood] + [Lighting] + [Composition] + [Technical details]
```

**Examples for Tikkit app:**

Event cover images:
```
"A vibrant rooftop party in a modern city at golden hour, aerial perspective,
 warm amber and electric blue tones, cinematic lens flare, ultra realistic, 4K"
```

App UI background:
```
"Abstract dark gradient mesh background with subtle electric blue and gold
 particle effects, minimal, luxury tech aesthetic, 16:9 aspect ratio"
```

Ticket/pass art:
```
"Sleek holographic VIP event ticket, dark charcoal base with gold foil accents,
 subtle circuit board pattern, premium feel, flat lay photography"
```

Pass badge icons:
```
"Minimalist emoji-style badge icon for early bird event attendance,
 gradient gold and blue, on transparent background, 512x512"
```

## Slash Commands

| Command | Description |
|---------|-------------|
| `/generate [prompt]` | Generate image from text |
| `/edit [image] [instructions]` | Edit existing image |
| `/restore [image]` | Restore/repair damaged photo |
| `/icon [description]` | Generate app icon or favicon |
| `/diagram [description]` | Create flowchart or diagram |
| `/pattern [description]` | Generate seamless texture/pattern |
| `/story [description]` | Sequential narrative images |
| `/nanobanana` | Show all available commands |

## Output Management

- All generated images land in `./nanobanana-output/`
- Files named with timestamp: `nano_YYYYMMDD_HHMMSS.png`
- After generation, show the user the file path
- Suggest using the image in the project (e.g. as event cover, background)

## Integration with Tikkit

Common use cases for this project:
- **Event covers** — Generate fallback cover images when organizers haven't uploaded one
- **Hero banners** — Explore page featured event visuals
- **Pass badges** — Emoji-style achievement badges (🎫 🐦 👑 🌟 🔥 ⚡)
- **Background textures** — Subtle patterns for cards and modals
- **Email headers** — Promotional image assets for event emails
- **App store screenshots** — Marketing visuals for the mobile app launch
