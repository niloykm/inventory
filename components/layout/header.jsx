"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useWarehouse } from "@/lib/warehouse-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  Search,
  Building2,
  LogOut,
  LogIn,
  Bell,
} from "lucide-react";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Sidebar } from "./sidebar";
import { toast } from "sonner";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { selectedLocation, setSelectedLocation, locations } = useWarehouse();

  const currentUser = user || {
    username: "Demo Operator",
    role: "admin",
    email: "demo@niloyinventory.app",
  };

  const handleGlobalSearchClick = () => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    );
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xs px-3 sm:px-5">
      {/* Left: Mobile Drawer Trigger & Brand Mark */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Open navigation menu"
              className="md:hidden h-8 w-8 rounded-md border-zinc-200 dark:border-zinc-800 shrink-0"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-64 border-zinc-200 dark:border-zinc-800"
          >
            <VisuallyHidden>
              <SheetTitle>Navigation Menu</SheetTitle>
            </VisuallyHidden>
            <Sidebar className="w-full h-full border-0" />
          </SheetContent>
        </Sheet>

        <Link
          href="/dashboard"
          className="flex items-center gap-2 min-w-0 md:hidden"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-mono font-bold text-xs">
            NI
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 truncate">
            Niloy Inventory
          </span>
        </Link>

        {/* Global Quick-Search Input Trigger (Desktop) */}
        <div className="hidden md:block w-72 lg:w-96">
          <button
            type="button"
            onClick={handleGlobalSearchClick}
            aria-label="Open quick inventory search palette"
            className="w-full flex items-center justify-between h-8 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-xs text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                Search SKU, barcode, supplier, or part #...
              </span>
            </span>
            <kbd className="inline-flex items-center rounded bg-zinc-200/70 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 font-medium shrink-0 ml-2">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>

      {/* Right: Unified Warehouse Switcher, Search (Mobile), Alerts, User Menu */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mobile Quick Search Icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGlobalSearchClick}
          aria-label="Quick search inventory"
          className="md:hidden h-8 w-8 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Unified Accessible Warehouse Location Switcher with paired <label htmlFor> */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="header-warehouse-select"
            className="sr-only xl:not-sr-only text-xs font-medium text-zinc-500 whitespace-nowrap"
          >
            Warehouse
          </label>
          <NativeSelect
            id="header-warehouse-select"
            size="sm"
            icon={<Building2 className="h-3.5 w-3.5" />}
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            options={locations.map((loc) => ({
              value: loc.id,
              label: loc.name,
            }))}
            wrapperClassName="w-[155px] sm:w-[225px]"
          />
        </div>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="System notifications"
          onClick={() =>
            toast.info(
              "Stock telemetry active. Check below-reorder alerts on the Health Bar."
            )
          }
          className="hidden sm:inline-flex h-8 w-8 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <Bell className="h-4 w-4" />
        </Button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              aria-label="Operator account menu"
              className="flex items-center gap-2 h-8 px-1.5 sm:px-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400"
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[11px] font-mono font-semibold">
                  {currentUser?.username?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block text-left">
                <span className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
                  {currentUser?.username}
                </span>
                <span className="text-[10px] text-zinc-500 capitalize font-mono leading-none">
                  {isAuthenticated ? currentUser?.role || "admin" : "preview"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 border-zinc-200 dark:border-zinc-800 text-xs"
            align="end"
          >
            <DropdownMenuLabel className="font-normal p-2">
              <div className="flex flex-col space-y-1">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {currentUser?.username}
                </p>
                <p className="text-[11px] text-zinc-500 font-mono truncate">
                  {currentUser?.email}
                </p>
                <span className="inline-flex w-fit items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 capitalize">
                  {isAuthenticated ? `Role: ${currentUser?.role}` : "Preview Session"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="border-zinc-100 dark:border-zinc-800" />
            <DropdownMenuItem asChild className="cursor-pointer text-xs">
              <Link href="/settings">System Configuration</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer text-xs">
              <Link href="/audit-logs">Security &amp; Audit Logs</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="border-zinc-100 dark:border-zinc-800" />
            {isAuthenticated ? (
              <DropdownMenuItem
                onClick={logout}
                className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer text-xs"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Sign Out
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild className="cursor-pointer text-xs">
                <Link href="/login">
                  <LogIn className="mr-2 h-3.5 w-3.5" />
                  Sign In as Operator
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
