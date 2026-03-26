/**
 * Branch Helpers
 *
 * Utilidades para acceso seguro y validado a datos de Branch.
 * Golden Rule #7: Siempre usar helpers para acceder a datos complejos.
 */

import { z } from "zod";

// Schema E.164 para validación
const E164Schema = z.string().regex(/^[+][1-9]\d{6,14}$/, "Debe ser formato E.164");

// Interfaces
export interface WhatsAppNumberExtra {
  readonly number: string;
  readonly label: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly createdAt: string;
}

// Schema Zod para validación
const WhatsAppNumberExtraSchema = z.object({
  number: E164Schema,
  label: z.string().min(1).max(50),
  order: z.number().int().min(0),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});

// Funciones helpers obligatorias (Golden Rule #7)

/**
 * Retorna el número principal validado, o null.
 */
export function getPrimaryWhatsApp(branch: {
  whatsappPhoneNumber: string | null;
}): string | null {
  if (!branch.whatsappPhoneNumber) return null;
  const result = E164Schema.safeParse(branch.whatsappPhoneNumber);
  if (!result.success) {
    console.error(
      `[BRANCH] whatsappPhoneNumber inválido:`,
      branch.whatsappPhoneNumber
    );
    return null;
  }
  return result.data;
}

/**
 * Retorna todos los números activos (principal + extras). Sin duplicados.
 */
export function getAllWhatsAppNumbers(branch: {
  whatsappPhoneNumber: string | null;
  whatsappNumbersExtra: unknown;
}): string[] {
  const numbers: string[] = [];
  const primary = getPrimaryWhatsApp(branch);
  if (primary) numbers.push(primary);

  const extras = parseWhatsAppExtras(branch.whatsappNumbersExtra);
  for (const extra of extras) {
    if (extra.isActive) numbers.push(extra.number);
  }

  return [...new Set(numbers)];
}

/**
 * Retorna los números extra validados y ordenados.
 */
export function getWhatsAppExtras(branch: {
  whatsappNumbersExtra: unknown;
}): WhatsAppNumberExtra[] {
  return parseWhatsAppExtras(branch.whatsappNumbersExtra);
}

// Private helper
function parseWhatsAppExtras(raw: unknown): WhatsAppNumberExtra[] {
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    console.error("whatsappNumbersExtra no es JSON válido");
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.error("whatsappNumbersExtra debe ser array");
    return [];
  }

  const valid: WhatsAppNumberExtra[] = [];
  for (const item of parsed) {
    const result = WhatsAppNumberExtraSchema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      console.error("WhatsAppNumberExtra inválido:", result.error);
    }
  }

  return valid.sort((a, b) => a.order - b.order);
}
