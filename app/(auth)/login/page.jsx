"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { isAuthenticated, user } = useAuth();
  const [redirectTarget, setRedirectTarget] = useState("/dashboard");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const next = params.get("redirect");
      if (next && next.startsWith("/") && !next.startsWith("//")) {
        setRedirectTarget(next);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        window.location.assign(redirectTarget);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, redirectTarget]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-4">
        {/* Session Active Redirect Banner (non-blocking) */}
        {isAuthenticated && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-md border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-2.5 text-xs text-emerald-800 dark:text-emerald-200"
          >
            <span className="flex items-center gap-2 font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              Signed in as <strong className="font-mono">{user?.username || "admin"}</strong>. Opening workspace...
            </span>
            <Link
              href={redirectTarget}
              className="inline-flex items-center gap-1 font-semibold underline shrink-0"
            >
              Continue
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        <Card className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <CardHeader className="space-y-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-mono font-bold text-xs tracking-wider">
                  IMS
                </div>
                <div>
                  <CardTitle className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    Niloy Inventory
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Enterprise ERP &amp; Multi-Warehouse Ledger
                  </CardDescription>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-600 dark:text-zinc-300">
                <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                v2.5
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-5">
            <LoginForm redirectTarget={redirectTarget} />
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
            <div className="flex w-full items-center justify-between text-xs text-zinc-500">
              <span>
                New operator?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline transition-colors"
                >
                  Create account
                </Link>
              </span>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Live Demo
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center font-mono text-[11px] text-zinc-400">
          Dhaka Main Warehouse · Chittagong Hub · Sylhet Depot
        </p>
      </div>
    </div>
  );
}
