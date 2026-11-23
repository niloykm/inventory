"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { SUPPLIERS } from "@/data/inventory";
import { PreviewModeBanner } from "@/components/ui/auth-gate-card";
import apiClient from "@/lib/api-client";
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
import { Plus, Edit, Trash, Building2, Star, Eye } from "lucide-react";
import { PageLoader } from "@/components/ui/loader";

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  blocked: "bg-red-100 text-red-800",
};

export default function SuppliersPage() {
  const { token, isLoading: authLoading } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(null);
  const [viewDialog, setViewDialog] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      const mapped = SUPPLIERS.map((s) => ({
        _id: s.id,
        name: s.name,
        code: s.id.toUpperCase(),
        contact_person: s.contactPerson,
        email: s.email,
        phone: s.phone,
        status: "active",
        rating: s.rating,
        payment_terms: `Net ${s.leadTimeDays * 6}`,
        currency: "BDT",
      }));
      setSuppliers(mapped);
      setStats({
        total: mapped.length,
        active: mapped.length,
        inactive: 0,
        average_rating: 4.7,
      });
      setLoading(false);
      return;
    }
    fetchSuppliers();
    fetchStats();
  }, [token, authLoading]);

  async function fetchSuppliers() {
    if (!token) return;

    try {
      const response = await apiClient.get("/suppliers", {}, token);
      // Extract and ensure suppliers is always an array
      const suppliersData = response?.data || response;
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
    } catch (error) {
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    if (!token) return;

    try {
      const response = await apiClient.get("/suppliers/stats", {}, token);
      setStats(response.stats);
    } catch (error) {
      console.error("Failed to load stats");
    }
  }

  async function handleSubmit() {
    try {
      if (formDialog === "new") {
        await apiClient.post("/suppliers", formData, token);
        toast.success("Supplier created successfully");
      } else {
        await apiClient.put(`/suppliers/${formDialog}`, formData, token);
        toast.success("Supplier updated successfully");
      }

      setFormDialog(null);
      setFormData({});
      fetchSuppliers();
      fetchStats();
    } catch (error) {
      toast.error(error.message || "Operation failed");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this supplier?")) return;

    try {
      await apiClient.delete(`/suppliers/${id}`, token);
      toast.success("Supplier deleted successfully");
      fetchSuppliers();
      fetchStats();
    } catch (error) {
      toast.error(error.message || "Failed to delete supplier");
    }
  }

  function openEditDialog(supplier) {
    setFormDialog(supplier._id);
    setFormData({
      name: supplier.name,
      code: supplier.code,
      email: supplier.email,
      phone: supplier.phone,
      website: supplier.website,
      contact_person: supplier.contact_person,
      tax_id: supplier.tax_id,
      payment_terms: supplier.payment_terms,
      currency: supplier.currency,
      credit_limit: supplier.credit_limit,
      rating: supplier.rating,
      status: supplier.status,
      notes: supplier.notes,
    });
  }

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <div className="space-y-4">
        {!token && <PreviewModeBanner moduleName="Suppliers" />}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Suppliers</h2>
          <Button
            onClick={() => {
              setFormDialog("new");
              setFormData({
                status: "active",
                currency: "USD",
                payment_terms: "net_30",
              });
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Suppliers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.active}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {stats.inactive}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Blocked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.blocked}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Suppliers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              All Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers?.map((supplier) => (
                    <TableRow key={supplier._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          {supplier.contact_person && (
                            <div className="text-sm text-muted-foreground">
                              {supplier.contact_person}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm">
                          {supplier.code || "N/A"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {supplier.email && <div>{supplier.email}</div>}
                          {supplier.phone && (
                            <div className="text-muted-foreground">
                              {supplier.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{supplier.payment_terms || "N/A"}</TableCell>
                      <TableCell>
                        {supplier.rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{supplier.rating}/5</span>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={statusColors[supplier.status]}
                          variant="outline"
                        >
                          {supplier.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewDialog(supplier)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(supplier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(supplier._id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!suppliers || suppliers.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground"
                      >
                        No suppliers found
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Supplier Details</DialogTitle>
              <DialogDescription>
                Complete supplier information
              </DialogDescription>
            </DialogHeader>
            {viewDialog && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">
                      Supplier Name
                    </Label>
                    <p className="text-lg font-medium">{viewDialog.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Supplier Code
                    </Label>
                    <p className="text-lg font-mono">{viewDialog.code}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p>{viewDialog.email || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p>{viewDialog.phone || "N/A"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">
                      Contact Person
                    </Label>
                    <p>{viewDialog.contact_person || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Website</Label>
                    <p className="text-blue-600">
                      {viewDialog.website || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">
                      Payment Terms
                    </Label>
                    <p>{viewDialog.payment_terms || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Currency</Label>
                    <p className="font-mono">{viewDialog.currency || "USD"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">
                      Credit Limit
                    </Label>
                    <p className="text-lg">
                      {viewDialog.credit_limit
                        ? new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: viewDialog.currency || "USD",
                          }).format(viewDialog.credit_limit)
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tax ID</Label>
                    <p className="font-mono">{viewDialog.tax_id || "N/A"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Rating</Label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= (viewDialog.rating || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm">
                        ({viewDialog.rating || 0}/5)
                      </span>
                    </div>
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

                {viewDialog.address && (
                  <div>
                    <Label className="text-muted-foreground">Address</Label>
                    <p className="whitespace-pre-wrap">{viewDialog.address}</p>
                  </div>
                )}

                {viewDialog.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="whitespace-pre-wrap text-sm">
                      {viewDialog.notes}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewDialog(null);
                      openEditDialog(viewDialog);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="outline" onClick={() => setViewDialog(null)}>
                    Close
                  </Button>
                </div>
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
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {formDialog === "new" ? "Add Supplier" : "Edit Supplier"}
              </DialogTitle>
              <DialogDescription>Enter supplier details</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Supplier Name *</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="ABC Corporation"
                />
              </div>
              <div>
                <Label>Supplier Code *</Label>
                <Input
                  value={formData.code || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="SUP-001"
                />
              </div>
              <div>
                <Label>Contact Person</Label>
                <Input
                  value={formData.contact_person || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_person: e.target.value })
                  }
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="contact@supplier.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  value={formData.website || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://supplier.com"
                />
              </div>
              <div>
                <Label>Tax ID</Label>
                <Input
                  value={formData.tax_id || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_id: e.target.value })
                  }
                  placeholder="VAT/TAX ID"
                />
              </div>
              <div>
                <Label>Payment Terms</Label>
                <Select
                  value={formData.payment_terms || "net_30"}
                  onValueChange={(v) =>
                    setFormData({ ...formData, payment_terms: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="net_15">Net 15</SelectItem>
                    <SelectItem value="net_30">Net 30</SelectItem>
                    <SelectItem value="net_60">Net 60</SelectItem>
                    <SelectItem value="net_90">Net 90</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
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
              <div>
                <Label>Credit Limit</Label>
                <Input
                  type="number"
                  value={formData.credit_limit || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      credit_limit: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="10000"
                />
              </div>
              <div>
                <Label>Rating (1-5)</Label>
                <Select
                  value={formData.rating?.toString() || ""}
                  onValueChange={(v) =>
                    setFormData({ ...formData, rating: parseInt(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Star</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status || "active"}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>
            <Button onClick={handleSubmit} className="w-full">
              {formDialog === "new" ? "Create Supplier" : "Update Supplier"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
