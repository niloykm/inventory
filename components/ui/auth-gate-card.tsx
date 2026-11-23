"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, LogIn, ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthGateCardProps {
  title: string;
  description?: string;
}

export function AuthGateCard({
  title,
  description = "Sign in with an operator account to access live MongoDB records and administrative actions for this module.",
}: AuthGateCardProps) {
  const pathname = usePathname() || "/dashboard";
  const loginHref = `/login?redirect=${encodeURIComponent(pathname)}`;

  return (
    <div className="w-full px-4 sm:px-6 py-10 max-w-2xl mx-auto">
      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0">
            <ShieldCheck className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {title}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <Button
            asChild
            size="sm"
            className="h-9 px-4 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Link href={loginHref}>
              <LogIn className="mr-1.5 h-3.5 w-3.5" />
              Sign In as Operator
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 px-3.5 text-xs border-zinc-200 dark:border-zinc-800"
          >
            <Link href="/dashboard">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Operations Command Center
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PreviewModeBanner({
  moduleName,
}: {
  moduleName: string;
}) {
  const pathname = usePathname() || "/dashboard";
  const loginHref = `/login?redirect=${encodeURIComponent(pathname)}`;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-3.5 py-2 text-xs text-zinc-700 dark:text-zinc-300"
    >
      <span className="flex items-center gap-2">
        <Info className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        <span>
          <strong>Preview Mode ({moduleName}):</strong> Showing live interactive ERP workspace ledger. Sign in to sync with MongoDB.
        </span>
      </span>
      <Link
        href={loginHref}
        className="inline-flex items-center gap-1 font-semibold text-zinc-900 dark:text-zinc-100 hover:underline shrink-0"
      >
        <LogIn className="h-3 w-3" />
        Sign In
      </Link>
    </div>
  );
}
