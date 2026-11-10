"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { logo } from "@/public/images";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Download,
  Plus,
  Shield,
  LogOut,
  Bell,
  Command,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Sidebar } from "./sidebar";
import { WAREHOUSE_LOCATIONS } from "@/data/inventory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function Header() {
  const { user, logout } = useAuth();
  const [selectedHub, setSelectedHub] = useState("all");

  const currentUser = user || {
    username: "Niloy (Lead)",
    role: "admin",
    email: "niloy@aftab.com",
  };

  const handleGlobalSearchClick = () => {
    // Dispatch a synthetic Cmd+K keyboard event to open the command palette
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    );
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xs px-3 sm:px-5">
      {/* Left: Mobile Navigation Trigger & Brand Mark */}
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden h-8 w-8 border-zinc-200 dark:border-zinc-800"
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-zinc-200 dark:border-zinc-800">
            <VisuallyHidden>
              <SheetTitle>Navigation Menu</SheetTitle>
            </VisuallyHidden>
            <Sidebar className="w-full h-full border-0" />
          </SheetContent>
        </Sheet>

        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-mono font-bold text-xs">
            NI
          </div>
          <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Niloy Inventory <span className="font-mono text-zinc-400 font-normal">ERP</span>
          </span>
        </Link>
      </div>

      {/* Middle: Global Quick-Search Input with Cmd/Ctrl + K Palette Shortcut */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          type="button"
          onClick={handleGlobalSearchClick}
          className="w-full flex items-center justify-between h-8 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-xs text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer text-left"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            <span>Search SKU, barcode, supplier, or part #...</span>
          </span>
          <kbd className="inline-flex items-center gap-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 font-medium">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Hub Switcher, Notifications, User Menu */}
      <div className="flex items-center gap-2">
        {/* Warehouse Selector */}
        <div className="hidden lg:block w-[180px]">
          <Select value={selectedHub} onValueChange={setSelectedHub}>
            <SelectTrigger className="h-8 text-xs border-zinc-200 dark:border-zinc-800 font-medium bg-transparent">
              <Building2 className="h-3.5 w-3.5 text-zinc-400 mr-1 shrink-0" />
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent className="border-zinc-200 dark:border-zinc-800 text-xs">
              {WAREHOUSE_LOCATIONS.map((loc) => (
                <SelectItem key={loc.id} value={loc.id} className="text-xs">
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Global Notifications button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => toast.info("No unread system alerts. All ledger balances synchronized.")}
          className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-8 px-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-mono font-semibold">
                  {currentUser?.username?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
                  {currentUser?.username}
                </span>
                <span className="text-[10px] text-zinc-400 capitalize font-mono leading-none">
                  {currentUser?.role || "Admin"}
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
                <p className="text-[11px] text-zinc-500 font-mono">
                  {currentUser?.email}
                </p>
                <span className="inline-flex w-fit items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 capitalize">
                  Role: {currentUser?.role}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="border-zinc-100 dark:border-zinc-800" />
            <DropdownMenuItem asChild className="cursor-pointer text-xs">
              <Link href="/settings">System Configuration</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer text-xs">
              <Link href="/audit-logs">Security & Audit Logs</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="border-zinc-100 dark:border-zinc-800" />
            <DropdownMenuItem
              onClick={logout}
              className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer text-xs"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
