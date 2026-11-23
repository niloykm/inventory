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
import { InventoryItem, Supplier, PurchaseOrderDraft } from "@/types/inventory";
import { ShoppingCart, ChevronDown, Clock } from "lucide-react";
import { toast } from "sonner";

interface CreatePoModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  suppliers: Supplier[];
  onCreatePo: (params: {
    itemId: string;
    quantity: number;
    supplierId: string;
    expectedDate: string;
    notes?: string;
  }) => PurchaseOrderDraft;
}

export function CreatePoModal({
  isOpen,
  onClose,
  item,
  suppliers,
  onCreatePo,
}: CreatePoModalProps) {
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || "");
  const [quantity, setQuantity] = useState<number>(25);
  const [expectedDate, setExpectedDate] = useState<string>("2026-11-28");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      const sup =
        suppliers.find((s) => s.id === item.supplierId) || suppliers[0];
      setSupplierId(sup?.id || "");
      const suggestedQty = Math.max(
        item.reorderQuantity || item.reorderPoint * 2 || 20,
        10
      );
      setQuantity(suggestedQty);
      const leadDays = sup?.leadTimeDays || 5;
      const eta = new Date(Date.now() + leadDays * 86400000)
        .toISOString()
        .slice(0, 10);
      setExpectedDate(eta);
      setNotes(
        item.onHand === 0
          ? "Urgent stockout replenishment"
          : "Threshold reorder replenishment"
      );
    }
  }, [item, suppliers]);

  if (!item) return null;

  const selectedSupplier =
    suppliers.find((s) => s.id === supplierId) || suppliers[0];
  const estimatedTotal = Math.max(0, quantity) * item.unitCost;

  const formattedTotal = new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(estimatedTotal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      toast.error("Order quantity must be greater than zero.");
      return;
    }

    setIsSubmitting(true);
    try {
      const draft = onCreatePo({
        itemId: item.id,
        quantity,
        supplierId,
        expectedDate,
        notes: notes.trim(),
      });
      toast.success(
        `Issued ${draft.poNumber} for +${draft.quantity} ${draft.unit} of ${draft.sku} (${formattedTotal})`
      );
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create Purchase Order";
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
                <ShoppingCart className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Create Replenishment Purchase Order
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 mt-0.5">
                  Dispatch supplier purchase order and track inbound batch arrival
                </DialogDescription>
              </div>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold shrink-0">
              {item.sku}
            </span>
          </div>
        </DialogHeader>

        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-3 space-y-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {item.name}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-zinc-500 tabular-nums">
            <span>
              On Hand:{" "}
              <strong
                className={
                  item.onHand === 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-amber-600 dark:text-amber-400"
                }
              >
                {item.onHand} {item.unit}
              </strong>
            </span>
            <span>
              Reorder Pt: <strong>{item.reorderPoint}</strong>
            </span>
            <span>
              Unit Cost: <strong>৳{item.unitCost.toLocaleString("en-BD")}</strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label
              htmlFor="po-supplier"
              className="text-xs uppercase tracking-wider text-zinc-500 font-medium"
            >
              Supplier *
            </Label>
            <div className="relative mt-1">
              <select
                id="po-supplier"
                aria-label="Supplier"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="h-9 w-full appearance-none rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-3 pr-8 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
              >
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} · {sup.leadTimeDays}d lead time
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            </div>
            {selectedSupplier && (
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
                <Clock className="h-3 w-3" />
                {selectedSupplier.contactPerson} · {selectedSupplier.phone}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label
                htmlFor="po-qty"
                className="text-xs uppercase tracking-wider text-zinc-500 font-medium"
              >
                Order Quantity ({item.unit}) *
              </Label>
              <Input
                id="po-qty"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                required
                className="mt-1 h-9 font-mono tabular-nums text-xs border-zinc-200 dark:border-zinc-800"
              />
            </div>

            <div>
              <Label
                htmlFor="po-eta"
                className="text-xs uppercase tracking-wider text-zinc-500 font-medium"
              >
                Expected Delivery
              </Label>
              <Input
                id="po-eta"
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="mt-1 h-9 font-mono text-xs border-zinc-200 dark:border-zinc-800"
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor="po-notes"
              className="text-xs uppercase tracking-wider text-zinc-500 font-medium"
            >
              Procurement Notes
            </Label>
            <Input
              id="po-notes"
              placeholder="Receiving bay instructions or priority note"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 h-9 text-xs border-zinc-200 dark:border-zinc-800"
            />
          </div>

          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-3 flex items-center justify-between text-xs font-mono tabular-nums">
            <span className="text-zinc-500">Estimated PO Commitment:</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {formattedTotal}
            </span>
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
              disabled={isSubmitting}
              className="text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isSubmitting ? "Issuing PO..." : "Issue Purchase Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
