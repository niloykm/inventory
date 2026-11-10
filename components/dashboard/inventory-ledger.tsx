"use client";

import React, { useState, useMemo } from "react";
import {
  InventoryItem,
  StockStatus,
  AdjustmentReason,
} from "@/types/inventory";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  MoreHorizontal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Archive,
  Download,
  Trash2,
  RefreshCw,
  Edit,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import { toast } from "sonner";

interface InventoryLedgerProps {
  items: InventoryItem[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  selectedLocation: string;
  onOpenAdjust: (item: InventoryItem) => void;
  onQuickDelete?: (itemId: string) => void;
}

export function InventoryLedger({
  items,
  activeFilter,
  onFilterChange,
  selectedLocation,
  onOpenAdjust,
  onQuickDelete,
}: InventoryLedgerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<keyof InventoryItem>("sku");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Available categories extracted from data
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => set.add(item.category));
    return Array.from(set);
  }, [items]);

  // Filtering
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Location filter
      if (selectedLocation !== "all" && item.locationId !== selectedLocation) {
        return false;
      }

      // Status pill filter
      if (activeFilter !== "all") {
        if (activeFilter === "low_stock" && item.status !== "low_stock") return false;
        if (activeFilter === "out_of_stock" && item.status !== "out_of_stock") return false;
        if (activeFilter === "discontinued" && item.status !== "discontinued") return false;
        if (activeFilter === "in_stock" && item.status !== "in_stock") return false;
      }

      // Category filter
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }

      // Search Query (SKU, Name, Barcode, Supplier)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesSku = item.sku.toLowerCase().includes(query);
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesBarcode = item.barcode?.toLowerCase().includes(query);
        const matchesSupplier = item.supplierName?.toLowerCase().includes(query);
        if (!matchesSku && !matchesName && !matchesBarcode && !matchesSupplier) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedLocation, activeFilter, selectedCategory, searchQuery]);

  // Sorting
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

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

  // Pagination
  const totalItems = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, currentPage, pageSize]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSet = new Set(paginatedItems.map((i) => i.id));
      setSelectedIds(newSet);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSort = (field: keyof InventoryItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Bulk Actions
  const handleBulkReorder = () => {
    toast.success(
      `Dispatched bulk purchase orders for ${selectedIds.size} SKUs to their suppliers.`
    );
    setSelectedIds(new Set());
  };

  const handleBulkExport = () => {
    const selected = items.filter((i) => selectedIds.has(i.id));
    const header = "SKU,Item Name,Category,Location,On Hand,Reserved,Available,Reorder Point,Unit Cost,Retail Price,Status\n";
    const rows = selected
      .map(
        (i) =>
          `"${i.sku}","${i.name}","${i.category}","${i.locationName}",${i.onHand},${i.reserved},${i.available},${i.reorderPoint},${i.unitCost},${i.retailPrice},"${i.status}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selected.length} items to CSV.`);
  };

  const handleBulkDelete = () => {
    if (onQuickDelete) {
      selectedIds.forEach((id) => onQuickDelete(id));
      toast.success(`Removed ${selectedIds.size} items from ledger.`);
      setSelectedIds(new Set());
    }
  };

  // Status Token Renderer
  const renderStatusBadge = (status: StockStatus) => {
    switch (status) {
      case "in_stock":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 font-mono">
            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            In Stock
          </span>
        );
      case "low_stock":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 font-mono">
            <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            Low Stock
          </span>
        );
      case "out_of_stock":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 font-mono">
            <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
            Out of Stock
          </span>
        );
      case "discontinued":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 font-mono">
            <Archive className="h-3 w-3 text-zinc-500" />
            Discontinued
          </span>
        );
    }
  };

  const isAllSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((item) => selectedIds.has(item.id));

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs flex flex-col">
      {/* 1. Control Toolbar */}
      <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Search & Filters */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Real-time search */}
          <div className="relative min-w-[240px] max-w-sm flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search SKU, barcode, title, supplier..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 pl-8 pr-3 text-xs border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400 font-sans"
            />
          </div>

          {/* Category Dropdown Filter */}
          <div className="w-[180px]">
            <Select
              value={selectedCategory}
              onValueChange={(val) => {
                setSelectedCategory(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs border-zinc-200 dark:border-zinc-800">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="border-zinc-200 dark:border-zinc-800 text-xs">
                <SelectItem value="all" className="text-xs">
                  All Categories
                </SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Stock Level Segmented Pills */}
          <div className="inline-flex rounded-md border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-50 dark:bg-zinc-900 text-xs">
            <button
              type="button"
              onClick={() => {
                onFilterChange("all");
                setCurrentPage(1);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeFilter === "all"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                onFilterChange("low_stock");
                setCurrentPage(1);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeFilter === "low_stock"
                  ? "bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 shadow-xs font-semibold"
                  : "text-zinc-500 hover:text-amber-700"
              }`}
            >
              Low Stock
            </button>
            <button
              type="button"
              onClick={() => {
                onFilterChange("out_of_stock");
                setCurrentPage(1);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeFilter === "out_of_stock"
                  ? "bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 shadow-xs font-semibold"
                  : "text-zinc-500 hover:text-rose-700"
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>

        {/* Right: Bulk Actions Strip if items selected, else table stats */}
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 ? (
            <div className="flex items-center gap-1.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-3 py-1 rounded-md text-xs font-medium animate-in fade-in">
              <span className="font-mono tabular-nums">{selectedIds.size}</span> selected:
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkReorder}
                className="h-6 px-2 text-[11px] text-zinc-100 hover:text-white hover:bg-zinc-800 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Bulk Reorder
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkExport}
                className="h-6 px-2 text-[11px] text-zinc-100 hover:text-white hover:bg-zinc-800 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <Download className="h-3 w-3 mr-1" />
                Export Selected
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
              Showing {paginatedItems.length} of {totalItems} SKUs
            </div>
          )}
        </div>
      </div>

      {/* 2. High-Density Table Workhorse */}
      <div className="relative overflow-x-auto min-h-[380px]">
        <Table className="w-full text-xs">
          <TableHeader className="bg-zinc-50/80 dark:bg-zinc-900/60 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 backdrop-blur-xs">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 px-3 py-2.5">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all rows"
                />
              </TableHead>
              <TableHead
                onClick={() => handleSort("sku")}
                className="cursor-pointer font-medium uppercase tracking-wider text-[11px] text-zinc-500 py-2.5 px-3 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <div className="flex items-center gap-1">
                  SKU / Barcode
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort("name")}
                className="cursor-pointer font-medium uppercase tracking-wider text-[11px] text-zinc-500 py-2.5 px-3 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <div className="flex items-center gap-1">
                  Item Description & Category
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="font-medium uppercase tracking-wider text-[11px] text-zinc-500 py-2.5 px-3">
                Location
              </TableHead>
              <TableHead
                onClick={() => handleSort("onHand")}
                className="cursor-pointer font-medium uppercase tracking-wider text-[11px] text-zinc-500 py-2.5 px-3 text-right hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <div className="flex items-center justify-end gap-1">
                  On Hand / Res / Avail
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort("reorderPoint")}
                className="cursor-pointer font-medium uppercase tracking-wider text-[11px] text-zinc-500 py-2.5 px-3 text-right hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <div className="flex items-center justify-end gap-1">
                  Reorder Pt
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort("unitCost")}
                className="cursor-pointer font-medium uppercase tracking-wider text-[11px] text-zinc-500 py-2.5 px-3 text-right hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <div className="flex items-center justify-end gap-1">
                  Cost / Retail (BDT)
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="font-medium uppercase tracking-wider text-[11px] text-zinc-500 py-2.5 px-3">
                Status
              </TableHead>
              <TableHead className="text-right font-medium uppercase tracking-wider text-[11px] text-zinc-500 py-2.5 px-3 w-16">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((item) => {
              const isSelected = selectedIds.has(item.id);
              const isBelowReorder =
                item.status !== "discontinued" && item.onHand <= item.reorderPoint;

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
                  {/* Selection Checkbox */}
                  <TableCell className="px-3 py-2.5 align-middle">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleRow(item.id)}
                      aria-label={`Select ${item.sku}`}
                    />
                  </TableCell>

                  {/* SKU & Barcode */}
                  <TableCell className="px-3 py-2.5 align-middle">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        {item.sku}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-400 tabular-nums">
                        {item.barcode}
                      </span>
                    </div>
                  </TableCell>

                  {/* Name & Category */}
                  <TableCell className="px-3 py-2.5 align-middle max-w-xs">
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-zinc-500 font-sans">
                          {item.category}
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[130px]">
                          {item.supplierName}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Location */}
                  <TableCell className="px-3 py-2.5 align-middle">
                    <span className="inline-flex rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                      {item.locationName.split("(")[0]?.trim() || item.locationName}
                    </span>
                  </TableCell>

                  {/* On Hand / Reserved / Available */}
                  <TableCell className="px-3 py-2.5 align-middle text-right">
                    <div className="font-mono text-xs tabular-nums font-semibold">
                      <span
                        className={
                          item.onHand === 0
                            ? "text-rose-600 font-bold"
                            : isBelowReorder
                            ? "text-amber-600 font-bold"
                            : "text-zinc-900 dark:text-zinc-100"
                        }
                      >
                        {item.onHand}
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-600 font-normal px-1">
                        /
                      </span>
                      <span className="text-zinc-400 font-normal">
                        {item.reserved}
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-600 font-normal px-1">
                        /
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {item.available}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-normal ml-1">
                        {item.unit}
                      </span>
                    </div>
                  </TableCell>

                  {/* Reorder Level */}
                  <TableCell className="px-3 py-2.5 align-middle text-right font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
                    {item.reorderPoint > 0 ? (
                      <span className={isBelowReorder ? "text-amber-600 font-bold" : ""}>
                        {item.reorderPoint} {item.unit}
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </TableCell>

                  {/* Unit Cost & Retail Price */}
                  <TableCell className="px-3 py-2.5 align-middle text-right font-mono text-xs tabular-nums">
                    <div className="flex flex-col items-end">
                      <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                        ৳{item.retailPrice.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Cost: ৳{item.unitCost.toLocaleString()}
                      </span>
                    </div>
                  </TableCell>

                  {/* Status Pill */}
                  <TableCell className="px-3 py-2.5 align-middle">
                    {renderStatusBadge(item.status)}
                  </TableCell>

                  {/* Row Actions Menu */}
                  <TableCell className="px-3 py-2.5 align-middle text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 text-xs border-zinc-200 dark:border-zinc-800"
                      >
                        <DropdownMenuLabel className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                          SKU {item.sku}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onOpenAdjust(item)}
                          className="cursor-pointer text-xs"
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                          Quick Adjust Stock
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            toast.info(`Triggered purchase order draft for ${item.sku}`);
                          }}
                          className="cursor-pointer text-xs"
                        >
                          <Package className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                          Reorder from Supplier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(item.sku);
                            toast.success(`Copied SKU ${item.sku} to clipboard`);
                          }}
                          className="cursor-pointer text-xs"
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                          Copy SKU Identifier
                        </DropdownMenuItem>
                        {onQuickDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                onQuickDelete(item.id);
                                toast.success(`Removed ${item.sku} from ledger.`);
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
                  </TableCell>
                </TableRow>
              );
            })}

            {paginatedItems.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-12 text-center text-zinc-500 text-xs"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Package className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                    <p className="font-medium text-zinc-700 dark:text-zinc-300">
                      No matching inventory records found
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Try adjusting search query, category, or stock status filters.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 3. Pagination & Ledger Stats Bar */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-2 font-mono text-zinc-500 tabular-nums">
          <span>
            Showing{" "}
            <strong>
              {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, totalItems)}
            </strong>{" "}
            of <strong>{totalItems}</strong> SKUs
          </span>

          <span className="text-zinc-300 dark:text-zinc-700">•</span>

          <div className="flex items-center gap-1">
            <span>Per page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-7 w-[64px] text-xs font-mono border-zinc-200 dark:border-zinc-800">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent className="border-zinc-200 dark:border-zinc-800 text-xs font-mono">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="h-7 px-2.5 text-xs border-zinc-200 dark:border-zinc-800"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Previous
          </Button>

          <span className="px-2 font-mono text-xs text-zinc-600 dark:text-zinc-400 tabular-nums">
            Page {currentPage} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="h-7 px-2.5 text-xs border-zinc-200 dark:border-zinc-800"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
