import * as React from "react";
import { LayoutGrid, List, LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list" | "card";

export interface ViewToggleOption {
  value: ViewMode;
  icon: LucideIcon;
  title?: string;
}

const viewToggleVariants = cva(
  "flex items-center bg-white rounded-card p-1 shrink-0",
  {
    variants: {
      variant: {
        default: "",
        bordered: "border border-slate-200 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ViewToggleProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof viewToggleVariants> {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  options?: ViewToggleOption[];
}

const defaultOptions: ViewToggleOption[] = [
  { value: "grid", icon: LayoutGrid, title: "Grid view" },
  { value: "list", icon: List, title: "List view" },
];

const ViewToggle = React.forwardRef<HTMLDivElement, ViewToggleProps>(
  ({ value, onChange, options = defaultOptions, variant, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(viewToggleVariants({ variant }), className)}
        {...props}
      >
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = value === option.value;

          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              title={option.title}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isActive
                  ? "bg-indigo-100 text-indigo-600"
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    );
  }
);
ViewToggle.displayName = "ViewToggle";

export { ViewToggle, viewToggleVariants };
