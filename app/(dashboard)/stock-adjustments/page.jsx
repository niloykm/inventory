"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useInventoryStore } from "@/lib/inventory-store";
import { WAREHOUSE_LOCATIONS } from "@/data/inventory";
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
import { Textarea } from "@/components/ui/textarea";
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
  CheckCircle,
  XCircle,
  Plus,
  Trash,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import apiClient from "@/lib/api-client";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { PageLoader, TableLoader } from "@/components/ui/loader";

const reasonOptions = [
  { value: "damage", label: "Damage" },
  { value: "theft", label: "Theft" },
  { value: "loss", label: "Loss" },
  { value: "found", label: "Found Item" },
  { value: "expired", label: "Expired" },
  { value: "quality_issue", label: "Quality Issue" },
  { value: "physical_count", label: "Physical Count" },
  { value: "other", label: "Other" },
];

export default function StockAdjustmentsPage() {
  const { token, user, isLoading: authLoading } = useAuth();
  const store = useInventoryStore();
  const [adjustments, setAdjustments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [adjustmentToDelete, setAdjustmentToDelete] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    item_id: "",
    adjustment_type: "decrease",
    quantity: "",
    reason: "damage",
    notes: "",
    location_id: "",
  });

  const canApprove = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      const previewAdj = store.movements
        .filter((m) => m.type === "adjustment" || m.type === "audit")
        .map((m) => ({
          _id: m.id,
          adjustment_number: m.reference || m.id.toUpperCase(),
          item_id: { name: `${m.sku} — ${m.itemName}` },
          adjustment_type: m.quantityDelta >= 0 ? "increase" : "decrease",
          quantity: Math.abs(m.quantityDelta),
          reason: m.reason,
          status: "approved",
          created_by: { username: m.operator },
          created_at: m.timestamp,
        }));
      setAdjustments(previewAdj);
      setStats({
        total: previewAdj.length,
        pending: 0,
        approved: previewAdj.length,
        total_increase: previewAdj
          .filter((a) => a.adjustment_type === "increase")
          .reduce((s, a) => s + a.quantity, 0),
        total_decrease: previewAdj
          .filter((a) => a.adjustment_type === "decrease")
          .reduce((s, a) => s + a.quantity, 0),
      });
      setItems(store.items.map((i) => ({ _id: i.id, name: `${i.sku} — ${i.name}` })));
      setLocations(
        WAREHOUSE_LOCATIONS.filter((l) => l.id !== "all").map((l) => ({
          _id: l.id,
          name: l.name,
        }))
      );
      setLoading(false);
      return;
    }
    fetchInitialData();
  }, [token, authLoading, store.movements, store.items]);

  async function fetchInitialData() {
    if (!token) return;
    try {
      await Promise.all([
        fetchAdjustments(),
        fetchStats(),
        fetchItems(),
        fetchLocations(),
      ]);
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAdjustments() {
    try {
      const response = await apiClient.get("/stock-adjustments", {}, token);
      setAdjustments(Array.isArray(response) ? response : response.data || []);
    } catch (error) {
      toast.error("Failed to load adjustments");
    }
  }

  async function fetchStats() {
    try {
      const response = await apiClient.get("/stock-adjustments/stats", {}, token);
      setStats(response.stats || {});
    } catch (error) {
      console.error("Failed to load stats");
    }
  }

  async function fetchItems() {
    try {
      const response = await apiClient.get("/items?limit=1000", {}, token);
      setItems(response.data || []);
    } catch (error) {
      console.error("Failed to load items");
    }
  }

  async function fetchLocations() {
    try {
      const response = await apiClient.get("/locations", {}, token);
      setLocations(response.data || []);
    } catch (error) {
      console.error("Failed to load locations");
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await apiClient.post("/stock-adjustments", {
        ...formData,
        quantity: parseFloat(formData.quantity)
      }, token);
      
      toast.success("Adjustment created");
      setShowCreateDialog(false);
      resetForm();
      fetchAdjustments();
      fetchStats();
    } catch (error) {
      toast.error(error.message || "Failed to create adjustment");
    }
  }

  function resetForm() {
    setFormData({
      item_id: "",
      adjustment_type: "decrease",
      quantity: "",
      reason: "damage",
      notes: "",
      location_id: "",
    });
  }

  async function handleApprove(id) {
    try {
      await apiClient.post(`/stock-adjustments/${id}/approve`, {}, token);
      toast.success("Adjustment approved");
      fetchAdjustments();
      fetchStats();
    } catch (error) {
      toast.error("Failed to approve");
    }
  }

  async function handleReject(id) {
    try {
      await apiClient.post(`/stock-adjustments/${id}/reject`, {}, token);
      toast.success("Adjustment rejected");
      fetchAdjustments();
      fetchStats();
    } catch (error) {
      toast.error("Failed to reject");
    }
  }

  async function handleDelete(id) {
    setAdjustmentToDelete(id);
    setShowDeleteDialog(true);
  }

  async function confirmDelete() {
    if (!adjustmentToDelete) return;
    try {
      await apiClient.delete(`/stock-adjustments/${adjustmentToDelete}`, token);
      toast.success("Adjustment deleted");
      fetchAdjustments();
      fetchStats();
    } catch (error) {
      toast.error("Failed to delete");
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <div className="space-y-4">
        {!token && <PreviewModeBanner moduleName="Stock Adjustments" />}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Stock Adjustments</h2>
            <p className="text-muted-foreground mt-1">Manage inventory corrections and reconciliations</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Adjustment
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Today's Adjustments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.today || 0}</div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Increases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.increases || 0}</div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Decreases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.decreases || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No adjustments found
                    </TableCell>
                  </TableRow>
                ) : (
                  adjustments.map((adj) => (
                    <TableRow key={adj._id}>
                      <TableCell className="font-medium">
                        {adj.item_id?.name || "Unknown Item"}
                        <div className="text-xs text-muted-foreground">{adj.item_id?.sku}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {adj.adjustment_type === "increase" ? (
                            <ArrowUpCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="capitalize">{adj.adjustment_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>{adj.quantity}</TableCell>
                      <TableCell className="capitalize">{adj.reason?.replace("_", " ")}</TableCell>
                      <TableCell>
                        {adj.created_at ? format(new Date(adj.created_at), "MMM dd, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          adj.status === "approved" ? "secondary" : 
                          adj.status === "rejected" ? "destructive" : "outline"
                        } className={
                          adj.status === "approved" ? "bg-green-100 text-green-800" :
                          adj.status === "pending" ? "bg-yellow-100 text-yellow-800" : ""
                        }>
                          {adj.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {adj.status === "pending" && canApprove && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleApprove(adj._id)} title="Approve">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleReject(adj._id)} title="Reject">
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(adj._id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Stock Adjustment</DialogTitle>
              <DialogDescription>Record a stock level correction</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <NativeSelect
                id="adj-item-select"
                label="Item *"
                value={formData.item_id}
                onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                required
                options={[
                  { value: "", label: "Select item...", disabled: true },
                  ...items.map((item) => ({
                    value: item._id,
                    label: `${item.name}${item.quantity !== undefined ? ` (Current: ${item.quantity})` : ""}`,
                  })),
                ]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NativeSelect
                  id="adj-type-select"
                  label="Adjustment Type"
                  value={formData.adjustment_type}
                  onChange={(e) =>
                    setFormData({ ...formData, adjustment_type: e.target.value })
                  }
                  options={[
                    { value: "increase", label: "Increase (+)" },
                    { value: "decrease", label: "Decrease (-)" },
                  ]}
                />
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="adj-qty-input"
                    className="text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-none"
                  >
                    Quantity *
                  </Label>
                  <Input
                    id="adj-qty-input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    className="h-9 font-mono text-sm tabular-nums"
                  />
                </div>
              </div>

              <NativeSelect
                id="adj-reason-select"
                label="Audit Reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                options={reasonOptions}
              />

              <NativeSelect
                id="adj-location-select"
                label="Warehouse Location (Optional)"
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                options={[
                  { value: "", label: "All / Default Location" },
                  ...locations.map((loc) => ({ value: loc._id, label: loc.name })),
                ]}
              />

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button type="submit">Create Adjustment</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Adjustment"
          description="Are you sure? This cannot be undone."
          confirmText="Delete"
          variant="destructive"
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  );
}
