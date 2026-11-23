"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/ui/safe-image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash, Eye, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors = {
  available:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
  in_use:
    "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
  maintenance:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
  retired:
    "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
};

export function ItemTable({ items, onDelete, canEdit }) {
  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-50/80 dark:bg-zinc-900/60 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
            <TableHead className="w-[52px] text-xs uppercase tracking-wider text-zinc-500 font-medium">
              Asset
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
              Name
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
              Category
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-zinc-500 font-medium text-right">
              Quantity
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
              Unit
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
              Status
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-zinc-500 font-medium text-right">
              Price
            </TableHead>
            <TableHead className="text-right text-xs uppercase tracking-wider text-zinc-500 font-medium">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items?.map((item) => (
            <TableRow
              key={item._id}
              className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors border-b border-zinc-100 dark:border-zinc-800/80"
            >
              <TableCell className="py-2.5 px-3">
                <SafeImage
                  src={item.image_url}
                  alt={item.name || "Inventory item"}
                  fallbackText={item.sku || item.name || "IT"}
                  className="h-8 w-8 rounded-md"
                />
              </TableCell>
              <TableCell className="py-2.5 px-3">
                <div className="flex flex-col">
                  <Link
                    href={`/inventory/${item._id}`}
                    className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 hover:underline"
                  >
                    {item.name}
                  </Link>
                  {item.sku && (
                    <span className="font-mono text-[11px] text-zinc-500">
                      {item.sku}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="py-2.5 px-3">
                <span className="inline-flex items-center rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {item.category || "Uncategorized"}
                </span>
              </TableCell>
              <TableCell className="py-2.5 px-3 text-right font-mono tabular-nums">
                <span
                  className={cn(
                    "font-semibold text-sm",
                    item.quantity <= (item.minimum_level || 0)
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-zinc-900 dark:text-zinc-100"
                  )}
                >
                  {Number(item.quantity || 0).toLocaleString("en-BD")}
                </span>
              </TableCell>
              <TableCell className="py-2.5 px-3 font-mono text-xs text-zinc-500">
                {item.unit_type || item.unit || "units"}
              </TableCell>
              <TableCell className="py-2.5 px-3">
                <Badge
                  className={cn(
                    "font-mono text-[11px] font-semibold capitalize rounded px-2 py-0.5",
                    statusColors[item.status] || ""
                  )}
                  variant="outline"
                >
                  {(item.status || "available").replace(/_/g, " ")}
                </Badge>
              </TableCell>
              <TableCell className="py-2.5 px-3 text-right font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                ৳{Number(item.price || item.unit_price || 0).toLocaleString("en-BD", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell className="py-2.5 px-3 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Actions for ${item.name}`}
                      className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 text-xs">
                    <DropdownMenuLabel className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                      Item Actions
                    </DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/inventory/${item._id}`}
                        className="cursor-pointer"
                      >
                        <Eye className="mr-2 h-3.5 w-3.5" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    {canEdit && (
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/inventory/${item._id}/edit`}
                          className="cursor-pointer"
                        >
                          <Edit className="mr-2 h-3.5 w-3.5" />
                          Edit Item
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {canEdit && (
                      <DropdownMenuItem
                        onClick={() => onDelete(item._id)}
                        className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer"
                      >
                        <Trash className="mr-2 h-3.5 w-3.5" />
                        Delete Item
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {(!items || items.length === 0) && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12">
                <div className="flex flex-col items-center justify-center text-zinc-500">
                  <Package className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    No inventory items found
                  </p>
                  <p className="text-xs mt-1">
                    Add your first item or clear the search filter.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
