"use client"

import * as React from "react"

/**
 * Modo solo lectura de una sección (p. ej. Configuración en la demo):
 * los controles base (Button, Input, Textarea, Switch, Checkbox, Select,
 * RadioGroup) se deshabilitan solos. Los enlaces (`Button asChild`) y los
 * botones marcados `readOnlySafe` (volver, pestañas) siguen activos para
 * poder navegar. React propaga el contexto a los portales: los diálogos
 * abiertos desde la sección también quedan en solo lectura.
 */
const ReadOnlyContext = React.createContext(false)

export function ReadOnlyProvider({
  readOnly = true,
  children,
}: {
  readOnly?: boolean
  children: React.ReactNode
}) {
  return (
    <ReadOnlyContext.Provider value={readOnly}>
      {children}
    </ReadOnlyContext.Provider>
  )
}

export function useReadOnly(): boolean {
  return React.useContext(ReadOnlyContext)
}
