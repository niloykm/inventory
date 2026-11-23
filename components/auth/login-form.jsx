"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth-context";
import { loginSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  ArrowRight,
} from "lucide-react";

const DEMO_ADMIN_CREDS = {
  username: "admin",
  password: "G7v9k3Qx_4pZs8L0bR2uH6yT5mN1cVwX",
};

export function LoginForm({ redirectTarget = "/dashboard" }) {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: DEMO_ADMIN_CREDS.username,
      password: DEMO_ADMIN_CREDS.password,
    },
  });

  function fillDemoAdmin() {
    form.setValue("username", DEMO_ADMIN_CREDS.username, { shouldValidate: true });
    form.setValue("password", DEMO_ADMIN_CREDS.password, { shouldValidate: true });
    setServerError("");
    toast.info("Loaded Demo Admin operator credentials");
  }

  async function onSubmit(data) {
    setServerError("");
    setIsLoading(true);
    try {
      await login(data.username, data.password, {
        redirectTo: redirectTarget,
        remember: rememberSession,
      });
      toast.success("Signed in — opening Operations Command Center");
    } catch (error) {
      const message =
        error?.message || "Unable to sign in. Please check your credentials.";
      setServerError(message);
      toast.error(message);
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-800 dark:text-rose-200"
          >
            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">Authentication Failed</p>
              <p className="text-rose-700 dark:text-rose-300">{serverError}</p>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Operator Username
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="admin"
                  autoComplete="username"
                  disabled={isLoading}
                  className="h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono text-sm focus-visible:ring-1 focus-visible:ring-zinc-400 transition-colors"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <div className="flex items-center justify-between">
                <FormLabel className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Password
                </FormLabel>
                <button
                  type="button"
                  onClick={fillDemoAdmin}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  <KeyRound className="h-3 w-3" />
                  Fill Demo Admin
                </button>
              </div>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter operator password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="h-9 pr-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono text-sm focus-visible:ring-1 focus-visible:ring-zinc-400 transition-colors"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between pt-0.5">
          <label
            htmlFor="remember-session"
            className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none"
          >
            <Checkbox
              id="remember-session"
              checked={rememberSession}
              onCheckedChange={(checked) => setRememberSession(checked === true)}
              disabled={isLoading}
            />
            <span>Keep operator session active (24h)</span>
          </label>
          <span className="font-mono text-[10px] text-zinc-400">JWT · TLS</span>
        </div>

        <Button
          type="submit"
          className="w-full h-9 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-semibold tracking-wide transition-colors cursor-pointer"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Authenticating with ERP...
            </>
          ) : (
            <>
              Sign In to Command Center
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
