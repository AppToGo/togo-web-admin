# Dev Analysis: WhatsApp Config Web Admin

## Objetivo
Implementar formulario de configuración de WhatsApp Cloud API en `/dashboard/settings/general/whatsapp/`. Permite registrar cuentas WABA (phoneNumber, metaWabaId, phoneNumberId, accessToken) y configurar reglas de ruteo hacia sedes. Sin integración OAuth con Meta — solo datos manuales.

## Archivos a modificar
- `components/layout/Sidebar.tsx` — Agregar item "WhatsApp" al submenu de settings
- `i18n/request.ts` — Registrar namespace `whatsapp`
- `i18n/messages/es/navigation.json` — Agregar clave `whatsapp`
- `i18n/messages/en/navigation.json` — Agregar clave `whatsapp`

## Archivos a crear
### Feature layer
- `features/whatsapp/types/whatsapp.types.ts`
- `features/whatsapp/types/index.ts`
- `features/whatsapp/services/whatsapp.service.ts`
- `features/whatsapp/hooks/query-keys.ts`
- `features/whatsapp/hooks/useWhatsAppAccounts.ts`
- `features/whatsapp/hooks/useWhatsAppAccountMutations.ts`
- `features/whatsapp/hooks/useWhatsAppRoutings.ts`
- `features/whatsapp/hooks/useWhatsAppRoutingMutations.ts`
- `features/whatsapp/hooks/index.ts`
- `features/whatsapp/components/WhatsAppAccountFormDialog.tsx`
- `features/whatsapp/components/WhatsAppRoutingFormDialog.tsx`
- `features/whatsapp/components/index.ts`
- `features/whatsapp/index.ts`

### Route page
- `app/[locale]/dashboard/settings/general/whatsapp/page.tsx`

### i18n
- `i18n/messages/es/whatsapp.json`
- `i18n/messages/en/whatsapp.json`

## Riesgos
- accessToken sensible → input type="password" con toggle, vacío en modo edición
- Borrar cuenta con routing rules → invalidar WHATSAPP_ROUTING_KEYS en onSettled
- Sin cuentas → deshabilitar "Nueva regla" con Alert informativo
- namespace no registrado → paso obligatorio en i18n/request.ts
