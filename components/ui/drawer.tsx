"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type DrawerSize = "sm" | "md" | "lg" | "xl" | "2xl"

const sizeClasses: Record<DrawerSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-xl",
  xl: "sm:max-w-3xl",
  "2xl": "sm:max-w-4xl",
}

function Drawer({
  isLoading = false,
  dismissible,
  direction = "right",
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root> & { isLoading?: boolean }) {
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      direction={direction}
      dismissible={dismissible ?? !isLoading}
      {...props}
    />
  )
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/30 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  size = "md",
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & { size?: DrawerSize }) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex flex-col h-full w-full",
          "glass-strong border-l border-white/40 shadow-card-lg",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <DrawerClose className="absolute right-4 top-4 z-10 p-2 rounded-full bg-white/60 hover:bg-white text-slate-500 hover:text-slate-900 shadow-sm transition-all">
          <X className="h-[18px] w-[18px]" strokeWidth={2} />
          <span className="sr-only">Cerrar</span>
        </DrawerClose>

        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "shrink-0 px-6 py-5 border-b border-slate-100/50",
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn(
        "shrink-0 px-6 py-4 border-t border-slate-100/50",
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-lg font-semibold text-slate-900 pr-8", className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-slate-500", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
