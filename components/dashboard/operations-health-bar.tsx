"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  TrendingUp,
  Truck,
  Ban,
  ChevronRight,
  Flame,
  Archive,
} from "lucide-react";
import { KPISummary } from "@/types/inventory";

interface OperationsHealthBarProps {
  summary: KPISummary;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onOpenPendingPOs?: () => void;
}

const formatBDT = (amount: number): string =>
  `BDT ${Math.round(amount).toLocaleString("en-BD")}`;

export function OperationsHealthBar({
  summary,
  activeFilter,
  onFilterChange,
  onOpenPendingPOs,
}: OperationsHealthBarProps) {
  const quickFilters = [
    {
      id: "all",
      label: `All Ledger (${summary.totalSkus})`,
      dot: null,
    },
    {
      id: "low_stock",
      label: `Below Reorder (${summary.itemsBelowReorder})`,
      dot: "bg-amber-500",
    },
    {
      id: "out_of_stock",
      label: `Stockouts (${summary.outOfStockCount})`,
      dot: "bg-rose-500",
    },
    {
      id: "discontinued",
      label: `Stalled / Archived (${summary.deadStockCount})`,
      dot: "bg-zinc-400",
    },
  ];

  return (
    <section
      aria-label="Operations health summary"
      className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-xs"
    >
      {/* Asymmetric Operational Metric Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
        {/* KPI 1 (Wide - 4 cols): Asset Valuation & Velocity Risk */}
        <div className="lg:col-span-4 flex flex-col justify-between rounded-md border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-3.5">
          <div className="flex items-center justify-between gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            <span>Total Inventory Valuation</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
              <TrendingUp className="h-3 w-3" />+{summary.valuationTrendPercent}% WoW
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 tabular-nums">
              {formatBDT(summary.totalValuationBDT)}
            </span>
            <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400 tabular-nums">
              {summary.totalSkus} SKUs
            </span>
          </div>
          {summary.highVelocityAtRiskCount > 0 && (
            <div className="mt-2 pt-2 border-t border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-1 font-medium text-amber-800 dark:text-amber-300">
                <Flame className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                {summary.highVelocityAtRiskCount} high-velocity SKUs need action today
              </span>
            </div>
          )}
        </div>

        {/* KPI 2 (3 cols): Reorder Threshold Warnings */}
        <button
          type="button"
          onClick={() =>
            onFilterChange(activeFilter === "low_stock" ? "all" : "low_stock")
          }
          aria-pressed={activeFilter === "low_stock"}
          className={`lg:col-span-3 flex flex-col justify-between text-left rounded-md border p-3.5 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 ${
            activeFilter === "low_stock"
              ? "border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 ring-1 ring-amber-500/30"
              : "border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/15 hover:border-amber-400 dark:hover:border-amber-700"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-amber-800 dark:text-amber-300">
            <span className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Low Stock
            </span>
            <span className="font-mono text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-200">
              Reorder
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-100 tabular-nums">
              {summary.itemsBelowReorder}
            </span>
            <span className="text-xs font-medium text-amber-800 dark:text-amber-300 inline-flex items-center gap-0.5">
              below reorder pt
              <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </button>

        {/* KPI 3 (2 cols): Out of Stock Critical */}
        <button
          type="button"
          onClick={() =>
            onFilterChange(
              activeFilter === "out_of_stock" ? "all" : "out_of_stock"
            )
          }
          aria-pressed={activeFilter === "out_of_stock"}
          className={`lg:col-span-2 flex flex-col justify-between text-left rounded-md border p-3.5 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500 ${
            activeFilter === "out_of_stock"
              ? "border-rose-600 bg-rose-50/80 dark:bg-rose-950/40 ring-1 ring-rose-500/30"
              : "border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/15 hover:border-rose-400 dark:hover:border-rose-700"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-rose-800 dark:text-rose-300">
            <span className="flex items-center gap-1 font-semibold">
              <Ban className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              Stockouts
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-1">
            <span className="font-mono text-2xl font-bold tracking-tight text-rose-900 dark:text-rose-100 tabular-nums">
              {summary.outOfStockCount}
            </span>
            <span className="text-xs font-medium text-rose-800 dark:text-rose-300 inline-flex items-center">
              zero stock
              <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </button>

        {/* KPI 4 (3 cols): Pending Inbound Batches + Stalled Capital */}
        <div className="lg:col-span-3 flex flex-col justify-between rounded-md border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-3.5">
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            <button
              type="button"
              onClick={onOpenPendingPOs}
              className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer font-semibold"
            >
              <Truck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Pending Inbound
            </button>
            <button
              type="button"
              onClick={onOpenPendingPOs}
              className="font-mono text-[11px] font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer tabular-nums"
            >
              {summary.pendingInboundBatches} POs
            </button>
          </div>
          <div className="mt-2 flex items-end justify-between gap-2">
            <div>
              <span className="font-mono text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 tabular-nums">
                +{summary.pendingInboundUnits.toLocaleString("en-BD")}
              </span>
              <span className="ml-1 text-[11px] text-zinc-500">units</span>
            </div>
            <button
              type="button"
              onClick={() =>
                onFilterChange(
                  activeFilter === "discontinued" ? "all" : "discontinued"
                )
              }
              className="text-right group cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 rounded px-1 -mx-1"
            >
              <span className="flex items-center justify-end gap-1 text-[10px] text-zinc-500 uppercase tracking-wider group-hover:text-zinc-800 dark:group-hover:text-zinc-200">
                <Archive className="h-2.5 w-2.5" />
                Stalled Capital
              </span>
              <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
                {formatBDT(summary.deadStockCapitalBDT)}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Shared-Element Animated Quick Filter Strip */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800/80 pt-3 text-xs">
        <div
          role="tablist"
          aria-label="Quick stock status filter"
          className="flex flex-wrap items-center gap-1"
        >
          <span className="mr-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
            Quick Filter:
          </span>
          {quickFilters.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => onFilterChange(tab.id)}
                className={`relative rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 ${
                  isActive
                    ? "text-white dark:text-zinc-900"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="health-quick-filter"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-md bg-zinc-900 dark:bg-zinc-100"
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
                  {tab.dot && (
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 rounded-full ${tab.dot}`}
                    />
                  )}
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Atomic invariants enforced</span>
        </div>
      </div>
    </section>
  );
}
