"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useInventoryStore } from "@/lib/inventory-store";
import { PreviewModeBanner } from "@/components/ui/auth-gate-card";
import apiClient from "@/lib/api-client";
import { ITEMS_ENDPOINTS } from "@/lib/config/api-endpoints";
import { ItemTable } from "@/components/inventory/item-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

export function InventoryContent() {
  const { token, user, isLoading: authLoading } = useAuth();
  const store = useInventoryStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const canEdit = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setItems(
        store.items.map((i) => ({
          _id: i.id,
          sku: i.sku,
          name: i.name,
          category: i.category,
          quantity: i.onHand,
          minimum_level: i.reorderPoint,
          unit_type: i.unit,
          status:
            i.status === "out_of_stock"
              ? "maintenance"
              : i.status === "discontinued"
              ? "retired"
              : "available",
          price: i.retailPrice,
          image_url: null,
        }))
      );
      setLoading(false);
      return;
    }
    fetchItems();
  }, [token, authLoading, store.items]);

  async function fetchItems() {
    // Allow fetching even when `token` is not present (httpOnly cookie auth)
    try {
      const response = await apiClient.get(ITEMS_ENDPOINTS.BASE, {}, token);

      // Handle the new response structure
      if (response && response.success && Array.isArray(response.data)) {
        setItems(response.data);
      } else if (Array.isArray(response)) {
        // Fallback for legacy format
        setItems(response);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Failed to load items:", error);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    setItemToDelete(id);
    setShowDeleteDialog(true);
  }

  async function confirmDelete() {
    if (!itemToDelete) return;

    try {
      await apiClient.delete(ITEMS_ENDPOINTS.BY_ID(itemToDelete), token);
      toast.success("Item deleted successfully");
      fetchItems();
    } catch (error) {
      toast.error("Failed to delete item");
    }
  }

  const filteredItems = items.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Loader className="h-full" text="Loading inventory..." />;
  }

  return (
    <div className="space-y-4">
      {!token && <PreviewModeBanner moduleName="SKU Catalog" />}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            SKU Catalog
          </h1>
          <p className="text-xs text-zinc-500">
            Master catalog of inventory SKUs, stock quantities, and unit pricing
          </p>
        </div>
        {canEdit && (
          <Button asChild size="sm">
            <Link href="/inventory/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Item
            </Link>
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <label htmlFor="inventory-search" className="sr-only">
            Search inventory items
          </label>
          <Search
            aria-hidden="true"
            className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400"
          />
          <Input
            id="inventory-search"
            placeholder="Search by SKU, name, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
      </div>

      <ItemTable
        items={filteredItems}
        onDelete={handleDelete}
        canEdit={canEdit}
      />

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
