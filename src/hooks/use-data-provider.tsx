

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
    seedDatabase,
    subscribeToUsers,
    subscribeToClients,
    subscribeToSystems,
    subscribeToEquipments,
    subscribeToProtocols,
    subscribeToCedulas,
    subscribeToCompanySettings,
    updateCompanySettings as updateCompanySettingsService,
    createUser as createUserService,
    updateUser as updateUserService,
    deleteUser as deleteUserService,
    createClient as createClientService,
    updateClient as updateClientService,
    deleteClient as deleteClientService,
    createSystem as createSystemService,
    updateSystem as updateSystemService,
    deleteSystem as deleteSystemService,
    createEquipment as createEquipmentService,
    updateEquipment as updateEquipmentService,
    deleteEquipment as deleteEquipmentService,
    createProtocol as createProtocolService,
    updateProtocol as updateProtocolService,
    deleteProtocol as deleteProtocolService,
    deleteProtocolByEquipmentId as deleteProtocolByEquipmentIdService,
    createCedula as createCedulaService,
    updateCedula as updateCedulaService,
    deleteCedula as deleteCedulaService,
    connectionTest,
} from '@/lib/services';
import type { User, Client, System, Equipment, Protocol, Cedula, CompanySettings } from '@/lib/services';
import { ACTIVE_USER_STORAGE_KEY } from '@/lib/mock-data';

type DataContextType = {
  users: User[];
  clients: Client[];
  systems: System[];
  equipments: Equipment[];
  protocols: Protocol[];
  cedulas: Cedula[];
  companySettings: CompanySettings | null;
  loading: boolean;
  error: string | null;
  // Auth
  loginUser: (email: string, pass: string) => Promise<User | null>;
  // Settings
  updateCompanySettings: (settingsData: Partial<CompanySettings>) => Promise<void>;
  // User mutations
  createUser: (userData: Omit<User, 'id'>, onProgress?: (progress: number) => void) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>, onProgress?: (progress: number) => void) => Promise<void>;
  // Client mutations
  createClient: (clientData: Omit<Client, 'id'>, onProgress?: (progress: number) => void) => Promise<Client>;
  updateClient: (clientId: string, clientData: Partial<Client>, onProgress?: (progress: number) => void) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  // System mutations
  createSystem: (systemData: Omit<System, 'id'>) => Promise<System>;
  updateSystem: (systemId: string, systemData: Partial<System>) => Promise<System>;
  deleteSystem: (systemId: string) => Promise<void>;
  // Equipment mutations
  createEquipment: (equipmentData: Omit<Equipment, 'id'>, onProgress?: (progress: number) => void) => Promise<void>;
  updateEquipment: (equipmentId: string, equipmentData: Partial<Equipment>, onProgress?: (progress: number) => void) => Promise<void>;
  deleteEquipment: (equipmentId: string) => Promise<void>;
  // Protocol mutations
  createProtocol: (protocolData: Omit<Protocol, 'id'>) => Promise<Protocol>;
  updateProtocol: (protocolId: string, protocolData: Partial<Protocol>) => Promise<Protocol>;
  deleteProtocol: (protocolId: string) => Promise<void>;
  // Cedula mutations
  createCedula: (cedulaData: Omit<Cedula, 'id'>, onProgress?: (progress: number) => void) => Promise<void>;
  updateCedula: (cedulaId: string, cedulaData: Partial<Cedula>, onProgress?: (progress: number) => void) => Promise<void>;
  deleteCedula: (cedulaId: string) => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [cedulas, setCedulas] = useState<Cedula[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true);
      setError(null);

      try {
        await connectionTest();
        await seedDatabase();
        
        const unsubscribers = [
          subscribeToUsers(setUsers),
          subscribeToClients(setClients),
          subscribeToSystems(setSystems),
          subscribeToEquipments(setEquipments),
          subscribeToProtocols(setProtocols),
          subscribeToCedulas(setCedulas),
          subscribeToCompanySettings(setCompanySettings),
        ];

        setLoading(false);

        return () => {
          unsubscribers.forEach(unsubscribe => unsubscribe());
        };

      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        setError(`FATAL: ${errorMessage}`);
        console.error("Failed to initialize data from Firestore:", e);
        setLoading(false);
      }
    };

    const unsubscribePromise = initializeApp();

    return () => {
      unsubscribePromise.then(cleanup => cleanup && cleanup());
    };
  }, []);
  
  // --- AUTH ---
  const loginUser = async (email: string, pass: string): Promise<User | null> => {
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (foundUser && foundUser.password === pass) {
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(foundUser));
          return foundUser;
      }
      return null;
  };

  const value: DataContextType = {
    users,
    clients,
    systems,
    equipments,
    protocols,
    cedulas,
    companySettings,
    loading,
    error,
    loginUser,
    updateCompanySettings: updateCompanySettingsService,
    createUser: createUserService,
    updateUser: updateUserService,
    deleteUser: deleteUserService,
    createClient: createClientService,
    updateClient: updateClientService,
    deleteClient: deleteClientService,
    createSystem: createSystemService,
    updateSystem: updateSystemService,
    deleteSystem: deleteSystemService,
    createEquipment: createEquipmentService,
    updateEquipment: updateEquipmentService,
    deleteEquipment: deleteEquipmentService,
    createProtocol: createProtocolService,
    updateProtocol: updateProtocolService,
    deleteProtocol: deleteProtocolService,
    createCedula: createCedulaService,
    updateCedula: updateCedulaService,
    deleteCedula: deleteCedulaService,
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
