"use client";

import React, { useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NativeSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface NativeSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  srOnlyLabel?: boolean;
  size?: "sm" | "default";
  icon?: React.ReactNode;
  options?: NativeSelectOption[];
  wrapperClassName?: string;
  labelClassName?: string;
}

export function NativeSelect({
  id,
  label,
  srOnlyLabel = false,
  size = "default",
  icon,
  options,
  children,
  className = "",
  wrapperClassName = "",
  labelClassName = "",
  ...props
}: NativeSelectProps) {
  const autoId = useId();
  const selectId = id || autoId;

  return (
    <div className={cn("flex flex-col", !srOnlyLabel && label ? "gap-1.5" : "", wrapperClassName)}>
      {label && (
        <label
          htmlFor={selectId}
          className={cn(
            srOnlyLabel
              ? "sr-only"
              : "text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-none",
            labelClassName
          )}
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {icon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 flex items-center text-zinc-400"
          >
            {icon}
          </span>
        )}
        <select
          id={selectId}
          className={cn(
            "w-full appearance-none rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-medium whitespace-nowrap shadow-xs transition-[color,border-color,box-shadow] duration-200 cursor-pointer",
            "hover:border-zinc-300 dark:hover:border-zinc-700",
            "focus-visible:outline-none focus-visible:border-zinc-400 focus-visible:ring-1 focus-visible:ring-zinc-400",
            "disabled:cursor-not-allowed disabled:opacity-50",
            size === "sm"
              ? "h-8 text-xs pr-7"
              : "h-9 text-sm pr-8",
            icon ? "pl-8" : "pl-3",
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                >
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute text-zinc-400",
            size === "sm" ? "right-2 h-3.5 w-3.5" : "right-2.5 h-4 w-4"
          )}
        />
      </div>
    </div>
  );
}
