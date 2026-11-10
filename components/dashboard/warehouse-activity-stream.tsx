"use client";

import React, { useState } from "react";
import { StockMovement, MovementType } from "@/types/inventory";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  FileCheck2,
  Clock,
  ShieldCheck,
  User,
  Filter,
} from "lucide-react";

interface WarehouseActivityStreamProps {
  movements: StockMovement[];
  onSelectSku?: (sku: string) => void;
}

export function WarehouseActivityStream({
  movements,
  onSelectSku,
}: WarehouseActivityStreamProps) {
  const [filterType, setFilterType] = useState<string>("all");

  const filteredMovements = movements.filter((m) => {
    if (filterType === "all") return true;
    if (filterType === "inbound" && m.type !== "inbound") return false;
    if (filterType === "outbound" && m.type !== "outbound") return false;
    if (filterType === "adjustment" && m.type !== "adjustment" && m.type !== "audit")
      return false;
    return true;
  });

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("en-BD", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const renderMovementIcon = (type: MovementType) => {
    switch (type) {
      case "inbound":
        return <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
      case "outbound":
        return <ArrowUpRight className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />;
      case "adjustment":
      case "audit":
        return <RefreshCw className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />;
      default:
        return <Activity className="h-3.5 w-3.5 text-zinc-500" />;
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Warehouse Activity Stream
            </h3>
            <p className="text-[11px] text-zinc-500">
              Immutable stock balance audit trail
            </p>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
              filterType === "all"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterType("inbound")}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
              filterType === "inbound"
                ? "bg-emerald-600 text-white font-medium"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            Inbound
          </button>
          <button
            type="button"
            onClick={() => setFilterType("adjustment")}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
              filterType === "adjustment"
                ? "bg-amber-600 text-white font-medium"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            Audits
          </button>
        </div>
      </div>

      {/* Movement List Stream */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 overflow-y-auto max-h-[500px]">
        {filteredMovements.map((mov) => {
          const isPositive = mov.quantityDelta > 0;
          return (
            <div
              key={mov.id}
              className="p-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors flex items-start gap-3 text-xs"
            >
              {/* Type Icon */}
              <div className="mt-0.5 p-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0">
                {renderMovementIcon(mov.type)}
              </div>

              {/* Movement Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => onSelectSku && onSelectSku(mov.sku)}
                      className="font-mono font-bold text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer"
                    >
                      {mov.sku}
                    </button>
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <span className="text-zinc-500 text-[11px] truncate">
                      {mov.reason}
                    </span>
                  </div>

                  {/* Quantity Delta Pill */}
                  <span
                    className={`font-mono text-xs font-bold tabular-nums px-1.5 py-0.5 rounded shrink-0 ${
                      isPositive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50"
                        : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50"
                    }`}
                  >
                    {isPositive ? `+${mov.quantityDelta}` : mov.quantityDelta}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                  {mov.itemName}
                </p>

                {/* Metadata Row */}
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono tabular-nums pt-0.5">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3 text-zinc-400" />
                    {mov.operator}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {mov.reference && (
                      <span className="px-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
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
          <div className="py-8 text-center text-xs text-zinc-400">
            No activity records matching selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
