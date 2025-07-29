
"use client";

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from "react";
import { User } from '@/lib/services';

type Permissions = User['permissions'];
type ModuleKey = keyof Permissions;
type ActionKey = keyof Permissions[ModuleKey];

type PermissionsContextType = {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  can: (action: ActionKey, module: ModuleKey) => boolean;
};

// Create a mock admin user that will always be "logged in"
const mockAdmin: User = {
    id: 'mock-admin-id',
    name: 'Administrador',
    email: 'admin@escuadramx.com',
    role: 'Administrador',
    permissions: {} // Not needed, as can() will always return true
};

const PermissionsContext = createContext<PermissionsContextType | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  // The user is always the mock admin, so we don't need a setter from outside.
  const [user, setUser] = useState<User | null>(mockAdmin);

  // The 'can' function is now simplified: it always returns true.
  const can = (action: ActionKey, module: ModuleKey): boolean => {
    return true;
  };

  return (
    <PermissionsContext.Provider value={{ user, setUser, can }}>
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
