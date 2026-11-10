"use client";

import React from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Package,
  Truck,
  Ban,
  Clock,
  ChevronRight,
} from "lucide-react";
import { KPISummary } from "@/types/inventory";

interface OperationsHealthBarProps {
  summary: KPISummary;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function OperationsHealthBar({
  summary,
  activeFilter,
  onFilterChange,
}: OperationsHealthBarProps) {
  const formattedValuation = new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(summary.totalValuationBDT);

  const formattedDeadStockCapital = new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(summary.deadStockCapitalBDT);

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-xs">
      {/* Top Banner / Operational Metric Strip */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Asset Valuation & Total Catalog */}
        <div className="flex flex-col justify-between rounded-md border border-zinc-100 dark:border-zinc-900 bg-zinc-50/60 dark:bg-zinc-900/40 p-3.5">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <span>Inventory Valuation</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
              <TrendingUp className="h-3 w-3" />
              +{summary.valuationTrendPercent}% WoW
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
              {formattedValuation}
            </span>
            <span className="font-mono text-xs text-zinc-500 tabular-nums">
              {summary.totalSkus} Active SKUs
            </span>
          </div>
        </div>

        {/* KPI 2: Actionable Critical Stock Alert Pill */}
        <button
          type="button"
          onClick={() =>
            onFilterChange(activeFilter === "low_stock" ? "all" : "low_stock")
          }
          className={`flex flex-col justify-between text-left rounded-md border p-3.5 transition-all cursor-pointer ${
            activeFilter === "low_stock"
              ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 ring-1 ring-amber-500/30"
              : "border-amber-200/80 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 hover:border-amber-400 dark:hover:border-amber-800"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <span className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Reorder Threshold
            </span>
            <span className="font-mono text-[11px] bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded text-amber-800 dark:text-amber-300">
              Action Req.
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold tracking-tight text-amber-800 dark:text-amber-200 tabular-nums">
              {summary.itemsBelowReorder}
            </span>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-0.5">
              items below reorder point
              <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </button>

        {/* KPI 3: Out of Stock & Zero Stockout Risk */}
        <button
          type="button"
          onClick={() =>
            onFilterChange(activeFilter === "out_of_stock" ? "all" : "out_of_stock")
          }
          className={`flex flex-col justify-between text-left rounded-md border p-3.5 transition-all cursor-pointer ${
            activeFilter === "out_of_stock"
              ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 ring-1 ring-rose-500/30"
              : "border-rose-200/80 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/10 hover:border-rose-400 dark:hover:border-rose-800"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-rose-700 dark:text-rose-400">
            <span className="flex items-center gap-1.5 font-semibold">
              <Ban className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              Stockouts
            </span>
            <span className="font-mono text-[11px] bg-rose-100 dark:bg-rose-900/50 px-1.5 py-0.5 rounded text-rose-800 dark:text-rose-300">
              Critical
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold tracking-tight text-rose-800 dark:text-rose-200 tabular-nums">
              {summary.outOfStockCount}
            </span>
            <span className="text-xs font-medium text-rose-700 dark:text-rose-400 flex items-center gap-0.5">
              zero stock items
              <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </button>

        {/* KPI 4: Inbound Batches & Dead Stock Capital */}
        <div className="flex flex-col justify-between rounded-md border border-zinc-100 dark:border-zinc-900 bg-zinc-50/60 dark:bg-zinc-900/40 p-3.5">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-blue-500" />
              Pending Inbound
            </span>
            <span className="font-mono text-[11px] text-zinc-500">
              {summary.pendingInboundBatches} PO Batches
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
              +{summary.pendingInboundUnits}{" "}
              <span className="text-xs font-normal text-zinc-500">units</span>
            </span>
            <div className="text-right">
              <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">
                Stalled Capital
              </span>
              <span className="font-mono text-xs font-medium text-zinc-700 dark:text-zinc-300 tabular-nums">
                {formattedDeadStockCapital}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Filter Shortcut Strip */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800/80 pt-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            Quick Filter:
          </span>
          <button
            type="button"
            onClick={() => onFilterChange("all")}
            className={`rounded px-2 py-0.5 font-medium transition-colors cursor-pointer ${
              activeFilter === "all"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            All Ledger ({summary.totalSkus})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("low_stock")}
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium transition-colors cursor-pointer ${
              activeFilter === "low_stock"
                ? "bg-amber-600 text-white"
                : "text-amber-700 hover:bg-amber-100/60 dark:text-amber-400 dark:hover:bg-amber-950/40"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Below Reorder Point ({summary.itemsBelowReorder})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("out_of_stock")}
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium transition-colors cursor-pointer ${
              activeFilter === "out_of_stock"
                ? "bg-rose-600 text-white"
                : "text-rose-700 hover:bg-rose-100/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Stockouts ({summary.outOfStockCount})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("discontinued")}
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium transition-colors cursor-pointer ${
              activeFilter === "discontinued"
                ? "bg-zinc-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
            Dead / Archived ({summary.deadStockCount})
          </button>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500">
          <Clock className="h-3 w-3" />
          <span>Real-time sync: Live</span>
        </div>
      </div>
    </div>
  );
}
