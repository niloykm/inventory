"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InventoryItem, StockStatus } from "@/types/inventory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  ArrowUpDown,
  MoreHorizontal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Archive,
  Download,
  Trash2,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Package,
  Truck,
  ShoppingCart,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface InventoryLedgerProps {
  items: InventoryItem[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  selectedLocation: string;
  onOpenAdjust: (item: InventoryItem) => void;
  onOpenTransfer: (item: InventoryItem) => void;
  onOpenCreatePo: (item: InventoryItem) => void;
  onBulkReorder?: (itemIds: string[]) => number;
  onQuickDelete?: (itemId: string) => void;
}

const VALID_SORT_FIELDS: Array<keyof InventoryItem> = [
  "sku",
  "name",
  "onHand",
  "reorderPoint",
  "unitCost",
  "retailPrice",
];

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "low_stock", label: "Low Stock" },
  { id: "out_of_stock", label: "Out of Stock" },
  { id: "in_stock", label: "In Stock" },
];

export function InventoryLedger({
  items,
  activeFilter,
  onFilterChange,
  selectedLocation,
  onOpenAdjust,
  onOpenTransfer,
  onOpenCreatePo,
  onBulkReorder,
  onQuickDelete,
}: InventoryLedgerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<keyof InventoryItem>("sku");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [urlHydrated, setUrlHydrated] = useState(false);

  // Hydrate table state from URL search params on mount (shareable / refresh-safe)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const cat = params.get("category");
    const sort = params.get("sort") as keyof InventoryItem | null;
    const order = params.get("order");
    const page = parseInt(params.get("page") || "1", 10);
    const status = params.get("status");

    if (q) setSearchQuery(q);
    if (cat) setSelectedCategory(cat);
    if (sort && VALID_SORT_FIELDS.includes(sort)) setSortField(sort);
    if (order === "asc" || order === "desc") setSortOrder(order);
    if (!Number.isNaN(page) && page >= 1) setCurrentPage(page);
    if (
      status &&
      ["all", "low_stock", "out_of_stock", "in_stock", "discontinued"].includes(
        status
      )
    ) {
      onFilterChange(status);
    }
    setUrlHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL search params synchronized with table state
  useEffect(() => {
    if (!urlHydrated || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const setOrDelete = (key: string, value: string, defaultVal: string) => {
      if (!value || value === defaultVal) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    };
    setOrDelete("q", searchQuery.trim(), "");
    setOrDelete("category", selectedCategory, "all");
    setOrDelete("status", activeFilter, "all");
    setOrDelete("sort", String(sortField), "sku");
    setOrDelete("order", sortOrder, "asc");
    setOrDelete("page", String(currentPage), "1");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, [
    urlHydrated,
    searchQuery,
    selectedCategory,
    activeFilter,
    sortField,
    sortOrder,
    currentPage,
  ]);

  // Reset to page 1 when location or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLocation, activeFilter]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => set.add(item.category));
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedLocation !== "all" && item.locationId !== selectedLocation) {
        return false;
      }
      if (activeFilter !== "all" && item.status !== activeFilter) {
        return false;
      }
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const hit =
          item.sku.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.barcode?.toLowerCase().includes(q) ||
          item.supplierName?.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [items, selectedLocation, activeFilter, selectedCategory, searchQuery]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortField, sortOrder]);

  const totalItems = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, safePage, pageSize]);

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedIds(new Set(paginatedItems.map((i) => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSort = (field: keyof InventoryItem) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleBulkReorderClick = () => {
    const ids = Array.from(selectedIds);
    if (onBulkReorder) {
      const count = onBulkReorder(ids);
      toast.success(
        `Issued ${count} replenishment Purchase Order(s) — Pending Inbound updated.`
      );
    } else {
      toast.success(`Dispatched bulk purchase orders for ${ids.length} SKUs.`);
    }
    setSelectedIds(new Set());
  };

  const handleBulkExport = () => {
    const selected = items.filter((i) => selectedIds.has(i.id));
    const header =
      "SKU,Item Name,Category,Location,On Hand,Reserved,Available,Reorder Point,Unit Cost,Retail Price,Status\n";
    const rows = selected
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
      `inventory-selected-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selected.length} selected SKU(s) to CSV.`);
  };

  const handleBulkDelete = () => {
    if (onQuickDelete) {
      selectedIds.forEach((id) => onQuickDelete(id));
      toast.success(`Removed ${selectedIds.size} item(s) from ledger.`);
      setSelectedIds(new Set());
    }
  };

  const renderStatusBadge = (status: StockStatus) => {
    switch (status) {
      case "in_stock":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60 font-mono whitespace-nowrap">
            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            In Stock
          </span>
        );
      case "low_stock":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60 font-mono whitespace-nowrap">
            <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
            Low Stock
          </span>
        );
      case "out_of_stock":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60 font-mono whitespace-nowrap">
            <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400 shrink-0" />
            Out of Stock
          </span>
        );
      case "discontinued":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 font-mono whitespace-nowrap">
            <Archive className="h-3 w-3 text-zinc-500 shrink-0" />
            Discontinued
          </span>
        );
    }
  };

  const isAllSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((item) => selectedIds.has(item.id));

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    activeFilter !== "all";

  return (
    <section
      aria-label="High-density inventory ledger"
      className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs flex flex-col"
    >
      {/* 1. Control Toolbar */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-2.5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          {/* Search + Category + Status Tabs */}
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {/* Real-time search input */}
            <div className="relative min-w-[200px] flex-1 max-w-sm">
              <Search
                aria-hidden="true"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400"
              />
              <Input
                type="search"
                aria-label="Filter inventory by SKU, barcode, title, or supplier"
                placeholder="Filter SKU, barcode, title, supplier..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 pl-8 pr-7 text-xs rounded-md border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search filter"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Accessible Native Category Filter (Zero aria-hidden select) */}
            <div className="relative flex items-center">
              <SlidersHorizontal
                aria-hidden="true"
                className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-zinc-400"
              />
              <select
                aria-label="Filter inventory by category"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 w-[165px] appearance-none rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-8 pr-7 text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-zinc-400"
              />
            </div>

            {/* Shared-Element Animated Status Tabs */}
            <div
              role="tablist"
              aria-label="Filter by stock status"
              className="inline-flex rounded-md border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-50 dark:bg-zinc-900 text-xs"
            >
              {STATUS_TABS.map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    type="button"
                    aria-selected={isActive}
                    onClick={() => {
                      onFilterChange(tab.id);
                      setCurrentPage(1);
                    }}
                    className={`relative px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 ${
                      isActive
                        ? "text-zinc-900 dark:text-zinc-50 font-semibold"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="ledger-status-tab"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 32,
                        }}
                        className="absolute inset-0 rounded bg-white dark:bg-zinc-800 shadow-xs border border-zinc-200/80 dark:border-zinc-700"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  onFilterChange("all");
                  setCurrentPage(1);
                }}
                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline cursor-pointer px-1"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Right: Bulk Actions or Row Counter */}
          <div className="flex items-center gap-2 shrink-0">
            {selectedIds.size > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-2.5 py-1 rounded-md text-xs font-medium">
                <span className="font-mono tabular-nums font-bold">
                  {selectedIds.size}
                </span>{" "}
                selected:
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkReorderClick}
                  className="h-6 px-2 text-[11px] text-zinc-100 hover:text-white hover:bg-zinc-800 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  Bulk PO
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkExport}
                  className="h-6 px-2 text-[11px] text-zinc-100 hover:text-white hover:bg-zinc-800 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
                {onQuickDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="h-6 px-2 text-[11px] text-rose-300 hover:text-rose-100 hover:bg-rose-950 dark:text-rose-700"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-xs text-zinc-500 font-mono tabular-nums">
                Showing{" "}
                <strong className="text-zinc-800 dark:text-zinc-200">
                  {paginatedItems.length}
                </strong>{" "}
                of{" "}
                <strong className="text-zinc-800 dark:text-zinc-200">
                  {totalItems}
                </strong>{" "}
                SKUs
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Animated Ledger Content (Desktop Table + Mobile Card List) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeFilter}-${selectedCategory}-${selectedLocation}-${safePage}`}
          initial={{ opacity: 0.4, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0.4, y: -4 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Desktop / Tablet High-Density Table */}
          <div className="hidden md:block relative overflow-x-auto min-h-[380px]">
            <Table className="w-full text-xs">
              <TableHeader className="bg-zinc-50/90 dark:bg-zinc-900/70 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 backdrop-blur-xs">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-9 px-3 py-2.5">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all visible inventory rows"
                    />
                  </TableHead>
                  <TableHead className="py-2.5 px-3">
                    <button
                      type="button"
                      onClick={() => handleSort("sku")}
                      className="inline-flex items-center gap-1 font-medium uppercase tracking-wider text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                    >
                      SKU / Item
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="font-medium uppercase tracking-wider text-[11px] text-zinc-600 dark:text-zinc-400 py-2.5 px-3">
                    Hub
                  </TableHead>
                  <TableHead className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("onHand")}
                      className="inline-flex items-center justify-end gap-1 font-medium uppercase tracking-wider text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                    >
                      On Hand / Res / Avail
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("reorderPoint")}
                      className="inline-flex items-center justify-end gap-1 font-medium uppercase tracking-wider text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                    >
                      Reorder Pt
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("unitCost")}
                      className="inline-flex items-center justify-end gap-1 font-medium uppercase tracking-wider text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                    >
                      Retail / Cost
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="font-medium uppercase tracking-wider text-[11px] text-zinc-600 dark:text-zinc-400 py-2.5 px-3">
                    Status
                  </TableHead>
                  <TableHead className="text-right font-medium uppercase tracking-wider text-[11px] text-zinc-600 dark:text-zinc-400 py-2.5 px-3">
                    Quick Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const isBelowReorder =
                    item.status === "low_stock" || item.status === "out_of_stock";

                  return (
                    <TableRow
                      key={item.id}
                      data-state={isSelected ? "selected" : undefined}
                      className={`border-b border-zinc-100 dark:border-zinc-800/80 transition-colors ${
                        isSelected
                          ? "bg-zinc-50 dark:bg-zinc-900/60"
                          : "hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40"
                      }`}
                    >
                      {/* Checkbox */}
                      <TableCell className="px-3 py-2.5 align-middle">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleRow(item.id)}
                          aria-label={`Select ${item.sku}`}
                        />
                      </TableCell>

                      {/* Combined SKU, Barcode, Title & Category for clean density */}
                      <TableCell className="px-3 py-2.5 align-middle max-w-[270px]">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                              {item.sku}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-400 tabular-nums">
                              {item.barcode}
                            </span>
                          </div>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate mt-0.5">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 truncate">
                            {item.category} · {item.supplierName}
                          </span>
                        </div>
                      </TableCell>

                      {/* Warehouse Hub */}
                      <TableCell className="px-3 py-2.5 align-middle">
                        <span className="inline-flex rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                          {item.locationName.split("(")[0]?.trim() ||
                            item.locationName}
                        </span>
                      </TableCell>

                      {/* On Hand / Reserved / Available */}
                      <TableCell className="px-3 py-2.5 align-middle text-right">
                        <div className="font-mono text-xs tabular-nums font-semibold whitespace-nowrap">
                          <span
                            className={
                              item.onHand === 0
                                ? "text-rose-700 dark:text-rose-400 font-bold"
                                : isBelowReorder
                                ? "text-amber-700 dark:text-amber-400 font-bold"
                                : "text-zinc-900 dark:text-zinc-100"
                            }
                          >
                            {item.onHand}
                          </span>
                          <span className="text-zinc-300 dark:text-zinc-600 font-normal px-1">
                            /
                          </span>
                          <span className="text-zinc-500 font-normal">
                            {item.reserved}
                          </span>
                          <span className="text-zinc-300 dark:text-zinc-600 font-normal px-1">
                            /
                          </span>
                          <span className="text-emerald-700 dark:text-emerald-400">
                            {item.available}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-normal ml-1">
                            {item.unit}
                          </span>
                        </div>
                      </TableCell>

                      {/* Reorder Point */}
                      <TableCell className="px-3 py-2.5 align-middle text-right font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {item.reorderPoint > 0 ? (
                          <span
                            className={
                              isBelowReorder
                                ? "text-amber-700 dark:text-amber-400 font-bold"
                                : ""
                            }
                          >
                            {item.reorderPoint} {item.unit}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </TableCell>

                      {/* Unit Cost & Retail Price */}
                      <TableCell className="px-3 py-2.5 align-middle text-right font-mono text-xs tabular-nums whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                            ৳{item.retailPrice.toLocaleString("en-BD")}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            Cost: ৳{item.unitCost.toLocaleString("en-BD")}
                          </span>
                        </div>
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell className="px-3 py-2.5 align-middle">
                        {renderStatusBadge(item.status)}
                      </TableCell>

                      {/* Direct One-Click ERP Actions + Overflow Menu */}
                      <TableCell className="px-3 py-2.5 align-middle text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          {isBelowReorder && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => onOpenCreatePo(item)}
                              aria-label={`Order replenishment PO for ${item.sku}`}
                              className="h-7 px-2 text-[11px] font-semibold border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 cursor-pointer"
                            >
                              <ShoppingCart className="h-3 w-3 mr-1" />
                              PO
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenAdjust(item)}
                            aria-label={`Adjust stock for ${item.sku}`}
                            className="h-7 px-2 text-[11px] border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                          >
                            <RefreshCw className="h-3 w-3 mr-1 text-zinc-500" />
                            Adjust
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenTransfer(item)}
                            aria-label={`Transfer stock for ${item.sku}`}
                            title="Inter-Warehouse Transfer"
                            className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                          >
                            <Truck className="h-3.5 w-3.5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`More actions for ${item.sku}`}
                                className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 text-xs border-zinc-200 dark:border-zinc-800"
                            >
                              <DropdownMenuLabel className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                                SKU {item.sku}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onOpenAdjust(item)}
                                className="cursor-pointer text-xs"
                              >
                                <RefreshCw className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                                Adjust Stock Count
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onOpenTransfer(item)}
                                className="cursor-pointer text-xs"
                              >
                                <Truck className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                                Transfer to Another Hub
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onOpenCreatePo(item)}
                                className="cursor-pointer text-xs"
                              >
                                <ShoppingCart className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                                Create Purchase Order
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  navigator.clipboard.writeText(item.sku);
                                  toast.success(`Copied SKU ${item.sku}`);
                                }}
                                className="cursor-pointer text-xs"
                              >
                                <ExternalLink className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                                Copy SKU Code
                              </DropdownMenuItem>
                              {onQuickDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      onQuickDelete(item.id);
                                      toast.success(
                                        `Removed ${item.sku} from ledger.`
                                      );
                                    }}
                                    className="cursor-pointer text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Remove SKU Record
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {paginatedItems.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center text-zinc-500 text-xs"
                    >
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Package className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                        <p className="font-medium text-zinc-700 dark:text-zinc-300">
                          No matching inventory records found
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          Try clearing your search query, category, or stock status filter.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Responsive Card List (< 768px — Zero horizontal page overflow) */}
          <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {paginatedItems.map((item) => {
              const isBelowReorder =
                item.status === "low_stock" || item.status === "out_of_stock";

              return (
                <div key={item.id} className="p-3.5 space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {item.sku}
                        </span>
                        <span className="inline-flex rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-300">
                          {item.locationName.split("(")[0]?.trim()}
                        </span>
                      </div>
                      <p className="font-medium text-zinc-800 dark:text-zinc-200 mt-0.5 leading-snug">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {item.category}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {renderStatusBadge(item.status)}
                    </div>
                  </div>

                  {/* Numeric Metrics Strip */}
                  <div className="grid grid-cols-3 gap-2 rounded-md bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80 p-2 font-mono tabular-nums">
                    <div>
                      <span className="block text-[10px] text-zinc-500 uppercase">
                        On / Res / Avail
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.onHand}/{item.reserved}/{item.available}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-zinc-500 uppercase">
                        Reorder Pt
                      </span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {item.reorderPoint > 0 ? item.reorderPoint : "—"} {item.unit}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-zinc-500 uppercase">
                        Retail (BDT)
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        ৳{item.retailPrice.toLocaleString("en-BD")}
                      </span>
                    </div>
                  </div>

                  {/* One-Tap Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenAdjust(item)}
                      className="flex-1 h-8 text-xs border-zinc-200 dark:border-zinc-800"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Adjust
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenTransfer(item)}
                      className="flex-1 h-8 text-xs border-zinc-200 dark:border-zinc-800"
                    >
                      <Truck className="h-3 w-3 mr-1" />
                      Transfer
                    </Button>
                    <Button
                      type="button"
                      variant={isBelowReorder ? "default" : "outline"}
                      size="sm"
                      onClick={() => onOpenCreatePo(item)}
                      className={`flex-1 h-8 text-xs ${
                        isBelowReorder
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : "border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Order PO
                    </Button>
                  </div>
                </div>
              );
            })}

            {paginatedItems.length === 0 && (
              <div className="py-10 px-4 text-center text-xs text-zinc-500">
                No matching inventory records found.
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 3. Pagination & Row Counter Bar (Zero hidden <select>) */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="flex flex-wrap items-center gap-2 font-mono text-zinc-600 dark:text-zinc-400 tabular-nums">
          <span>
            Showing{" "}
            <strong className="text-zinc-900 dark:text-zinc-100">
              {totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1}–
              {Math.min(safePage * pageSize, totalItems)}
            </strong>{" "}
            of{" "}
            <strong className="text-zinc-900 dark:text-zinc-100">
              {totalItems}
            </strong>{" "}
            SKUs
          </span>

          <span className="text-zinc-300 dark:text-zinc-700">·</span>

          <label
            htmlFor="ledger-page-size"
            className="inline-flex items-center gap-1.5"
          >
            <span>Per page:</span>
            <div className="relative">
              <select
                id="ledger-page-size"
                aria-label="Rows per page"
                value={String(pageSize)}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-7 w-[60px] appearance-none rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-2 pr-6 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 cursor-pointer"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400"
              />
            </div>
          </label>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="h-7 px-2.5 text-xs border-zinc-200 dark:border-zinc-800"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Previous
          </Button>

          <span className="px-2 font-mono text-xs text-zinc-600 dark:text-zinc-400 tabular-nums">
            Page {safePage} / {totalPages}
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="h-7 px-2.5 text-xs border-zinc-200 dark:border-zinc-800"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}
