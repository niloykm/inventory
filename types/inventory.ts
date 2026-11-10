export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "discontinued";

export type MovementType = "adjustment" | "inbound" | "outbound" | "transfer" | "audit";

export type AdjustmentReason =
  | "Damaged"
  | "Stocktake Audit"
  | "Return"
  | "Purchase Order Received"
  | "Fulfillment"
  | "Write-off"
  | "Supplier RMA";

export interface WarehouseLocation {
  id: string;
  name: string;
  code: string;
  city: string;
  type: "hub" | "warehouse" | "fulfillment";
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  leadTimeDays: number;
  rating: number;
}

export interface InventoryItem {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  locationId: string;
  locationName: string;
  onHand: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  retailPrice: number;
  unit: string;
  status: StockStatus;
  lastAudited: string;
  updatedAt: string;
  supplierId: string;
  supplierName: string;
  velocityScore?: "high" | "moderate" | "low" | "zero";
}

export interface StockMovement {
  id: string;
  sku: string;
  itemName: string;
  type: MovementType;
  quantityDelta: number;
  reason: AdjustmentReason | string;
  operator: string;
  timestamp: string;
  location: string;
  reference?: string;
  previousQty?: number;
  newQty?: number;
}

export interface KPISummary {
  totalSkus: number;
  totalValuationBDT: number;
  valuationTrendPercent: number; // e.g. +3.4% WoW
  itemsBelowReorder: number;
  outOfStockCount: number;
  pendingInboundBatches: number;
  pendingInboundUnits: number;
  deadStockCount: number;
  deadStockCapitalBDT: number;
}
