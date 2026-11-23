"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
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
  LogIn,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const primaryNavItems = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: "Live",
    roles: ["admin", "manager", "employee"],
  },
  {
    name: "SKU Catalog",
    href: "/inventory",
    icon: Package,
    roles: ["admin", "manager", "employee"],
  },
  {
    name: "Inbound / Orders",
    href: "/purchase-orders",
    icon: ShoppingCart,
    roles: ["admin", "manager"],
  },
  {
    name: "Suppliers",
    href: "/suppliers",
    icon: Building2,
    roles: ["admin", "manager"],
  },
  {
    name: "Stock Adjustments",
    href: "/stock-adjustments",
    icon: Sliders,
    roles: ["admin", "manager"],
  },
  {
    name: "Stock Movements",
    href: "/stock-movements",
    icon: Activity,
    roles: ["admin", "manager", "employee"],
  },
  {
    name: "Stock Transfers",
    href: "/stock-transfers",
    icon: Truck,
    roles: ["admin", "manager"],
  },
];

const secondaryNavItems = [
  {
    name: "Categories",
    href: "/categories",
    icon: FolderTree,
    roles: ["admin", "manager"],
  },
  {
    name: "Locations",
    href: "/locations",
    icon: MapPin,
    roles: ["admin", "manager"],
  },
  {
    name: "Assignments",
    href: "/assignments",
    icon: UserCheck,
    roles: ["admin", "manager", "employee"],
  },
  {
    name: "Maintenance",
    href: "/maintenance",
    icon: Wrench,
    roles: ["admin", "manager", "employee"],
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["admin", "manager"],
  },
  {
    name: "Audit Logs",
    href: "/audit-logs",
    icon: FileText,
    roles: ["admin"],
  },
  {
    name: "Users",
    href: "/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin", "manager", "employee"],
  },
];

export function Sidebar({ className }) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isSecondaryRouteActive = secondaryNavItems.some((item) =>
    pathname.startsWith(item.href)
  );
  const [adminOpen, setAdminOpen] = useState(isSecondaryRouteActive);

  const currentUser = user || {
    username: "Demo Operator",
    role: "admin",
    email: "demo@niloyinventory.app",
  };
  const role = currentUser?.role || "admin";

  const visiblePrimary = primaryNavItems.filter((i) => i.roles.includes(role));
  const visibleSecondary = secondaryNavItems.filter((i) =>
    i.roles.includes(role)
  );

  const isActive = (href) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      aria-label="Primary sidebar navigation"
      className={cn(
        "flex flex-col h-full border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-[width] duration-200 select-none",
        collapsed ? "w-16" : "w-60",
        className
      )}
    >
      {/* 1. Brand & Collapse Trigger */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 overflow-hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 rounded-md"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold font-mono text-xs">
            IMS
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="block text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase truncate">
                Niloy Inventory
              </span>
              <span className="block text-[10px] text-zinc-500 font-mono leading-none mt-0.5">
                Enterprise ERP v2.5
              </span>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 transition-colors cursor-pointer hidden md:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* 2. Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Core Operations */}
        <div>
          {!collapsed && (
            <div className="px-2.5 mb-1.5 text-[10px] font-semibold font-mono uppercase tracking-wider text-zinc-500">
              Operations
            </div>
          )}
          <div className="space-y-0.5">
            {visiblePrimary.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer group relative focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
                    active
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-200"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active-indicator"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-zinc-900 dark:bg-zinc-100 rounded-r"
                    />
                  )}
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active
                        ? "text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                    )}
                  />
                  {!collapsed && (
                    <div className="flex flex-1 items-center justify-between min-w-0">
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
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

        {/* Collapsible Governance & Admin Accordion */}
        <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
          {!collapsed ? (
            <button
              type="button"
              onClick={() => setAdminOpen((prev) => !prev)}
              aria-expanded={adminOpen}
              className="w-full flex items-center justify-between px-2.5 py-1 mb-1 text-[10px] font-semibold font-mono uppercase tracking-wider text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
            >
              <span>Governance &amp; Admin</span>
              <motion.span
                animate={{ rotate: adminOpen ? 180 : 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </motion.span>
            </button>
          ) : null}

          <AnimatePresence initial={false}>
            {(adminOpen || collapsed) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-0.5">
                  {visibleSecondary.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={collapsed ? item.name : undefined}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer group relative focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
                          active
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-200"
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="sidebar-active-indicator"
                            transition={{ type: "spring", stiffness: 400, damping: 32 }}
                            className="absolute left-0 top-1 bottom-1 w-[3px] bg-zinc-900 dark:bg-zinc-100 rounded-r"
                          />
                        )}
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            active
                              ? "text-zinc-900 dark:text-zinc-100"
                              : "text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                          )}
                        />
                        {!collapsed && (
                          <span className="truncate">{item.name}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* 3. Operator Session Footer */}
      <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1 shrink-0">
        <div
          className={cn(
            "flex items-center gap-2 rounded-md p-1.5 bg-zinc-50 dark:bg-zinc-900/60",
            collapsed ? "justify-center" : ""
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
            {currentUser?.username?.substring(0, 2).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {currentUser?.username}
              </p>
              <p className="text-[10px] text-zinc-500 capitalize font-mono">
                {isAuthenticated ? `${role} · verified` : "preview mode"}
              </p>
            </div>
          )}
        </div>

        {isAuthenticated ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            aria-label="Sign out of operator session"
            className={cn(
              "w-full h-7 px-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30",
              collapsed ? "justify-center" : "justify-start gap-2"
            )}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={cn(
              "w-full h-7 px-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
              collapsed ? "justify-center" : "justify-start gap-2"
            )}
          >
            <Link href="/login">
              <LogIn className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && <span>Operator Sign In</span>}
            </Link>
          </Button>
        )}
      </div>
    </aside>
  );
}
