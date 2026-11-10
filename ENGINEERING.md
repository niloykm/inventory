# INVENTORY ENGINEERING RULES

- Strict TypeScript: Full type-safety across SKU, InventoryItem, StockMovement, Supplier, and StockStatus models. Zero `any`.
- Table State Management: Support URL search params for pagination, sorting (`sort=sku&order=asc`), and filtering so table states are shareable and preserve on refresh.
- Optimistic Updates: Instant UI feedback for stock increment/decrement actions with rollback on network failure.
- Zero Layout Shift: Explicit table container dimensions with fixed header scrolling (`sticky top-0`) when browsing large catalogs.
