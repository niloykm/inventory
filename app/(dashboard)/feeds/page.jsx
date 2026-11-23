"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { feedsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Edit, Trash, AlertCircle } from "lucide-react";
import { PageLoader } from "@/components/ui/loader";
import { AuthGateCard } from "@/components/ui/auth-gate-card";
import Link from "next/link";
import { format, isPast, parseISO } from "date-fns";

export default function FeedsPage() {
  const {token, user, isLoading: authLoading } = useAuth();
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);

  const canEdit = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    fetchFeeds();
  }, [token, authLoading]);

  async function fetchFeeds() {
    if (!token) { if (!authLoading) setLoading(false); return; }

    try {
      const data = await feedsApi.getAll(token);
      // Ensure feeds is always an array
      setFeeds(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to load feeds");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this feed?")) return;

    try {
      await feedsApi.delete(id, token);
      toast.success("Feed deleted successfully");
      fetchFeeds();
    } catch (error) {
      toast.error("Failed to delete feed");
    }
  }

  function isExpired(expiryDate) {
    if (!expiryDate) return false;
    return isPast(parseISO(expiryDate));
  }

  if (loading) {
    return <PageLoader />;
  }

  if (!token) {
    return <AuthGateCard title="Feed Inventory" />;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Feeds</h2>
          {canEdit && (
            <Button asChild>
              <Link href="/feeds/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Feed
              </Link>
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {feeds?.map((feed) => (
            <Card
              key={feed._id}
              className={isExpired(feed.expiry_date) ? "border-red-300" : ""}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {feed.name}
                      {isExpired(feed.expiry_date) && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </CardTitle>
                    <CardDescription>{feed.feed_type}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span
                    className={
                      feed.quantity <= (feed.minimum_level || 0)
                        ? "text-amber-600 font-semibold"
                        : ""
                    }
                  >
                    {feed.quantity} {feed.unit_type}
                  </span>
                </div>
                {feed.unit_price && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Unit Price:</span>
                    <span>${feed.unit_price.toFixed(2)}</span>
                  </div>
                )}
                {feed.batch_number && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Batch:</span>
                    <span>{feed.batch_number}</span>
                  </div>
                )}
                {feed.expiry_date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expiry:</span>
                    <span
                      className={
                        isExpired(feed.expiry_date)
                          ? "text-red-600 font-semibold"
                          : ""
                      }
                    >
                      {format(parseISO(feed.expiry_date), "MMM dd, yyyy")}
                    </span>
                  </div>
                )}
                {feed.supplier_name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Supplier:</span>
                    <span>{feed.supplier_name}</span>
                  </div>
                )}

                {canEdit && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/feeds/${feed._id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(feed._id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {(!feeds || feeds.length === 0) && (
            <div className="col-span-full text-center text-muted-foreground py-8">
              No feeds found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
