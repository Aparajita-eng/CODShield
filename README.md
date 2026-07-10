# CODShield Design System

> Premium enterprise design system for cybersecurity & fintech SaaS.
> Inspired by **Stripe · Linear · Vercel · Ramp · Cloudflare**

---

## Overview

CODShield Design System is a complete, production-ready Tailwind CSS design system built for enterprise-grade cybersecurity and fintech products. It prioritizes clarity, trust, and premium aesthetics — without AI-generated clichés like neon gradients, glassmorphism blobs, or purple noise backgrounds.

---

## Files

| File | Description |
|------|-------------|
| `tailwind.config.js` | Full Tailwind theme extension — all color, spacing, typography, shadow, animation tokens |
| `components.css` | `@apply` component classes for every UI pattern |
| `design-system.html` | Interactive reference — open in browser, no build step needed |

---

## Color Palette

| Role | Token | Value |
|------|-------|-------|
| Background | `surface.base` | `#FFFFFF` |
| Secondary BG | `surface.subtle` | `#F8F9FB` |
| Primary Text | `text.primary` | `#111827` |
| Secondary Text | `text.secondary` | `#4B5563` |
| Borders | `border` | `#E5E7EB` |
| **Brand (Navy)** | `navy.900` | `#0F172A` |
| **Accent (Emerald)** | `emerald.600` | `#059669` |
| Danger | `danger` | `#DC2626` |
| Warning | `warning` | `#F59E0B` |
| Success | `success` | `#16A34A` |

---

## Typography

- **UI Font**: [Inter](https://fonts.google.com/specimen/Inter)
- **Code/Data Font**: [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)

| Level | Size | Weight |
|-------|------|--------|
| Hero | 56px | 800 |
| Section | 40px | 700 |
| Body | 18px | 400 |

---

## Design Principles

- ✅ Generous whitespace — 8-pt grid throughout
- ✅ `12px` border radius on all cards and panels
- ✅ Very subtle shadows — max `0.10` opacity
- ✅ Fade-only animations — 150–300ms, no bounce
- ❌ No purple gradients
- ❌ No neon colors
- ❌ No glassmorphism cards
- ❌ No decorative blobs

---

## Quick Start

1. Copy `tailwind.config.js` into your project root
2. Import `components.css` into your main stylesheet
3. Open `design-system.html` in a browser for a live reference of all components

```html
<!-- Example button usage -->
<button class="btn-primary">Activate Shield</button>
<button class="btn-accent">View Dashboard</button>
<button class="btn-secondary">Cancel</button>
```

---

## Component Coverage

- **Buttons** — Primary, Accent, Secondary, Ghost, Danger, 5 sizes, icon variants
- **Forms** — Input, Select, Textarea, Toggle, Checkbox, error/focus states
- **Cards** — Base, Interactive, Subtle, Dark (filled), Stat tiles with deltas
- **Badges & Pills** — 7 semantic variants, count badges, status dots
- **Navigation** — Top navbar, sidebar nav, tabs, pill tabs
- **Tables** — Full data table with sortable headers, row hover
- **Feedback** — Alerts (4 types), Toasts (4 types), Progress bars, Skeletons
- **Overlays** — Modal, Dropdown, Tooltip
- **Security UI** — Risk score rings, shield status pills, live activity feed

---

## License

MIT © CODShield
