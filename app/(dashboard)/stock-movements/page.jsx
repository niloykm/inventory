"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useInventoryStore } from "@/lib/inventory-store";
import { WAREHOUSE_LOCATIONS } from "@/data/inventory";
import { PageLoader } from "@/components/ui/loader";
import { PreviewModeBanner } from "@/components/ui/auth-gate-card";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Eye,
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import apiClient from "@/lib/api-client";

const movementTypeColors = {
  purchase: "bg-green-100 text-green-800",
  sale: "bg-blue-100 text-blue-800",
  transfer_in: "bg-purple-100 text-purple-800",
  transfer_out: "bg-purple-100 text-purple-800",
  transfer: "bg-purple-100 text-purple-800",
  adjustment_increase: "bg-yellow-100 text-yellow-800",
  adjustment_decrease: "bg-orange-100 text-orange-800",
  adjustment: "bg-yellow-100 text-yellow-800",
  return: "bg-orange-100 text-orange-800",
  damage: "bg-red-100 text-red-800",
  expired: "bg-red-100 text-red-800",
  assignment: "bg-indigo-100 text-indigo-800",
  return_assignment: "bg-indigo-100 text-indigo-800",
};

const movementTypeIcons = {
  purchase: TrendingUp,
  sale: TrendingDown,
  transfer_in: Activity,
  transfer_out: Activity,
  transfer: Activity,
  adjustment_increase: TrendingUp,
  adjustment_decrease: TrendingDown,
  adjustment: Activity,
  return: Activity,
  damage: TrendingDown,
  expired: TrendingDown,
  assignment: Activity,
  return_assignment: Activity,
};

// Format movement type for display
const formatMovementType = (type) => {
  const typeMap = {
    transfer_in: "Transfer In",
    transfer_out: "Transfer Out",
    adjustment_increase: "Adjustment +",
    adjustment_decrease: "Adjustment -",
    return_assignment: "Return Assignment",
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

export default function StockMovementsPage() {
  const { token, isLoading: authLoading } = useAuth();
  const store = useInventoryStore();
  const [movements, setMovements] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDialog, setViewDialog] = useState(null);
  const [filters, setFilters] = useState({
    movement_type: "all",
    item_id: "all",
    location_id: "all",
    start_date: "",
    end_date: "",
    reference_type: "all",
    reference_id: "",
  });

  // Map local ERP store movements into the page schema when viewing in Preview Mode
  const previewMovements = useMemo(() => {
    return store.movements.map((m) => {
      let movement_type = "adjustment_increase";
      let reference_type = "adjustment";
      if (m.type === "inbound") {
        movement_type = "purchase";
        reference_type = "purchase_order";
      } else if (m.type === "outbound") {
        movement_type = "sale";
        reference_type = "sale_order";
      } else if (m.type === "transfer") {
        movement_type = m.quantityDelta >= 0 ? "transfer_in" : "transfer_out";
        reference_type = "transfer";
      } else if (m.quantityDelta < 0) {
        movement_type = m.reason === "Damaged" ? "damage" : "adjustment_decrease";
        reference_type = "adjustment";
      }

      const matchedItem = store.items.find((i) => i.sku === m.sku);
      const matchedLoc = WAREHOUSE_LOCATIONS.find((l) => l.name === m.location);

      return {
        _id: m.id,
        movement_type,
        reference_type,
        reference_number: m.reference || m.id.toUpperCase(),
        reference_id: m.reference || "",
        item_id: {
          _id: matchedItem?.id || m.sku,
          name: m.itemName,
          sku: m.sku,
        },
        location_id: {
          _id: matchedLoc?.id || m.location,
          name: m.location,
        },
        quantity: m.quantityDelta,
        quantity_before: m.previousQty ?? Math.max(0, (matchedItem?.onHand || 0) - m.quantityDelta),
        quantity_after: m.newQty ?? (matchedItem?.onHand || 0),
        reason: m.reason,
        notes: `${m.reason} · Operator: ${m.operator}`,
        performed_by: { username: m.operator, full_name: m.operator },
        movement_date: m.timestamp,
        created_at: m.timestamp,
      };
    });
  }, [store.movements, store.items]);

  const previewItems = useMemo(
    () => store.items.map((i) => ({ _id: i.id, name: `${i.sku} — ${i.name}` })),
    [store.items]
  );

  const previewLocations = useMemo(
    () =>
      WAREHOUSE_LOCATIONS.filter((l) => l.id !== "all").map((l) => ({
        _id: l.id,
        name: l.name,
      })),
    []
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const transferId = urlParams.get("transfer_id");
      if (transferId) {
        setFilters((prev) => ({
          ...prev,
          reference_id: transferId,
          reference_type: "transfer",
        }));
      }
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setItems(previewItems);
      setLocations(previewLocations);
      setLoading(false);
      return;
    }
    fetchMovements();
    fetchItems();
    fetchLocations();
  }, [token, authLoading, previewItems, previewLocations]);

  // Refetch or filter whenever filters or preview data change
  useEffect(() => {
    if (authLoading) return;
    if (token) {
      fetchMovements();
    } else {
      let filtered = [...previewMovements];
      if (filters.movement_type !== "all") {
        if (filters.movement_type === "transfer") {
          filtered = filtered.filter(
            (m) =>
              m.movement_type === "transfer_in" ||
              m.movement_type === "transfer_out"
          );
        } else {
          filtered = filtered.filter(
            (m) => m.movement_type === filters.movement_type
          );
        }
      }
      if (filters.item_id !== "all") {
        filtered = filtered.filter((m) => m.item_id?._id === filters.item_id);
      }
      if (filters.location_id !== "all") {
        filtered = filtered.filter(
          (m) => m.location_id?._id === filters.location_id
        );
      }
      if (filters.reference_type !== "all") {
        filtered = filtered.filter(
          (m) => m.reference_type === filters.reference_type
        );
      }
      if (filters.start_date) {
        const startTs = new Date(filters.start_date).getTime();
        filtered = filtered.filter(
          (m) => new Date(m.movement_date).getTime() >= startTs
        );
      }
      if (filters.end_date) {
        const endTs = new Date(filters.end_date).getTime() + 86400000;
        filtered = filtered.filter(
          (m) => new Date(m.movement_date).getTime() <= endTs
        );
      }
      setMovements(filtered);
      setLoading(false);
    }
  }, [filters, token, authLoading, previewMovements]);

  async function fetchMovements() {
    if (!token) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key] && filters[key] !== "all") {
          // Handle special movement type filtering
          if (key === "movement_type" && filters[key] === "transfer") {
            // Don't add to query params, we'll filter client-side for transfers
            return;
          }
          queryParams.append(key, filters[key]);
        }
      });

      const response = await apiClient.get(
        `/stock-movements?${queryParams}`,
        {},
        token
      );

      let movements = Array.isArray(response)
        ? response
        : response?.movements || [];

      // Client-side filtering for transfer type (includes transfer_in and transfer_out)
      if (filters.movement_type === "transfer") {
        movements = movements.filter(
          (m) =>
            m.movement_type === "transfer_in" ||
            m.movement_type === "transfer_out"
        );
      }

      setMovements(movements);
    } catch (error) {
      console.error("Failed to load stock movements:", error);
      toast.error("Failed to load stock movements");
    } finally {
      setLoading(false);
    }
  }

  async function fetchItems() {
    if (!token) return;
    try {
      const response = await apiClient.get("/items", {}, token);
      setItems(
        Array.isArray(response)
          ? response
          : response?.items || response?.data || []
      );
    } catch (error) {
      console.error("Failed to load items");
    }
  }

  async function fetchLocations() {
    if (!token) return;
    try {
      const response = await apiClient.get("/locations", {}, token);
      setLocations(Array.isArray(response) ? response : response?.data || []);
    } catch (error) {
      console.error("Failed to load locations");
    }
  }

  function clearFilters() {
    setFilters({
      movement_type: "all",
      item_id: "all",
      location_id: "all",
      start_date: "",
      end_date: "",
      reference_type: "all",
      reference_id: "",
    });
    // Clear URL parameters
    window.history.replaceState({}, "", window.location.pathname);
  }

  const stats = {
    total: movements.length,
    purchases: movements.filter((m) => m.movement_type === "purchase").length,
    sales: movements.filter((m) => m.movement_type === "sale").length,
    transfers: movements.filter(
      (m) =>
        m.movement_type === "transfer_in" || m.movement_type === "transfer_out"
    ).length,
    adjustments: movements.filter(
      (m) =>
        m.movement_type === "adjustment_increase" ||
        m.movement_type === "adjustment_decrease" ||
        m.movement_type?.includes("adjustment")
    ).length,
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="w-full px-3 sm:px-5 lg:px-6 py-4">
      <div className="space-y-4">
        {!token && <PreviewModeBanner moduleName="Stock Movements" />}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Stock Movements
            </h1>
            <p className="text-xs text-zinc-500">
              Complete audit ledger of inbound receipts, dispatches, transfers, and count adjustments
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-xs px-3 py-1 tabular-nums">
            <Activity className="mr-1.5 h-3.5 w-3.5" />
            {stats.total} Total Movements
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Movements
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Purchases</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.purchases}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sales</CardTitle>
              <TrendingDown className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.sales}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transfers</CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.transfers}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Adjustments</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.adjustments}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="rounded-md border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Movement Filters</CardTitle>
            <CardDescription className="text-xs">
              Filter stock movements by type, SKU item, warehouse hub, reference, or date range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              <NativeSelect
                id="sm-filter-type"
                label="Movement Type"
                value={filters.movement_type}
                onChange={(e) =>
                  setFilters({ ...filters, movement_type: e.target.value })
                }
                options={[
                  { value: "all", label: "All Types" },
                  { value: "purchase", label: "Purchase / Inbound" },
                  { value: "sale", label: "Sale / Outbound" },
                  { value: "transfer", label: "Transfer (All)" },
                  { value: "transfer_in", label: "Transfer In" },
                  { value: "transfer_out", label: "Transfer Out" },
                  { value: "adjustment_increase", label: "Adjustment (+)" },
                  { value: "adjustment_decrease", label: "Adjustment (-)" },
                  { value: "return", label: "Return" },
                  { value: "damage", label: "Damaged" },
                  { value: "expired", label: "Expired" },
                  { value: "assignment", label: "Assignment" },
                ]}
              />

              <NativeSelect
                id="sm-filter-item"
                label="SKU / Item"
                value={filters.item_id}
                onChange={(e) =>
                  setFilters({ ...filters, item_id: e.target.value })
                }
                options={[
                  { value: "all", label: "All Items" },
                  ...items.map((item) => ({
                    value: item._id,
                    label: item.name,
                  })),
                ]}
              />

              <NativeSelect
                id="sm-filter-location"
                label="Warehouse Location"
                value={filters.location_id}
                onChange={(e) =>
                  setFilters({ ...filters, location_id: e.target.value })
                }
                options={[
                  { value: "all", label: "All Locations" },
                  ...locations.map((loc) => ({
                    value: loc._id,
                    label: loc.name,
                  })),
                ]}
              />

              <NativeSelect
                id="sm-filter-ref"
                label="Reference Type"
                value={filters.reference_type}
                onChange={(e) =>
                  setFilters({ ...filters, reference_type: e.target.value })
                }
                options={[
                  { value: "all", label: "All References" },
                  { value: "transfer", label: "Transfer" },
                  { value: "purchase_order", label: "Purchase Order" },
                  { value: "sale_order", label: "Sale Order" },
                  { value: "adjustment", label: "Adjustment" },
                  { value: "assignment", label: "Assignment" },
                ]}
              />

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="sm-filter-start-date"
                  className="text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-none"
                >
                  Start Date
                </Label>
                <Input
                  id="sm-filter-start-date"
                  type="date"
                  value={filters.start_date}
                  onChange={(e) =>
                    setFilters({ ...filters, start_date: e.target.value })
                  }
                  className="h-9 font-mono text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="sm-filter-end-date"
                  className="text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-none"
                >
                  End Date
                </Label>
                <Input
                  id="sm-filter-end-date"
                  type="date"
                  value={filters.end_date}
                  onChange={(e) =>
                    setFilters({ ...filters, end_date: e.target.value })
                  }
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {movements.length}
                  </span>{" "}
                  movement{movements.length !== 1 ? "s" : ""}
                  {filters.start_date && filters.end_date && (
                    <span>
                      {" "}
                      from {format(
                        new Date(filters.start_date),
                        "MMM dd"
                      )} to {format(new Date(filters.end_date), "MMM dd")}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Movements Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Movement History</CardTitle>
                <CardDescription className="mt-1">
                  Complete log of all inventory stock movements
                </CardDescription>
              </div>
              {movements.length > 0 && (
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {movements.length}{" "}
                  {movements.length === 1 ? "Record" : "Records"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {movements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No movements found
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {Object.values(filters).some((v) => v && v !== "all")
                    ? "Try adjusting your filters to see more results."
                    : "Stock movements will appear here as items are purchased, transferred, or adjusted."}
                </p>
                {Object.values(filters).some((v) => v && v !== "all") && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Date & Time</TableHead>
                      <TableHead className="w-[200px]">Type</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="w-[120px] text-center">
                        Quantity
                      </TableHead>
                      <TableHead className="w-[180px]">Location</TableHead>
                      <TableHead className="w-[140px]">Reference</TableHead>
                      <TableHead className="w-[100px] text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => {
                      const Icon =
                        movementTypeIcons[movement.movement_type] || Activity;
                      return (
                        <TableRow key={movement._id}>
                          <TableCell className="font-mono text-sm">
                            <div className="flex flex-col">
                              <span className="font-semibold">
                                {movement.movement_date
                                  ? format(
                                      new Date(movement.movement_date),
                                      "MMM dd, yyyy"
                                    )
                                  : "N/A"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {movement.movement_date
                                  ? format(
                                      new Date(movement.movement_date),
                                      "HH:mm:ss"
                                    )
                                  : ""}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                movementTypeColors[movement.movement_type]
                              }
                              variant="outline"
                            >
                              <Icon className="mr-1 h-3 w-3" />
                              {formatMovementType(movement.movement_type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {movement.item_id?.name || "Unknown Item"}
                              </span>
                              {movement.item_id?.sku && (
                                <span className="text-xs text-muted-foreground">
                                  SKU: {movement.item_id.sku}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span
                                className={`text-lg font-bold ${
                                  movement.quantity_change > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {movement.quantity_change > 0 ? "+" : ""}
                                {movement.quantity_change}
                              </span>
                              {movement.item_id?.unit && (
                                <span className="text-xs text-muted-foreground">
                                  {movement.item_id.unit}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {movement.movement_type === "transfer_out" ? (
                                <div className="flex flex-col">
                                  <span className="text-muted-foreground text-xs">
                                    From:
                                  </span>
                                  <span className="font-medium">
                                    {movement.from_location_id?.name ||
                                      "Unknown"}
                                  </span>
                                </div>
                              ) : movement.movement_type === "transfer_in" ? (
                                <div className="flex flex-col">
                                  <span className="text-muted-foreground text-xs">
                                    To:
                                  </span>
                                  <span className="font-medium">
                                    {movement.to_location_id?.name || "Unknown"}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-medium">
                                  {movement.location_id?.name ||
                                    movement.to_location_id?.name ||
                                    movement.from_location_id?.name ||
                                    "Unknown"}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {movement.reference_number || movement.reference ? (
                              <div className="flex flex-col">
                                <span className="font-mono text-xs">
                                  {movement.reference_number ||
                                    movement.reference}
                                </span>
                                {movement.reference_type && (
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {movement.reference_type.replace("_", " ")}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewDialog(movement)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Detail Dialog */}
        <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Movement Details</DialogTitle>
              <DialogDescription>Stock movement information</DialogDescription>
            </DialogHeader>
            {viewDialog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">
                      Movement Type
                    </Label>
                    <div className="mt-1">
                      <Badge
                        className={movementTypeColors[viewDialog.movement_type]}
                        variant="outline"
                      >
                        {formatMovementType(viewDialog.movement_type)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date & Time</Label>
                    <p className="mt-1">
                      {viewDialog.movement_date
                        ? format(new Date(viewDialog.movement_date), "PPP p")
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Item</Label>
                    <p className="text-lg font-medium mt-1">
                      {viewDialog.item_id?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Quantity Change
                    </Label>
                    <div className="flex items-baseline gap-2 mt-1">
                      <p
                        className={`text-2xl font-bold ${
                          viewDialog.quantity_change > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {viewDialog.quantity_change > 0 ? "+" : ""}
                        {viewDialog.quantity_change}
                      </p>
                      {viewDialog.item_id?.unit && (
                        <span className="text-sm text-muted-foreground">
                          {viewDialog.item_id.unit}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {viewDialog.item_id?.sku && (
                  <div>
                    <Label className="text-muted-foreground">SKU</Label>
                    <p className="font-mono mt-1">{viewDialog.item_id.sku}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">
                      {viewDialog.movement_type === "transfer_out"
                        ? "From Location"
                        : viewDialog.movement_type === "transfer_in"
                        ? "To Location"
                        : "Location"}
                    </Label>
                    <p className="mt-1">
                      {viewDialog.movement_type === "transfer_out"
                        ? viewDialog.from_location_id?.name || "N/A"
                        : viewDialog.movement_type === "transfer_in"
                        ? viewDialog.to_location_id?.name || "N/A"
                        : viewDialog.location_id?.name ||
                          viewDialog.to_location_id?.name ||
                          viewDialog.from_location_id?.name ||
                          "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Quantity After
                    </Label>
                    <div className="flex items-baseline gap-2 mt-1">
                      <p className="text-lg font-medium">
                        {new Intl.NumberFormat("en-US").format(
                          viewDialog.quantity_after || 0
                        )}
                      </p>
                      {viewDialog.item_id?.unit && (
                        <span className="text-sm text-muted-foreground">
                          {viewDialog.item_id.unit}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {(viewDialog.movement_type === "transfer_in" ||
                  viewDialog.movement_type === "transfer_out") &&
                  viewDialog.to_location_id &&
                  viewDialog.from_location_id && (
                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                      <div>
                        <Label className="text-muted-foreground">
                          From Location
                        </Label>
                        <p className="mt-1 font-medium">
                          {viewDialog.from_location_id.name}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">
                          To Location
                        </Label>
                        <p className="mt-1 font-medium">
                          {viewDialog.to_location_id.name}
                        </p>
                      </div>
                    </div>
                  )}

                {(viewDialog.reference_number || viewDialog.reference) && (
                  <div>
                    <Label className="text-muted-foreground">
                      Reference
                      {viewDialog.reference_type === "transfer" &&
                        " (Transfer)"}
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono">
                        {viewDialog.reference_number || viewDialog.reference}
                      </p>
                      {viewDialog.reference_type === "transfer" &&
                        viewDialog.reference_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Navigate to stock transfers page with this transfer
                              window.location.href = `/stock-transfers?highlight=${viewDialog.reference_id}`;
                            }}
                          >
                            View Transfer
                          </Button>
                        )}
                    </div>
                  </div>
                )}

                {viewDialog.performed_by && (
                  <div>
                    <Label className="text-muted-foreground">
                      Performed By
                    </Label>
                    <p className="mt-1">
                      {viewDialog.performed_by?.username || "N/A"}
                    </p>
                  </div>
                )}

                {viewDialog.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="whitespace-pre-wrap mt-1">
                      {viewDialog.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
