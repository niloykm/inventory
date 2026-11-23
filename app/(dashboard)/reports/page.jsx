"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getLowStockReport,
  getAssignedItemsReport,
  exportItemsCSV,
  exportAssignmentsCSV,
  exportLowStockCSV,
} from "@/lib/actions/reports.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoader } from "@/components/ui/loader";
import { AuthGateCard } from "@/components/ui/auth-gate-card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Download, Package, AlertTriangle, Users } from "lucide-react";
import { downloadBlob } from "@/lib/client-utils";

export default function ReportsPage() {
  const {token, isLoading: authLoading } = useAuth();
  const [lowStock, setLowStock] = useState([]);
  const [assignedItems, setAssignedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(10);

  useEffect(() => {
    fetchReports();
  }, [token, authLoading]);

  useEffect(() => {
    if (token) {
      fetchReports();
    }
  }, [threshold, token]);

  async function fetchReports() {
    if (!token) { if (!authLoading) setLoading(false); return; }

    try {
      const [lowStockResult, assignedResult] = await Promise.all([
        getLowStockReport(token, threshold),
        getAssignedItemsReport(token),
      ]);

      if (lowStockResult.success) {
        // Ensure lowStock is always an array
        const lowStockData = lowStockResult.data;
        setLowStock(Array.isArray(lowStockData) ? lowStockData : []);
      }

      if (assignedResult.success) {
        // Ensure assignedItems is always an array
        const assignedData = assignedResult.data;
        setAssignedItems(Array.isArray(assignedData) ? assignedData : []);
      }
    } catch (error) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(type) {
    try {
      let result;
      let filename;

      switch (type) {
        case "items":
          result = await exportItemsCSV(token);
          filename = "items-export.csv";
          break;
        case "assignments":
          result = await exportAssignmentsCSV(token);
          filename = "assignments-export.csv";
          break;
        case "lowstock":
          result = await exportLowStockCSV(token, threshold);
          filename = "low-stock-export.csv";
          break;
        default:
          return;
      }

      if (result.success && result.blob) {
        downloadBlob(result.blob, filename);
        toast.success("Export downloaded successfully");
      } else {
        toast.error(result.error || "Export failed");
      }
    } catch (error) {
      toast.error("Failed to export data");
    }
  }

  if (loading) {
    return <PageLoader />;
  }

  if (!token) {
    return <AuthGateCard title="Inventory Reports & Analytics" />;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>

        {/* Export Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
            <CardDescription>Download reports in CSV format</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => handleExport("items")} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export All Items
            </Button>
            <Button
              onClick={() => handleExport("assignments")}
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Assignments
            </Button>
            <Button onClick={() => handleExport("lowstock")} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Low Stock
            </Button>
          </CardContent>
        </Card>

        {/* Low Stock Report */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Low Stock Items
                </CardTitle>
                <CardDescription>Items below minimum threshold</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label>Threshold:</Label>
                <Input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value) || 10)}
                  min="1"
                  max="1000"
                  className="w-20"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Minimum Level</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock?.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <span className="text-amber-600 font-semibold">
                          {item.quantity} {item.unit_type}
                        </span>
                      </TableCell>
                      <TableCell>{item.minimum_level || 0}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200"
                        >
                          Low Stock
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!lowStock || lowStock.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        No low stock items
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Items Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Currently Assigned Items
            </CardTitle>
            <CardDescription>Items currently assigned to users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedItems?.map((assignment) => (
                    <TableRow key={assignment._id}>
                      <TableCell className="font-medium">
                        {assignment.item_id?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {assignment.assigned_to_user_id?.username || "N/A"}
                      </TableCell>
                      <TableCell>{assignment.quantity}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {assignment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!assignedItems || assignedItems.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground"
                      >
                        No items currently assigned
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
