"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { assignmentsApi } from "@/lib/api";
import { AssignmentTable } from "@/components/assignments/assignment-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PageLoader } from "@/components/ui/loader";
import { AuthGateCard } from "@/components/ui/auth-gate-card";
import { Plus } from "lucide-react";

export default function AssignmentsPage() {
  const {token, isLoading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returnDialog, setReturnDialog] = useState(null);
  const [returnQuantity, setReturnQuantity] = useState("");

  useEffect(() => {
    fetchAssignments();
  }, [token, authLoading]);

  async function fetchAssignments() {
    if (!token) { if (!authLoading) setLoading(false); return; }

    try {
      const response = await assignmentsApi.getAll(token);
      // Handle both direct data and wrapped response
      const data = response?.data || response;
      setAssignments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load assignments:", error);
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }

  async function handleReturn() {
    if (!returnDialog) return;

    try {
      await assignmentsApi.return(
        returnDialog._id,
        {
          return_notes: returnQuantity,
          condition_at_return: "good",
        },
        token
      );
      toast.success("Item returned successfully");
      setReturnDialog(null);
      setReturnQuantity("");
      fetchAssignments();
    } catch (error) {
      console.error("Failed to return item:", error);
      toast.error("Failed to return item");
    }
  }

  if (loading) {
    return <PageLoader />;
  }

  if (!token) {
    return <AuthGateCard title="Asset Assignments" />;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Assignments</h2>
          <Button asChild>
            <Link href="/assignments/new">
              <Plus className="mr-2 h-4 w-4" />
              New Assignment
            </Link>
          </Button>
        </div>

        <AssignmentTable
          assignments={assignments}
          onReturn={(assignment) => {
            setReturnDialog(assignment);
            setReturnQuantity("");
          }}
        />

        <Dialog
          open={!!returnDialog}
          onOpenChange={() => setReturnDialog(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Return Item</DialogTitle>
              <DialogDescription>
                Confirm the return of this assigned item
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Item</Label>
                <p className="text-sm text-muted-foreground">
                  {returnDialog?.item_name || "N/A"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Employee</Label>
                <p className="text-sm text-muted-foreground">
                  {returnDialog?.employee_name || "N/A"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <p className="text-sm text-muted-foreground">
                  {returnDialog?.quantity || 0}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="return-notes">Return Notes (Optional)</Label>
                <Input
                  id="return-notes"
                  placeholder="Add any notes about the return..."
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReturnDialog(null)}>
                Cancel
              </Button>
              <Button onClick={handleReturn}>Return Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
