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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryItem, AdjustmentReason } from "@/types/inventory";
import { AlertCircle, ArrowRight, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onAdjust: (
    itemId: string,
    delta: number,
    reason: string,
    reference?: string,
    note?: string
  ) => void;
}

const ADJUSTMENT_REASONS: AdjustmentReason[] = [
  "Damaged",
  "Stocktake Audit",
  "Return",
  "Purchase Order Received",
  "Fulfillment",
  "Write-off",
  "Supplier RMA",
];

export function AdjustStockModal({
  isOpen,
  onClose,
  item,
  onAdjust,
}: AdjustStockModalProps) {
  const [direction, setDirection] = useState<"increment" | "decrement">("increment");
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<AdjustmentReason>("Stocktake Audit");
  const [reference, setReference] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setDirection(item.onHand === 0 ? "increment" : "decrement");
      setReason(item.onHand === 0 ? "Purchase Order Received" : "Damaged");
      setReference("");
      setNotes("");
    }
  }, [item]);

  if (!item) return null;

  const numericDelta = direction === "increment" ? Math.abs(quantity) : -Math.abs(quantity);
  const projectedOnHand = item.onHand + numericDelta;
  const isInvalid = direction === "decrement" && item.onHand < Math.abs(quantity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      toast.error("Adjustment quantity must be greater than zero.");
      return;
    }
    if (isInvalid) {
      toast.error(`Cannot decrease by ${quantity}. Current on-hand is ${item.onHand}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      onAdjust(item.id, numericDelta, reason, reference.trim(), notes.trim());
      toast.success(
        `Stock updated for ${item.sku}: ${numericDelta > 0 ? "+" : ""}${numericDelta} ${item.unit}`
      );
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to adjust stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xl">
        <DialogHeader className="border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Log Stock Count Adjustment
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 mt-0.5">
                Record an audited inventory balance correction with immutable ledger entry
              </DialogDescription>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium">
              {item.sku}
            </span>
          </div>
        </DialogHeader>

        {/* Item context banner */}
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-3 space-y-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
            {item.name}
          </p>
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 tabular-nums">
            <span>Location: <strong className="text-zinc-700 dark:text-zinc-300 font-sans">{item.locationName}</strong></span>
            <span>Current On-Hand: <strong className="text-zinc-900 dark:text-zinc-100">{item.onHand} {item.unit}</strong></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action Direction Selector */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
              Adjustment Type
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setDirection("increment")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                  direction === "increment"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500"
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                Inbound / Increment (+)
              </button>
              <button
                type="button"
                onClick={() => setDirection("decrement")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                  direction === "decrement"
                    ? "border-rose-600 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-500"
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                <Minus className="h-3.5 w-3.5" />
                Shrinkage / Decrement (-)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Quantity */}
            <div>
              <Label htmlFor="delta-qty" className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
                Adjustment Delta ({item.unit})
              </Label>
              <Input
                id="delta-qty"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                required
                className="mt-1 font-mono tabular-nums text-sm border-zinc-200 dark:border-zinc-800 focus-visible:ring-zinc-400"
              />
            </div>

            {/* Audit Reason */}
            <div>
              <Label className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
                Audit Reason *
              </Label>
              <Select
                value={reason}
                onValueChange={(val) => setReason(val as AdjustmentReason)}
              >
                <SelectTrigger className="mt-1 text-xs border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent className="border-zinc-200 dark:border-zinc-800">
                  {ADJUSTMENT_REASONS.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reference & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ref-code" className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
                Document / Ref #
              </Label>
              <Input
                id="ref-code"
                placeholder="e.g. AUD-2026-04, PO-991"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="mt-1 font-mono text-xs border-zinc-200 dark:border-zinc-800"
              />
            </div>
            <div>
              <Label htmlFor="audit-notes" className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
                Operator Note
              </Label>
              <Input
                id="audit-notes"
                placeholder="e.g. Physical recount bay B2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 text-xs border-zinc-200 dark:border-zinc-800"
              />
            </div>
          </div>

          {/* Projected impact preview */}
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/40 p-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">Projected Balance:</span>
              <div className="flex items-center gap-2 font-bold tabular-nums">
                <span className="text-zinc-600 dark:text-zinc-400">{item.onHand}</span>
                <ArrowRight className="h-3 w-3 text-zinc-400" />
                <span className={projectedOnHand < item.reorderPoint ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
                  {projectedOnHand} {item.unit}
                </span>
              </div>
            </div>
            {isInvalid && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Adjustment exceeds current physical on-hand quantity!</span>
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
              disabled={isSubmitting || isInvalid}
              className="text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isSubmitting ? "Writing Ledger..." : "Commit Ledger Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
