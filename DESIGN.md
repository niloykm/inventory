# INVENTORY DASHBOARD DESIGN SYSTEM

## 1. Ergonomics & Density
- Palette: Clean, neutral operational dark canvas (`#09090b` zinc-950, `#18181b` zinc-900) or crisp enterprise light theme (`#ffffff`, `#f4f4f5` zinc-100).
- Borders: Structural 1px dividers (`border-zinc-200 dark:border-zinc-800`). Zero blurry AI glow effects or neon drop shadows.
- Surface Geometry: Compact radii (`rounded-md` 6px for buttons, inputs, and table shells). Never oversized `rounded-3xl` containers.
- Data Density: Compact table cell padding (`py-2.5 px-3.5`) designed for desktop operational efficiency.

## 2. Typography & Numerical Precision
- Monospace Primacy: All SKUs, barcodes, quantities, reorder thresholds, currency values (BDT / USD), and timestamps MUST use `font-mono tabular-nums`.
- Labels & Headers: Clear, concise table headers (`text-xs uppercase tracking-wider text-zinc-500 font-medium`).
- Status Tokens: High-contrast WCAG AA compliant badges with text + icon indicator (not bare color dots).

## 3. Keyboard & Micro-Interactions
- Focus rings: High-visibility focus indicators on all inputs (`focus-visible:ring-1 focus-visible:ring-zinc-400`).
- Instant row hover feedback (`hover:bg-zinc-800/50 dark:hover:bg-zinc-900/50`).
- Skeleton loaders for table rows and KPI cards during async data fetching.
