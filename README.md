# Togo Admin Dashboard

Dashboard administrativo para Togo, un SaaS de automatización de pedidos por WhatsApp.

## 🔐 Arquitectura de Seguridad (Enterprise)

### Modelo de Tokens

| Token | Almacenamiento | Duración | Persistencia |
|-------|----------------|----------|--------------|
| **Access Token** | Memoria (Zustand) | 30 min | ❌ No (se pierde en reload) |
| **Refresh Token** | Cookie httpOnly | 7 días | ✅ Sí (con rotación) |

**Ventajas de este modelo:**
- ✅ Protegido contra XSS (access token en memoria)
- ✅ SSR-compatible (middleware lee cookie)
- ✅ Rotación automática de refresh tokens
- ✅ Revocación server-side

```
┌─────────────────────────────────────────────────────────────┐
│  Access Token (Memoria)    │   Refresh Token (httpOnly)     │
│  • No accesible por XSS    │   • No accesible por JS        │
│  • Se pierde en reload     │   • SameSite=Lax               │
│  • 30 minutos              │   • 7 días con rotación        │
└─────────────────────────────────────────────────────────────┘
```

## 🏗️ Estructura del Proyecto

```
togo-web-admin/
├── app/
│   ├── api/auth/            # API routes para manejo de cookies
│   │   ├── set-cookie/      # Guarda refresh token en httpOnly cookie
│   │   ├── clear-cookie/    # Elimina cookie en logout
│   │   ├── refresh/         # Refresca tokens usando cookie
│   │   └── logout-proxy/    # Proxy para logout con cookie
│   ├── api/csrf/            # Genera tokens CSRF para operaciones críticas
│   ├── login/               # Página de login
│   ├── register/            # Página de registro
│   ├── forgot-password/     # Recuperación de contraseña
│   ├── dashboard/           # Dashboard principal
│   ├── layout.tsx           # Root layout (con AuthProvider)
│   ├── providers.tsx        # React Query provider
│   └── globals.css          # Estilos globales
│   ├── login/               # Página de login
│   ├── register/            # Página de registro
│   ├── forgot-password/     # Recuperación de contraseña
│   ├── dashboard/           # Dashboard principal
│   ├── layout.tsx           # Root layout
│   ├── providers.tsx        # React Query provider
│   └── globals.css          # Estilos globales
├── components/
│   ├── ui/                  # Button, Input, Card
│   └── layout/              # DashboardLayout, Sidebar, Header
├── features/auth/
│   ├── components/          # LoginForm, RegisterForm, etc.
│   ├── hooks/               # useAuth, useAuthGuard
│   ├── services/            # auth.service.ts
│   └── stores/              # auth.store.ts
├── services/
│   └── api.service.ts       # Axios + interceptores + queue
├── middleware.ts            # Protección SSR de rutas
└── SECURITY.md              # Documentación detallada de seguridad
```

## 🚀 Tecnologías

- **Next.js 16** - Framework React con App Router
- **TypeScript** - Tipado estático
- **TailwindCSS** - Estilos utilitarios
- **TanStack Query** - Manejo de estado del servidor
- **Zustand** - Manejo de estado del cliente (access token en memoria)
- **Axios** - Cliente HTTP con interceptores

## 🔐 Sistema de Autenticación

### Flujo Completo

#### 1. Login
```typescript
// El usuario inicia sesión
const login = useLogin();
login.mutate({ email, password });
```

Proceso:
1. Frontend → `POST /auth/login` → Backend
2. Backend responde con `access_token`, `refresh_token`, `user`
3. Frontend:
   - Guarda `refresh_token` en cookie httpOnly (vía `/api/auth/set-cookie`)
   - Guarda `access_token` en memoria (Zustand)
   - Guarda `user` en Zustand (persistido en localStorage)

#### 2. Page Reload / Nueva Sesión
```typescript
// Middleware detecta existencia de cookie (NO valida el token)
const refreshToken = request.cookies.get("togo_refresh_token")?.value;
const hasCookie = !!refreshToken; // true/false
```

**⚠️ Nota importante sobre el Middleware:**
- El middleware solo verifica que **exista** la cookie, no que el token sea válido
- La validación real ocurre cuando el dashboard intenta usar el token (silent refresh)
- Si el token fue revocado, el silent refresh fallará y redirigirá a login

**Flujo:**
- Existe cookie → Middleware permite acceso → AuthProvider hace silent refresh
- No existe cookie → Redirige a login

#### 3. API Call con Token Expirado
```typescript
// Axios interceptor maneja automáticamente
apiClient.get("/orders"); // Si 401, refresca y reintenta
```

Proceso:
1. Request falla con 401
2. Si no hay refresh en progreso → inicia refresh
3. Si hay refresh en progreso → encola request
4. Una vez refrescado → todos los requests en cola usan nuevo token

### Protección contra Race Conditions

El sistema implementa un **queue de refresh** para evitar múltiples refresh simultáneos:

```typescript
let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

// Cuando múltiples requests fallan:
// Request 1 → inicia refresh
// Request 2, 3, 4 → esperan en cola
// Refresh completo → todos reintentan con nuevo token
```

### Logout

```typescript
const logout = useLogout();
logout.mutate();
```

Proceso:
1. Llama a `/auth/logout` (backend revoca token)
2. Llama a `/api/auth/clear-cookie` (elimina cookie)
3. Limpia estado en memoria
4. Redirige a `/login`

### AuthProvider (Session Restoration)

```typescript
// app/layout.tsx
<AuthProvider>
  {children}
</AuthProvider>
```

**Crítico para la arquitectura de memoria:**
- Al cargar la app, el access token en memoria está vacío (se perdió en reload)
- AuthProvider intenta restaurar la sesión vía `/api/auth/refresh`
- Muestra loading spinner mientras restaura
- Las páginas protegidas esperan a que `restoreState === "restored"`

### CSRF Protection (Operaciones Críticas)

Para operaciones sensibles (pagos, eliminación, cambio de email):

```typescript
import { useCsrf } from "@/features/auth/hooks/useCsrf";

function DeleteBusinessButton() {
  const { getCsrfToken, isLoading } = useCsrf();
  
  const handleDelete = async () => {
    const csrfToken = await getCsrfToken();
    await deleteBusiness({ csrfToken });
  };
  
  return <Button onClick={handleDelete} disabled={isLoading}>Eliminar</Button>;
}
```

**API de CSRF:**
- `GET /api/csrf` - Genera token CSRF (almacenado en cookie httpOnly)
- Header requerido: `X-CSRF-Token: <token>`
- Válido por 1 hora

## 🛡️ Protección de Rutas

### Middleware (SSR)

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get("togo_refresh_token")?.value;
  const isAuthenticated = !!refreshToken;
  
  // Redirecciones automáticas
  // • Auth + ruta pública → dashboard
  // • No auth + protegida → login
}
```

### Client Guard

```typescript
// En páginas protegidas
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";

function OrdersPage() {
  useAuthGuard(); // Redirige a login si no está autenticado
  return <OrdersList />;
}
```

## 🏢 Multi-Tenant

### Headers Automáticos

Cada request incluye:
- `Authorization: Bearer <access_token>`

**⚠️ Recomendación de seguridad (CRÍTICO):**
```typescript
// ❌ NO recomendado: Usar header X-Business-ID
// El header puede ser manipulado por el cliente
const businessId = headers['x-business-id'];

// ✅ RECOMENDADO: Extraer businessId del JWT únicamente
const businessId = jwt.businessId;
```

**Mejor práctica para el backend:**
- Ignorar completamente el header `X-Business-ID`
- Extraer `businessId` únicamente del JWT validado
- Esto elimina la superficie de ataque (no hay nada que falsificar)

```typescript
// Backend - Middleware de autenticación
function authenticateRequest(req) {
  const token = extractBearerToken(req);
  const jwt = verifyAndDecodeJWT(token);
  
  // Contexto del tenant viene del JWT, no del header
  req.tenant = {
    userId: jwt.sub,
    businessId: jwt.businessId,  // ✅ Del JWT firmado
    role: jwt.role,
  };
  
  // Todos los queries deben filtrar por req.tenant.businessId
  // WHERE business_id = req.tenant.businessId
}
```

**Si decides mantener el header (por logging/debug):**
- Úsalo solo para logging, NUNCA para lógica de negocio
- El JWT es la única fuente de verdad

## 🚀 Cómo ejecutar

### Requisitos

- Node.js 20+ (recomendado)
- Backend de Togo ejecutándose en `http://localhost:3001`

### Instalación

```bash
cd /Users/calvocc/Documents/ToGo.nosync/togo-web-admin

# Instalar dependencias
npm install

# Configurar variables de entorno
# Ya está configurado en .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:3001

# Ejecutar en desarrollo
npm run dev
```

La aplicación estará en `http://localhost:3000`

### Scripts disponibles

```bash
npm run dev      # Desarrollo
npm run build    # Build de producción
npm run start    # Iniciar en producción
npm run lint     # ESLint
```

## 📁 Estructura de Features

Cada feature sigue esta estructura:

```
features/[feature]/
├── components/     # Componentes React
├── hooks/          # Hooks (React Query, guards)
├── services/       # Llamadas a API
├── stores/         # Estado global (Zustand)
├── types/          # Tipos TypeScript
└── utils/          # Utilidades
```

## 🎯 Características Enterprise

### Escalabilidad

- ✅ Arquitectura modular por features
- ✅ State management escalable (Zustand)
- ✅ Server state caching (TanStack Query)
- ✅ HTTP client centralizado con retry logic

### Seguridad

- ✅ XSS protection (tokens no en localStorage)
- ✅ CSRF protection (SameSite=Lax, CSRF tokens para operaciones críticas)
- ✅ SSR route protection (middleware)
- ✅ Token rotation
- ✅ Server-side token revocation

### Developer Experience

- ✅ TypeScript estricto
- ✅ ESLint + Prettier configurados
- ✅ Path aliases (`@/components`)
- ✅ API routes para abstracción

## 📝 Convenciones

### Nomenclatura

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Componentes | PascalCase | `LoginForm.tsx` |
| Hooks | camelCase + use | `useAuth.ts` |
| Servicios | camelCase | `auth.service.ts` |
| Stores | camelCase | `auth.store.ts` |
| Tipos | PascalCase | `LoginResponse` |

### Imports

```typescript
// Siempre usar aliases
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import type { User } from "@/types";
```

## 📄 Documentación Adicional

- `SECURITY.md` - Detalles técnicos de seguridad
- `ARCHITECTURE.md` - Decisiones arquitectónicas (si existe)

## 🤝 Contribución

1. Crear feature branch desde `main`
2. Seguir convenciones de código (ESLint + Prettier)
3. Ejecutar lint antes de commitear: `npm run lint`
4. Crear PR con descripción clara

## 📄 Licencia

Proyecto privado - Togo Team
