"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-950 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-slate-500",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "group-[.toaster]:bg-red-50 group-[.toaster]:border-red-200 group-[.toaster]:text-red-900",
          success: "group-[.toaster]:bg-emerald-50 group-[.toaster]:border-emerald-200 group-[.toaster]:text-emerald-900",
          warning: "group-[.toaster]:bg-amber-50 group-[.toaster]:border-amber-200 group-[.toaster]:text-amber-900",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
