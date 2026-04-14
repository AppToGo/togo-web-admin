# Dev Analysis: refactor/ordenes-pagina-principal

## Objetivo

Hacer que `/dashboard/orders` sea la página de aterrizaje universal tras el inicio de sesión, reemplazando `/dashboard` en todos los puntos de redirección de la aplicación. Adicionalmente, reordenar el menú de navegación del Sidebar para que el orden sea: Órdenes → Dashboard → Clientes → Catálogo → Configuración.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `components/layout/Sidebar.tsx` | Reordenar `navigation` array + cambiar logo href a `/dashboard/orders` |
| `middleware.ts` | Línea ~112: `/dashboard` → `/dashboard/orders` en redirect de auth routes |
| `app/[locale]/page.tsx` | `redirect("/dashboard")` → `redirect("/dashboard/orders")` |
| `features/auth/hooks/useAuth.ts` | `onSuccess`: `router.push("/dashboard")` → `/dashboard/orders` |
| `features/auth/hooks/useAuthGuard.ts` | Default de `useAuthRedirect`: `/dashboard` → `/dashboard/orders` |
| `features/auth/components/AuthProvider.tsx` | Fallback en `restoreSession` línea ~189 |
| `e2e/pages/LoginPage.ts` | `waitForDashboardRedirect()` regex: `/dashboard` → `/dashboard/orders` |

## Riesgos

- Logo sidebar: cambiar a `/dashboard/orders` para coherencia con "home = orders"
- `isActive` en `CollapsibleNavItem` ya maneja la colisión `/dashboard` vs `/dashboard/orders` — no tocar
- Solo `useAuthRedirect` necesita el default cambiado; `useAuthGuard` tiene default `/login` (correcto, no tocar)

## Notas para el implementador

1. El redirect post-login está en `useLogin.onSuccess`, no en `onSettled`
2. `handleForceLogout` en AuthProvider siempre redirige a `/login`, el cambio es solo el fallback de `restoreSession`
3. Para E2E: cambiar solo `LoginPage.ts` propaga el fix a todos los tests que consumen `waitForDashboardRedirect()`
4. El test "expired session redirects to login" que navega a `/es/dashboard` puede mantenerse

## Orden de implementación sugerido

1. `Sidebar.tsx` (reordenar nav + logo href)
2. `middleware.ts` (redirect de auth routes)
3. `app/[locale]/page.tsx` (root redirect)
4. `features/auth/hooks/useAuth.ts` (post-login redirect)
5. `features/auth/hooks/useAuthGuard.ts` (default de useAuthRedirect)
6. `features/auth/components/AuthProvider.tsx` (fallback restoreSession)
7. `e2e/pages/LoginPage.ts` (waitForDashboardRedirect)
