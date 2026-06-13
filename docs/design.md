# Design System: PDF to JSON Processor

## 1. Visual Theme & Atmosphere
A vibrant, ethereal workspace combining a serene twilight-gradient sky with stylized landscape elements and modern glassmorphic overlays. The density is balanced (5), variance is offset (6), and motion is fluid (7). The atmosphere feels like a calm, highly-crafted cockpit for parsing technical data — contrasting the rigid, mechanical structure of JSON with an organic, visually expansive background.

## 2. Color Palette & Roles
- **Twilight Canvas (Background)** — Linear gradient from Deep Periwinkle (`#6D5CE6`) to Soft Coral (`#FFA0B4`).
- **Frosted Surface** (`rgba(255, 255, 255, 0.65)`) — Primary card and container fill. Requires `backdrop-blur-md` (or higher) to maintain text legibility over the gradient sky.
- **Charcoal Ink** (`#0F172A`) — Primary text, ensuring high contrast on the frosted glass surfaces.
- **Muted Steel** (`#475569`) — Secondary text, descriptions, metadata, and JSON keys.
- **Whisper Border** (`rgba(255, 255, 255, 0.4)`) — Card borders and 1px structural lines to define glass edges crisply.
- **Electric Ocean** (`#2563EB`) — Single accent color for primary CTAs (Upload, Download), active states, and focus rings.

## 3. Typography Rules
- **Display:** `Outfit` — Track-tight, controlled scale, weight-driven hierarchy. Used for the main application title and prominent empty state headlines.
- **Body:** `Satoshi` — Relaxed leading (1.6), 65ch max-width, neutral secondary color for instructions and modal text.
- **Mono:** `JetBrains Mono` — Crucial for the JSON viewer, metadata, file IDs, and line numbers. High legibility for data structures.
- **Banned:** `Inter`, generic system fonts, and any serif fonts (e.g., `Times New Roman`, `Georgia`). Dashboard and data tools must remain crisp and sans-serif.

## 4. Component Stylings
- **Split-Screen Panels (PDF & JSON):** Glassmorphic containers with generously rounded corners (`1.5rem` or `24px`). Diffused whisper shadow (`box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08)`).
- **Buttons:** Pill-shaped (fully rounded). Flat, no outer glow. Tactile `-1px` translate on active (click) state. Solid **Electric Ocean** fill for primary actions, frosted/outline for secondary actions.
- **Inputs/Upload Zone:** Dashed **Whisper Border** on resting state, transitioning to solid **Electric Ocean** on file drag-over. Label above, clear instruction inside.
- **Loaders:** Skeletal shimmer matching the exact layout dimensions of the JSON tree. No generic circular spinners.
- **Modals:** Deep glassmorphic overlay (`rgba(15, 23, 42, 0.4)` backdrop blur). The modal itself is a larger frosted surface centered on the screen.
- **Empty States:** Composed, illustrated compositions utilizing the retro-landscape/nature vibe — not just a "No data" text string.

## 5. Layout Principles
- **Grid-First Architecture:** The core workspace uses a strict CSS Grid split-screen (`1fr 1fr`). Left side for PDF rendering, right side for JSON syntax highlighting.
- **No Overlapping Elements:** Every element occupies its own clear spatial zone. The glass cards float above the background but never overlap each other.
- **Max-Width Containment:** The main application interface is contained within a `1440px` max-width, centered, allowing the background gradient and landscape to breathe on larger monitors.
- **Responsive Collapse:** Strict single-column collapse below `1024px`. PDF viewer stacks *above* the JSON viewer on mobile/tablet. No horizontal scroll allowed.

## 6. Motion & Interaction
- **Spring Physics:** Used for all interactive elements (modals, buttons, toast notifications) with `stiffness: 100, damping: 20` for a weighty, premium feel.
- **Staggered Cascade Reveals:** When multiple PDF-JSON rows are loaded from the queue, they animate in with a slight delay cascade.
- **Perpetual Micro-Interactions:** The upload zone has a subtle, infinite breathing animation (Pulse) to invite interaction.
- **Hardware Acceleration:** Animate exclusively via `transform` and `opacity`. Never animate `width` or `top`.

## 7. Anti-Patterns (Banned)
- No emojis anywhere in the UI.
- No `Inter` font.
- No pure black (`#000000`).
- No neon/outer glow shadows on buttons or text.
- No 3-column equal grids (use asymmetric or 2-column split).
- No AI copywriting clichés ("Elevate", "Seamless", "Unleash").
- No fake system/metric sections ("SYSTEM PERFORMANCE", "99.9% UPTIME") — this is a functional tool, not a marketing dashboard.
- No scroll arrows or bouncing chevrons.
- No generic serif fonts.
