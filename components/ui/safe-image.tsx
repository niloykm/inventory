"use client";

import React, { useState, useEffect } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface SafeImageProps {
  src?: string | null;
  alt: string;
  fallbackText?: string;
  className?: string;
  fallbackClassName?: string;
  iconOnly?: boolean;
}

const BLOCKED_HOSTS = ["loremflickr.com", "localhost:6210"];

function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (BLOCKED_HOSTS.some((host) => trimmed.includes(host))) return false;
  return (
    trimmed.startsWith("/") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("data:image/")
  );
}

function getInitials(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return text.trim().slice(0, 2).toUpperCase() || "SK";
}

export function SafeImage({
  src,
  alt,
  fallbackText,
  className = "h-8 w-8 rounded-md object-cover",
  fallbackClassName,
  iconOnly = false,
}: SafeImageProps) {
  const [failed, setFailed] = useState(!isValidImageUrl(src));

  useEffect(() => {
    setFailed(!isValidImageUrl(src));
  }, [src]);

  if (failed || !src) {
    const initials = getInitials(fallbackText || alt);
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 font-mono text-[11px] font-semibold select-none",
          className,
          fallbackClassName
        )}
      >
        {iconOnly ? <Package className="h-4 w-4 text-zinc-500" /> : initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn(
        "shrink-0 rounded-md border border-zinc-200 dark:border-zinc-800 object-cover bg-zinc-50 dark:bg-zinc-900",
        className
      )}
    />
  );
}
