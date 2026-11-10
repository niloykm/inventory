"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-zinc-50/40 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased">
      {/* Sidebar - Fixed/Sticky on desktop */}
      <div className="hidden md:block shrink-0 sticky top-0 h-screen z-20">
        <Sidebar className="h-full" />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
