# Dev Analysis — feat/onboarding-tour-pedidos

## Objetivo

Implementar un product tour paso a paso en la pantalla de Gestión de Órdenes
que se activa automáticamente en el primer ingreso del usuario, usando una
implementación custom construida sobre las primitivas ya disponibles:
Framer Motion, Radix UI, createPortal, Zustand y TailwindCSS.

## Componente
togo-web-admin

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `app/[locale]/dashboard/orders/page.tsx` | Agregar `data-tour-step` en buscador, filtros, ViewToggle. Envolver con `OrdersTourProvider`. Agregar botón `?` junto al título. |
| `features/orders/components/OrdersKanbanBoard.tsx` | Agregar `data-tour-step` en métricas, ColumnVisibilityBar y kanban board. |
| `components/layout/Sidebar.tsx` | Agregar `data-tour-step="sidebar"` en el `<aside>` raíz. |
| `i18n/messages/es/orders.json` | Agregar namespace `tour` con los 8 pasos en español. |
| `i18n/messages/en/orders.json` | Agregar namespace `tour` con los 8 pasos en inglés. |

## Archivos a crear

| Archivo | Descripción |
|---|---|
| `features/orders/stores/tour.store.ts` | Zustand store con persist en localStorage. Clave per-user: `togo-orders-tour-completed-{userId}-{businessId}`. |
| `features/orders/hooks/useOrdersTour.ts` | Hook principal: expone `isActive`, `currentStep`, `totalSteps`, `goNext`, `goPrev`, `skip`, `startTour()`. |
| `features/orders/types/tour.types.ts` | Tipos `TourStep` y `TourState`. |
| `features/orders/components/tour/TourSpotlight.tsx` | Portal con overlay SVG + spotlight recortado (Framer Motion) + TourPopover anclado. Usa `querySelector('[data-tour-step]')`. |
| `features/orders/components/tour/TourPopover.tsx` | Popover posicionado automáticamente. Contiene título, descripción, "X de 8", botones Anterior/Siguiente/Saltar. |
| `features/orders/components/tour/OrdersTourProvider.tsx` | Context Provider que inicializa el tour y renderiza TourSpotlight cuando está activo. |
| `features/orders/components/tour/index.ts` | Barrel de exports. |

## Riesgos

- **Spotlight sobre elementos fixed/sticky**: Sidebar y ColumnVisibilityBar son `position: fixed`. El `getBoundingClientRect()` devuelve coords relativas al viewport, lo que es correcto para el overlay. Mitigación: validar con `position: fixed` para no sumar scroll offsets.
- **Race condition datos vs tour**: El tour no debe activarse mientras el board muestra skeletons. Mitigación: el tour solo arranca cuando `isLoading === false`.
- **z-index conflicts**: El overlay necesita `z-[200]` para estar sobre sidebar (z-50) y dialogs (z-100). Verificar valores existentes.
- **SSR safety**: `tour.store.ts` accede a `localStorage`. Proteger con `typeof window !== 'undefined'` y patrón `createJSONStorage`.

## Pasos del tour (8)

1. `metrics` → OrderMetrics (KPIs del día)
2. `search` → Input de búsqueda
3. `filters` → Botón de filtros (Popover)
4. `view-toggle` → Toggle card/lista
5. `column-visibility` → ColumnVisibilityBar flotante
6. `kanban-board` → Tablero kanban y sus columnas
7. `order-card` → Tarjeta de orden con dropdown de estado
8. `sidebar` → Menú de navegación lateral
