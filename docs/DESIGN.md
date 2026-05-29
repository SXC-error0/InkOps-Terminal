# InkOps Terminal — Design System V2

## Visual Direction

**Professional dashboard aesthetic** — clean, data-dense, purposeful.
References: Linear.app, Vercel Dashboard, Stripe Dashboard.

Principles:
- Every element answers a question, not decorates
- Numbers are the hero — mono font, high contrast
- Actions are obvious — blue for primary, ghost for secondary
- Status is scannable — green/amber/red dots, not text
- Surfaces create hierarchy — raised cards vs flat backgrounds

Anti-patterns (AI slop — do not use):
- No gradients, no glass morphism, no excessive border-radius
- No purple-to-blue defaults, no animated backgrounds
- No gratuitous shadows on every element

## Color Palette

```
Background scale:
  --gray-50:  #f8fafc   Page background
  --gray-100: #f1f5f9   Card background alt
  --gray-200: #e2e8f0   Borders
  --gray-300: #cbd5e1   Border hover
  --gray-400: #94a3b8   Disabled text
  --gray-500: #64748b   Muted text
  --gray-700: #334155   Secondary text
  --gray-900: #0f172a   Primary text

Brand:
  --blue-50:  #eff6ff   Accent background
  --blue-500: #3b82f6   Primary action
  --blue-600: #2563eb   Primary hover

Semantic:
  --green-500: #22c55e  Success
  --amber-500: #f59e0b  Warning
  --red-500: #ef4444    Danger/Error

Sidebar:
  --slate-900: #0f172a  Sidebar background
  --slate-800: #1e293b  Sidebar hover
  --slate-700: #334155  Sidebar active
```

## Typography Scale

```
Font stacks:
  UI:   Inter, -apple-system, sans-serif
  Data: JetBrains Mono, Fira Code, monospace

Size scale:
  xs:   11px   Labels, badges, meta
  sm:   13px   Body, inputs, list items
  base: 14px   Card titles, navigation
  lg:   18px   Section headers
  xl:   24px   Page titles (rare)
  2xl:  32px   Metric values

Weight:
  400: Body
  500: Emphasis, buttons
  600: Headers, metric labels
  700: Metric values (mono only)
```

## Spacing Scale (4px grid)

```
1  = 4px    Tight internal padding
2  = 8px    Icon gaps, inline spacing
3  = 12px   Compact card padding
4  = 16px   Standard card padding
5  = 20px   Section gaps
6  = 24px   Card gaps
8  = 32px   Page padding
```

## Shadows

```
sm:   0 1px 2px rgba(0,0,0,0.04)       Subtle card
md:   0 1px 3px rgba(0,0,0,0.06),      Elevated card
      0 1px 2px rgba(0,0,0,0.04)
lg:   0 4px 6px rgba(0,0,0,0.05),      Modal/dropdown
      0 2px 4px rgba(0,0,0,0.04)
```

## Border Radius

```
sm:  4px    Inputs, badges, small buttons
md:  6px    Buttons, cards
lg:  8px    Large cards, modals
```

## Component Specs

### Card
- background: white
- border: 1px solid gray-200
- border-radius: lg (8px)
- shadow: sm
- padding: 16px (body), 14px 18px (header)
- header: bottom border 1px gray-100, 13px semibold gray-700

### Button / Primary
- background: blue-500
- color: white
- padding: 8px 16px
- radius: md (6px)
- hover: blue-600
- disabled: opacity 0.4

### Button / Secondary
- background: white
- border: 1px gray-200
- color: gray-700
- hover: bg gray-50, border gray-300

### Button / Ghost
- transparent, gray-500 text
- hover: bg gray-50, gray-700 text

### Input
- background: white, border gray-200
- padding: 8px 12px, radius sm
- focus: border blue-500, ring 3px blue-50
- placeholder: gray-400

### Badge
- padding: 2px 8px, radius 100px, 11px medium
- Colors: blue/amber/green/red/slate backgrounds

### Status Dot
- 7px circle, no border
- Green=healthy, Amber=warning, Red=error, Slate=offline

### Metric Card
- Large mono number (32px bold)
- Small label above (11px gray-500)
- Optional icon in colored box (32px, rounded 8px)
- Padding: 16px, min-height: 80px

## Page Layout

```
┌─ Sidebar (192px) ─┬─ Content Area ──────────────────────┐
│                    │  Status Bar (44px, white, border)   │
│  Logo              ├─────────────────────────────────────┤
│  Nav items         │                                     │
│  ─────────         │  Page Content (p-8 / 32px)          │
│  Device status     │  max-width: 960px, centered         │
│                    │                                     │
└────────────────────┴─────────────────────────────────────┘
```
