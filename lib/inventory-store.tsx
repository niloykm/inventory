"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  InventoryItem,
  StockMovement,
  PurchaseOrderDraft,
} from "@/types/inventory";
import {
  INITIAL_INVENTORY_ITEMS,
  INITIAL_MOVEMENTS,
  INITIAL_PURCHASE_ORDERS,
  WAREHOUSE_LOCATIONS,
  SUPPLIERS,
  deriveItemIntegrity,
} from "@/data/inventory";

const STORAGE_KEY = "niloy_inventory_erp_ledger_v2";

interface PersistedState {
  items: InventoryItem[];
  movements: StockMovement[];
  purchaseOrders: PurchaseOrderDraft[];
}

interface TransferResult {
  success: boolean;
  reference: string;
  sourceRemaining: number;
  targetLocationName: string;
}

interface InventoryStoreValue {
  items: InventoryItem[];
  movements: StockMovement[];
  purchaseOrders: PurchaseOrderDraft[];
  hydrated: boolean;
  adjustStock: (
    itemId: string,
    delta: number,
    reason: string,
    reference?: string,
    note?: string,
    operator?: string
  ) => void;
  transferStock: (
    itemId: string,
    targetLocationId: string,
    quantity: number,
    reference?: string,
    note?: string,
    operator?: string
  ) => TransferResult;
  createPurchaseOrder: (params: {
    itemId: string;
    quantity: number;
    supplierId: string;
    expectedDate: string;
    notes?: string;
    operator?: string;
  }) => PurchaseOrderDraft;
  receivePurchaseOrder: (poId: string, operator?: string) => void;
  addSku: (newItem: InventoryItem, operator?: string) => void;
  deleteSku: (itemId: string) => void;
  bulkReorder: (itemIds: string[], operator?: string) => number;
  resetDemoLedger: () => void;
}

const InventoryStoreContext = createContext<InventoryStoreValue | undefined>(
  undefined
);

export function InventoryStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<InventoryItem[]>(() =>
    INITIAL_INVENTORY_ITEMS.map(deriveItemIntegrity)
  );
  const [movements, setMovements] = useState<StockMovement[]>(INITIAL_MOVEMENTS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDraft[]>(
    INITIAL_PURCHASE_ORDERS
  );
  const [hydrated, setHydrated] = useState(false);

  // Hydrate persisted mutations from localStorage after mount (zero SSR mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Partial<PersistedState> = JSON.parse(raw);
        if (Array.isArray(parsed.items) && parsed.items.length > 0) {
          setItems(parsed.items.map(deriveItemIntegrity));
        }
        if (Array.isArray(parsed.movements)) {
          setMovements(parsed.movements);
        }
        if (Array.isArray(parsed.purchaseOrders)) {
          setPurchaseOrders(parsed.purchaseOrders);
        }
      }
    } catch {
      // Ignore corrupt localStorage and continue with canonical seed
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist mutations cleanly once hydrated
  useEffect(() => {
    if (!hydrated) return;
    try {
      const payload: PersistedState = { items, movements, purchaseOrders };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota errors
    }
  }, [items, movements, purchaseOrders, hydrated]);

  const adjustStock = useCallback(
    (
      itemId: string,
      delta: number,
      reason: string,
      reference?: string,
      _note?: string,
      operator = "T. Rahman (Lead Stockman)"
    ) => {
      const targetItem = items.find((i) => i.id === itemId);
      if (!targetItem) return;

      const previousQty = targetItem.onHand;
      const nextOnHand = Math.max(0, previousQty + delta);

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          return deriveItemIntegrity({
            ...item,
            onHand: nextOnHand,
            updatedAt: new Date().toISOString(),
          });
        })
      );

      const newMovement: StockMovement = {
        id: `mov-${Date.now()}`,
        sku: targetItem.sku,
        itemName: targetItem.name,
        type: delta > 0 ? "inbound" : "adjustment",
        quantityDelta: delta,
        reason,
        operator,
        timestamp: new Date().toISOString(),
        location: targetItem.locationName,
        reference:
          reference?.trim() ||
          `ADJ-${Math.floor(1000 + Math.random() * 9000)}`,
        previousQty,
        newQty: nextOnHand,
      };
      setMovements((prev) => [newMovement, ...prev]);
    },
    [items]
  );

  const transferStock = useCallback(
    (
      itemId: string,
      targetLocationId: string,
      quantity: number,
      reference?: string,
      _note?: string,
      operator = "S. Hossain (Operations Lead)"
    ): TransferResult => {
      const sourceItem = items.find((i) => i.id === itemId);
      const targetLoc = WAREHOUSE_LOCATIONS.find(
        (l) => l.id === targetLocationId && l.id !== "all"
      );

      if (!sourceItem || !targetLoc) {
        throw new Error("Invalid source SKU or destination warehouse.");
      }
      if (sourceItem.locationId === targetLoc.id) {
        throw new Error("Destination warehouse must differ from source warehouse.");
      }
      if (quantity <= 0 || quantity > sourceItem.available) {
        throw new Error(
          `Transfer quantity must be between 1 and ${sourceItem.available} available ${sourceItem.unit}.`
        );
      }

      const refCode =
        reference?.trim() ||
        `TRF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const nowIso = new Date().toISOString();
      const sourceRemaining = sourceItem.onHand - quantity;

      setItems((prev) => {
        const existingTarget = prev.find(
          (i) => i.sku === sourceItem.sku && i.locationId === targetLoc.id
        );

        const updated = prev.map((item) => {
          if (item.id === sourceItem.id) {
            return deriveItemIntegrity({
              ...item,
              onHand: Math.max(0, item.onHand - quantity),
              updatedAt: nowIso,
            });
          }
          if (existingTarget && item.id === existingTarget.id) {
            return deriveItemIntegrity({
              ...item,
              onHand: item.onHand + quantity,
              updatedAt: nowIso,
            });
          }
          return item;
        });

        if (!existingTarget) {
          const destRecord: InventoryItem = deriveItemIntegrity({
            ...sourceItem,
            id: `item-${Date.now()}`,
            locationId: targetLoc.id,
            locationName: targetLoc.name,
            onHand: quantity,
            reserved: 0,
            available: quantity,
            updatedAt: nowIso,
            lastAudited: nowIso,
          });
          return [destRecord, ...updated];
        }

        return updated;
      });

      const outMovement: StockMovement = {
        id: `mov-trf-out-${Date.now()}`,
        sku: sourceItem.sku,
        itemName: `${sourceItem.name} → ${targetLoc.code}`,
        type: "transfer",
        quantityDelta: -quantity,
        reason: `Transfer to ${targetLoc.name}`,
        operator,
        timestamp: nowIso,
        location: sourceItem.locationName,
        reference: refCode,
        previousQty: sourceItem.onHand,
        newQty: sourceRemaining,
      };

      const inMovement: StockMovement = {
        id: `mov-trf-in-${Date.now() + 1}`,
        sku: sourceItem.sku,
        itemName: `${sourceItem.name} ← ${sourceItem.locationName.split("(")[0].trim()}`,
        type: "transfer",
        quantityDelta: quantity,
        reason: `Received from ${sourceItem.locationName}`,
        operator,
        timestamp: nowIso,
        location: targetLoc.name,
        reference: refCode,
      };

      setMovements((prev) => [inMovement, outMovement, ...prev]);

      return {
        success: true,
        reference: refCode,
        sourceRemaining,
        targetLocationName: targetLoc.name,
      };
    },
    [items]
  );

  const createPurchaseOrder = useCallback(
    ({
      itemId,
      quantity,
      supplierId,
      expectedDate,
      notes,
      operator = "S. Hossain (Operations Lead)",
    }: {
      itemId: string;
      quantity: number;
      supplierId: string;
      expectedDate: string;
      notes?: string;
      operator?: string;
    }): PurchaseOrderDraft => {
      const targetItem = items.find((i) => i.id === itemId);
      if (!targetItem) {
        throw new Error("Target SKU not found.");
      }
      const supplier =
        SUPPLIERS.find((s) => s.id === supplierId) || SUPPLIERS[0];
      const safeQty = Math.max(1, Math.floor(quantity));
      const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(
        200 + Math.random() * 799
      )}`;
      const nowIso = new Date().toISOString();

      const draft: PurchaseOrderDraft = {
        id: `po-${Date.now()}`,
        poNumber,
        itemId: targetItem.id,
        sku: targetItem.sku,
        itemName: targetItem.name,
        supplierId: supplier.id,
        supplierName: supplier.name,
        locationId: targetItem.locationId,
        locationName: targetItem.locationName,
        quantity: safeQty,
        unit: targetItem.unit,
        unitCost: targetItem.unitCost,
        totalCostBDT: safeQty * targetItem.unitCost,
        expectedDate,
        status: "ordered",
        notes: notes?.trim(),
        createdAt: nowIso,
        createdBy: operator,
      };

      setPurchaseOrders((prev) => [draft, ...prev]);

      const movement: StockMovement = {
        id: `mov-po-${Date.now()}`,
        sku: targetItem.sku,
        itemName: targetItem.name,
        type: "audit",
        quantityDelta: safeQty,
        reason: `PO Issued (${supplier.name})`,
        operator,
        timestamp: nowIso,
        location: targetItem.locationName,
        reference: poNumber,
      };
      setMovements((prev) => [movement, ...prev]);

      return draft;
    },
    [items]
  );

  const receivePurchaseOrder = useCallback(
    (poId: string, operator = "Tareq Rahman (Lead Stockman)") => {
      const po = purchaseOrders.find((p) => p.id === poId);
      if (!po || po.status === "received") return;

      const nowIso = new Date().toISOString();

      setPurchaseOrders((prev) =>
        prev.map((p) => (p.id === poId ? { ...p, status: "received" } : p))
      );

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== po.itemId && item.sku !== po.sku) return item;
          return deriveItemIntegrity({
            ...item,
            onHand: item.onHand + po.quantity,
            updatedAt: nowIso,
          });
        })
      );

      const movement: StockMovement = {
        id: `mov-rcv-${Date.now()}`,
        sku: po.sku,
        itemName: po.itemName,
        type: "inbound",
        quantityDelta: po.quantity,
        reason: "Purchase Order Received",
        operator,
        timestamp: nowIso,
        location: po.locationName,
        reference: po.poNumber,
      };
      setMovements((prev) => [movement, ...prev]);
    },
    [purchaseOrders]
  );

  const addSku = useCallback(
    (newItem: InventoryItem, operator = "System Master Data") => {
      const normalized = deriveItemIntegrity(newItem);
      setItems((prev) => [normalized, ...prev]);

      if (normalized.onHand > 0) {
        const movement: StockMovement = {
          id: `mov-init-${Date.now()}`,
          sku: normalized.sku,
          itemName: normalized.name,
          type: "inbound",
          quantityDelta: normalized.onHand,
          reason: "Initial Master SKU Stock",
          operator,
          timestamp: new Date().toISOString(),
          location: normalized.locationName,
          reference: `INIT-${normalized.sku}`,
          previousQty: 0,
          newQty: normalized.onHand,
        };
        setMovements((prev) => [movement, ...prev]);
      }
    },
    []
  );

  const deleteSku = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const bulkReorder = useCallback(
    (itemIds: string[], operator = "S. Hossain (Operations Lead)"): number => {
      const targets = items.filter(
        (i) => itemIds.includes(i.id) && i.status !== "discontinued"
      );
      const nowIso = new Date().toISOString();
      const expected = new Date(Date.now() + 5 * 86400000)
        .toISOString()
        .slice(0, 10);

      const newPos: PurchaseOrderDraft[] = targets.map((item, idx) => {
        const qty = Math.max(item.reorderQuantity || item.reorderPoint * 2, 20);
        return {
          id: `po-bulk-${Date.now()}-${idx}`,
          poNumber: `PO-${new Date().getFullYear()}-${Math.floor(
            300 + Math.random() * 699
          )}`,
          itemId: item.id,
          sku: item.sku,
          itemName: item.name,
          supplierId: item.supplierId,
          supplierName: item.supplierName,
          locationId: item.locationId,
          locationName: item.locationName,
          quantity: qty,
          unit: item.unit,
          unitCost: item.unitCost,
          totalCostBDT: qty * item.unitCost,
          expectedDate: expected,
          status: "ordered",
          notes: "Bulk replenishment dispatch",
          createdAt: nowIso,
          createdBy: operator,
        };
      });

      if (newPos.length > 0) {
        setPurchaseOrders((prev) => [...newPos, ...prev]);
        const newMovs: StockMovement[] = newPos.map((po, idx) => ({
          id: `mov-bulk-po-${Date.now()}-${idx}`,
          sku: po.sku,
          itemName: po.itemName,
          type: "audit",
          quantityDelta: po.quantity,
          reason: `Bulk PO Issued (${po.supplierName})`,
          operator,
          timestamp: nowIso,
          location: po.locationName,
          reference: po.poNumber,
        }));
        setMovements((prev) => [...newMovs, ...prev]);
      }

      return newPos.length;
    },
    [items]
  );

  const resetDemoLedger = useCallback(() => {
    setItems(INITIAL_INVENTORY_ITEMS.map(deriveItemIntegrity));
    setMovements(INITIAL_MOVEMENTS);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <InventoryStoreContext.Provider
      value={{
        items,
        movements,
        purchaseOrders,
        hydrated,
        adjustStock,
        transferStock,
        createPurchaseOrder,
        receivePurchaseOrder,
        addSku,
        deleteSku,
        bulkReorder,
        resetDemoLedger,
      }}
    >
      {children}
    </InventoryStoreContext.Provider>
  );
}

export function useInventoryStore(): InventoryStoreValue {
  const ctx = useContext(InventoryStoreContext);
  if (!ctx) {
    throw new Error(
      "useInventoryStore must be used within InventoryStoreProvider"
    );
  }
  return ctx;
}
