"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  StockMovement,
  MovementType,
  PurchaseOrderDraft,
} from "@/types/inventory";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  User,
  Truck,
  PackageCheck,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";

interface WarehouseActivityStreamProps {
  movements: StockMovement[];
  purchaseOrders: PurchaseOrderDraft[];
  activePanel?: "activity" | "inbound";
  onPanelChange?: (panel: "activity" | "inbound") => void;
  onSelectSku?: (sku: string) => void;
  onReceivePo?: (poId: string) => void;
}

const STREAM_FILTERS = [
  { id: "all", label: "All" },
  { id: "inbound", label: "Inbound" },
  { id: "transfer", label: "Transfers" },
  { id: "adjustment", label: "Audits" },
];

export function WarehouseActivityStream({
  movements,
  purchaseOrders,
  activePanel = "activity",
  onPanelChange,
  onSelectSku,
  onReceivePo,
}: WarehouseActivityStreamProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [internalPanel, setInternalPanel] = useState<"activity" | "inbound">(
    activePanel
  );

  const currentPanel = onPanelChange ? activePanel : internalPanel;
  const setPanel = (panel: "activity" | "inbound") => {
    setInternalPanel(panel);
    onPanelChange?.(panel);
  };

  const openPOs = purchaseOrders.filter((po) => po.status !== "received");

  const filteredMovements = movements.filter((m) => {
    if (filterType === "all") return true;
    if (filterType === "inbound") return m.type === "inbound";
    if (filterType === "transfer") return m.type === "transfer";
    if (filterType === "adjustment")
      return m.type === "adjustment" || m.type === "audit";
    return true;
  });

  // Deterministic Asia/Dhaka formatting prevents SSR/Client hydration mismatch (#418)
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("en-BD", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Dhaka",
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const renderMovementIcon = (type: MovementType) => {
    switch (type) {
      case "inbound":
        return (
          <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        );
      case "outbound":
        return (
          <ArrowUpRight className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        );
      case "transfer":
        return (
          <Truck className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" />
        );
      case "adjustment":
      case "audit":
        return (
          <RefreshCw className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        );
      default:
        return <Activity className="h-3.5 w-3.5 text-zinc-500" />;
    }
  };

  return (
    <section
      aria-label="Warehouse activity and inbound purchase orders"
      className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs flex flex-col h-full"
    >
      {/* Top Panel Mode Switcher */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shrink-0">
              {currentPanel === "activity" ? (
                <Activity className="h-3.5 w-3.5" />
              ) : (
                <ShoppingCart className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {currentPanel === "activity"
                  ? "Warehouse Activity Stream"
                  : "Pending Inbound Batches"}
              </h2>
              <p className="text-[11px] text-zinc-500 truncate">
                {currentPanel === "activity"
                  ? "Immutable balance audit log (BST)"
                  : "Receive supplier POs into warehouse stock"}
              </p>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Right rail view switcher"
            className="inline-flex rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-0.5 text-[11px] shrink-0"
          >
            <button
              role="tab"
              type="button"
              aria-selected={currentPanel === "activity"}
              onClick={() => setPanel("activity")}
              className={`relative px-2 py-0.5 rounded font-medium cursor-pointer transition-colors ${
                currentPanel === "activity"
                  ? "text-zinc-900 dark:text-zinc-50 font-semibold"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {currentPanel === "activity" && (
                <motion.span
                  layoutId="stream-panel-tab"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded bg-white dark:bg-zinc-800 shadow-xs border border-zinc-200/80 dark:border-zinc-700"
                />
              )}
              <span className="relative z-10">Ledger</span>
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={currentPanel === "inbound"}
              onClick={() => setPanel("inbound")}
              className={`relative px-2 py-0.5 rounded font-medium cursor-pointer transition-colors ${
                currentPanel === "inbound"
                  ? "text-zinc-900 dark:text-zinc-50 font-semibold"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {currentPanel === "inbound" && (
                <motion.span
                  layoutId="stream-panel-tab"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded bg-white dark:bg-zinc-800 shadow-xs border border-zinc-200/80 dark:border-zinc-700"
                />
              )}
              <span className="relative z-10 font-mono tabular-nums">
                POs ({openPOs.length})
              </span>
            </button>
          </div>
        </div>

        {/* Sub-filters when viewing Activity Ledger */}
        {currentPanel === "activity" && (
          <div
            role="tablist"
            aria-label="Filter movement type"
            className="flex items-center gap-1 text-[11px]"
          >
            {STREAM_FILTERS.map((f) => {
              const isActive = filterType === f.id;
              return (
                <button
                  key={f.id}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  onClick={() => setFilterType(f.id)}
                  className={`relative px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    isActive
                      ? "text-white dark:text-zinc-900 font-semibold"
                      : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activity-subfilter-pill"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      className="absolute inset-0 rounded bg-zinc-900 dark:bg-zinc-100"
                    />
                  )}
                  <span className="relative z-10">{f.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Animated Panel Body */}
      <AnimatePresence mode="wait">
        {currentPanel === "activity" ? (
          <motion.div
            key={`activity-${filterType}`}
            initial={{ opacity: 0.4, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0.4, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="divide-y divide-zinc-100 dark:divide-zinc-800/80 overflow-y-auto max-h-[540px]"
          >
            {filteredMovements.map((mov) => {
              const isPositive = mov.quantityDelta > 0;
              return (
                <div
                  key={mov.id}
                  className="p-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors flex items-start gap-2.5 text-xs"
                >
                  <div className="mt-0.5 p-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0">
                    {renderMovementIcon(mov.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => onSelectSku && onSelectSku(mov.sku)}
                          className="font-mono font-bold text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer shrink-0"
                        >
                          {mov.sku}
                        </button>
                        <span className="text-zinc-300 dark:text-zinc-700">·</span>
                        <span className="text-zinc-600 dark:text-zinc-400 text-[11px] truncate">
                          {mov.reason}
                        </span>
                      </div>

                      <span
                        className={`font-mono text-xs font-bold tabular-nums px-1.5 py-0.5 rounded shrink-0 ${
                          isPositive
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50"
                            : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50"
                        }`}
                      >
                        {isPositive ? `+${mov.quantityDelta}` : mov.quantityDelta}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                      {mov.itemName}
                    </p>

                    <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-500 font-mono tabular-nums pt-0.5">
                      <span className="flex items-center gap-1 truncate">
                        <User className="h-3 w-3 text-zinc-400 shrink-0" />
                        <span className="truncate">{mov.operator}</span>
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {mov.reference && (
                          <span className="px-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {mov.reference}
                          </span>
                        )}
                        <span>{formatTime(mov.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredMovements.length === 0 && (
              <div className="py-10 text-center text-xs text-zinc-500">
                No activity entries matching this filter.
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="inbound-pos"
            initial={{ opacity: 0.4, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0.4, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="divide-y divide-zinc-100 dark:divide-zinc-800/80 overflow-y-auto max-h-[540px]"
          >
            {openPOs.map((po) => (
              <div
                key={po.id}
                className="p-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {po.poNumber}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                    <span className="font-mono text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                      {po.sku}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold tabular-nums px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50 shrink-0">
                    +{po.quantity} {po.unit}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                  {po.itemName}
                </p>

                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-zinc-500 tabular-nums">
                  <span className="truncate">{po.supplierName}</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 shrink-0">
                    BDT {po.totalCostBDT.toLocaleString("en-BD")}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="font-mono text-[10px] text-zinc-500">
                    ETA: {po.expectedDate} · {po.locationName.split("(")[0].trim()}
                  </span>
                  {onReceivePo && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onReceivePo(po.id);
                        toast.success(
                          `Received ${po.poNumber}: +${po.quantity} ${po.unit} added to ${po.sku}`
                        );
                      }}
                      className="h-6 px-2 text-[11px] font-semibold border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 cursor-pointer"
                    >
                      <PackageCheck className="h-3 w-3 mr-1" />
                      Receive Batch
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {openPOs.length === 0 && (
              <div className="py-10 px-4 text-center text-xs text-zinc-500">
                All purchase orders have been received. Click <strong>PO</strong> on any low-stock SKU to issue a new replenishment batch.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
