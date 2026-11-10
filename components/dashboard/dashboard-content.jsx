"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  INITIAL_INVENTORY_ITEMS,
  INITIAL_MOVEMENTS,
  WAREHOUSE_LOCATIONS,
  SUPPLIERS,
  computeKPISummary,
} from "@/data/inventory";
import { OperationsHealthBar } from "@/components/dashboard/operations-health-bar";
import { InventoryLedger } from "@/components/dashboard/inventory-ledger";
import { WarehouseActivityStream } from "@/components/dashboard/warehouse-activity-stream";
import { AdjustStockModal } from "@/components/dashboard/adjust-stock-modal";
import { NewSkuModal } from "@/components/dashboard/new-sku-modal";
import { QuickSearchPalette } from "@/components/dashboard/quick-search-palette";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Download,
  Search,
  Building2,
  Package,
  Layers,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { DASHBOARD_ENDPOINTS } from "@/lib/config/api-endpoints";

export function DashboardContent() {
  const { user, token } = useAuth();

  // Primary interactive operational state
  const [items, setItems] = useState(INITIAL_INVENTORY_ITEMS);
  const [movements, setMovements] = useState(INITIAL_MOVEMENTS);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");

  // Modals state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState(null);
  const [isNewSkuModalOpen, setIsNewSkuModalOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Global Cmd/Ctrl + K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Try fetching API stats if authenticated, without blocking UX
  useEffect(() => {
    if (!token) return;

    async function syncBackendStats() {
      try {
        const response = await apiClient.get(DASHBOARD_ENDPOINTS.STATS, {}, token);
        if (response && response.success && response.data) {
          // If backend returns real items, we can merge or inspect them
          console.log("[Dashboard] Live stats synchronized:", response.data);
        }
      } catch (err) {
        console.warn("[Dashboard] Backend sync notice (using high-density local ledger):", err.message);
      }
    }

    syncBackendStats();
  }, [token]);

  // Compute live KPI metrics dynamically from active items
  const summary = useMemo(() => {
    const locationFiltered =
      selectedLocation === "all"
        ? items
        : items.filter((item) => item.locationId === selectedLocation);
    return computeKPISummary(locationFiltered);
  }, [items, selectedLocation]);

  // Handle stock adjustments with optimistic ledger insertion
  const handleStockAdjustment = useCallback(
    (itemId, delta, reason, reference, notes) => {
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id !== itemId) return item;

          const newOnHand = Math.max(0, item.onHand + delta);
          const newAvailable = Math.max(0, item.available + delta);
          let newStatus = item.status;
          if (newStatus !== "discontinued") {
            if (newOnHand === 0) newStatus = "out_of_stock";
            else if (newOnHand <= item.reorderPoint) newStatus = "low_stock";
            else newStatus = "in_stock";
          }

          return {
            ...item,
            onHand: newOnHand,
            available: newAvailable,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          };
        })
      );

      // Record movement entry in audit ledger stream
      const targetItem = items.find((i) => i.id === itemId);
      if (targetItem) {
        const newMovement = {
          id: `mov-${Date.now()}`,
          sku: targetItem.sku,
          itemName: targetItem.name,
          type: delta > 0 ? "inbound" : "adjustment",
          quantityDelta: delta,
          reason,
          operator: user?.username ? `${user.username} (${user.role || "Operator"})` : "T. Rahman (Lead Stockman)",
          timestamp: new Date().toISOString(),
          location: targetItem.locationName,
          reference: reference || `ADJ-${Math.floor(1000 + Math.random() * 9000)}`,
          previousQty: targetItem.onHand,
          newQty: Math.max(0, targetItem.onHand + delta),
        };
        setMovements((prev) => [newMovement, ...prev]);
      }
    },
    [items, user]
  );

  // Handle adding new SKU
  const handleAddNewSku = useCallback((newItem) => {
    setItems((prev) => [newItem, ...prev]);

    // Record initial inbound stock movement if initial stock > 0
    if (newItem.onHand > 0) {
      const initialMovement = {
        id: `mov-${Date.now()}`,
        sku: newItem.sku,
        itemName: newItem.name,
        type: "inbound",
        quantityDelta: newItem.onHand,
        reason: "Initial Master SKU Stock",
        operator: user?.username ? `${user.username} (${user.role})` : "System Master Data",
        timestamp: new Date().toISOString(),
        location: newItem.locationName,
        reference: `INIT-${newItem.sku}`,
        previousQty: 0,
        newQty: newItem.onHand,
      };
      setMovements((prev) => [initialMovement, ...prev]);
    }
  }, [user]);

  // Handle quick deletion from table
  const handleQuickDelete = useCallback((itemId) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  // Quick export all items to CSV
  const handleExportAllCsv = () => {
    const header = "SKU,Item Name,Category,Location,On Hand,Reserved,Available,Reorder Point,Unit Cost,Retail Price,Status\n";
    const rows = items
      .map(
        (i) =>
          `"${i.sku}","${i.name}","${i.category}","${i.locationName}",${i.onHand},${i.reserved},${i.available},${i.reorderPoint},${i.unitCost},${i.retailPrice},"${i.status}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `inventory-ledger-full-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported complete catalog (${items.length} SKUs) to CSV.`);
  };

  return (
    <div className="w-full space-y-4">
      {/* 1. Operations Command Bar: Location, Search, Fast Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Operations Command Center</span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                v2.5 Enterprise
              </span>
            </h1>
            <p className="text-xs text-zinc-500">
              High-density inventory ledger, stock threshold telemetry, and live movement stream
            </p>
          </div>
        </div>

        {/* Right side operational triggers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Warehouse Location Switcher */}
          <div className="w-[200px]">
            <Select
              value={selectedLocation}
              onValueChange={setSelectedLocation}
            >
              <SelectTrigger className="h-8 text-xs border-zinc-200 dark:border-zinc-800 font-medium">
                <Building2 className="h-3.5 w-3.5 text-zinc-400 mr-1.5 shrink-0" />
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent className="border-zinc-200 dark:border-zinc-800 text-xs">
                {WAREHOUSE_LOCATIONS.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id} className="text-xs">
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Search Palette Trigger Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaletteOpen(true)}
            className="h-8 px-2.5 text-xs text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <Search className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden md:inline">Quick Search</span>
            <kbd className="ml-2 hidden rounded bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 text-[10px] font-mono text-zinc-500 sm:inline-block">
              ⌘K
            </kbd>
          </Button>

          {/* Export Full CSV */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAllCsv}
            className="h-8 px-2.5 text-xs border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>

          {/* Add SKU Button */}
          <Button
            size="sm"
            onClick={() => setIsNewSkuModalOpen(true)}
            className="h-8 px-3 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New SKU
          </Button>
        </div>
      </div>

      {/* 2. Operations Health Bar (Above the fold) */}
      <OperationsHealthBar
        summary={summary}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* 3. Core Enterprise Split Workspace: Ledger + Activity Stream */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Left: High-Density Inventory Ledger (Workhorse) */}
        <div className="xl:col-span-8 flex flex-col">
          <InventoryLedger
            items={items}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            selectedLocation={selectedLocation}
            onOpenAdjust={(item) => {
              setSelectedItemForAdjust(item);
              setIsAdjustModalOpen(true);
            }}
            onQuickDelete={handleQuickDelete}
          />
        </div>

        {/* Right: Real-time Warehouse Movement Stream */}
        <div className="xl:col-span-4 flex flex-col">
          <WarehouseActivityStream
            movements={movements}
            onSelectSku={(sku) => {
              // Open quick adjust for that SKU
              const target = items.find((i) => i.sku === sku);
              if (target) {
                setSelectedItemForAdjust(target);
                setIsAdjustModalOpen(true);
              }
            }}
          />
        </div>
      </div>

      {/* Quick Action Modals */}
      <AdjustStockModal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setSelectedItemForAdjust(null);
        }}
        item={selectedItemForAdjust}
        onAdjust={handleStockAdjustment}
      />

      <NewSkuModal
        isOpen={isNewSkuModalOpen}
        onClose={() => setIsNewSkuModalOpen(false)}
        locations={WAREHOUSE_LOCATIONS}
        suppliers={SUPPLIERS}
        onAddSku={handleAddNewSku}
      />

      <QuickSearchPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        items={items}
        onSelectItem={(item) => {
          setSelectedItemForAdjust(item);
          setIsAdjustModalOpen(true);
        }}
      />
    </div>
  );
}
