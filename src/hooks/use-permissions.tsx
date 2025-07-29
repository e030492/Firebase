
"use client";

import { createContext, useContext, ReactNode } from "react";

// Dado que hemos eliminado a los usuarios, el concepto de permisos por rol ya no aplica.
// Sin embargo, mantenemos un proveedor de contexto simple para que los componentes
// que usan el hook `usePermissions` no fallen. Esto simplifica la transición.

type PermissionsContextType = {
  // La función `can` siempre devolverá `true`, dando acceso total a todas las funciones.
  can: (action: string, module: string) => boolean;
};


const PermissionsContext = createContext<PermissionsContextType | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  
  const can = (action: string, module: string): boolean => {
    // Con la eliminación de la autenticación, siempre se conceden los permisos.
    return true;
  };

  return (
    <PermissionsContext.Provider value={{ can }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}
