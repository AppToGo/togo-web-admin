import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconToggleVariants = cva(
  "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 cursor-pointer",
  {
    variants: {
      state: {
        active: "bg-indigo-100 text-indigo-600 shadow-sm",
        inactive: "text-slate-400 hover:text-slate-600 hover:bg-slate-100",
      },
    },
    defaultVariants: {
      state: "inactive",
    },
  }
);

export interface IconToggleProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconToggleVariants> {
  children: React.ReactNode;
}

const IconToggle = React.forwardRef<HTMLButtonElement, IconToggleProps>(
  ({ className, state, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(iconToggleVariants({ state, className }))}
        {...props}
      >
        {children}
      </button>
    );
  }
);
IconToggle.displayName = "IconToggle";

export { IconToggle, iconToggleVariants };
