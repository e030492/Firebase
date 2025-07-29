
"use client";

import { createContext, useContext, ReactNode } from "react";
import { User } from '@/lib/services';

type Permissions = User['permissions'];
type ModuleKey = keyof Permissions;
type ActionKey = keyof Permissions[ModuleKey];

type PermissionsContextType = {
  // The user object is kept for type compatibility in other components,
  // but it will always be a mock admin object.
  user: User | null;
  can: (action: ActionKey, module: ModuleKey) => boolean;
};

// Create a mock admin user. This will be the "logged in" user for the entire session.
// This is used to satisfy components that expect a user object.
const mockAdmin: User = {
    id: 'mock-admin-id',
    name: 'Administrador',
    email: 'admin@escuadramx.com',
    role: 'Administrador',
    permissions: {} // Not needed, as can() will always return true
};

const PermissionsContext = createContext<PermissionsContextType | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  
  // The 'can' function is simplified: it always returns true, giving full access.
  const can = (action: ActionKey, module: ModuleKey): boolean => {
    return true;
  };

  return (
    <PermissionsContext.Provider value={{ user: mockAdmin, can }}>
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
