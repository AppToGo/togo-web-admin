# Dev Analysis: feat/modal-upgrade-plan-free

## Objetivo
Mostrar al usuario con `subscriptionPlan === 1` (Free) un modal de upgrade la primera vez que accede al dashboard en cada sesión. Permite seleccionar un plan de pago (Basic, Pro, Enterprise) y simula el cobro actualizando el store de Zustand.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `types/auth.types.ts` | Agregar `setSubscriptionPlan` a `AuthActions` |
| `features/auth/stores/auth.store.ts` | Implementar `setSubscriptionPlan(plan)` |
| `components/layout/DashboardLayout.tsx` | Montar `<UpgradePlanModal>` con `useUpgradePlanModal` |
| `features/subscription/components/index.ts` | Re-exportar `UpgradePlanModal` |
| `features/subscription/index.ts` | Re-exportar desde barrel raíz |
| `i18n/request.ts` | Registrar namespace `subscription` |
| `lib/plan.utils.ts` | Agregar constante `PLAN_PRICES` |

## Archivos a crear

| Archivo | Descripción |
|---|---|
| `features/subscription/components/UpgradePlanModal.tsx` | Modal UI con selector de planes y simulación de pago |
| `features/subscription/hooks/useUpgradePlanModal.ts` | Lógica de visibilidad (sessionStorage flag una vez por sesión) |
| `features/subscription/hooks/index.ts` | Barrel export de hooks |
| `i18n/messages/es/subscription.json` | Traducciones ES |
| `i18n/messages/en/subscription.json` | Traducciones EN |

## Decisiones clave

- **Flag sessionStorage** con clave `togo-upgrade-modal-shown-{userId}` — se escribe antes de abrir el modal, se borra cuando cierra pestaña
- **Simulación sin useMutation** — setTimeout 1200ms con estado local `isPaying`
- **Orden al pagar**: `setSubscriptionPlan()` → `onClose()` → `toast.success()`
- **Precios en `PLAN_PRICES`** en `lib/plan.utils.ts` (centralizado, comentado como TODO para backend)

## Secuencia de implementación
1. Tipos y store
2. i18n (archivos + registro en request.ts)
3. Hook de visibilidad
4. Modal UI + precio constantes
5. Barrel exports
6. Integración en DashboardLayout
