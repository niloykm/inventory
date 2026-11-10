"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InventoryItem } from "@/types/inventory";
import { Search, ArrowRight, Package, RefreshCw, Barcode } from "lucide-react";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

interface QuickSearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onSelectItem: (item: InventoryItem) => void;
}

export function QuickSearchPalette({
  isOpen,
  onClose,
  items,
  onSelectItem,
}: QuickSearchPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = items.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      item.sku.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.barcode?.toLowerCase().includes(q) ||
      item.supplierName?.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }).slice(0, 8);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      onSelectItem(filtered[selectedIndex]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden gap-0">
        <VisuallyHidden>
          <DialogTitle>Quick Inventory Search Palette</DialogTitle>
        </VisuallyHidden>
        <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 px-3.5 py-3">
          <Search className="h-4 w-4 text-zinc-400 mr-2 shrink-0" />
          <Input
            ref={inputRef}
            placeholder="Search SKU, barcode, title, supplier... (Press ESC to exit)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="border-0 shadow-none focus-visible:ring-0 text-sm h-7 p-0 bg-transparent placeholder:text-zinc-400"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/80 p-1">
          {filtered.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={item.id}
                onClick={() => {
                  onSelectItem(item);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`p-2.5 rounded-md flex items-center justify-between cursor-pointer transition-colors text-xs ${
                  isSelected
                    ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Package className="h-4 w-4 text-zinc-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{item.sku}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {item.barcode}
                      </span>
                    </div>
                    <p className="truncate text-zinc-500 text-[11px]">{item.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right font-mono tabular-nums">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {item.onHand} {item.unit}
                    </span>
                    <span className="block text-[10px] text-zinc-400">
                      ৳{item.retailPrice.toLocaleString()}
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-zinc-400">
              No matching SKUs found for "{query}".
            </div>
          )}
        </div>

        <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
          <span>Use ↑ ↓ to navigate</span>
          <span>↵ Enter to select & adjust stock</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
