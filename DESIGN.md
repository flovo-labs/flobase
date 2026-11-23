# Design System Tokens for Flobase

This document outlines the extracted design tokens defining the visual identity, typography, color architecture, and aesthetic guidelines across the Flobase ecosystem (Editor, CLI output, Documentation, and Branding).

---

## 1. Color Palette

Flobase utilizes an organic, high-contrast, technical dark/light palette defined by deep obsidian charcoals, crisp off-white tones, and an electric lime accent.

### Primary & Accent
- **Primary / Brand Lime**: `#b8f34a` (`var(--lime)`)
- **Lime Hover / Highlight**: `#c8fa67` (`var(--lime-hover)`)
- **Lime Muted**: `#8fca32` (`var(--lime-muted)`)
- **Lime Ink (on lime backgrounds)**: `#10120f` (`var(--lime-ink)`)
- **Success / Emerald**: `#86d9a0` (dark) / `#287d4a` (light)
- **Warning / Orange**: `#f97316` (muted: `#fdba74`, dark container: `#7c2d12`)
- **Error / Crimson**: `#ef4444` (badge: `#991b1b`, soft text: `#fca5a5`, container: `#450a0a`)

### Dark Mode (Primary Mode for Technical Tools)
- **Background (`--bg`)**: `#10120f` (Deep Obsidian / Forest Charcoal)
- **Surface Level 1 (`--surface`)**: `#151814` (Panels, Canvas Cards)
- **Surface Level 2 (`--surface-2`)**: `#1c221b` (Secondary cards, node bodies, subtle elevations)
- **Surface Level 3 (`--surface-3`)**: `#242c22` (Hover states, active elements, inputs)
- **Line / Border (`--line`)**: `#262f25` (Subtle boundary borders)
- **Line Highlight**: `#334131` (Interactive or focused borders)
- **Text Primary (`--text`)**: `#f4f5ef` (High-contrast, warm off-white)
- **Text Secondary (`--text-2`)**: `#9ba697` (Subheadings, field types, labels)
- **Text Muted (`--muted`)**: `#6f7a6b` (Placeholders, inactive indicators)

### Light Mode (Secondary / Documentation)
- **Background (`--bg`)**: `#f7f8f4`
- **Surface Level 1 (`--surface`)**: `#ffffff`
- **Surface Level 2 (`--surface-2`)**: `#eff1ea`
- **Surface Level 3 (`--surface-3`)**: `#e5e9df`
- **Line / Border (`--line`)**: `#e7e9e2`
- **Text Primary (`--text`)**: `#10120f`
- **Text Secondary (`--text-2`)**: `#62695e`
- **Text Muted (`--muted`)**: `#848e80`

---

## 2. Typography

- **Display & Headings**: `Manrope`, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
  - Weights: `600` (SemiBold), `700` (Bold), `800` (ExtraBold)
  - Letter spacing: `-0.02em` to `-0.01em` on headlines for modern density.
- **Body / Sans**: `Manrope`, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
  - Weights: `400` (Regular), `500` (Medium)
- **Monospace (Code, Types, Schema)**: `DM Mono`, "JetBrains Mono", Menlo, Consolas, monospace
  - Weights: `400` (Regular), `500` (Medium)

---

## 3. Shadows & Elevation

Flobase replaces harsh blur shadows with organic, deep ambient glows:
- **Shadow Sm**: `0 4px 16px rgba(0, 0, 0, 0.25)`
- **Shadow Regular**: `0 24px 80px rgba(0, 0, 0, 0.40)`
- **Shadow Lg / Floating**: `0 32px 90px rgba(0, 0, 0, 0.55)`
- **Node Focus Glow**: `0 0 0 1px #b8f34a, 0 12px 32px rgba(184, 243, 74, 0.12)`

---

## 4. Radii & Geometry

- **Containers & Major Panels**: `16px` to `24px`
- **Canvas Nodes & Cards**: `12px` to `16px`
- **Buttons, Badges & Inputs**: `6px` to `8px`
- **Pills / Micro Badges**: `9999px`
