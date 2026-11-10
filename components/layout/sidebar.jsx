"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { logo } from "@/public/images";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Building2,
  Sliders,
  Activity,
  Truck,
  FolderTree,
  MapPin,
  UserCheck,
  Wrench,
  BarChart3,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  PackageCheck,
  PawPrint,
  Wheat,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const primaryNavItems = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: "Live",
  },
  {
    name: "Products / SKU Catalog",
    href: "/inventory",
    icon: Package,
  },
  {
    name: "Inbound / Orders",
    href: "/purchase-orders",
    icon: ShoppingCart,
  },
  {
    name: "Suppliers",
    href: "/suppliers",
    icon: Building2,
  },
  {
    name: "Stock Adjustments",
    href: "/stock-adjustments",
    icon: Sliders,
  },
  {
    name: "Stock Movements",
    href: "/stock-movements",
    icon: Activity,
  },
  {
    name: "Stock Transfers",
    href: "/stock-transfers",
    icon: Truck,
  },
];

const secondaryNavItems = [
  {
    name: "Categories",
    href: "/categories",
    icon: FolderTree,
  },
  {
    name: "Locations",
    href: "/locations",
    icon: MapPin,
  },
  {
    name: "Assignments",
    href: "/assignments",
    icon: UserCheck,
  },
  {
    name: "Maintenance",
    href: "/maintenance",
    icon: Wrench,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "Audit Logs",
    href: "/audit-logs",
    icon: FileText,
  },
  {
    name: "Users",
    href: "/users",
    icon: Users,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({ className }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const currentUser = user || {
    username: "Niloy (Lead)",
    role: "admin",
    email: "niloy@aftab.com",
  };

  const isActive = (href) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-all duration-200 select-none",
        collapsed ? "w-16" : "w-60",
        className
      )}
    >
      {/* 1. Header & Collapse Trigger */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-zinc-200 dark:border-zinc-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 overflow-hidden"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold font-mono text-xs">
            IMS
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase truncate">
                Niloy Inventory
              </h2>
              <p className="text-[10px] text-zinc-400 font-mono leading-none">
                Enterprise ERP v2.5
              </p>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer hidden md:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* 2. Navigation List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Core Operations Section */}
        <div>
          {!collapsed && (
            <div className="px-2 mb-1 text-[10px] font-semibold font-mono uppercase tracking-wider text-zinc-400">
              Operations
            </div>
          )}
          <div className="space-y-0.5">
            {primaryNavItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer group relative",
                    active
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-200"
                  )}
                >
                  {/* High contrast active edge indicator */}
                  {active && (
                    <span className="absolute left-0 top-1 bottom-1 w-1 bg-zinc-900 dark:bg-zinc-100 rounded-r" />
                  )}
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform",
                      active
                        ? "text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                    )}
                  />
                  {!collapsed && (
                    <div className="flex flex-1 items-center justify-between min-w-0">
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Secondary Modules */}
        <div>
          {!collapsed && (
            <div className="px-2 mb-1 text-[10px] font-semibold font-mono uppercase tracking-wider text-zinc-400">
              Governance & Admin
            </div>
          )}
          <div className="space-y-0.5">
            {secondaryNavItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer group relative",
                    active
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-200"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1 bottom-1 w-1 bg-zinc-900 dark:bg-zinc-100 rounded-r" />
                  )}
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform",
                      active
                        ? "text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Operator Profile & Session Footer */}
      <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
        <div
          className={cn(
            "flex items-center gap-2 rounded-md p-1.5 bg-zinc-50 dark:bg-zinc-900/60",
            collapsed ? "justify-center" : ""
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
            {currentUser?.username?.substring(0, 2).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {currentUser?.username}
              </p>
              <p className="text-[10px] text-zinc-400 capitalize font-mono">
                {currentUser?.role || "Operator"}
              </p>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className={cn(
            "w-full h-7 px-2 text-xs text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30",
            collapsed ? "justify-center" : "justify-start gap-2"
          )}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}
