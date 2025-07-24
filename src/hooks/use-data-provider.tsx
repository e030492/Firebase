
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
    getUsers, getClients, getSystems, getEquipments, getProtocols, getCedulas,
    createUser as createUserService,
    deleteUser as deleteUserService,
    seedDatabase,
    User, Client, System, Equipment, Protocol, Cedula
} from '@/lib/services';
import { USERS_STORAGE_KEY } from '@/lib/mock-data';

type DataContextType = {
  users: User[];
  clients: Client[];
  systems: System[];
  equipments: Equipment[];
  protocols: Protocol[];
  cedulas: Cedula[];
  loading: boolean;
  error: string | null;
  debugMessage: string;
  refreshData: () => void;
  createUser: (userData: Omit<User, 'id'>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [cedulas, setCedulas] = useState<Cedula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugMessage, setDebugMessage] = useState('Initializing DataProvider...');

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setDebugMessage('Checking local storage status...');
    setError(null);
    try {
        const initialUsers = localStorage.getItem(USERS_STORAGE_KEY);
        
        if (!initialUsers) {
            setDebugMessage('LocalStorage is empty. Seeding all local collections...');
            await seedDatabase((message) => setDebugMessage(message));
            setDebugMessage('Seeding complete. Fetching all collections from LocalStorage...');
        } else {
            setDebugMessage('LocalStorage has data. Fetching all collections...');
        }
        
        setUsers(getUsers());
        setClients(getClients());
        setSystems(getSystems());
        setEquipments(getEquipments());
        setProtocols(getProtocols());
        setCedulas(getCedulas());
        
        setDebugMessage('All data loaded successfully from LocalStorage.');

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      setError(errorMessage);
      setDebugMessage(`FATAL ERROR: ${errorMessage}`);
      console.error("Failed to load data from LocalStorage:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const createUser = async (userData: Omit<User, 'id'>) => {
    setDebugMessage(`Creating user ${userData.name}...`);
    createUserService(userData);
    await loadAllData(); // Refresh all data from localStorage
    setDebugMessage(`User ${userData.name} created.`);
  };

  const deleteUser = async (userId: string) => {
    setDebugMessage(`Deleting user ${userId}...`);
    deleteUserService(userId);
    await loadAllData(); // Refresh all data from localStorage
    setDebugMessage(`User ${userId} deleted.`);
  };

  const value = {
    users,
    clients,
    systems,
    equipments,
    protocols,
    cedulas,
    loading,
    error,
    debugMessage,
    refreshData: loadAllData,
    createUser,
    deleteUser,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
