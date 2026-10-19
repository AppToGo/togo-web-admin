# Seguridad - Togo Admin

## 🔐 Modelo de Seguridad Actual

### Arquitectura de Tokens

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                               │
│  ┌─────────────────────┐      ┌─────────────────────────┐   │
│  │   Access Token      │      │   Refresh Token         │   │
│  │   • En memoria      │      │   • httpOnly Cookie     │   │
│  │   • Zustand Store   │      │   • SameSite=Lax        │   │
│  │   • NO persistente  │      │   • Secure (prod)       │   │
│  │   • Se pierde en    │      │   • 7 días expiración   │   │
│  │     reload          │      │                         │   │
│  └─────────────────────┘      └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                        │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ /api/auth/      │  │ /api/auth/      │                   │
│  │ set-cookie      │  │ refresh         │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND TOGO                            │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ POST /auth/     │  │ POST /auth/     │                   │
│  │ login           │  │ refresh         │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Access Token (Memoria)

| Propiedad | Valor |
|-----------|-------|
| Almacenamiento | Memoria (Zustand Store) |
| Persistencia | **NO** - Se pierde en reload |
| Duración | 30 minutos |
| Uso | Header `Authorization: Bearer <token>` |

**Ventajas:**
- Inaccesible a ataques XSS
- No queda en disco/localStorage
- Rotación natural en cada sesión

**Consideraciones:**
- Usuario debe re-autenticar después de reload
- Se mitiga con refresh token automático

### Refresh Token (httpOnly Cookie)

| Propiedad | Valor |
|-----------|-------|
| Almacenamiento | Cookie httpOnly |
| JavaScript Access | **NO** |
| Duración | 7 días |
| SameSite | Lax |
| Secure | Sí (en producción) |

**Ventajas:**
- Protegido contra XSS
- Middleware puede leerlo (SSR)
- Rotación en cada uso

### Flujo de Autenticación

```
1. LOGIN
   Usuario ──login(credentials)──► Backend
                                     │
                                     ▼
                         ┌──────────────────────┐
                         │  access_token        │
                         │  refresh_token       │
                         │  user                │
                         └──────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
              Store in          /api/auth/        Zustand
              memory            set-cookie        (user only)
              (access)          (refresh)         
                    │                │
                    └────────────────┘
                                     │
                                     ▼
                         ┌──────────────────────┐
                         │  Cookie httpOnly     │
                         │  togo_refresh_token  │
                         └──────────────────────┘

2. PAGE RELOAD
   Usuario ──carga página──► Middleware
                                │
                                ▼ (lee cookie)
                         ┌──────────────┐
                         │ has refresh? │
                         └──────────────┘
                                │
                    ┌───────────┴───────────┐
                    Sí                        No
                    │                         │
                    ▼                         ▼
              /dashboard                 /login
              (silent refresh)           

3. API CALL WITH EXPIRED TOKEN
   Usuario ──API call──► Axios Interceptor
                            │ 401 Unauthorized
                            ▼
                     ┌──────────────────┐
                     │ Queue Request    │
                     │ (if refreshing)  │
                     └──────────────────┘
                            │
                            ▼
                     /api/auth/refresh
                     (le cookie automático)
                            │
                            ▼
                     ┌──────────────────┐
                     │ New access_token │
                     │ New refresh_token│
                     └──────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
         Update       Update cookie   Retry original
         memory                       request
```

## 🛡️ Protección contra Race Conditions

El interceptor de Axios implementa un **sistema de cola** para evitar múltiples refresh simultáneos:

```typescript
// Cuando múltiples requests fallan con 401:

Request 1 ──401──► Inicia refresh
                        │
Request 2 ──401──► Se une a cola (waiting...)
                        │
Request 3 ──401──► Se une a cola (waiting...)
                        │
                   Refresh completo
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
    Request 1      Request 2      Request 3
    (retry)        (retry)        (retry)
    con nuevo      con nuevo      con nuevo
    token          token          token
```

### Implementación del Queue

```typescript
let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

// Si isRefreshing = true, las requests esperan
// Cuando termina, todas reciben el mismo nuevo token
```

### Sincronización Global (AuthProvider ↔ Interceptor)

**Problema:** En el arranque de la app, AuthProvider intenta restaurar la sesión simultáneamente con requests de React Query.

**Solución:** Estado global compartido entre AuthProvider y Axios interceptor:

```typescript
// services/auth-sync.service.ts
let isGlobalRefreshing = false;

// AuthProvider y el interceptor usan la misma bandera
// Si AuthProvider está restaurando, el interceptor espera
```

**Flujo de sincronización:**
```
1. Page Load
   │
   ├─► AuthProvider inicia restore
   │   isGlobalRefreshing = true
   │
   ├─► React Query dispara request
   │   Request recibe 401
   │
   ├─► Interceptor detecta isGlobalRefreshing = true
   │   Espera a que AuthProvider termine
   │
   ├─► AuthProvider completa restore
   │   isGlobalRefreshing = false
   │
   └─► Interceptor reintenta con nuevo token
       (sin hacer segundo refresh)
```

**Previene:** Doble refresh, race conditions, tokens inválidos

## 🏢 Multi-Tenant Security

### ⚠️ Mejor Práctica: Ignorar Headers de Tenant

**Problema:** El header `X-Business-ID` puede ser manipulado por el cliente.

**Solución:** El backend debe extraer `businessId` **únicamente** del JWT firmado.

```typescript
// ❌ INSEGURO: Usar header (puede ser falsificado)
const businessId = req.headers['x-business-id'];
const orders = await db.query('SELECT * FROM orders WHERE business_id = ?', [businessId]);

// ✅ SEGURO: Extraer del JWT validado
const jwt = verifyToken(req.headers.authorization);
const businessId = jwt.businessId;  // Viene del token firmado
const orders = await db.query('SELECT * FROM orders WHERE business_id = ?', [businessId]);
```

**Frontend (Axios Interceptor):**
```typescript
// NO enviamos X-Business-ID header
// El backend extrae todo del JWT
config.headers.Authorization = `Bearer ${accessToken}`;
```

**Ventajas:**
- ✅ Menor superficie de ataque (sin headers que falsificar)
- ✅ Menos complejidad (sin validación header vs JWT)
- ✅ JWT es la única fuente de verdad

**Si necesitas el header para logging/debug:**
```typescript
// Solo para logging, NUNCA para lógica de negocio
logger.info(`Request from business ${headers['x-business-id']}`, {
  headerBusinessId: headers['x-business-id'],  // Para debug
  jwtBusinessId: jwt.businessId,                // Fuente de verdad
});`

```typescript
// Cliente
config.headers["X-Business-ID"] = user.businessId;

// Backend (debe implementar)
if (jwtPayload.businessId !== request.headers['x-business-id']) {
  throw new UnauthorizedException();
}
```

### Roles y Permisos

```typescript
enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",  // Acceso a todo
  OWNER = "OWNER",              // Su propio negocio
  ADMIN = "ADMIN",              // Negocio asignado
  OPERATOR = "OPERATOR",        // Operaciones limitadas
  MESERO = "MESERO",            // Solo pedidos
  DELIVERY = "DELIVERY",        // Solo entregas
}
```

## 🔒 Protección de Rutas

### Middleware (SSR)

```typescript
// Lee refresh token de cookie httpOnly
const refreshToken = request.cookies.get("togo_refresh_token")?.value;
const hasCookie = !!refreshToken;
```

**⚠️ Limitación importante:**
- El middleware solo verifica que **exista** la cookie
- **NO valida** que el refresh token siga siendo válido (podría estar revocado)
- La validación real ocurre en el cliente cuando AuthProvider intenta el silent refresh
- Si el token está revocado, el usuario es redirigido a login después de ver el loading

**¿Por qué no validamos en el middleware?**
- Edge Runtime no permite llamadas complejas al backend
- Validar en cada request ralentizaría la app
- El enfoque "optimista" (permitir y validar después) es aceptable para la mayoría de casos

### AuthProvider (Client-Side Session Restoration)

```typescript
// Cuando el usuario carga la página (F5):
// 1. Access token en memoria: VACÍO (se perdió)
// 2. AuthProvider intenta: POST /api/auth/refresh
// 3. Si éxito: Almacena nuevo access token en memoria
// 4. Si falla: Redirige a login
```

**Estados del restore:**
- `"restoring"` - Mostrando spinner mientras valida cookie
- `"restored"` - Sesión restaurada, token en memoria
- `"failed"` - Cookie inválida/expirada, redirige a login

### Client Guard (Client-Side)

```typescript
function useAuthGuard() {
  const isAuthenticated = useIsAuthenticated(); // Check memory token
  const router = useRouter();
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated]);
}
```

## ⚠️ Consideraciones de Seguridad

### XSS Protection

| Vector | Protección |
|--------|------------|
| Scripts inyectados | Refresh token inaccesible (httpOnly) |
| Dependencias maliciosas | Access token en memoria, no en window |
| localStorage poisoning | No usamos localStorage para tokens |

### CSRF Protection

No usamos tokens CSRF: con este modelo no aportan.

- **Llamadas al API:** llevan el access token en `Authorization: Bearer`, guardado en memoria. El navegador no adjunta esa cabecera por su cuenta, así que un sitio externo no puede forjar una petición autenticada.
- **Rutas que dependen de cookie:** son solo `/api/auth/refresh` y `/api/auth/logout`. La cookie `togo_refresh_token` es `httpOnly` y `SameSite=Lax`, así que no viaja en POST cross-site.
- **XSS:** un token CSRF tampoco protegería contra XSS, porque el script inyectado puede pedirlo igual. La defensa contra XSS es la de la sección anterior.

> Historia: hubo un endpoint `/api/csrf` con un hook `useCsrf()`, pero ninguna pantalla lo usaba, el backend nunca validó `X-CSRF-Token` y el endpoint dependía de `POST /auth/validate-session`, que no existe en el API. Se eliminó en octubre de 2026.

### Recomendaciones para Producción

1. **HTTPS obligatorio** - Nunca enviar tokens por HTTP
2. **Rate limiting** - Limitar intentos de login (backend)
3. **Device fingerprinting** - Vincular tokens a dispositivo
4. **Audit logging** - Registrar logins/logouts/sospechosos
5. **2FA** - Considerar para roles OWNER/ADMIN
6. **Session management** - Permitir ver/revocar sesiones activas

## 🔄 Logout y Limpieza

### Logout Normal (con Logout Proxy)

**Problema potencial:** Si el backend falla al revocar el token, el usuario podría quedar con cookies "zombie".

**Solución:** Logout proxy que SIEMPRE limpia cookies:

```typescript
// /api/auth/logout-proxy/route.ts
export async function POST() {
  const refreshToken = cookieStore.get("togo_refresh_token")?.value;
  
  try {
    // Intentar revocar en backend
    if (refreshToken) {
      await fetch(`${API_BASE_URL}/auth/logout`, { ... });
    }
  } catch (error) {
    // Log pero NO fallar
    console.warn("Backend logout failed");
  } finally {
    // SIEMPRE limpiar cookies (incluso si backend falló)
    cookieStore.delete("togo_refresh_token");
  }
  
  return NextResponse.json({ success: true });
}
```

**Flujo completo:**
```
1. Cliente llama a /api/auth/logout-proxy
2. Proxy intenta revocar en backend
3. Proxy SIEMPRE limpia cookies (try/finally)
4. Cliente limpia estado en memoria
5. Redirige a /login
```

**Garantía:** El usuario nunca queda con cookies inválidas en el browser.

### Logout Global (todos los dispositivos)

```
1. POST /auth/logout-all
2. Backend revoca TODOS los refresh tokens del usuario
3. Todos los dispositivos requieren re-autenticación
```

## 📊 Comparación: localStorage vs httpOnly

| Aspecto | localStorage | httpOnly Cookies |
|---------|--------------|------------------|
| XSS | ❌ Vulnerable | ✅ Protegido |
| SSR | ❌ No disponible | ✅ Middleware puede leer |
| CSRF | ✅ Inmune | ✅ Protegido (Bearer en memoria + SameSite=Lax) |
| Subdominios | ✅ Funciona | ✅ SameSite=Lax permite navegación |
| Complejidad | Simple | Requiere API routes |
| Escalabilidad | ❌ No enterprise | ✅ Enterprise-ready |

## 🎯 Conclusión

El modelo actual **Access Token en memoria + Refresh Token en httpOnly cookie** proporciona:

- ✅ Protección contra XSS (access token inaccesible desde JS)
- ✅ SSR-compatible (middleware lee cookie)
- ✅ Rotación de tokens con queue system (sin race conditions)
- ✅ Revocación server-side
- ✅ SameSite=Lax (compatible con subdominios)
- ✅ Base sólida para escalar a enterprise

### Trade-offs Aceptados

| Aspecto | Decisión | Justificación |
|---------|----------|---------------|
| Middleware solo verifica existencia | No valida token contra backend | Edge Runtime limitado; validación real en cliente |
| Access token se pierce en reload | No persistente | Seguridad > Conveniencia; silent refresh lo mitiga |
| SameSite=Lax | No Strict | Necesario para futuro multi-subdominio |

### Checklist para Producción B2B

- [ ] **Device fingerprinting** - Vincular tokens a dispositivo/browser
- [ ] **2FA** - Para roles OWNER/ADMIN
- [ ] **Session management UI** - Ver/revocar sesiones activas
- [ ] **Rate limiting agresivo** - Login, refresh
- [ ] **Audit logging** - Todos los eventos de auth
- [ ] **Security headers** - CSP, HSTS, X-Frame-Options
- [ ] **Dependency scanning** - npm audit en CI/CD
