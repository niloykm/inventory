"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
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
import { Label } from "@/components/ui/label";
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
  Bell,
  BellOff,
  Eye,
  Trash,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import apiClient from "@/lib/api-client";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { PageLoader } from "@/components/ui/loader";
import { AuthGateCard } from "@/components/ui/auth-gate-card";

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const priorityIcons = {
  low: Info,
  medium: Bell,
  high: AlertTriangle,
  urgent: XCircle,
};

export default function NotificationsPage() {
  const {token, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDialog, setViewDialog] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, [token, authLoading]);

  async function fetchNotifications() {
    if (!token) { if (!authLoading) setLoading(false); return; }
    try {
      const response = await apiClient.get("/notifications", {}, token);
      setNotifications(
        Array.isArray(response) ? response : response?.data || []
      );
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(id) {
    try {
      await apiClient.post(`/notifications/${id}/read`, {}, token);
      toast.success("Notification marked as read");
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  }

  async function handleMarkAsUnread(id) {
    try {
      await apiClient.post(`/notifications/${id}/unread`, {}, token);
      toast.success("Notification marked as unread");
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to mark as unread");
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await apiClient.post("/notifications/mark-all-read", {}, token);
      toast.success("All notifications marked as read");
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  }

  async function handleDelete(id) {
    setNotificationToDelete(id);
    setShowDeleteDialog(true);
  }

  async function confirmDelete() {
    if (!notificationToDelete) return;

    try {
      await apiClient.delete(`/notifications/${notificationToDelete}`, token);
      toast.success("Notification deleted");
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const stats = {
    total: notifications.length,
    unread: unreadCount,
    urgent: notifications.filter((n) => n.priority === "urgent" && !n.is_read)
      .length,
    high: notifications.filter((n) => n.priority === "high" && !n.is_read)
      .length,
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!token) {
    return <AuthGateCard title="Notifications Center" />;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${
                    unreadCount > 1 ? "s" : ""
                  }`
                : "All caught up!"}
            </p>
          </div>
          <Button onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <Bell className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.unread}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.urgent}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                High Priority
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.high}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unread Notifications */}
        {unreadCount > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Unread Notifications
              </CardTitle>
              <CardDescription>
                {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {notifications
                  .filter((n) => !n.is_read)
                  .map((notification) => {
                    const Icon = priorityIcons[notification.priority] || Info;
                    return (
                      <div
                        key={notification._id}
                        className="flex items-start gap-4 p-4 border rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <div className="mt-1">
                          <Icon
                            className={`h-5 w-5 ${
                              notification.priority === "urgent"
                                ? "text-red-600"
                                : notification.priority === "high"
                                ? "text-orange-600"
                                : notification.priority === "medium"
                                ? "text-yellow-600"
                                : "text-blue-600"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold">
                                {notification.title}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {notification.created_at
                                  ? format(
                                      new Date(notification.created_at),
                                      "PPP p"
                                    )
                                  : "N/A"}
                              </p>
                            </div>
                            <Badge
                              className={priorityColors[notification.priority]}
                              variant="outline"
                            >
                              {notification.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewDialog(notification)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification._id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(notification._id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => {
                    const Icon = priorityIcons[notification.priority] || Info;
                    return (
                      <TableRow
                        key={notification._id}
                        className={notification.is_read ? "opacity-60" : ""}
                      >
                        <TableCell>
                          <Icon
                            className={`h-4 w-4 ${
                              notification.priority === "urgent"
                                ? "text-red-600"
                                : notification.priority === "high"
                                ? "text-orange-600"
                                : notification.priority === "medium"
                                ? "text-yellow-600"
                                : "text-blue-600"
                            }`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {notification.title}
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {notification.message}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={priorityColors[notification.priority]}
                            variant="outline"
                          >
                            {notification.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {notification.created_at
                            ? format(
                                new Date(notification.created_at),
                                "MMM dd, yyyy"
                              )
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {notification.is_read ? (
                            <Badge variant="outline" className="bg-gray-100">
                              <BellOff className="mr-1 h-3 w-3" />
                              Read
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-blue-100 text-blue-800"
                            >
                              <Bell className="mr-1 h-3 w-3" />
                              Unread
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewDialog(notification)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {notification.is_read ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleMarkAsUnread(notification._id)
                                }
                              >
                                <Bell className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleMarkAsRead(notification._id)
                                }
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(notification._id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {notifications.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground"
                      >
                        No notifications found
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
              <DialogTitle>{viewDialog?.title}</DialogTitle>
              <DialogDescription>Notification details</DialogDescription>
            </DialogHeader>
            {viewDialog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Priority</Label>
                    <div className="mt-1">
                      <Badge
                        className={priorityColors[viewDialog.priority]}
                        variant="outline"
                      >
                        {viewDialog.priority}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      {viewDialog.is_read ? (
                        <Badge variant="outline" className="bg-gray-100">
                          Read
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-blue-100 text-blue-800"
                        >
                          Unread
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Message</Label>
                  <p className="mt-1 whitespace-pre-wrap">
                    {viewDialog.message}
                  </p>
                </div>

                {viewDialog.type && (
                  <div>
                    <Label className="text-muted-foreground">Type</Label>
                    <p className="mt-1 capitalize">{viewDialog.type}</p>
                  </div>
                )}

                {viewDialog.action_url && (
                  <div>
                    <Label className="text-muted-foreground">Action</Label>
                    <Button asChild variant="link" className="mt-1 p-0 h-auto">
                      <a href={viewDialog.action_url}>
                        {viewDialog.action_text || "View Details"}
                      </a>
                    </Button>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground">Received</Label>
                  <p className="mt-1">
                    {viewDialog.created_at
                      ? format(new Date(viewDialog.created_at), "PPP p")
                      : "N/A"}
                  </p>
                </div>

                {viewDialog.is_read && viewDialog.read_at && (
                  <div>
                    <Label className="text-muted-foreground">Read At</Label>
                    <p className="mt-1">
                      {format(new Date(viewDialog.read_at), "PPP p")}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t">
                  {!viewDialog.is_read && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleMarkAsRead(viewDialog._id);
                        setViewDialog(null);
                      }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Read
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setViewDialog(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <ConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Notification"
          description="Are you sure you want to delete this notification? This action cannot be undone."
          confirmText="Delete"
          onConfirm={confirmDelete}
          variant="destructive"
        />
      </div>
    </div>
  );
}
