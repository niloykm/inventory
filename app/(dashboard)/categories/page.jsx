"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCategories } from "@/lib/categories-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash,
  FolderTree,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { PageLoader } from "@/components/ui/loader";

export default function CategoriesPage() {
  const { token } = useAuth();
  const [formDialog, setFormDialog] = useState(null);
  const [formData, setFormData] = useState({});
  const [expanded, setExpanded] = useState(new Set());

  const {
    categories,
    tree,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  async function handleSubmit() {
    try {
      if (formDialog === "new") {
        await createCategory(formData);
        toast.success("Category created successfully");
      } else {
        await updateCategory(formDialog, formData);
        toast.success("Category updated successfully");
      }

      setFormDialog(null);
      setFormData({});
      // provider refreshes data
    } catch (error) {
      toast.error(error.message || "Operation failed");
    }
  }

  async function handleDelete(id) {
    if (
      !confirm(
        "Are you sure? This will fail if category has children or items."
      )
    )
      return;

    try {
      await deleteCategory(id);
      toast.success("Category deleted successfully");
    } catch (error) {
      toast.error(error.message || "Failed to delete category");
    }
  }

  function openEditDialog(category) {
    setFormDialog(category._id);
    setFormData({
      name: category.name,
      code: category.code,
      parent_id: category.parent_id?._id || null,
      description: category.description,
      sku_prefix: category.sku_prefix,
      custom_attributes: category.custom_attributes,
      image_url: category.image_url,
    });
  }

  function toggleExpand(id) {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  }

  function renderTree(nodes, level = 0) {
    return nodes.map((node) => (
      <div key={node._id} className="border-b border-zinc-200 dark:border-zinc-800 last:border-0">
        <div
          className="flex items-center justify-between p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {node.has_children ? (
              <button
                type="button"
                onClick={() => toggleExpand(node._id)}
                className="p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                aria-label={expanded.has(node._id) ? `Collapse ${node.name}` : `Expand ${node.name}`}
              >
                {expanded.has(node._id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
            <FolderTree className="h-4 w-4 text-zinc-500 shrink-0" />
            {node.image_url && !node.image_url.includes("loremflickr.com") && (
              <img
                src={node.image_url}
                alt={node.name}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                className="h-6 w-6 rounded object-cover border border-zinc-200 dark:border-zinc-800"
              />
            )}
            <span className="font-medium text-sm truncate">{node.name}</span>
            {node.code && (
              <code className="font-mono text-xs text-zinc-500">
                ({node.code})
              </code>
            )}
          </div>
          <div className="flex gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Edit ${node.name}`}
              onClick={() => openEditDialog(node)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Delete ${node.name}`}
              onClick={() => handleDelete(node._id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {expanded.has(node._id) &&
          node.children &&
          node.children.length > 0 && (
            <div>{renderTree(node.children, level + 1)}</div>
          )}
      </div>
    ));
  }

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <Button
            onClick={() => {
              setFormDialog("new");
              setFormData({});
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        {/* Category Tree */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Category Hierarchy
            </CardTitle>
            <CardDescription>
              Click to expand/collapse categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tree && tree.length > 0 ? (
              <div className="border rounded-md">{renderTree(tree)}</div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No categories found
              </div>
            )}
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
                {formDialog === "new" ? "Add Category" : "Edit Category"}
              </DialogTitle>
              <DialogDescription>Enter category details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Category Name *</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Electronics"
                />
              </div>
              <div>
                <Label>Code</Label>
                <Input
                  value={formData.code || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="ELEC"
                />
              </div>
              <div>
                <Label>Parent Category</Label>
                <Select
                  value={formData.parent_id || "none"}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      parent_id: v === "none" ? null : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (Root Category)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Root Category)</SelectItem>
                    {categories
                      .filter((c) => c._id !== formDialog)
                      .map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.path || cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>SKU Prefix</Label>
                <Input
                  value={formData.sku_prefix || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, sku_prefix: e.target.value })
                  }
                  placeholder="ELC"
                />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input
                  value={formData.image_url || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Category description..."
                  rows={3}
                />
              </div>
            </div>
            <Button onClick={handleSubmit} className="w-full">
              {formDialog === "new" ? "Create Category" : "Update Category"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
