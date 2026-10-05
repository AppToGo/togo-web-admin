/**
 * Tests for bot-message.utils (plan bot natural, T22)
 *
 * Espejo de `api-togo/.../bot-message-validator.ts`: si la API amplía sus
 * listas (TLDs, tuteo, emojis), estos tests tienen que traer los casos
 * nuevos acá también.
 *
 * NOTA: el repo aún no tiene runner unitario (sin vitest instalado ni script
 * `test:unit`); estos tests corren cuando se agregue. Verificación manual en
 * su lugar: tsc + eslint.
 */

import { describe, it, expect } from "vitest";
import {
  hasErrors,
  shownVersions,
  validateVariants,
  variablesIn,
  withSampleValues,
} from "./bot-message.utils";
import type { BotMessage } from "../types/bot-messages.types";

const message = (
  overrides: Partial<Pick<BotMessage, "maxLength" | "required" | "allowed">> = {}
): Pick<BotMessage, "maxLength" | "required" | "allowed"> => ({
  maxLength: 300,
  required: ["total"],
  allowed: ["total", "businessName"],
  ...overrides,
});

const voice = { address: "tu" as const, emojis: true };

describe("bot-message.utils", () => {
  it("variablesIn extrae variables sin repetir", () => {
    expect(variablesIn("Vas en {total}, {total} en *{businessName}*")).toEqual([
      "total",
      "businessName",
    ]);
  });

  it("acepta versiones con las variables obligatorias", () => {
    expect(
      validateVariants(["Vas en {total} 👌"], message(), voice)
    ).toEqual([]);
  });

  it("marca la variable obligatoria que falta", () => {
    expect(validateVariants(["Listo, anotado"], message(), voice)).toEqual([
      { index: 0, code: "missing_variable", severity: "error", variable: "total" },
    ]);
  });

  it("marca la variable que el código no pasa", () => {
    const [issue] = validateVariants(["Vas en {total}, {nombre}"], message(), voice);
    expect(issue).toMatchObject({ code: "unknown_variable", variable: "nombre" });
  });

  it("rechaza links con TLDs viejos y nuevos", () => {
    const issues = validateVariants(
      [
        "Paga {total} en www.mipago.com",
        "Mira el menú en {total} mipagina.ai",
        "Escríbenos a pedidos.tienda.blog por {total}",
      ],
      message(),
      voice
    );
    expect(issues.map((i) => `${i.index}:${i.code}`)).toEqual([
      "0:url",
      "1:url",
      "2:url",
    ]);
  });

  it("no confunde puntuación normal con dominios", () => {
    expect(
      validateVariants(["Vas en {total}. ¿Algo más?"], message(), voice)
    ).toEqual([]);
  });

  it("marca repetidas tras normalizar espacios y mayúsculas", () => {
    const issues = validateVariants(
      ["Vas en {total}", "vas  en {total}"],
      { maxLength: 300, required: [], allowed: ["total"] },
      voice
    );
    expect(issues.map((i) => `${i.index}:${i.code}`)).toEqual(["1:duplicate"]);
  });

  it("el tuteo con usted y los emojis apagados son advertencias", () => {
    const issues = validateVariants(
      ["Dime si sigues, vas en {total} 🙌"],
      message(),
      { address: "usted", emojis: false }
    );
    expect(issues.map((i) => [i.code, i.severity])).toEqual([
      ["address", "warning"],
      ["emojis", "warning"],
    ]);
    expect(hasErrors(issues)).toBe(false);
  });

  it("withSampleValues rellena datos conocidos y deja lo demás intacto", () => {
    expect(withSampleValues("Vas en {total} en *{businessName}*")).toBe(
      "Vas en $44.000 en *Tu negocio*"
    );
    expect(withSampleValues("Aviso de {futureVar}")).toBe("Aviso de {futureVar}");
  });

  it("usa el nombre real del negocio y del asistente cuando se dan", () => {
    expect(
      withSampleValues("Bienvenido a *{businessName}*, soy {assistantName}", {
        businessName: "Pollos Ricos",
        assistantName: "Rica",
      })
    ).toBe("Bienvenido a *Pollos Ricos*, soy Rica");
  });

  it("sin nombre del asistente usa ToGo por defecto", () => {
    expect(withSampleValues("Soy {assistantName}")).toBe("Soy ToGo");
    expect(
      withSampleValues("Soy {assistantName}", { assistantName: "" })
    ).toBe("Soy ToGo");
  });

  it("shownVersions prefiere el borrador sobre lo publicado", () => {
    const published = { variants: ["a"], origin: "TEMPLATE" as const };
    const draft = { variants: ["b"], origin: "MANUAL" as const };
    expect(shownVersions({ published, draft } as BotMessage)).toBe(draft);
    expect(shownVersions({ published, draft: null } as BotMessage)).toBe(
      published
    );
  });
});
