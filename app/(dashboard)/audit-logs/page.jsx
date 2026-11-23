"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAuditLogs, getAuditStats } from "@/lib/actions/audit.actions";
import { AuditTable } from "@/components/audit/audit-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Activity, Users, FileText } from "lucide-react";
import { PageLoader } from "@/components/ui/loader";
import { AuthGateCard } from "@/components/ui/auth-gate-card";
import { NativeSelect } from "@/components/ui/native-select";

export default function AuditLogsPage() {
  const { token, isLoading: authLoading } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "all",
    entity_type: "",
    limit: 100,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [token, authLoading, filters]);

  async function fetchData() {
    if (!token) return;

    // Build filters for API: omit `action` when user selected "all"
    const apiFilters = { ...filters };
    if (apiFilters.action === "all") {
      delete apiFilters.action;
    }

    try {
      const [logsResult, statsResult] = await Promise.all([
        getAuditLogs(token, apiFilters),
        getAuditStats(token),
      ]);

      if (logsResult.success) {
        // Ensure logs is always an array
        const logsData = logsResult.data;
        setLogs(Array.isArray(logsData) ? logsData : []);
      }

      if (statsResult.success) {
        setStats(statsResult.data);
      }
    } catch (error) {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <PageLoader />;
  }

  if (!token) {
    return (
      <AuthGateCard
        title="Security & Audit Logs"
        description="Sign in with an administrator account to inspect system audit trails, operator actions, and session telemetry."
      />
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_logs || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unique Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.by_user?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Action Types
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.by_action?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter audit logs by action or entity type
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <NativeSelect
              id="audit-filter-action"
              label="Action"
              value={filters.action}
              onChange={(e) =>
                setFilters({ ...filters, action: e.target.value })
              }
              options={[
                { value: "all", label: "All actions" },
                { value: "create", label: "Create" },
                { value: "update", label: "Update" },
                { value: "delete", label: "Delete" },
                { value: "login", label: "Login" },
                { value: "logout", label: "Logout" },
              ]}
            />

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="audit-filter-entity"
                className="text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-none"
              >
                Entity Type
              </Label>
              <Input
                id="audit-filter-entity"
                placeholder="e.g., item, user, assignment"
                value={filters.entity_type}
                onChange={(e) =>
                  setFilters({ ...filters, entity_type: e.target.value })
                }
                className="h-9 text-sm"
              />
            </div>

            <NativeSelect
              id="audit-filter-limit"
              label="Result Limit"
              value={filters.limit.toString()}
              onChange={(e) =>
                setFilters({ ...filters, limit: parseInt(e.target.value, 10) })
              }
              options={[
                { value: "50", label: "50 logs" },
                { value: "100", label: "100 logs" },
                { value: "200", label: "200 logs" },
                { value: "500", label: "500 logs" },
              ]}
            />
          </CardContent>
        </Card>

        <AuditTable logs={logs} />
      </div>
    </div>
  );
}
