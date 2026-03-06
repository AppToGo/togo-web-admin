"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// Contexto para manejar el cierre del dialog
const DialogContext = React.createContext<{
  onClose?: () => void;
}>({});

const Dialog = ({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Cerrar con Escape
  React.useEffect(() => {
    if (!open) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange?.(false);
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    // Prevenir scroll del body cuando el dialog está abierto
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open || !mounted) return null;

  const handleClose = () => onOpenChange?.(false);

  return createPortal(
    <DialogContext.Provider value={{ onClose: handleClose }}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop con blur */}
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />
        {/* Content container */}
        <div className="relative z-[101] w-full max-w-lg">
          {children}
        </div>
      </div>
    </DialogContext.Provider>,
    document.body
  );
};

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { onClose } = React.useContext(DialogContext);

  return (
    <div
      ref={ref}
      className={cn(
        // Estilos del proyecto: glass + bordes redondeados
        "relative glass-strong rounded-card-xl",
        "border border-white/40 shadow-card-xl",
        "flex flex-col max-h-[85vh]",
        "animate-in fade-in zoom-in-95 duration-200",
        className
      )}
      {...props}
    >
      {/* Botón de cerrar */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 p-2 rounded-full bg-white/60 hover:bg-white text-slate-500 hover:text-slate-900 shadow-sm transition-all"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        <span className="sr-only">Cerrar</span>
      </button>
      
      {/* Contenido */}
      <div className="overflow-y-auto">
        {children}
      </div>
    </div>
  );
});
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      "px-6 pt-6 pb-4 border-b border-slate-100/50",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold text-slate-900 pr-8",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

export { Dialog, DialogContent, DialogHeader, DialogTitle };
