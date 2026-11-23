"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { WAREHOUSE_LOCATIONS } from "@/data/inventory";
import { WarehouseLocation } from "@/types/inventory";

interface WarehouseContextValue {
  selectedLocation: string;
  setSelectedLocation: (locationId: string) => void;
  activeWarehouse: WarehouseLocation;
  locations: WarehouseLocation[];
}

const WarehouseContext = createContext<WarehouseContextValue | undefined>(undefined);

const VALID_IDS = new Set(WAREHOUSE_LOCATIONS.map((l) => l.id));

export function WarehouseProvider({ children }: { children: React.ReactNode }) {
  const [selectedLocation, setSelectedLocationState] = useState<string>("all");

  // Sync initial location from URL param on mount (client-only to prevent SSR mismatch)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const loc = params.get("location");
    if (loc && VALID_IDS.has(loc)) {
      setSelectedLocationState(loc);
    }
  }, []);

  const setSelectedLocation = useCallback((locationId: string) => {
    const safeId = VALID_IDS.has(locationId) ? locationId : "all";
    setSelectedLocationState(safeId);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (safeId === "all") {
        url.searchParams.delete("location");
      } else {
        url.searchParams.set("location", safeId);
      }
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, []);

  const activeWarehouse =
    WAREHOUSE_LOCATIONS.find((l) => l.id === selectedLocation) ||
    WAREHOUSE_LOCATIONS[0];

  return (
    <WarehouseContext.Provider
      value={{
        selectedLocation,
        setSelectedLocation,
        activeWarehouse,
        locations: WAREHOUSE_LOCATIONS,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse(): WarehouseContextValue {
  const ctx = useContext(WarehouseContext);
  if (!ctx) {
    throw new Error("useWarehouse must be used within WarehouseProvider");
  }
  return ctx;
}
