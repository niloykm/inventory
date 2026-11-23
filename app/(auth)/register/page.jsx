"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { RegisterForm } from "@/components/auth/register-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-4">
        <Card className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <CardHeader className="space-y-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-mono font-bold text-xs tracking-wider">
                  IMS
                </div>
                <div>
                  <CardTitle className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    Create Operator Account
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Register for Niloy Inventory ERP access
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
            <RegisterForm />
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-4 text-xs text-zinc-500">
            <span>
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline transition-colors"
              >
                Sign in
              </Link>
            </span>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Live Demo
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
