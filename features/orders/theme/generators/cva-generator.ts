/**
 * CVA Variants Generator
 * 
 * Genera automáticamente todas las variantes CVA para los estados de órdenes
 * basándose en el STATUS_THEME. Esto asegura consistencia y facilita cambios.
 */

import { cva } from "class-variance-authority";
import type { OrderStatus } from "../../types";
import { STATUS_THEME, getStatusTokens } from "../order-status.theme";

/** Helper para generar variantes por estado */
function generateStatusVariants<T>(
  generator: (status: OrderStatus, tokens: ReturnType<typeof getStatusTokens>) => string
): Record<OrderStatus, string> {
  const statuses = Object.keys(STATUS_THEME) as OrderStatus[];
  return statuses.reduce((acc, status) => {
    acc[status] = generator(status, getStatusTokens(status));
    return acc;
  }, {} as Record<OrderStatus, string>);
}

/**
 * Variantes del contenedor de columna
 * Incluye fondo, ring de drag-over y transiciones
 */
export const columnVariants = cva(
  "flex flex-col rounded-3xl shrink-0 p-4 h-[calc(100vh-200px)] transition-all duration-200",
  {
    variants: {
      status: generateStatusVariants((_, tokens) => 
        `${tokens.bg}/30`
      ),
    },
    defaultVariants: {
      status: "DRAFT",
    },
  }
);

/**
 * Variantes para el estado de drag-over de columna
 * Se aplica como clase adicional cuando se arrastra sobre la columna
 */
export const columnDragOverVariants = cva("", {
  variants: {
    status: generateStatusVariants((_, tokens) => 
      `ring-2 ${tokens.ring} ring-offset-2 ${tokens.bg}/50`
    ),
  },
  defaultVariants: {
    status: "DRAFT",
  },
});

/**
 * Variantes del header de columna
 */
export const columnHeaderVariants = cva("px-4 py-3 rounded-card-lg mb-3", {
  variants: {
    status: generateStatusVariants((_, tokens) => 
      tokens.bgMedium
    ),
  },
  defaultVariants: {
    status: "DRAFT",
  },
});

/**
 * Variantes del dot indicador de status
 */
export const dotVariants = cva("w-2 h-2 rounded-full", {
  variants: {
    status: generateStatusVariants((_, tokens) => 
      tokens.dot
    ),
  },
  defaultVariants: {
    status: "DRAFT",
  },
});

/**
 * Variantes para el contenedor de tarjetas en estado drag-over
 */
export const cardContainerDragOverVariants = cva("", {
  variants: {
    status: generateStatusVariants((_, tokens) => 
      `${tokens.bgMedium}/30`
    ),
  },
  defaultVariants: {
    status: "DRAFT",
  },
});

/**
 * Variantes de texto para el contador de órdenes
 */
export const counterTextVariants = cva(
  "text-xs font-medium px-2 py-0.5 rounded-full transition-colors",
  {
    variants: {
      status: generateStatusVariants(() => 
        "bg-white/70 text-slate-500"
      ),
    },
    defaultVariants: {
      status: "DRAFT",
    },
  }
);

/**
 * Variantes de texto para el contador en estado drag-over
 */
export const counterTextDragOverVariants = cva(
  "text-xs font-medium px-2 py-0.5 rounded-full transition-colors",
  {
    variants: {
      status: generateStatusVariants((_, tokens) => 
        `${tokens.bgMedium}/50 ${tokens.textMedium}`
      ),
    },
    defaultVariants: {
      status: "DRAFT",
    },
  }
);

/**
 * Variantes para el estado vacío de la columna
 */
export const emptyStateVariants = cva(
  "flex flex-col items-center justify-center py-8 text-center rounded-card transition-colors duration-200 border-2 border-dashed",
  {
    variants: {
      status: generateStatusVariants((_, tokens) => 
        tokens.border
      ),
    },
    defaultVariants: {
      status: "DRAFT",
    },
  }
);

/**
 * Variantes para el estado vacío en drag-over
 */
export const emptyStateDragOverVariants = cva("", {
  variants: {
    status: generateStatusVariants((_, tokens) => 
      `${tokens.borderHover} ${tokens.bg}/50`
    ),
  },
  defaultVariants: {
    status: "DRAFT",
  },
});

/**
 * Variantes para el icono del estado vacío
 */
export const emptyStateIconVariants = cva(
  "w-12 h-12 rounded-card flex items-center justify-center mb-3 transition-colors",
  {
    variants: {
      status: generateStatusVariants((_, tokens) => 
        tokens.bgMedium
      ),
    },
    defaultVariants: {
      status: "DRAFT",
    },
  }
);

/**
 * Variantes para el icono del estado vacío en drag-over
 */
export const emptyStateIconDragOverVariants = cva("", {
  variants: {
    status: generateStatusVariants((_, tokens) => 
      tokens.bgHover
    ),
  },
  defaultVariants: {
    status: "DRAFT",
  },
});

/**
 * Variantes de texto para el estado vacío
 */
export const emptyStateTextVariants = cva("text-sm transition-colors", {
  variants: {
    status: generateStatusVariants((_, tokens) => 
      `text-${tokens.dot.split('-')[1]}-400`
    ),
  },
  defaultVariants: {
    status: "DRAFT",
  },
});

/**
 * Variantes de texto para el estado vacío en drag-over
 */
export const emptyStateTextDragOverVariants = cva(
  "text-sm font-medium transition-colors",
  {
    variants: {
      status: generateStatusVariants((_, tokens) => 
        tokens.textMedium
      ),
    },
    defaultVariants: {
      status: "DRAFT",
    },
  }
);
