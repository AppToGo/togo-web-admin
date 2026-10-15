/**
 * Desde qué ancho se oculta una pieza del teléfono (barra inferior, pantalla
 * completa): ahí la reemplaza el layout de escritorio. Clases estáticas para
 * que Tailwind las genere.
 */
export const HIDDEN_FROM = {
  md: "md:hidden",
  lg: "lg:hidden",
} as const;

export type HiddenFrom = keyof typeof HIDDEN_FROM;
