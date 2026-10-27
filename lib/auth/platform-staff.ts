/**
 * Personal de ToGo sin negocio propio: el SUPER_ADMIN y los usuarios internos
 * (PLATFORM: comerciales, supervisores). Ven todos los negocios eligiéndolos
 * con el selector; lo que pueden hacer lo deciden sus permisos (el backend es
 * el que manda).
 */
export function isPlatformStaffRole(role: string | null | undefined): boolean {
  return role === "SUPER_ADMIN" || role === "PLATFORM";
}
