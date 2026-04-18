// =============================================================================
// NaKmetiji.si — UI: Input
// Vnosno polje s podporo za ikone in napake
// =============================================================================

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, iconPosition = "left", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const errorId = error && inputId ? `${inputId}-error` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-forest-800 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === "left" && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={clsx(
              "w-full rounded-xl border border-earth-200 bg-white px-4 py-3",
              "text-sm text-forest-900 placeholder:text-earth-400",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-forest-400/30 focus:border-forest-400",
              "hover:border-earth-300",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              icon && iconPosition === "left" && "pl-10",
              icon && iconPosition === "right" && "pr-10",
              error && "border-red-400 focus:ring-red-400/30 focus:border-red-400",
              className
            )}
            {...props}
          />
          {icon && iconPosition === "right" && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none">
              {icon}
            </span>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-red-500" role="alert">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
