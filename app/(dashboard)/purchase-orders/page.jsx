"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useInventoryStore } from "@/lib/inventory-store";
import { SUPPLIERS } from "@/data/inventory";
import { PreviewModeBanner } from "@/components/ui/auth-gate-card";
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
  Plus,
  Edit,
  Trash,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  Package,
} from "lucide-react";
import { format } from "date-fns";
import apiClient from "@/lib/api-client";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { PageLoader } from "@/components/ui/loader";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  ordered: "bg-purple-100 text-purple-800",
  received: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function PurchaseOrdersPage() {
  const { token, user, isLoading: authLoading } = useAuth();
  const store = useInventoryStore();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(null);
  const [viewDialog, setViewDialog] = useState(null);
  const [formData, setFormData] = useState({});
  const [poItems, setPoItems] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [poToDelete, setPoToDelete] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setPurchaseOrders(
        store.purchaseOrders.map((po) => ({
          _id: po.id,
          po_number: po.poNumber,
          supplier_id: { _id: po.supplierId, name: po.supplierName },
          order_date: po.createdAt,
          expected_delivery_date: po.expectedDate,
          status: po.status === "ordered" ? "submitted" : po.status,
          currency: "BDT",
          total_amount: po.totalCostBDT,
          notes: po.notes,
          items: [
            {
              item_id: { _id: po.itemId, name: `${po.sku} — ${po.itemName}` },
              quantity: po.quantity,
              unit_price: po.unitCost,
              received_quantity: po.status === "received" ? po.quantity : 0,
            },
          ],
        }))
      );
      setSuppliers(SUPPLIERS.map((s) => ({ _id: s.id, name: s.name })));
      setItems(store.items.map((i) => ({ _id: i.id, name: `${i.sku} — ${i.name}`, price: i.unitCost })));
      setLoading(false);
      return;
    }
    fetchPurchaseOrders();
    fetchSuppliers();
    fetchItems();
  }, [token, authLoading, store.purchaseOrders, store.items]);

  async function fetchPurchaseOrders() {
    if (!token) return;
    try {
      const response = await apiClient.get("/purchase-orders", {}, token);
      setPurchaseOrders(
        Array.isArray(response) ? response : response?.data || []
      );
    } catch (error) {
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  }

  async function fetchSuppliers() {
    if (!token) return;
    try {
      const response = await apiClient.get("/suppliers", {}, token);
      setSuppliers(Array.isArray(response) ? response : response?.data || []);
    } catch (error) {
      console.error("Failed to load suppliers");
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

  async function handleSubmit() {
    try {
      const dataToSubmit = {
        ...formData,
        items: poItems,
        created_by: user?.userId,
        total_amount: poItems.reduce(
          (sum, item) => sum + item.quantity * item.unit_price,
          0
        ),
      };

      if (formDialog === "new") {
        await apiClient.post("/purchase-orders", dataToSubmit, token);
        toast.success("Purchase order created successfully");
      } else {
        await apiClient.put(
          `/purchase-orders/${formDialog}`,
          dataToSubmit,
          token
        );
        toast.success("Purchase order updated successfully");
      }

      setFormDialog(null);
      setFormData({});
      setPoItems([]);
      fetchPurchaseOrders();
    } catch (error) {
      toast.error(error.message || "Operation failed");
    }
  }

  async function handleDelete(id) {
    setPoToDelete(id);
    setShowDeleteDialog(true);
  }

  async function confirmDelete() {
    if (!poToDelete) return;

    try {
      await apiClient.delete(`/purchase-orders/${poToDelete}`, token);
      toast.success("Purchase order deleted successfully");
      fetchPurchaseOrders();
    } catch (error) {
      toast.error("Failed to delete purchase order");
    }
  }

  async function handleApprove(id) {
    try {
      await apiClient.post(`/purchase-orders/${id}/approve`, {}, token);
      toast.success("Purchase order approved");
      fetchPurchaseOrders();
    } catch (error) {
      toast.error("Failed to approve purchase order");
    }
  }

  async function handleReceive(id) {
    try {
      await apiClient.post(`/purchase-orders/${id}/receive`, {}, token);
      toast.success("Purchase order received");
      fetchPurchaseOrders();
    } catch (error) {
      toast.error("Failed to receive purchase order");
    }
  }

  function openEditDialog(po) {
    setFormDialog(po._id);
    setFormData({
      supplier_id: po.supplier_id?._id || "",
      order_date: po.order_date
        ? format(new Date(po.order_date), "yyyy-MM-dd")
        : "",
      expected_delivery: po.expected_delivery_date || po.expected_delivery
        ? format(new Date(po.expected_delivery_date || po.expected_delivery), "yyyy-MM-dd")
        : "",
      currency: po.currency || "USD",
      notes: po.notes || "",
    });
    
    // Transform items from backend format to frontend format
    const transformedItems = (po.items || []).map(item => ({
      item_id: item.item_id?._id || item.item_id,
      quantity: item.quantity_ordered || item.quantity || 0,
      unit_price: item.unit_price || 0
    }));
    
    setPoItems(transformedItems);
  }

  function addPoItem() {
    setPoItems([...poItems, { item_id: "", quantity: 1, unit_price: 0 }]);
  }

  function removePoItem(index) {
    setPoItems(poItems.filter((_, i) => i !== index));
  }

  function updatePoItem(index, field, value) {
    const updated = [...poItems];
    updated[index][field] = value;
    setPoItems(updated);
  }

  const formatCurrency = (value, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value || 0);
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <div className="space-y-4">
        {!token && <PreviewModeBanner moduleName="Purchase Orders" />}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
          <Button
            onClick={() => {
              setFormDialog("new");
              setFormData({ status: "pending", currency: "USD" });
              setPoItems([]);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Purchase Order
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          {["pending", "approved", "ordered", "received", "cancelled"].map(
            (status) => (
              <Card key={status}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {status}
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {purchaseOrders.filter((po) => po.status === status).length}
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>

        {/* Purchase Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po._id}>
                      <TableCell className="font-mono">
                        {po.po_number || po._id.slice(-8)}
                      </TableCell>
                      <TableCell>{po.supplier_id?.name || "N/A"}</TableCell>
                      <TableCell>
                        {po.order_date
                          ? format(new Date(po.order_date), "MMM dd, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {po.expected_delivery
                          ? format(
                              new Date(po.expected_delivery),
                              "MMM dd, yyyy"
                            )
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(po.total_amount, po.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={statusColors[po.status]}
                          variant="outline"
                        >
                          {po.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewDialog(po)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {po.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove(po._id)}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(po)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {po.status === "approved" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReceive(po._id)}
                            >
                              <Package className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(po._id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {purchaseOrders.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground"
                      >
                        No purchase orders found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Detail Dialog */}
        <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Purchase Order Details</DialogTitle>
              <DialogDescription>
                PO #{viewDialog?.po_number || viewDialog?._id?.slice(-8)}
              </DialogDescription>
            </DialogHeader>
            {viewDialog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Supplier</Label>
                    <p className="text-lg font-medium">
                      {viewDialog.supplier_id?.name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge
                      className={statusColors[viewDialog.status]}
                      variant="outline"
                    >
                      {viewDialog.status}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Order Date</Label>
                    <p>
                      {viewDialog.order_date
                        ? format(new Date(viewDialog.order_date), "PPP")
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Expected Delivery
                    </Label>
                    <p>
                      {viewDialog.expected_delivery
                        ? format(new Date(viewDialog.expected_delivery), "PPP")
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Items</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewDialog.items?.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.item_id?.name || "N/A"}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            {formatCurrency(
                              item.unit_price,
                              viewDialog.currency
                            )}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(
                              item.quantity * item.unit_price,
                              viewDialog.currency
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-end">
                    <div className="text-right">
                      <Label className="text-muted-foreground">
                        Total Amount
                      </Label>
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          viewDialog.total_amount,
                          viewDialog.currency
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {viewDialog.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="whitespace-pre-wrap">{viewDialog.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Form Dialog */}
        <Dialog
          open={!!formDialog}
          onOpenChange={() => {
            setFormDialog(null);
            setFormData({});
            setPoItems([]);
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {formDialog === "new"
                  ? "New Purchase Order"
                  : "Edit Purchase Order"}
              </DialogTitle>
              <DialogDescription>
                Enter purchase order details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Supplier *</Label>
                  <Select
                    value={formData.supplier_id || ""}
                    onValueChange={(v) =>
                      setFormData({ ...formData, supplier_id: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier._id} value={supplier._id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select
                    value={formData.currency || "USD"}
                    onValueChange={(v) =>
                      setFormData({ ...formData, currency: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="INR">INR</SelectItem>
                      <SelectItem value="BDT">BDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Order Date *</Label>
                  <Input
                    type="date"
                    value={formData.order_date || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, order_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Expected Delivery</Label>
                  <Input
                    type="date"
                    value={formData.expected_delivery || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expected_delivery: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Items *</Label>
                  <Button type="button" size="sm" onClick={addPoItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                {poItems.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 mb-2 items-end"
                  >
                    <div className="col-span-5">
                      <Select
                        value={item.item_id}
                        onValueChange={(v) => updatePoItem(index, "item_id", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((it) => (
                            <SelectItem key={it._id} value={it._id}>
                              {it.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) =>
                          updatePoItem(
                            index,
                            "quantity",
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Unit Price"
                        value={item.unit_price}
                        onChange={(e) =>
                          updatePoItem(
                            index,
                            "unit_price",
                            parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removePoItem(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="text-right">
                    <Label className="text-muted-foreground">
                      Total Amount
                    </Label>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        poItems.reduce(
                          (sum, item) => sum + item.quantity * item.unit_price,
                          0
                        ),
                        formData.currency
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={handleSubmit} className="w-full">
              {formDialog === "new"
                ? "Create Purchase Order"
                : "Update Purchase Order"}
            </Button>
          </DialogContent>
        </Dialog>

        <ConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Purchase Order"
          description="Are you sure you want to delete this purchase order? This action cannot be undone."
          confirmText="Delete"
          onConfirm={confirmDelete}
          variant="destructive"
        />
      </div>
    </div>
  );
}
