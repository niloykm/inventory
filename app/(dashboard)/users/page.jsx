"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getAllUsers,
  updateUser,
  deleteUser,
} from "@/lib/actions/users.actions";
import { UserTable } from "@/components/users/user-table";
import { UserForm } from "@/components/users/user-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import Link from "next/link";
import { PageLoader } from "@/components/ui/loader";
import { AuthGateCard } from "@/components/ui/auth-gate-card";

export default function UsersPage() {
  const {token, user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchUsers();
  }, [token, authLoading]);

  async function fetchUsers() {
    if (!token) { if (!authLoading) setLoading(false); return; }

    try {
      const result = await getAllUsers(token);
      if (result.success) {
        setUsers(result.data);
      } else {
        toast.error(result.error || "Failed to load users");
      }
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(formData) {
    if (!editDialog) return;

    setIsSubmitting(true);
    try {
      const result = await updateUser(editDialog._id, formData, token);
      if (result.success) {
        toast.success("User updated successfully");
        setEditDialog(null);
        fetchUsers();
      } else {
        toast.error(result.error || "Failed to update user");
      }
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setUserToDelete(id);
    setShowDeleteDialog(true);
  }

  async function confirmDelete() {
    if (!userToDelete) return;

    try {
      const result = await deleteUser(userToDelete, token);
      if (result.success) {
        toast.success("User deleted successfully");
        fetchUsers();
      } else {
        toast.error(result.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  }

  if (loading) {
    return <PageLoader />;
  }

  if (!token) {
    return <AuthGateCard title="User & Role Management" />;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          {isAdmin && (
            <Button asChild>
              <Link href="/users/new">
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Link>
            </Button>
          )}
        </div>

        <UserTable
          users={users}
          onEdit={(user) => setEditDialog(user)}
          onDelete={handleDelete}
          currentUserId={user?.user_id}
        />

        <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information</DialogDescription>
            </DialogHeader>
            <UserForm
              defaultValues={editDialog}
              onSubmit={handleEdit}
              isLoading={isSubmitting}
              isEdit
            />
          </DialogContent>
        </Dialog>

        <ConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete User"
          description="Are you sure you want to delete this user? This action cannot be undone."
          confirmText="Delete"
          onConfirm={confirmDelete}
          variant="destructive"
        />
      </div>
    </div>
  );
}
