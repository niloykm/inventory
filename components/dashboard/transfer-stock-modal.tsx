"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InventoryItem, WarehouseLocation } from "@/types/inventory";
import {
  ArrowRight,
  AlertCircle,
  Truck,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

interface TransferStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  locations: WarehouseLocation[];
  onTransfer: (
    itemId: string,
    targetLocationId: string,
    quantity: number,
    reference?: string,
    note?: string
  ) => { reference: string; targetLocationName: string };
}

export function TransferStockModal({
  isOpen,
  onClose,
  item,
  locations,
  onTransfer,
}: TransferStockModalProps) {
  const destinationOptions = locations.filter(
    (loc) => loc.id !== "all" && loc.id !== item?.locationId
  );

  const [targetLocationId, setTargetLocationId] = useState<string>(
    destinationOptions[0]?.id || ""
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [reference, setReference] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      const nextDest = locations.find(
        (l) => l.id !== "all" && l.id !== item.locationId
      );
      setTargetLocationId(nextDest?.id || "");
      setQuantity(Math.min(Math.max(1, item.available), 5));
      setReference("");
      setNotes("");
    }
  }, [item, locations]);

  if (!item) return null;

  const isUnavailable = item.available <= 0;
  const isInvalidQty = quantity <= 0 || quantity > item.available;
  const projectedSource = Math.max(0, item.onHand - quantity);
  const targetLocation = destinationOptions.find(
    (l) => l.id === targetLocationId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUnavailable) {
      toast.error("No available stock at source warehouse to transfer.");
      return;
    }
    if (!targetLocationId) {
      toast.error("Please select a destination warehouse.");
      return;
    }
    if (isInvalidQty) {
      toast.error(
        `Transfer quantity must be between 1 and ${item.available} available ${item.unit}.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = onTransfer(
        item.id,
        targetLocationId,
        quantity,
        reference.trim(),
        notes.trim()
      );
      toast.success(
        `Transferred ${quantity} ${item.unit} of ${item.sku} to ${result.targetLocationName} (${result.reference})`
      );
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to transfer stock";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xl">
        <DialogHeader className="border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <Truck className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Inter-Warehouse Stock Transfer
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 mt-0.5">
                  Atomically move available stock between regional warehouses with audit trail
                </DialogDescription>
              </div>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold shrink-0">
              {item.sku}
            </span>
          </div>
        </DialogHeader>

        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-3 space-y-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
            {item.name}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-zinc-500 tabular-nums">
            <span>
              From:{" "}
              <strong className="font-sans text-zinc-800 dark:text-zinc-200">
                {item.locationName}
              </strong>
            </span>
            <span>
              Available:{" "}
              <strong className="text-emerald-700 dark:text-emerald-400">
                {item.available} {item.unit}
              </strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label
                htmlFor="transfer-dest"
                className="text-xs uppercase tracking-wider text-zinc-500 font-medium"
              >
                Destination Hub *
              </Label>
              <div className="relative mt-1">
                <select
                  id="transfer-dest"
                  aria-label="Destination warehouse"
                  value={targetLocationId}
                  onChange={(e) => setTargetLocationId(e.target.value)}
                  className="h-9 w-full appearance-none rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-3 pr-8 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
                >
                  {destinationOptions.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              </div>
            </div>

            <div>
              <Label
                htmlFor="transfer-qty"
                className="text-xs uppercase tracking-wider text-zinc-500 font-medium"
              >
                Transfer Quantity ({item.unit}) *
              </Label>
              <Input
                id="transfer-qty"
                type="number"
                min={1}
                max={Math.max(1, item.available)}
                value={quantity}
                disabled={isUnavailable}
                onChange={(e) =>
                  setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))
                }
                required
                className="mt-1 h-9 font-mono tabular-nums text-xs border-zinc-200 dark:border-zinc-800 focus-visible:ring-zinc-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label
                htmlFor="transfer-ref"
                className="text-xs uppercase tracking-wider text-zinc-500 font-medium"
              >
                Dispatch Manifest #
              </Label>
              <Input
                id="transfer-ref"
                placeholder="Auto-generated TRF-#"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="mt-1 h-9 font-mono text-xs border-zinc-200 dark:border-zinc-800"
              />
            </div>
            <div>
              <Label
                htmlFor="transfer-notes"
                className="text-xs uppercase tracking-wider text-zinc-500 font-medium"
              >
                Carrier / Notes
              </Label>
              <Input
                id="transfer-notes"
                placeholder="e.g. Sundarban Courier van #4"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 h-9 text-xs border-zinc-200 dark:border-zinc-800"
              />
            </div>
          </div>

          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono tabular-nums">
              <span className="text-zinc-500">Source On-Hand After Transfer:</span>
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="text-zinc-500">{item.onHand}</span>
                <ArrowRight className="h-3 w-3 text-zinc-400" />
                <span
                  className={
                    projectedSource <= item.reorderPoint
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-zinc-900 dark:text-zinc-100"
                  }
                >
                  {projectedSource} {item.unit}
                </span>
              </span>
            </div>
            {targetLocation && (
              <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="text-zinc-500">
                  Inbound to {targetLocation.code}:
                </span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  +{quantity} {item.unit}
                </span>
              </div>
            )}
            {(isUnavailable || isInvalidQty) && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {isUnavailable
                    ? "Zero available stock at source warehouse. Issue a PO to replenish first."
                    : `Quantity cannot exceed ${item.available} available ${item.unit}.`}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs border-zinc-200 dark:border-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || isUnavailable || isInvalidQty}
              className="text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isSubmitting ? "Dispatching..." : "Confirm Atomic Transfer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
