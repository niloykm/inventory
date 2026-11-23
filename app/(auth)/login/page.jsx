"use client";

import { useEffect } from "react";
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
import { PageLoader } from "@/components/ui/loader";
import Link from "next/link";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    console.log("[LoginPage] Auth state:", { isAuthenticated, isLoading });
    if (!isLoading && isAuthenticated) {
      console.log(
        "[LoginPage] User is authenticated, redirecting to dashboard"
      );
      // Use window.location for hard redirect to clear cache
      window.location.href = "/dashboard";
    }
  }, [isAuthenticated, isLoading]);

  // Add no-cache meta tags
  useEffect(() => {
    // Set meta tags to prevent caching
    const metaCache = document.createElement("meta");
    metaCache.httpEquiv = "Cache-Control";
    metaCache.content = "no-cache, no-store, must-revalidate";
    document.head.appendChild(metaCache);

    const metaPragma = document.createElement("meta");
    metaPragma.httpEquiv = "Pragma";
    metaPragma.content = "no-cache";
    document.head.appendChild(metaPragma);

    const metaExpires = document.createElement("meta");
    metaExpires.httpEquiv = "Expires";
    metaExpires.content = "0";
    document.head.appendChild(metaExpires);

    return () => {
      document.head.removeChild(metaCache);
      document.head.removeChild(metaPragma);
      document.head.removeChild(metaExpires);
    };
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  // Don't render if authenticated - prevents flash of login form
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <CardHeader className="space-y-1.5 text-center border-b border-zinc-100 dark:border-zinc-800/80 pb-5">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-mono font-bold text-sm">
            IMS
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Sign in to Niloy Inventory
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Enterprise inventory operations &amp; stock ledger
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <LoginForm />
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
          <p className="text-center text-xs text-zinc-500">
            New operator?{" "}
            <Link
              href="/register"
              className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline transition-colors"
            >
              Create an account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
