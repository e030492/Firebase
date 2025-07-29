
"use client";

import { createContext, useContext, ReactNode } from "react";

// Como hemos eliminado el sistema de autenticación, este proveedor de permisos
// simplemente devuelve 'true' para cualquier verificación. Esto nos permite mantener
// el hook `usePermissions` en el código (por si se necesita en el futuro) sin que
// cause problemas.

type PermissionsContextType = {
  can: (action: string, module: string) => boolean;
};


const PermissionsContext = createContext<PermissionsContextType | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  
  const can = (): boolean => {
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
