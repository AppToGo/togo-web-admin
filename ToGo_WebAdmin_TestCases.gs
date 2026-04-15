/**
 * ToGo Web Admin — Test Cases Generator (versión optimizada)
 * ─────────────────────────────────────────────────────────
 * INSTRUCCIONES:
 *  1. Abre Google Sheets y crea un archivo nuevo (en blanco).
 *  2. Ve a Extensiones > Apps Script.
 *  3. Borra el código que aparece por defecto.
 *  4. Pega TODO el contenido de este archivo.
 *  5. Selecciona la función "buildTestDocument" en el desplegable.
 *  6. Haz clic en ▶ Ejecutar y acepta los permisos.
 *  7. Listo — debería terminar en ~30 segundos.
 */

// ─── Casos de prueba ──────────────────────────────────────────────────────────
// Formato: [ID, Módulo, Sub-módulo, Nombre, Precondiciones, Pasos, Resultado Esperado, Prioridad]
const TEST_CASES = [
  ["TC-001","Autenticación","Login","Login con credenciales válidas","Usuario registrado y activo","1. Abrir la URL del admin\n2. Ingresar email y contraseña válidos\n3. Clic en 'Iniciar sesión'","Redirige al dashboard principal","Alta"],
  ["TC-002","Autenticación","Login","Login con credenciales inválidas","Página de login visible","1. Ingresar email o contraseña incorrectos\n2. Clic en 'Iniciar sesión'","Muestra mensaje de error, permanece en login","Alta"],
  ["TC-003","Autenticación","Login","Campos vacíos en login","Página de login visible","1. Dejar email y contraseña vacíos\n2. Clic en 'Iniciar sesión'","Muestra mensajes de validación en los campos","Alta"],
  ["TC-004","Autenticación","Recuperar Contraseña","Solicitar recuperación de contraseña","Usuario tiene email registrado","1. Clic en '¿Olvidaste tu contraseña?'\n2. Ingresar email registrado\n3. Enviar formulario","Muestra confirmación de envío de correo","Alta"],
  ["TC-005","Autenticación","Registro","Registro de nuevo negocio (flujo completo)","El usuario no tiene cuenta","1. Ir a /register\n2. Completar paso 1: datos del usuario\n3. Completar paso 2: datos del negocio\n4. Enviar","Registro exitoso, redirige al dashboard","Alta"],
  ["TC-006","Autenticación","Registro","Registro con email ya existente","Existe un usuario con el email a usar","1. Ir a /register\n2. Ingresar email ya registrado\n3. Completar y enviar","Error: el email ya está registrado","Alta"],
  ["TC-007","Autenticación","Sesión","Cierre de sesión","Usuario autenticado","1. Clic en menú de usuario\n2. Seleccionar 'Cerrar sesión'","Sesión cerrada, redirige a login","Alta"],
  ["TC-008","Dashboard","KPIs","Visualización de métricas principales","Usuario autenticado con órdenes registradas","1. Navegar al dashboard\n2. Verificar tarjetas de KPI y valores","Muestra KPIs: ventas totales, órdenes, ticket promedio","Media"],
  ["TC-009","Dashboard","Filtros de fecha","Filtro 'Hoy'","Usuario autenticado","1. Seleccionar filtro 'Hoy'\n2. Verificar actualización de datos","KPIs y gráficas muestran solo datos del día actual","Media"],
  ["TC-010","Dashboard","Filtros de fecha","Filtro 'Esta semana'","Usuario autenticado","1. Seleccionar filtro 'Esta semana'\n2. Verificar datos","Datos reflejan el rango de la semana en curso","Media"],
  ["TC-011","Dashboard","Filtros de fecha","Rango de fechas personalizado","Usuario autenticado","1. Seleccionar rango personalizado\n2. Escoger fecha inicio y fin\n3. Aplicar","Datos actualizados para el rango seleccionado","Media"],
  ["TC-012","Órdenes","Vista Kanban","Visualización del tablero Kanban","Existen órdenes en distintos estados","1. Navegar a /dashboard/orders\n2. Verificar columnas por estado","Columnas de estado con órdenes correspondientes","Alta"],
  ["TC-013","Órdenes","Vista Kanban","Cambiar estado de orden via Kanban","Existen órdenes en estado 'Pendiente'","1. Arrastrar una orden de 'Pendiente' a 'En proceso'\n2. Verificar cambio","Orden cambia de columna y estado se actualiza","Alta"],
  ["TC-014","Órdenes","Filtros","Filtrar por tipo de entrega (delivery)","Existen órdenes de delivery y pickup","1. Seleccionar filtro 'Delivery'\n2. Verificar resultados","Solo se muestran órdenes de tipo Delivery","Alta"],
  ["TC-015","Órdenes","Filtros","Filtrar por estado de pago","Existen órdenes pagadas y pendientes","1. Seleccionar filtro 'Pagado'\n2. Verificar resultados","Solo se muestran órdenes con estado Pagado","Alta"],
  ["TC-016","Órdenes","Filtros","Buscar orden por ID","Existe al menos una orden con ID conocido","1. Ingresar ID de orden en el buscador\n2. Verificar resultados","Muestra únicamente la orden con ese ID","Alta"],
  ["TC-017","Órdenes","Detalle","Ver detalle de una orden","Existe al menos una orden","1. Clic en una orden del tablero\n2. Verificar panel de detalle","Muestra: productos, cliente, monto, pago, dirección","Alta"],
  ["TC-018","Órdenes","Filtros","Filtrar por sucursal","Negocio con más de una sucursal","1. Seleccionar sucursal específica\n2. Verificar órdenes mostradas","Solo se muestran órdenes de esa sucursal","Alta"],
  ["TC-019","Catálogo","Productos","Listar productos","Existen productos creados","1. Navegar a /dashboard/catalog/products\n2. Verificar lista/grid","Muestra todos los productos con nombre, precio e imagen","Alta"],
  ["TC-020","Catálogo","Productos","Crear nuevo producto","Usuario con permisos de edición","1. Clic en 'Agregar producto'\n2. Completar nombre, descripción, precio, categoría, imagen\n3. Guardar","Producto creado y visible en la lista","Alta"],
  ["TC-021","Catálogo","Productos","Crear producto con campos vacíos","Modal de creación abierto","1. Dejar nombre y precio vacíos\n2. Intentar guardar","Muestra mensajes de validación en campos requeridos","Alta"],
  ["TC-022","Catálogo","Productos","Editar producto existente","Existe al menos un producto","1. Seleccionar producto\n2. Clic en editar\n3. Modificar nombre o precio\n4. Guardar","Cambios guardados y reflejados en la lista","Alta"],
  ["TC-023","Catálogo","Productos","Eliminar producto","Existe al menos un producto","1. Seleccionar producto\n2. Clic en eliminar\n3. Confirmar","Producto eliminado y ya no aparece en la lista","Alta"],
  ["TC-024","Catálogo","Productos","Activar producto en sucursal","Producto creado, sucursal seleccionada","1. Seleccionar sucursal\n2. Buscar producto desactivado\n3. Activarlo","Producto queda activo para esa sucursal","Alta"],
  ["TC-025","Catálogo","Productos","Desactivar producto en sucursal","Producto activo en la sucursal","1. Seleccionar sucursal\n2. Buscar producto activo\n3. Desactivarlo","Producto queda inactivo para esa sucursal","Alta"],
  ["TC-026","Catálogo","Productos","Sobrescribir precio por sucursal","Producto activo en la sucursal","1. Seleccionar sucursal\n2. Editar producto\n3. Cambiar precio de sucursal\n4. Guardar","Precio sobreescrito aplica solo para esa sucursal","Media"],
  ["TC-027","Catálogo","Productos","Filtrar por categoría","Existen productos en distintas categorías","1. Seleccionar una categoría en el filtro\n2. Verificar resultados","Solo se muestran productos de esa categoría","Media"],
  ["TC-028","Catálogo","Productos","Buscar producto por nombre","Existen varios productos","1. Escribir nombre de producto en el buscador\n2. Verificar resultados","Muestra solo productos que coinciden con la búsqueda","Media"],
  ["TC-029","Catálogo","Categorías","Crear nueva categoría","Usuario con permisos de edición","1. Ir a /dashboard/catalog/categories\n2. Clic en 'Nueva categoría'\n3. Ingresar nombre\n4. Guardar","Categoría creada y visible en la lista","Alta"],
  ["TC-030","Catálogo","Categorías","Editar categoría existente","Existe al menos una categoría","1. Seleccionar categoría\n2. Editar nombre\n3. Guardar","Nombre de categoría actualizado","Media"],
  ["TC-031","Catálogo","Categorías","Eliminar categoría","Existe categoría sin productos asignados","1. Seleccionar categoría\n2. Clic en eliminar\n3. Confirmar","Categoría eliminada de la lista","Media"],
  ["TC-032","Sucursales","Listado","Ver lista de sucursales","Al menos una sucursal creada","1. Navegar a /dashboard/branches\n2. Verificar tarjetas de sucursales","Muestra todas las sucursales con nombre, dirección y estado","Alta"],
  ["TC-033","Sucursales","Crear","Crear nueva sucursal","Usuario con permisos, sin alcanzar límite del plan","1. Clic en 'Nueva sucursal'\n2. Completar nombre, dirección, teléfono, horario\n3. Guardar","Sucursal creada y visible en la lista","Alta"],
  ["TC-034","Sucursales","Crear","Crear sucursal con campos vacíos","Formulario de nueva sucursal abierto","1. Dejar nombre y dirección vacíos\n2. Intentar guardar","Muestra mensajes de validación en campos requeridos","Alta"],
  ["TC-035","Sucursales","Editar","Editar información de sucursal","Existe al menos una sucursal","1. Clic en una sucursal\n2. Editar nombre o teléfono\n3. Guardar","Cambios reflejados en la tarjeta de la sucursal","Alta"],
  ["TC-036","Sucursales","Eliminar","Eliminar sucursal","Existe más de una sucursal","1. Seleccionar sucursal\n2. Clic en eliminar\n3. Confirmar","Sucursal eliminada y ya no aparece en la lista","Alta"],
  ["TC-037","Sucursales","Límite de plan","Restricción por límite de sucursales","Negocio en el límite de sucursales del plan","1. Intentar crear sucursal adicional\n2. Verificar restricción","Muestra mensaje de límite alcanzado con opción de upgrade","Alta"],
  ["TC-038","Sucursales","Configuración","Configurar horarios de sucursal","Existe al menos una sucursal","1. Ir a configuración de la sucursal\n2. Modificar horarios\n3. Guardar","Horarios guardados correctamente","Media"],
  ["TC-039","Clientes","Listado","Ver lista de clientes","Existen clientes registrados","1. Navegar a /dashboard/customers\n2. Verificar tabla de clientes","Muestra clientes con nombre, email y métricas básicas","Media"],
  ["TC-040","Clientes","Búsqueda","Buscar cliente por nombre","Existen clientes registrados","1. Escribir nombre en el buscador\n2. Verificar resultados","Muestra solo los clientes que coinciden","Media"],
  ["TC-041","Clientes","Búsqueda","Buscar cliente por email","Existen clientes registrados","1. Escribir email en el buscador\n2. Verificar resultados","Encuentra y muestra el cliente con ese email","Media"],
  ["TC-042","Clientes","Detalle","Ver detalle de cliente","Existen clientes con historial de órdenes","1. Clic en un cliente\n2. Verificar página de detalle","Muestra: contacto, historial de órdenes, total gastado, favoritos","Media"],
  ["TC-043","Clientes","Filtros","Filtrar clientes por sucursal","Negocio con múltiples sucursales","1. Seleccionar una sucursal\n2. Verificar resultados","Solo se muestran clientes de esa sucursal","Media"],
  ["TC-044","Configuración","Negocio","Editar información básica del negocio","Usuario administrador del negocio","1. Ir a Configuración > General > Negocio\n2. Modificar nombre o descripción\n3. Guardar","Cambios guardados y reflejados","Media"],
  ["TC-045","Configuración","Negocio","Subir logo del negocio","Formulario de configuración abierto","1. Clic en área de subida de logo\n2. Seleccionar imagen JPG/PNG\n3. Guardar","Logo subido y visible en la configuración","Media"],
  ["TC-046","Configuración","Negocio","Subir banner del negocio","Formulario de configuración abierto","1. Clic en área de subida de banner\n2. Seleccionar imagen\n3. Guardar","Banner subido correctamente","Media"],
  ["TC-047","Configuración","Negocio","Cambiar color primario de la marca","Formulario de configuración abierto","1. Clic en selector de color primario\n2. Escoger nuevo color\n3. Guardar","Color primario actualizado y visible en la vista previa","Baja"],
  ["TC-048","Configuración","Negocio","Cambiar visibilidad del catálogo","Formulario de configuración abierto","1. Cambiar visibilidad (Público/Privado/Restringido)\n2. Guardar","Visibilidad actualizada correctamente","Media"],
  ["TC-049","Configuración","Usuarios","Ver lista de usuarios del negocio","Existen usuarios asignados","1. Ir a Configuración > Usuarios\n2. Verificar lista","Muestra usuarios con nombre, email y rol","Media"],
  ["TC-050","Configuración","Usuarios","Ver detalle y permisos de usuario","Existe al menos un usuario asignado","1. Clic en un usuario\n2. Verificar página de detalle","Muestra info, rol, sucursales asignadas y permisos","Media"],
  ["TC-051","Perfiles Operador","Listado","Ver lista de perfiles de operador","Existen perfiles creados","1. Ir a Configuración > Perfiles de operador\n2. Verificar lista","Muestra perfiles con nombre y descripción","Media"],
  ["TC-052","Perfiles Operador","Crear","Crear nuevo perfil de operador","Usuario administrador","1. Clic en 'Nuevo perfil'\n2. Ingresar nombre y permisos\n3. Guardar","Perfil creado y visible en la lista","Media"],
  ["TC-053","Perfiles Operador","Editar","Editar permisos de un perfil","Existe al menos un perfil","1. Seleccionar perfil\n2. Modificar permisos\n3. Guardar","Permisos actualizados correctamente","Media"],
  ["TC-054","Perfiles Operador","Eliminar","Eliminar perfil de operador","Existe un perfil sin usuarios asignados","1. Seleccionar perfil\n2. Clic en eliminar\n3. Confirmar","Perfil eliminado y ya no aparece","Media"],
  ["TC-055","Inventario","Vista","Ver inventario de una sucursal","Productos con stock asignado a una sucursal","1. Navegar a /dashboard/inventory\n2. Seleccionar sucursal\n3. Verificar vista","Muestra inventario con niveles de stock por producto","Baja"],
  ["TC-056","Inventario","Alertas","Verificar alerta de stock bajo","Existe al menos un producto con stock bajo","1. Navegar a /dashboard/inventory\n2. Verificar indicadores de stock bajo","Muestra alerta visual para productos con bajo inventario","Baja"],
  ["TC-057","Admin","Negocios","Ver lista de negocios (Super Admin)","Usuario con rol SUPER_ADMIN","1. Navegar a /admin/businesses\n2. Verificar lista de negocios","Muestra todos los negocios con estado de suscripción","Alta"],
  ["TC-058","Admin","Negocios","Activar/desactivar un negocio","Usuario SUPER_ADMIN, existe un negocio","1. Seleccionar negocio\n2. Cambiar estado activo/inactivo\n3. Confirmar","Estado del negocio cambia correctamente","Alta"],
  ["TC-059","Admin","Negocios","Registrar pago de suscripción","Usuario SUPER_ADMIN, negocio con pago pendiente","1. Seleccionar negocio\n2. Clic en 'Registrar pago'\n3. Ingresar monto y fecha\n4. Confirmar","Pago registrado y estado actualizado","Alta"],
  ["TC-060","Admin","Negocios","Actualizar límite de sucursales","Usuario SUPER_ADMIN","1. Seleccionar negocio\n2. Clic en 'Actualizar límite'\n3. Cambiar número\n4. Guardar","Nuevo límite aplicado al negocio","Alta"],
  ["TC-061","Admin","Productos Globales","Crear producto global","Usuario SUPER_ADMIN","1. Navegar a /admin/global-products\n2. Clic en 'Nuevo producto'\n3. Completar formulario\n4. Guardar","Producto global creado y visible en el catálogo","Alta"],
  ["TC-062","Admin","Productos Globales","Editar producto global","Existe al menos un producto global","1. Seleccionar producto global\n2. Editar nombre o descripción\n3. Guardar","Cambios guardados en el catálogo global","Alta"],
  ["TC-063","Admin","Categorías Industria","Gestionar categorías de industria","Usuario SUPER_ADMIN","1. Navegar a /admin/industry-categories\n2. Verificar lista\n3. Crear o editar una categoría","Categorías gestionadas correctamente","Alta"],
  ["TC-064","Configuración","Notificaciones","Configurar preferencias de notificaciones","Usuario autenticado","1. Ir a Configuración > Notificaciones\n2. Activar/desactivar notificaciones\n3. Guardar","Preferencias guardadas correctamente","Baja"],
  ["TC-065","UI/UX","Responsive","Vista en tablet (768px)","Acceso desde tablet o navegador redimensionado","1. Redimensionar navegador a 768px\n2. Navegar por las secciones principales","Layout adaptado, menús y tablas usables","Baja"],
  ["TC-066","UI/UX","Responsive","Vista en móvil (375px)","Acceso desde móvil o navegador redimensionado","1. Redimensionar navegador a 375px\n2. Navegar por las secciones principales","Layout adaptado sin superposición de elementos","Baja"],
  ["TC-067","UI/UX","Navegación","Navegación por el menú lateral","Usuario autenticado en el dashboard","1. Clic en cada opción del menú lateral\n2. Verificar carga de cada página","Cada sección carga correctamente sin errores","Baja"],
  ["TC-068","UI/UX","Mensajes","Toast de éxito al guardar","Usuario realizando operación de guardado","1. Realizar operación (crear, editar, eliminar)\n2. Confirmar","Aparece notificación de éxito con mensaje descriptivo","Media"],
  ["TC-069","UI/UX","Mensajes","Toast de error cuando falla operación","Operación que debe fallar (datos inválidos)","1. Intentar guardar con datos inválidos\n2. Observar feedback","Aparece notificación de error con mensaje descriptivo","Media"],
  ["TC-070","Suscripción","Plan Gratuito","Restricciones del plan gratuito","Negocio en plan gratuito","1. Navegar al dashboard\n2. Verificar funciones bloqueadas\n3. Intentar acceder a función premium","Banner de plan gratuito visible, funciones premium bloqueadas con CTA de upgrade","Media"],
  ["TC-071","Suscripción","Upgrade","Flujo de actualización de plan","Negocio en plan gratuito o básico","1. Clic en banner de upgrade o función bloqueada\n2. Seguir el flujo","Muestra pantalla con opciones de planes disponibles","Media"],
  ["TC-072","Órdenes","Tiempo Real","Nuevas órdenes en tiempo real","WebSocket activo","1. Mantener vista de órdenes abierta\n2. Crear orden desde app de cliente\n3. Verificar aparición sin recargar","Nueva orden aparece en el Kanban automáticamente","Alta"],
  ["TC-073","General","Paginación","Paginación en lista de productos","Más productos que el tamaño de página","1. Ir a lista de productos\n2. Navegar a siguiente página","Segunda página de productos carga correctamente","Baja"],
  ["TC-074","General","Paginación","Paginación en lista de clientes","Más registros que el tamaño de página","1. Ir a lista de clientes\n2. Navegar entre páginas","Paginación funciona mostrando clientes por páginas","Baja"],
];

const HEADERS = [
  "ID", "Módulo", "Sub-módulo", "Caso de Prueba", "Precondiciones",
  "Pasos", "Resultado Esperado", "Resultado Actual", "Estado",
  "Prioridad", "Tester", "Fecha", "Notas"
];

// ─── Entry point ──────────────────────────────────────────────────────────────
function buildTestDocument() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  buildInstructionsSheet(ss);
  buildTestCasesSheet(ss);
  buildSummarySheet(ss);

  // Eliminar hoja en blanco por defecto si existe
  ["Hoja 1", "Sheet1", "Hoja1"].forEach(name => {
    const s = ss.getSheetByName(name);
    if (s) try { ss.deleteSheet(s); } catch(e) {}
  });

  ss.setActiveSheet(ss.getSheetByName("Casos de Prueba"));
  SpreadsheetApp.getUi().alert(
    "Documento generado correctamente.\n\n" +
    "Hojas creadas:\n" +
    "  • Instrucciones\n" +
    "  • Casos de Prueba (74 casos)\n" +
    "  • Resumen"
  );
}

// ─── Hoja: Instrucciones ──────────────────────────────────────────────────────
function buildInstructionsSheet(ss) {
  let ws = ss.getSheetByName("Instrucciones");
  if (ws) ss.deleteSheet(ws);
  ws = ss.insertSheet("Instrucciones", 0);
  ws.setTabColor("#2D2D2D");
  ws.setColumnWidth(1, 20);
  ws.setColumnWidth(2, 700);

  // Título
  ws.setRowHeight(2, 44);
  ws.getRange("B2")
    .setValue("ToGo Web Admin — Documento de Pruebas Manuales")
    .setBackground("#2D2D2D").setFontColor("#FFFFFF")
    .setFontSize(16).setFontWeight("bold").setFontFamily("Arial")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");

  // Subtítulo
  ws.setRowHeight(3, 28);
  ws.getRange("B3")
    .setValue("Guía de uso para el tester")
    .setBackground("#FFF0E8").setFontColor("#E85D26")
    .setFontSize(11).setFontStyle("italic").setFontFamily("Arial")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");

  const sections = [
    [5,  "Qué es este documento",
         "Este archivo contiene los 74 casos de prueba para la verificación manual del panel de administración de ToGo. Cada fila representa un caso con pasos detallados y resultado esperado."],
    [8,  "Cómo completar los resultados",
         "1. Ejecutar los pasos de la columna 'Pasos'.\n2. Registrar lo ocurrido en 'Resultado Actual'.\n3. Cambiar 'Estado' con el menú desplegable: Aprobado / Fallido / Omitido.\n4. Agregar tu nombre en 'Tester' y la fecha en 'Fecha'.\n5. Comentarios adicionales en 'Notas'."],
    [13, "Prioridades",
         "Alta   → Funcionalidades críticas. Probar primero.\nMedia  → Importantes pero no críticas.\nBaja   → Secundarias o de experiencia de usuario."],
    [17, "Hojas del documento",
         "• Instrucciones    → Esta hoja.\n• Casos de Prueba  → Los 74 casos para ejecutar.\n• Resumen          → Estadísticas automáticas de avance."],
  ];

  sections.forEach(([row, title, body]) => {
    ws.setRowHeight(row, 24);
    ws.getRange(row, 2).setValue(title)
      .setFontColor("#E85D26").setFontWeight("bold")
      .setFontSize(11).setFontFamily("Arial");

    ws.setRowHeight(row + 1, 72);
    ws.getRange(row + 1, 2).setValue(body)
      .setBackground("#F9F9F9").setFontSize(10).setFontFamily("Arial")
      .setVerticalAlignment("top").setWrap(true)
      .setBorder(true,true,true,true,false,false,"#DDDDDD", SpreadsheetApp.BorderStyle.SOLID);
  });
}

// ─── Hoja: Casos de Prueba ────────────────────────────────────────────────────
function buildTestCasesSheet(ss) {
  let ws = ss.getSheetByName("Casos de Prueba");
  if (ws) ss.deleteSheet(ws);
  ws = ss.insertSheet("Casos de Prueba", 1);
  ws.setTabColor("#E85D26");

  // Anchos de columna (una sola llamada por columna)
  const widths = [70, 130, 140, 300, 240, 360, 320, 210, 100, 90, 110, 90, 240];
  widths.forEach((w, i) => ws.setColumnWidth(i + 1, w));

  // ── Encabezado ──
  ws.setRowHeight(1, 36);
  ws.getRange(1, 1, 1, HEADERS.length)
    .setValues([HEADERS])
    .setBackground("#2D2D2D").setFontColor("#FFFFFF")
    .setFontWeight("bold").setFontSize(10).setFontFamily("Arial")
    .setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setBorder(true,true,true,true,true,true,"#000000", SpreadsheetApp.BorderStyle.SOLID);

  ws.setFrozenRows(1);

  // ── Datos — UN SOLO setValues para las 74 filas ──
  const rows = TEST_CASES.map(tc => [
    tc[0], tc[1], tc[2], tc[3], tc[4], tc[5], tc[6],
    "", "Pendiente", tc[7], "", "", ""
  ]);
  const dataRange = ws.getRange(2, 1, rows.length, HEADERS.length);
  dataRange.setValues(rows);

  // ── Formato en bloque (mínimo de llamadas) ──
  dataRange
    .setFontFamily("Arial").setFontSize(9)
    .setVerticalAlignment("top").setWrap(true)
    .setBackground("#FFFFFF")
    .setBorder(true,true,true,true,true,true,"#CCCCCC", SpreadsheetApp.BorderStyle.SOLID);

  ws.setRowHeights(2, rows.length, 70);

  // Alineación centrada para columnas puntuales
  [1, 9, 10, 11, 12].forEach(col => {
    ws.getRange(2, col, rows.length, 1).setHorizontalAlignment("center");
  });

  // ── Dropdown en columna Estado ──
  const estadoRange = ws.getRange(2, 9, rows.length, 1);
  estadoRange.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(["Pendiente","Aprobado","Fallido","Omitido"], true)
      .setAllowInvalid(false).build()
  );

  // ── Formato condicional (Estado + Prioridad) — todo en una sola llamada ──
  ws.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Aprobado")
      .setBackground("#D6F4D6").setFontColor("#2E7D32").setRanges([estadoRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Fallido")
      .setBackground("#FAD7D7").setFontColor("#C62828").setRanges([estadoRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Omitido")
      .setBackground("#E8EAF6").setFontColor("#3949AB").setRanges([estadoRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Pendiente")
      .setBackground("#FFF9C4").setFontColor("#F57F17").setRanges([estadoRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Alta")
      .setBackground("#FFCCCC").setFontColor("#B71C1C")
      .setRanges([ws.getRange(2, 10, rows.length, 1)]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Media")
      .setBackground("#FFF2CC").setFontColor("#E65100")
      .setRanges([ws.getRange(2, 10, rows.length, 1)]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Baja")
      .setBackground("#D9EAD3").setFontColor("#1B5E20")
      .setRanges([ws.getRange(2, 10, rows.length, 1)]).build(),
  ]);

  // ── Filtro ──
  ws.getRange(1, 1, rows.length + 1, HEADERS.length).createFilter();
}

// ─── Hoja: Resumen ────────────────────────────────────────────────────────────
function buildSummarySheet(ss) {
  let ws = ss.getSheetByName("Resumen");
  if (ws) ss.deleteSheet(ws);
  ws = ss.insertSheet("Resumen", 2);
  ws.setTabColor("#2D7D32");

  ws.setColumnWidth(1, 20);
  ws.setColumnWidth(2, 200);
  ws.setColumnWidth(3, 110);
  ws.setColumnWidth(4, 30);
  ws.setColumnWidth(5, 190);
  ws.setColumnWidth(6, 80);
  ws.setColumnWidth(7, 100);

  // Título
  ws.setRowHeight(2, 40);
  ws.getRange("B2:G2").merge()
    .setValue("Resumen de Ejecución de Pruebas")
    .setBackground("#2D2D2D").setFontColor("#FFFFFF")
    .setFontWeight("bold").setFontSize(14).setFontFamily("Arial")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");

  // Encabezados tablas izquierda y derecha en una sola llamada
  ws.setRowHeight(4, 28);
  ws.getRange(4, 2, 1, 2).setValues([["Métrica","Valor"]])
    .setBackground("#E85D26").setFontColor("#FFFFFF")
    .setFontWeight("bold").setFontSize(10).setFontFamily("Arial")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");

  ws.getRange(4, 5, 1, 3).setValues([["Módulo","Total","Aprobados"]])
    .setBackground("#E85D26").setFontColor("#FFFFFF")
    .setFontWeight("bold").setFontSize(10).setFontFamily("Arial")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");

  const n = TEST_CASES.length;

  // Métricas izquierda — labels en bloque, fórmulas con setFormula() individual
  // (setFormulas() con arrays puede fallar en locales no-inglés; setFormula() es más fiable)
  const metricLabels = [
    ["Total de casos"],["Aprobados ✅"],["Fallidos ❌"],["Omitidos ⏭"],["Pendientes ⏳"],["% Completado"]
  ];
  const metricBgs = ["#F2F2F2","#D6F4D6","#FAD7D7","#E8EAF6","#FFF9C4","#E3F2FD"];

  ws.getRange(5, 2, 6, 1).setValues(metricLabels)
    .setFontWeight("bold").setFontSize(10).setFontFamily("Arial")
    .setBorder(true,true,true,true,true,true,"#CCCCCC", SpreadsheetApp.BorderStyle.SOLID);
  ws.getRange(5, 3, 6, 1)
    .setFontSize(10).setFontFamily("Arial").setHorizontalAlignment("center")
    .setBorder(true,true,true,true,true,true,"#CCCCCC", SpreadsheetApp.BorderStyle.SOLID);

  // setFormula() individual — garantiza sintaxis correcta sin importar el locale
  ws.getRange(5, 3).setFormula("=COUNTA('Casos de Prueba'!A2:A" + (n+1) + ")");
  ws.getRange(6, 3).setFormula("=COUNTIF('Casos de Prueba'!I2:I" + (n+1) + ",\"Aprobado\")");
  ws.getRange(7, 3).setFormula("=COUNTIF('Casos de Prueba'!I2:I" + (n+1) + ",\"Fallido\")");
  ws.getRange(8, 3).setFormula("=COUNTIF('Casos de Prueba'!I2:I" + (n+1) + ",\"Omitido\")");
  ws.getRange(9, 3).setFormula("=COUNTIF('Casos de Prueba'!I2:I" + (n+1) + ",\"Pendiente\")");
  ws.getRange(10, 3).setFormula("=IFERROR(C6/C5,0)");
  ws.getRange(10, 3).setNumberFormat("0.0%");

  metricBgs.forEach((bg, i) => ws.getRange(5 + i, 2, 1, 2).setBackground(bg));

  // Módulos — labels y totales en bloque, fórmulas con setFormula() individual
  const modules = [...new Set(TEST_CASES.map(tc => tc[1]))].sort();
  const modLabels  = modules.map(m => [m]);
  const modTotals  = modules.map(m => [TEST_CASES.filter(tc => tc[1] === m).length]);

  ws.getRange(5, 5, modules.length, 1).setValues(modLabels)
    .setFontSize(10).setFontFamily("Arial").setBackground("#F2F2F2")
    .setBorder(true,true,true,true,true,true,"#CCCCCC", SpreadsheetApp.BorderStyle.SOLID);
  ws.getRange(5, 6, modules.length, 1).setValues(modTotals)
    .setFontSize(10).setFontFamily("Arial").setHorizontalAlignment("center").setBackground("#F2F2F2")
    .setBorder(true,true,true,true,true,true,"#CCCCCC", SpreadsheetApp.BorderStyle.SOLID);
  ws.getRange(5, 7, modules.length, 1)
    .setFontSize(10).setFontFamily("Arial").setHorizontalAlignment("center").setBackground("#D6F4D6")
    .setBorder(true,true,true,true,true,true,"#CCCCCC", SpreadsheetApp.BorderStyle.SOLID);

  modules.forEach((_, i) => {
    ws.getRange(5 + i, 7).setFormula(
      "=COUNTIFS('Casos de Prueba'!B2:B" + (n+1) + ",E" + (5+i) +
      ",'Casos de Prueba'!I2:I" + (n+1) + ",\"Aprobado\")"
    );
  });

  // Nota final
  const noteRow = 5 + modules.length + 2;
  ws.getRange(noteRow, 2, 1, 6).merge()
    .setValue("Las métricas se actualizan automáticamente al cambiar el Estado en la hoja 'Casos de Prueba'.")
    .setBackground("#FFF9C4").setFontSize(10).setFontFamily("Arial")
    .setFontStyle("italic").setVerticalAlignment("middle").setWrap(true)
    .setBorder(true,true,true,true,false,false,"#F0C040", SpreadsheetApp.BorderStyle.SOLID);
  ws.setRowHeight(noteRow, 36);
}
