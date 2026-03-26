import * as React from "react";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva("text-card-foreground", {
  variants: {
    variant: {
      default: "border border-slate-200 bg-white rounded-lg",
      ghost: "border-0 bg-transparent shadow-none rounded-lg",
      outline: "border border-slate-200 bg-transparent shadow-none rounded-lg",
      elevated: "border border-slate-200 bg-white shadow-md rounded-lg",
      primary:
        "border border-indigo-200 bg-white shadow-sm ring-1 ring-indigo-100 rounded-lg",
      kanban: "border bg-card text-card-foreground shadow rounded-xl",
      glass:
        "rounded-card-xl bg-white/40 backdrop-blur-xl border border-white/80 overflow-hidden",
      "gradient-indigo":
        "rounded-card-lg shadow-card bg-gradient-indigo-purple text-white overflow-hidden",
      "gradient-emerald":
        "rounded-card-lg shadow-card bg-gradient-emerald-teal text-white overflow-hidden",
      "gradient-amber":
        "rounded-card-lg shadow-card bg-gradient-orange-amber text-white overflow-hidden",
      "gradient-blue":
        "rounded-card-lg shadow-card bg-gradient-blue-cyan text-white overflow-hidden",
      "gradient-purple":
        "rounded-card-lg shadow-card bg-gradient-purple-indigo text-white overflow-hidden",
      "metrics-emerald":
        "rounded-card-xl border border-white/80 overflow-hidden relative backdrop-blur-2xl bg-gradient-to-br from-emerald-400/15 via-white/10 to-emerald-500/20",
      "metrics-blue":
        "rounded-card-xl border border-white/80 overflow-hidden relative backdrop-blur-2xl bg-gradient-to-br from-blue-400/15 via-white/10 to-blue-500/20",
      "metrics-purple":
        "rounded-card-xl border border-white/80 overflow-hidden relative backdrop-blur-2xl bg-gradient-to-br from-purple-400/15 via-white/10 to-purple-500/20",
      "metrics-amber":
        "rounded-card-xl border border-white/80 overflow-hidden relative backdrop-blur-2xl bg-gradient-to-br from-amber-400/15 via-white/10 to-amber-500/20",
      "metrics-default":
        "rounded-card-xl border border-white/80 overflow-hidden relative backdrop-blur-2xl bg-gradient-to-br from-slate-400/15 via-white/10 to-slate-500/20",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface CardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  variant?:
    | "default"
    | "ghost"
    | "outline"
    | "elevated"
    | "primary"
    | "kanban"
    | "glass"
    | "gradient-indigo"
    | "gradient-emerald"
    | "gradient-amber"
    | "gradient-blue"
    | "gradient-purple"
    | "metrics-emerald"
    | "metrics-blue"
    | "metrics-purple"
    | "metrics-amber"
    | "metrics-default";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};
