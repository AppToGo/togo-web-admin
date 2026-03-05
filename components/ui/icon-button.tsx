import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
  "flex items-center justify-center transition-all duration-200 w-10 h-10 rounded-icon bg-white border-0",
  {
    variants: {
      state: {
        active: "text-indigo-600 ",
        inactive: "text-slate-500 hover:text-slate-700",
      },
    },
    defaultVariants: {
      state: "inactive",
    },
  }
);

export interface IconButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  children: React.ReactNode;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, state, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(iconButtonVariants({ state, className }))}
        {...props}
      >
        {children}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";

export { IconButton, iconButtonVariants };
