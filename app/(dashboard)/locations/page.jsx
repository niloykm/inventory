"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { WAREHOUSE_LOCATIONS } from "@/data/inventory";
import { PreviewModeBanner } from "@/components/ui/auth-gate-card";
import { locationsApi } from "@/lib/api";
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
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash, MapPin } from "lucide-react";
import { PageLoader } from "@/components/ui/loader";

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  maintenance: "bg-yellow-100 text-yellow-800",
};

export default function LocationsPage() {
  const { token, user, isLoading: authLoading } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(null);
  const [formData, setFormData] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);

  const canEdit = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setLocations(
        WAREHOUSE_LOCATIONS.filter((l) => l.id !== "all").map((l) => ({
          _id: l.id,
          name: l.name,
          type: l.type,
          status: "active",
          address: l.city,
          capacity: l.type === "warehouse" ? 5000 : 2500,
          current_usage: l.type === "warehouse" ? 2140 : 860,
        }))
      );
      setLoading(false);
      return;
    }
    fetchLocations();
  }, [token, authLoading]);

  async function fetchLocations() {
    if (!token) return;

    try {
      const data = await locationsApi.getAll(token);
      // Ensure locations is always an array
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to load locations");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    try {
      const result =
        formDialog === "new"
          ? await locationsApi.create(formData, token)
          : await locationsApi.update(formDialog, formData, token);

      toast.success(
        `Location ${formDialog === "new" ? "created" : "updated"} successfully`
      );
      setFormDialog(null);
      setFormData({});
      fetchLocations();
    } catch (error) {
      toast.error(error.message || "Operation failed");
    }
  }

  async function handleDelete(id) {
    setLocationToDelete(id);
    setShowDeleteDialog(true);
  }

  async function confirmDelete() {
    if (!locationToDelete) return;

    try {
      await locationsApi.delete(locationToDelete, token);
      toast.success("Location deleted successfully");
      fetchLocations();
    } catch (error) {
      toast.error(error.message || "Failed to delete location");
    }
  }

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <div className="space-y-4">
        {!token && <PreviewModeBanner moduleName="Locations" />}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Locations</h2>
          {canEdit && (
            <Button
              onClick={() => {
                setFormDialog("new");
                setFormData({});
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations?.map((location) => (
            <Card key={location._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {location.name}
                    </CardTitle>
                    <CardDescription>{location.type}</CardDescription>
                  </div>
                  <Badge
                    className={statusColors[location.status]}
                    variant="outline"
                  >
                    {location.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {location.address && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Address:</span>{" "}
                    {location.address}
                  </div>
                )}
                {location.capacity && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Capacity:</span>{" "}
                    {location.current_usage || 0} / {location.capacity}
                  </div>
                )}
                {canEdit && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setFormDialog(location._id);
                        setFormData(location);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(location._id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {(!locations || locations.length === 0) && (
            <div className="col-span-full text-center text-muted-foreground py-8">
              No locations found
            </div>
          )}
        </div>

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
                {formDialog === "new" ? "Add Location" : "Edit Location"}
              </DialogTitle>
              <DialogDescription>Enter location details</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-4"
            >
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Type *</Label>
                <Select
                  value={formData.type || "warehouse"}
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="store">Store</SelectItem>
                    <SelectItem value="facility">Facility</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={formData.address || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={formData.capacity || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <Button type="submit">
                {formDialog === "new" ? "Create" : "Update"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Location"
          description="Are you sure you want to delete this location? This action cannot be undone."
          confirmText="Delete"
          onConfirm={confirmDelete}
          variant="destructive"
        />
      </div>
    </div>
  );
}
