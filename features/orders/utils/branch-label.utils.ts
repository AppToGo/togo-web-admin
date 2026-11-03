/**
 * Utilidades para formatear el nombre de una sede en tarjetas y detalle de pedidos:
 * - Limpieza de prefijos genéricos ("Sede ", "Sucursal ", etc.).
 * - Código corto / iniciales (2–3 caracteres) para el encabezado compacto de la card.
 */

const BRANCH_PREFIX_REGEX =
  /^(?:sede|sucursal|punto|local|tienda|branch)(?:\s*[-:·.]\s*|\s+)/i;

const STOPWORDS = new Set([
  "de",
  "del",
  "la",
  "las",
  "el",
  "los",
  "y",
  "e",
  "en",
  "a",
  "al",
  "por",
  "con",
  "the",
  "of",
]);

export interface BranchDisplayInfo {
  fullName: string;
  cleanName: string;
  shortCode: string;
}

/**
 * Quita prefijos redundantes como "Sede " o "Sucursal " al inicio del nombre.
 * Si al quitar el prefijo el texto queda vacío (p. ej. la sede se llama "Sede"),
 * conserva el nombre original recortado.
 */
export function cleanBranchName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";

  const cleaned = trimmed.replace(BRANCH_PREFIX_REGEX, "").trim();
  return cleaned.length > 0 ? cleaned : trimmed;
}

/**
 * Normaliza un texto eliminando diacríticos y caracteres no alfanuméricos.
 */
function toAlphanumericUpper(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
}

/**
 * Genera el código corto (2–3 caracteres en mayúscula) a partir del nombre
 * limpio de la sede:
 * - 1 palabra ("Centro", "Chapinero") → primeras 3 letras ("CEN", "CHA").
 * - 2+ palabras con número o letra suelta ("Calle 85", "Zona T") → inicial + token ("C85", "ZT").
 * - 2+ palabras ("Santa Bárbara", "Parque Lleras") → iniciales de hasta 3 palabras ("SB", "PL").
 */
export function formatBranchShortCode(name: string): string {
  const cleaned = cleanBranchName(name);
  if (!cleaned) return "";

  const rawTokens = cleaned
    .split(/[\s\-_/·.,:]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const significantTokens = rawTokens.filter(
    (token) => !STOPWORDS.has(token.toLowerCase())
  );
  const tokens = significantTokens.length > 0 ? significantTokens : rawTokens;

  if (tokens.length === 1) {
    const normalized = toAlphanumericUpper(tokens[0]);
    return normalized.slice(0, 3);
  }

  const first = toAlphanumericUpper(tokens[0]);
  const second = toAlphanumericUpper(tokens[1] ?? "");

  // Ej. "Calle 85" → "C85", "Parque 93" → "P93", "Zona T" → "ZT"
  if (
    tokens.length === 2 &&
    first.length > 0 &&
    second.length > 0 &&
    (/^\d{1,3}$/.test(second) || second.length === 1)
  ) {
    return `${first[0]}${second}`.slice(0, 4);
  }

  // Iniciales de las primeras 3 palabras significativas (ej. "Santa Bárbara" → "SB")
  const initials = tokens
    .slice(0, 3)
    .map((token) => toAlphanumericUpper(token)[0] ?? "")
    .join("");

  if (initials.length >= 2) {
    return initials;
  }

  return toAlphanumericUpper(cleaned).slice(0, 3);
}

/**
 * Resuelve la información visual de la sede (`fullName`, `cleanName`, `shortCode`)
 * a partir del mapa `id -> nombre`. Si dos sedes distintas comparten el mismo
 * código corto, desempata extendiendo a un código de hasta 4 caracteres.
 */
export function resolveBranchDisplay(
  branchId: string | undefined,
  branchNamesById: Record<string, string>
): BranchDisplayInfo | null {
  if (!branchId) return null;
  const fullName = branchNamesById[branchId]?.trim();
  if (!fullName) return null;

  const cleanName = cleanBranchName(fullName);
  const baseCode = formatBranchShortCode(fullName);
  if (!baseCode) return null;

  // Verificar si otra sede con distinto nombre limpio produce el mismo código corto
  const hasCollision = Object.entries(branchNamesById).some(
    ([otherId, otherName]) => {
      if (otherId === branchId || !otherName?.trim()) return false;
      const otherClean = cleanBranchName(otherName);
      if (otherClean.toLowerCase() === cleanName.toLowerCase()) return false;
      return formatBranchShortCode(otherName) === baseCode;
    }
  );

  if (!hasCollision) {
    return { fullName, cleanName, shortCode: baseCode };
  }

  // Desempate: si tiene varias palabras, inicial de la 1ª + 2 letras de la última;
  // si es 1 sola palabra, hasta 4 letras.
  const tokens = cleanName
    .split(/[\s\-_/·.,:]+/)
    .map((t) => toAlphanumericUpper(t))
    .filter((t) => t.length > 0 && !STOPWORDS.has(t.toLowerCase()));

  const disambiguated =
    tokens.length >= 2
      ? `${tokens[0][0]}${tokens[tokens.length - 1].slice(0, 2)}`
      : toAlphanumericUpper(cleanName).slice(0, 4);

  return {
    fullName,
    cleanName,
    shortCode: disambiguated || baseCode,
  };
}
