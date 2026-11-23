"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getAllApprovals,
  getPendingApprovals,
  approveRequest,
  rejectRequest,
  createApproval,
  deleteApproval,
} from "@/lib/actions/approvals.actions";
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
import { CheckCircle, XCircle, Clock, Plus, Trash } from "lucide-react";
import { format } from "date-fns";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { InputDialog } from "@/components/ui/input-dialog";
import { PageLoader } from "@/components/ui/loader";
import { AuthGateCard } from "@/components/ui/auth-gate-card";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-red-100 text-red-800",
};

export default function ApprovalsPage() {
  const {token, user, isLoading: authLoading } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(null);
  const [formData, setFormData] = useState({});
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [approvalToAction, setApprovalToAction] = useState(null);

  const canApprove = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    fetchApprovals();
  }, [token, authLoading]);

  async function fetchApprovals() {
    if (!token) { if (!authLoading) setLoading(false); return; }

    try {
      const [allResult, pendingResult] = await Promise.all([
        getAllApprovals(token),
        getPendingApprovals(token),
      ]);

      if (allResult.success) {
        // Ensure approvals is always an array
        const approvalsData = allResult.data;
        setApprovals(Array.isArray(approvalsData) ? approvalsData : []);
      }

      if (pendingResult.success) {
        // Ensure pending is always an array
        const pendingData = pendingResult.data;
        setPending(Array.isArray(pendingData) ? pendingData : []);
      }
    } catch (error) {
      toast.error("Failed to load approvals");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id) {
    setApprovalToAction(id);
    setShowApproveDialog(true);
  }

  async function confirmApprove(notes) {
    if (!approvalToAction) return;

    try {
      const result = await approveRequest(approvalToAction, notes, token);
      if (result.success) {
        toast.success("Request approved successfully");
        fetchApprovals();
      } else {
        toast.error(result.error || "Failed to approve request");
      }
    } catch (error) {
      toast.error("Failed to approve request");
    }
  }

  async function handleReject(id) {
    setApprovalToAction(id);
    setShowRejectDialog(true);
  }

  async function confirmReject(notes) {
    if (!approvalToAction || !notes) return;

    try {
      const result = await rejectRequest(approvalToAction, notes, token);
      if (result.success) {
        toast.success("Request rejected");
        fetchApprovals();
      } else {
        toast.error(result.error || "Failed to reject request");
      }
    } catch (error) {
      toast.error("Failed to reject request");
    }
  }

  async function handleSubmit() {
    try {
      const dataToSubmit = {
        ...formData,
        requested_by: formData.requested_by || user?.user_id || user?._id,
      };

      if (!dataToSubmit.requested_by) {
        toast.error("User not authenticated");
        return;
      }

      if (!dataToSubmit.request_type || !dataToSubmit.title) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (formDialog === "new") {
        const result = await createApproval(dataToSubmit, token);
        if (result.success) {
          toast.success("Approval request created successfully");
        } else {
          toast.error(result.error || "Failed to create");
          return;
        }
      } else {
        toast.error("Editing approvals is not supported");
        return;
      }

      setFormDialog(null);
      setFormData({});
      fetchApprovals();
    } catch (error) {
      toast.error(error.message || "Operation failed");
    }
  }

  async function handleDelete(id) {
    setApprovalToAction(id);
    setShowDeleteDialog(true);
  }

  async function confirmDelete() {
    if (!approvalToAction) return;

    try {
      const result = await deleteApproval(approvalToAction, token);
      if (result.success) {
        toast.success("Approval request deleted successfully");
        fetchApprovals();
      } else {
        toast.error(result.error || "Failed to delete");
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete");
    }
  }

  if (loading) {
    return <PageLoader />;
  }

  if (!token) {
    return <AuthGateCard title="Approval Workflows" />;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Approvals</h2>
          <Button
            onClick={() => {
              setFormDialog("new");
              setFormData({
                status: "pending",
                priority: "medium",
                request_type: "purchase",
              });
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </div>

        {/* Pending Approvals */}
        {canApprove && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Pending Approvals
              </CardTitle>
              <CardDescription>
                {pending.length} requests awaiting approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pending?.map((approval) => (
                  <div
                    key={approval._id}
                    className="flex items-center justify-between border p-4 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{approval.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Requested by: {approval.requested_by?.username} -{" "}
                        {approval.request_type}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        className={priorityColors[approval.priority]}
                        variant="outline"
                      >
                        {approval.priority}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(approval._id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(approval._id)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(approval._id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!pending || pending.length === 0) && (
                  <p className="text-center text-sm text-muted-foreground">
                    No pending approvals
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Approvals */}
        <Card>
          <CardHeader>
            <CardTitle>All Approval Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvals?.map((approval) => (
                    <TableRow key={approval._id}>
                      <TableCell className="font-medium">
                        {approval.title}
                      </TableCell>
                      <TableCell>{approval.request_type}</TableCell>
                      <TableCell>
                        {approval.requested_by?.username || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={priorityColors[approval.priority]}
                          variant="outline"
                        >
                          {approval.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {approval.created_at
                          ? format(
                              new Date(approval.created_at),
                              "MMM dd, yyyy"
                            )
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={statusColors[approval.status]}
                          variant="outline"
                        >
                          {approval.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(approval._id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!approvals || approvals.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground"
                      >
                        No approval requests found
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
                {formDialog === "new"
                  ? "New Approval Request"
                  : "Edit Approval Request"}
              </DialogTitle>
              <DialogDescription>Enter request details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Request Type *</Label>
                <Select
                  value={formData.request_type || ""}
                  onValueChange={(v) =>
                    setFormData({ ...formData, request_type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="reservation">Reservation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
                  placeholder="Request title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Detailed description"
                  rows={3}
                />
              </div>
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: parseFloat(e.target.value),
                    })
                  }
                  placeholder="0.00"
                />
              </div>
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
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSubmit} className="w-full">
              {formDialog === "new" ? "Create Request" : "Update Request"}
            </Button>
          </DialogContent>
        </Dialog>

        <InputDialog
          open={showApproveDialog}
          onOpenChange={setShowApproveDialog}
          title="Approve Request"
          description="Add approval notes (optional)"
          label="Approval Notes"
          placeholder="Enter any additional notes..."
          required={false}
          onConfirm={confirmApprove}
          confirmText="Approve"
        />

        <InputDialog
          open={showRejectDialog}
          onOpenChange={setShowRejectDialog}
          title="Reject Request"
          description="Please provide a reason for rejection"
          label="Rejection Reason"
          placeholder="Enter the reason for rejection..."
          required={true}
          onConfirm={confirmReject}
          confirmText="Reject"
          variant="destructive"
        />

        <ConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Approval Request"
          description="Are you sure you want to delete this approval request? This action cannot be undone."
          confirmText="Delete"
          onConfirm={confirmDelete}
          variant="destructive"
        />
      </div>
    </div>
  );
}
