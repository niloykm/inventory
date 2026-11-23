"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getAllMaintenance,
  getUpcomingMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
} from "@/lib/actions/maintenance.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Wrench, Calendar, Plus, Edit, Trash } from "lucide-react";
import { format } from "date-fns";
import { itemsApi } from "@/lib/api";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { PageLoader } from "@/components/ui/loader";
import { AuthGateCard } from "@/components/ui/auth-gate-card";

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export default function MaintenancePage() {
  const {token, isLoading: authLoading } = useAuth();
  const [maintenance, setMaintenance] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(null);
  const [formData, setFormData] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [maintenanceToDelete, setMaintenanceToDelete] = useState(null);

  useEffect(() => {
    fetchMaintenance();
    fetchItems();
  }, [token, authLoading]);

  async function fetchMaintenance() {
    if (!token) { if (!authLoading) setLoading(false); return; }

    try {
      const [allResult, upcomingResult] = await Promise.all([
        getAllMaintenance(token),
        getUpcomingMaintenance(token),
      ]);

      if (allResult.success) {
        // Ensure maintenance is always an array
        const maintenanceData = allResult.data;
        setMaintenance(Array.isArray(maintenanceData) ? maintenanceData : []);
      }

      if (upcomingResult.success) {
        // Ensure upcoming is always an array
        const upcomingData = upcomingResult.data;
        setUpcoming(Array.isArray(upcomingData) ? upcomingData : []);
      }
    } catch (error) {
      toast.error("Failed to load maintenance records");
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
      if (formDialog === "new") {
        const result = await createMaintenance(formData, token);
        if (result.success) {
          toast.success("Maintenance record created successfully");
        } else {
          toast.error(result.error || "Failed to create");
          return;
        }
      } else {
        const result = await updateMaintenance(formDialog, formData, token);
        if (result.success) {
          toast.success("Maintenance record updated successfully");
        } else {
          toast.error(result.error || "Failed to update");
          return;
        }
      }

      setFormDialog(null);
      setFormData({});
      fetchMaintenance();
    } catch (error) {
      toast.error(error.message || "Operation failed");
    }
  }

  async function handleDelete(id) {
    setMaintenanceToDelete(id);
    setShowDeleteDialog(true);
  }

  async function confirmDelete() {
    if (!maintenanceToDelete) return;

    try {
      const result = await deleteMaintenance(maintenanceToDelete, token);
      if (result.success) {
        toast.success("Maintenance record deleted successfully");
        fetchMaintenance();
      } else {
        toast.error(result.error || "Failed to delete");
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete");
    }
  }

  function openEditDialog(record) {
    setFormDialog(record._id);
    setFormData({
      item_id: record.item_id?._id || "",
      title: record.title,
      maintenance_type: record.maintenance_type,
      description: record.description,
      scheduled_date: record.scheduled_date
        ? format(new Date(record.scheduled_date), "yyyy-MM-dd")
        : "",
      priority: record.priority,
      status: record.status,
      notes: record.notes,
    });
  }

  if (loading) {
    return <PageLoader />;
  }

  if (!token) {
    return <AuthGateCard title="Maintenance Schedule" />;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            Maintenance Records
          </h2>
          <Button
            onClick={() => {
              setFormDialog("new");
              setFormData({ priority: "medium", status: "scheduled" });
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Schedule Maintenance
          </Button>
        </div>

        {/* Upcoming Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Maintenance (Next 30 Days)
            </CardTitle>
            <CardDescription>{upcoming.length} scheduled tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcoming?.map((record) => (
                <div
                  key={record._id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">{record.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {record.item_id?.name} -{" "}
                      {format(new Date(record.scheduled_date), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      className={priorityColors[record.priority]}
                      variant="outline"
                    >
                      {record.priority}
                    </Badge>
                    <Badge
                      className={statusColors[record.status]}
                      variant="outline"
                    >
                      {record.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(record)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!upcoming || upcoming.length === 0) && (
                <p className="text-center text-sm text-muted-foreground">
                  No upcoming maintenance
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* All Maintenance Records */}
        <Card>
          <CardHeader>
            <CardTitle>All Maintenance Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenance?.map((record) => (
                    <TableRow key={record._id}>
                      <TableCell className="font-medium">
                        {record.title}
                      </TableCell>
                      <TableCell>{record.item_id?.name || "N/A"}</TableCell>
                      <TableCell>{record.maintenance_type}</TableCell>
                      <TableCell>
                        {record.scheduled_date
                          ? format(
                              new Date(record.scheduled_date),
                              "MMM dd, yyyy"
                            )
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={priorityColors[record.priority]}
                          variant="outline"
                        >
                          {record.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={statusColors[record.status]}
                          variant="outline"
                        >
                          {record.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record._id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!maintenance || maintenance.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground"
                      >
                        No maintenance records found
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {formDialog === "new"
                  ? "Schedule Maintenance"
                  : "Edit Maintenance"}
              </DialogTitle>
              <DialogDescription>Enter maintenance details</DialogDescription>
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
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Oil change and filter replacement"
                />
              </div>
              <div>
                <Label>Maintenance Type</Label>
                <Select
                  value={formData.maintenance_type || "preventive"}
                  onValueChange={(v) =>
                    setFormData({ ...formData, maintenance_type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Scheduled Date</Label>
                <Input
                  type="date"
                  value={formData.scheduled_date || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduled_date: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority || "medium"}
                    onValueChange={(v) =>
                      setFormData({ ...formData, priority: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status || "scheduled"}
                    onValueChange={(v) =>
                      setFormData({ ...formData, status: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Maintenance description..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </div>
            <Button onClick={handleSubmit} className="w-full">
              {formDialog === "new"
                ? "Create Maintenance"
                : "Update Maintenance"}
            </Button>
          </DialogContent>
        </Dialog>

        <ConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Maintenance Record"
          description="Are you sure you want to delete this maintenance record? This action cannot be undone."
          confirmText="Delete"
          onConfirm={confirmDelete}
          variant="destructive"
        />
      </div>
    </div>
  );
}
