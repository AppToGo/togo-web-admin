# Sistema de Filtros de Fecha Globales

Este módulo implementa un sistema de filtros de fecha global que sincroniza el período seleccionado entre el Dashboard y la página de Órdenes.

## Arquitectura

### Store Zustand con Persistencia

El store `useDateFilterStore` mantiene el estado global de los filtros de fecha:

- **Preset seleccionado**: today, yesterday, week, last7days, month, custom
- **Rango de fechas**: from/to en formato YYYY-MM-DD
- **Persistencia**: Los datos se guardan en localStorage
- **Recálculo automático**: Al rehidratar, los presets se recalculan para que "today" sea siempre el día actual

### Hooks de Integración

Los hooks conectan el store con TanStack Query:

- `useDateFilterParams()`: Retorna `{ dateFrom, dateTo }` listo para la API
- `useDateFilterQuery()`: Retorna el rango completo para queryKeys
- `useDateFilterKey()`: Retorna queryKey array para invalidaciones

### Componente Reutilizable

`DateRangeFilter` es un componente que puede usarse en cualquier página:

```tsx
<DateRangeFilter
  variant="default"
  showPresets={true}
  availablePresets={["today", "week", "month", "custom"]}
/>
```

## Uso

### En Dashboard

El Dashboard muestra el filtro en el header y actualiza automáticamente las métricas:

```tsx
import { DateRangeFilter } from "@/features/filters/components";
import { useDashboardMetrics } from "@/features/orders/hooks/useOrderMetrics";

const { data: metrics } = useDashboardMetrics();
```

### En Órdenes

La página de órdenes usa el mismo filtro, sincronizando la lista de órdenes:

```tsx
import { useDateFilterParams } from "@/features/filters/hooks";

const dateParams = useDateFilterParams();
const { data: orders } = useOrders(dateParams);
```

### En Hooks Existentes

Los hooks de órdenes ahora usan los filtros globales por defecto:

- `useOrderMetrics(params?)` - Usa filtros globales automáticamente
- `useOrders(params?)` - Usa filtros globales, params puede sobreescribir
- `useOrdersByStatus(params?)` - Usa filtros globales, soporta `skipDateFilter`

## Presets Disponibles

| Preset | Descripción | Rango calculado |
|--------|-------------|-----------------|
| today | Hoy | Desde hoy hasta hoy |
| yesterday | Ayer | Desde ayer hasta ayer |
| week | Esta semana | Desde domingo hasta hoy |
| last7days | Últimos 7 días | Desde hace 6 días hasta hoy |
| month | Este mes | Desde el 1ro del mes hasta hoy |
| custom | Personalizado | Definido por el usuario |

## API

### Stores

```typescript
import {
  useDateFilterStore,
  useDateFilterRange,
  useDateFilterPreset,
  useDateFilterActions,
} from "@/features/filters/stores";

// Acciones
setPreset("week");
setCustomRange({ from: "2024-01-01", to: "2024-01-31" });
```

### Hooks

```typescript
import {
  useDateFilterQuery,
  useDateFilterParams,
  useDateFilterKey,
  useHasDateFilter,
  useDateFilterDays,
} from "@/features/filters/hooks";

// Para usar en queries
const dateParams = useDateFilterParams();
const { data } = useQuery({
  queryKey: ["orders", dateParams.dateFrom, dateParams.dateTo],
  queryFn: () => getOrders(dateParams),
});
```

## Sincronización

Cuando el usuario cambia el filtro en Dashboard:

1. El store se actualiza
2. React Query detecta cambio en queryKey
3. Las queries se invalidan automáticamente
4. Los datos se refrescan en ambas páginas

## Notas

- Los filtros de fecha global siempre tienen prioridad
- Los parámetros explícitos en los hooks pueden sobreescribir los globales
- El formato de fecha siempre es YYYY-MM-DD para el backend
- Las fechas se manejan en zona horaria local del usuario
