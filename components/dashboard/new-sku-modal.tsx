"use client";

import React, { useState } from "react";
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
import { InventoryItem, WarehouseLocation, Supplier } from "@/types/inventory";
import { toast } from "sonner";
import { PackagePlus, ChevronDown } from "lucide-react";

interface NewSkuModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: WarehouseLocation[];
  suppliers: Supplier[];
  onAddSku: (item: InventoryItem) => void;
}

const CATEGORIES = [
  "Networking & Cabling",
  "Enterprise Hardware",
  "Power Systems",
  "Sensors & Telemetry",
  "Workwear & Safety",
  "Hardware & Fasteners",
  "Packaging & Logistics",
  "Electrical & Power",
  "Chemicals & Soldering",
];

const UNIT_TYPES = [
  "pcs",
  "boxes",
  "units",
  "spools",
  "rolls",
  "pairs",
  "tubs",
  "towers",
];

export function NewSkuModal({
  isOpen,
  onClose,
  locations,
  suppliers,
  onAddSku,
}: NewSkuModalProps) {
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [locationId, setLocationId] = useState(
    locations.find((l) => l.id !== "all")?.id || "loc-dhk-01"
  );
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "sup-01");
  const [onHand, setOnHand] = useState<number>(50);
  const [reorderPoint, setReorderPoint] = useState<number>(20);
  const [unitCost, setUnitCost] = useState<number>(1200);
  const [retailPrice, setRetailPrice] = useState<number>(1800);
  const [unit, setUnit] = useState(UNIT_TYPES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim()) {
      toast.error("SKU identifier is required.");
      return;
    }
    if (!name.trim()) {
      toast.error("Product name is required.");
      return;
    }
    if (retailPrice < unitCost) {
      toast.warning("Notice: Retail price is lower than unit cost.");
    }

    setIsSubmitting(true);
    try {
      const selectedLoc =
        locations.find((l) => l.id === locationId) || locations[1];
      const selectedSup =
        suppliers.find((s) => s.id === supplierId) || suppliers[0];

      const newItem: InventoryItem = {
        id: `item-${Date.now()}`,
        sku: sku.trim().toUpperCase(),
        barcode:
          barcode.trim() ||
          `8941${Math.floor(10000000 + Math.random() * 90000000)}`,
        name: name.trim(),
        category,
        locationId: selectedLoc.id,
        locationName: selectedLoc.name,
        onHand,
        reserved: 0,
        available: onHand,
        reorderPoint,
        reorderQuantity: Math.max(reorderPoint * 2, 20),
        unitCost,
        retailPrice,
        unit,
        status:
          onHand === 0
            ? "out_of_stock"
            : onHand <= reorderPoint
            ? "low_stock"
            : "in_stock",
        lastAudited: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        supplierId: selectedSup.id,
        supplierName: selectedSup.name,
        velocityScore: "moderate",
      };

      onAddSku(newItem);
      toast.success(`SKU [${newItem.sku}] added to active inventory catalog.`);
      onClose();
      setSku("");
      setName("");
      setBarcode("");
      setOnHand(50);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create SKU";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectClass =
    "h-9 w-full appearance-none rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-3 pr-8 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-xl rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xl">
        <DialogHeader className="border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <PackagePlus className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Register New Inventory SKU
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 mt-0.5">
                Define master SKU record, threshold rules, and initial warehouse stock allocation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label
                htmlFor="sku-code"
                className="text-xs uppercase tracking-wider text-zinc-500 font-medium"
              >
                SKU Code *
              </Label>
              <Input
                id="sku-code"
                placeholder="e.g. NET-ROUT-AX30"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                required
                className="mt-1 h-9 font-mono text-xs uppercase tracking-wider border-zinc-200 dark:border-zinc-800 focus-visible:ring-zinc-400"
              />
            </div>
            <div>
              <Label
                htmlFor="barcode-num"
                className="text-xs uppercase tracking-wider text-zinc-500 font-medium"
              >
                Barcode / EAN-13
              </Label>
              <Input
                id="barcode-num"
                placeholder="Auto-generated if empty"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="mt-1 h-9 font-mono text-xs border-zinc-200 dark:border-zinc-800"
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor="item-title"
              className="text-xs uppercase tracking-wider text-zinc-500 font-medium"
            >
              Item Name &amp; Specification *
            </Label>
            <Input
              id="item-title"
              placeholder="e.g. Gigabit Wi-Fi 6 Industrial Router 4x GE"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 h-9 text-xs border-zinc-200 dark:border-zinc-800 focus-visible:ring-zinc-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label
                htmlFor="new-sku-category"
                className="text-xs uppercase tracking-wider text-zinc-500 font-medium"
              >
                Category
              </Label>
              <div className="relative mt-1">
                <select
                  id="new-sku-category"
                  aria-label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={selectClass}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              </div>
            </div>
            <div>
              <Label
                htmlFor="new-sku-location"
                className="text-xs uppercase tracking-wider text-zinc-500 font-medium"
              >
                Primary Location
              </Label>
              <div className="relative mt-1">
                <select
                  id="new-sku-location"
                  aria-label="Primary warehouse location"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className={selectClass}
                >
                  {locations
                    .filter((l) => l.id !== "all")
                    .map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label
                htmlFor="init-stock"
                className="text-xs uppercase tracking-wider text-zinc-500 font-medium"
              >
                Initial On-Hand
              </Label>
              <Input
                id="init-stock"
                type="number"
                min={0}
                value={onHand}
                onChange={(e) => setOnHand(Math.max(0, parseInt(e.target.value, 10) || 0))}
                required
                className="mt-1 h-9 font-mono text-xs tabular-nums border-zinc-200 dark:border-zinc-800"
              />
            </div>
            <div>
              <Label
                htmlFor="reorder-lvl"
                className="text-xs uppercase tracking-wider text-zinc-500 font-medium"
              >
                Reorder Level
              </Label>
              <Input
                id="reorder-lvl"
                type="number"
                min={0}
                value={reorderPoint}
                onChange={(e) =>
                  setReorderPoint(Math.max(0, parseInt(e.target.value, 10) || 0))
                }
                required
                className="mt-1 h-9 font-mono text-xs tabular-nums border-zinc-200 dark:border-zinc-800"
              />
            </div>
            <div>
              <Label
                htmlFor="new-sku-unit"
                className="text-xs uppercase tracking-wider text-zinc-500 font-medium"
              >
                Unit Measure
              </Label>
              <div className="relative mt-1">
                <select
                  id="new-sku-unit"
                  aria-label="Unit of measure"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className={`${selectClass} font-mono`}
                >
                  {UNIT_TYPES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label
                htmlFor="unit-cost"
                className="text-xs uppercase tracking-wider text-zinc-500 font-medium"
              >
                Unit Cost (BDT)
              </Label>
              <Input
                id="unit-cost"
                type="number"
                min={0}
                value={unitCost}
                onChange={(e) =>
                  setUnitCost(Math.max(0, parseFloat(e.target.value) || 0))
                }
                required
                className="mt-1 h-9 font-mono text-xs tabular-nums border-zinc-200 dark:border-zinc-800"
              />
            </div>
            <div>
              <Label
                htmlFor="retail-price"
                className="text-xs uppercase tracking-wider text-zinc-500 font-medium"
              >
                Retail Price (BDT)
              </Label>
              <Input
                id="retail-price"
                type="number"
                min={0}
                value={retailPrice}
                onChange={(e) =>
                  setRetailPrice(Math.max(0, parseFloat(e.target.value) || 0))
                }
                required
                className="mt-1 h-9 font-mono text-xs tabular-nums border-zinc-200 dark:border-zinc-800"
              />
            </div>
            <div>
              <Label
                htmlFor="new-sku-supplier"
                className="text-xs uppercase tracking-wider text-zinc-500 font-medium"
              >
                Assigned Supplier
              </Label>
              <div className="relative mt-1">
                <select
                  id="new-sku-supplier"
                  aria-label="Assigned supplier"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className={selectClass}
                >
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              </div>
            </div>
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
              {isSubmitting ? "Creating SKU..." : "Save SKU Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
