"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useWarehouse } from "@/lib/warehouse-context";
import { useInventoryStore } from "@/lib/inventory-store";
import {
  WAREHOUSE_LOCATIONS,
  SUPPLIERS,
  computeKPISummary,
} from "@/data/inventory";
import { OperationsHealthBar } from "@/components/dashboard/operations-health-bar";
import { InventoryLedger } from "@/components/dashboard/inventory-ledger";
import { WarehouseActivityStream } from "@/components/dashboard/warehouse-activity-stream";
import { AdjustStockModal } from "@/components/dashboard/adjust-stock-modal";
import { TransferStockModal } from "@/components/dashboard/transfer-stock-modal";
import { CreatePoModal } from "@/components/dashboard/create-po-modal";
import { NewSkuModal } from "@/components/dashboard/new-sku-modal";
import { QuickSearchPalette } from "@/components/dashboard/quick-search-palette";
import { ScrollProgressBar } from "@/components/motion/scroll-progress-bar";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Download,
  Building2,
  Database,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { DASHBOARD_ENDPOINTS } from "@/lib/config/api-endpoints";

export function DashboardContent() {
  const { user, token, isAuthenticated } = useAuth();
  const { selectedLocation, activeWarehouse } = useWarehouse();
  const {
    items,
    movements,
    purchaseOrders,
    adjustStock,
    transferStock,
    createPurchaseOrder,
    receivePurchaseOrder,
    addSku,
    deleteSku,
    bulkReorder,
    resetDemoLedger,
  } = useInventoryStore();

  const [activeFilter, setActiveFilter] = useState("all");
  const [rightRailPanel, setRightRailPanel] = useState("activity");
  const [liveBackendStats, setLiveBackendStats] = useState(null);

  // Modals state
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState(null);
  const [selectedItemForTransfer, setSelectedItemForTransfer] = useState(null);
  const [selectedItemForPo, setSelectedItemForPo] = useState(null);
  const [isNewSkuModalOpen, setIsNewSkuModalOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const operatorLabel = user?.username
    ? `${user.username} (${user.role || "Operator"})`
    : "T. Rahman (Lead Stockman)";

  // Global Cmd/Ctrl + K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Synchronize live MongoDB backend telemetry when authenticated
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function syncBackendStats() {
      try {
        const response = await apiClient.get(
          DASHBOARD_ENDPOINTS.STATS,
          {},
          token
        );
        if (!cancelled && response?.success && response?.data) {
          setLiveBackendStats(response.data);
        }
      } catch {
        // Non-blocking fallback when offline or previewing
      }
    }

    syncBackendStats();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Compute live KPI metrics dynamically from single source of truth
  const summary = useMemo(() => {
    const locationFilteredItems =
      selectedLocation === "all"
        ? items
        : items.filter((item) => item.locationId === selectedLocation);
    const locationFilteredPos =
      selectedLocation === "all"
        ? purchaseOrders
        : purchaseOrders.filter((po) => po.locationId === selectedLocation);

    return computeKPISummary(locationFilteredItems, locationFilteredPos);
  }, [items, purchaseOrders, selectedLocation]);

  const handleExportAllCsv = () => {
    const exportItems =
      selectedLocation === "all"
        ? items
        : items.filter((i) => i.locationId === selectedLocation);
    const header =
      "SKU,Item Name,Category,Location,On Hand,Reserved,Available,Reorder Point,Unit Cost,Retail Price,Status\n";
    const rows = exportItems
      .map(
        (i) =>
          `"${i.sku}","${i.name}","${i.category}","${i.locationName}",${i.onHand},${i.reserved},${i.available},${i.reorderPoint},${i.unitCost},${i.retailPrice},"${i.status}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `inventory-ledger-${activeWarehouse.code.toLowerCase()}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(
      `Exported ${exportItems.length} SKU(s) for ${activeWarehouse.name} to CSV.`
    );
  };

  return (
    <div className="w-full space-y-4">
      <ScrollProgressBar />

      {/* 1. Operations Command Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Operations Command Center
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-mono font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700">
              <Building2 className="h-3 w-3 text-zinc-500" />
              {activeWarehouse.name}
            </span>
            {isAuthenticated && liveBackendStats && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-mono font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 tabular-nums">
                <Database className="h-3 w-3" />
                API Synced · {liveBackendStats.total_items} DB Items
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500">
            Multi-warehouse BDT inventory ledger, reorder urgency, inter-warehouse transfers, and PO replenishment
          </p>
        </div>

        {/* Fast Action Triggers */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              resetDemoLedger();
              toast.info("Restored baseline multi-warehouse inventory ledger.");
            }}
            title="Reset ledger demo data"
            className="h-8 px-2 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">Reset</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportAllCsv}
            className="h-8 px-2.5 text-xs border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsNewSkuModalOpen(true)}
            className="h-8 px-3 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New SKU
          </Button>
        </div>
      </div>

      {/* 2. Actionable Operations Health Bar */}
      <OperationsHealthBar
        summary={summary}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onOpenPendingPOs={() => setRightRailPanel("inbound")}
      />

      {/* 3. Core Enterprise Split Workspace: Ledger + Activity / Inbound POs */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8 flex flex-col min-w-0">
          <InventoryLedger
            items={items}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            selectedLocation={selectedLocation}
            onOpenAdjust={(item) => setSelectedItemForAdjust(item)}
            onOpenTransfer={(item) => setSelectedItemForTransfer(item)}
            onOpenCreatePo={(item) => setSelectedItemForPo(item)}
            onBulkReorder={(ids) => {
              const created = bulkReorder(ids, operatorLabel);
              if (created > 0) setRightRailPanel("inbound");
              return created;
            }}
            onQuickDelete={deleteSku}
          />
        </div>

        <div className="xl:col-span-4 flex flex-col min-w-0">
          <WarehouseActivityStream
            movements={movements}
            purchaseOrders={purchaseOrders}
            activePanel={rightRailPanel}
            onPanelChange={setRightRailPanel}
            onSelectSku={(sku) => {
              const target = items.find((i) => i.sku === sku);
              if (target) setSelectedItemForAdjust(target);
            }}
            onReceivePo={(poId) => receivePurchaseOrder(poId, operatorLabel)}
          />
        </div>
      </div>

      {/* 4. Actionable ERP Modals & Command Palette */}
      <AdjustStockModal
        isOpen={Boolean(selectedItemForAdjust)}
        onClose={() => setSelectedItemForAdjust(null)}
        item={selectedItemForAdjust}
        onAdjust={(itemId, delta, reason, reference, note) =>
          adjustStock(itemId, delta, reason, reference, note, operatorLabel)
        }
      />

      <TransferStockModal
        isOpen={Boolean(selectedItemForTransfer)}
        onClose={() => setSelectedItemForTransfer(null)}
        item={selectedItemForTransfer}
        locations={WAREHOUSE_LOCATIONS}
        onTransfer={(itemId, targetLocId, qty, ref, note) =>
          transferStock(itemId, targetLocId, qty, ref, note, operatorLabel)
        }
      />

      <CreatePoModal
        isOpen={Boolean(selectedItemForPo)}
        onClose={() => setSelectedItemForPo(null)}
        item={selectedItemForPo}
        suppliers={SUPPLIERS}
        onCreatePo={(params) => {
          const po = createPurchaseOrder({
            ...params,
            operator: operatorLabel,
          });
          setRightRailPanel("inbound");
          return po;
        }}
      />

      <NewSkuModal
        isOpen={isNewSkuModalOpen}
        onClose={() => setIsNewSkuModalOpen(false)}
        locations={WAREHOUSE_LOCATIONS}
        suppliers={SUPPLIERS}
        onAddSku={(newItem) => addSku(newItem, operatorLabel)}
      />

      <QuickSearchPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        items={items}
        onSelectItem={(item) => setSelectedItemForAdjust(item)}
      />
    </div>
  );
}
