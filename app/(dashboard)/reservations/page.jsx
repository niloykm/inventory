"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import {
  getAllReservations,
  createReservation,
  updateReservation,
  deleteReservation,
} from "@/lib/actions/reservations.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Calendar, Plus, Edit, Trash } from "lucide-react";
import { PageLoader } from "@/components/ui/loader";
import { AuthGateCard } from "@/components/ui/auth-gate-card";
import { itemsApi } from "@/lib/api";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function ReservationsPage() {
  const {token, user, isLoading: authLoading } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchReservations();
    fetchItems();
  }, [token, authLoading]);

  async function fetchReservations() {
    if (!token) { if (!authLoading) setLoading(false); return; }

    try {
      const result = await getAllReservations(token);
      if (result.success) {
        // Ensure reservations is always an array
        const reservationsData = result.data;
        setReservations(
          Array.isArray(reservationsData) ? reservationsData : []
        );
      } else {
        toast.error(result.error || "Failed to load reservations");
      }
    } catch (error) {
      toast.error("Failed to load reservations");
    } finally {
      setLoading(false);
    }
  }

  async function fetchItems() {
    if (!token) { if (!authLoading) setLoading(false); return; }

    try {
      const response = await itemsApi.getAll(token);
      const itemsList = Array.isArray(response)
        ? response
        : response?.items || response?.data || [];
      setItems(itemsList);
    } catch (error) {
      console.error("Failed to load items");
    }
  }

  async function handleSubmit() {
    try {
      // Auto-fill user_id with current user
      const dataToSubmit = {
        ...formData,
        user_id: formData.user_id || user?.userId,
      };

      if (formDialog === "new") {
        const result = await createReservation(dataToSubmit, token);
        if (result.success) {
          toast.success("Reservation created successfully");
        } else {
          toast.error(result.error || "Failed to create");
          return;
        }
      } else {
        const result = await updateReservation(formDialog, dataToSubmit, token);
        if (result.success) {
          toast.success("Reservation updated successfully");
        } else {
          toast.error(result.error || "Failed to update");
          return;
        }
      }

      setFormDialog(null);
      setFormData({});
      fetchReservations();
    } catch (error) {
      toast.error(error.message || "Operation failed");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this reservation?")) return;

    try {
      const result = await deleteReservation(id, token);
      if (result.success) {
        toast.success("Reservation deleted successfully");
        fetchReservations();
      } else {
        toast.error(result.error || "Failed to delete");
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete");
    }
  }

  function openEditDialog(reservation) {
    setFormDialog(reservation._id);
    setFormData({
      item_id: reservation.item_id?._id || "",
      quantity: reservation.quantity,
      start_date: reservation.start_date
        ? format(new Date(reservation.start_date), "yyyy-MM-dd")
        : "",
      end_date: reservation.end_date
        ? format(new Date(reservation.end_date), "yyyy-MM-dd")
        : "",
      status: reservation.status,
      purpose: reservation.purpose,
    });
  }

  if (loading) {
    return <PageLoader />;
  }

  if (!token) {
    return <AuthGateCard title="Stock Reservations" />;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Reservations</h2>
          <Button
            onClick={() => {
              setFormDialog("new");
              setFormData({ status: "pending" });
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Reservation
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              All Reservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Reserved By</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations?.map((reservation) => (
                    <TableRow key={reservation._id}>
                      <TableCell className="font-medium">
                        {reservation.item_id?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {reservation.user_id?.username || "N/A"}
                      </TableCell>
                      <TableCell>{reservation.quantity}</TableCell>
                      <TableCell>
                        {reservation.start_date
                          ? format(
                              new Date(reservation.start_date),
                              "MMM dd, yyyy"
                            )
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {reservation.end_date
                          ? format(
                              new Date(reservation.end_date),
                              "MMM dd, yyyy"
                            )
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={statusColors[reservation.status]}
                          variant="outline"
                        >
                          {reservation.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(reservation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(reservation._id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!reservations || reservations.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground"
                      >
                        No reservations found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Form Dialog */}
        <Dialog
          open={!!formDialog}
          onOpenChange={() => {
            setFormDialog(null);
            setFormData({});
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {formDialog === "new" ? "New Reservation" : "Edit Reservation"}
              </DialogTitle>
              <DialogDescription>Enter reservation details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Item *</Label>
                <Select
                  value={formData.item_id || ""}
                  onValueChange={(v) =>
                    setFormData({ ...formData, item_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item._id} value={item._id}>
                        {item.name} ({item.quantity || 0} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.start_date || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={formData.end_date || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Purpose</Label>
                <Input
                  value={formData.purpose || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                  placeholder="Purpose of reservation"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status || "pending"}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSubmit} className="w-full">
              {formDialog === "new"
                ? "Create Reservation"
                : "Update Reservation"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
