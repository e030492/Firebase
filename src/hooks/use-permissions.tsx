"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ACTIVE_USER_STORAGE_KEY, mockUsers } from "@/lib/mock-data";

type User = typeof mockUsers[0];
type Permissions = User['permissions'];
type ModuleKey = keyof Permissions;
type ActionKey = keyof Permissions[ModuleKey];

type PermissionsContextType = {
  user: User | null;
  can: (action: ActionKey, module: ModuleKey) => boolean;
};

const PermissionsContext = createContext<PermissionsContextType | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse active user for permissions", error);
        setUser(null);
      }
    }
  }, []);

  const can = (action: ActionKey, module: ModuleKey): boolean => {
    if (!user) {
      return false;
    }
    // Admin can do everything
    if (user.role === 'Administrador') {
        return true;
    }
    const modulePermissions = user.permissions?.[module];
    if (modulePermissions) {
      return modulePermissions[action] ?? false;
    }
    return false;
  };

  return (
    <PermissionsContext.Provider value={{ user, can }}>
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
