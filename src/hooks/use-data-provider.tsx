
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
import type { User, Client, System, Equipment, Protocol, Cedula } from '@/lib/services';
import { ACTIVE_USER_STORAGE_KEY } from '@/lib/mock-data';
import { firebaseConfig } from '@/lib/firebase';


type DataContextType = {
  users: User[];
  clients: Client[];
  systems: System[];
  equipments: Equipment[];
  protocols: Protocol[];
  cedulas: Cedula[];
  loading: boolean;
  error: string | null;
  debugLog: string[];
  isDebugWindowVisible: boolean;
  toggleDebugWindow: () => void;
  // Auth
  loginUser: (email: string, pass: string) => Promise<User | null>;
  // User mutations
  createUser: (userData: Omit<User, 'id'>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  // Client mutations
  createClient: (clientData: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (clientId: string, clientData: Partial<Client>) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  // System mutations
  createSystem: (systemData: Omit<System, 'id'>) => Promise<void>;
  updateSystem: (systemId: string, systemData: Partial<System>) => Promise<void>;
  deleteSystem: (systemId: string) => Promise<void>;
  // Equipment mutations
  createEquipment: (equipmentData: Omit<Equipment, 'id'>) => Promise<void>;
  updateEquipment: (equipmentId: string, equipmentData: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (equipmentId: string) => Promise<void>;
  // Protocol mutations
  createProtocol: (protocolData: Omit<Protocol, 'id'>) => Promise<void>;
  updateProtocol: (protocolId: string, protocolData: Partial<Protocol>) => Promise<void>;
  deleteProtocol: (protocolId: string) => Promise<void>;
  // Cedula mutations
  createCedula: (cedulaData: Omit<Cedula, 'id'>) => Promise<void>;
  updateCedula: (cedulaId: string, cedulaData: Partial<Cedula>) => Promise<void>;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [isDebugWindowVisible, setIsDebugWindowVisible] = useState(false);

  const toggleDebugWindow = () => setIsDebugWindowVisible(prev => !prev);
  
  const log = useCallback((message: string) => {
    setDebugLog(prev => [...prev, message]);
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true);
      setError(null);
      setDebugLog(['DataProvider initialized. Starting connection process...']);

      try {
        log("Attempting Firestore connection test...");
        await connectionTest(log);
        log("Firestore connection test successful.");

        log("Checking if database needs seeding...");
        await seedDatabase(log);
        
        log("Subscribing to real-time data collections...");
        
        const unsubscribers = [
          subscribeToUsers(setUsers, log),
          subscribeToClients(setClients, log),
          subscribeToSystems(setSystems, log),
          subscribeToEquipments(setEquipments, log),
          subscribeToProtocols(setProtocols, log),
          subscribeToCedulas(setCedulas, log),
        ];

        log('All subscriptions established. App is now in real-time sync.');
        setLoading(false);

        return () => {
          log('Cleaning up subscriptions...');
          unsubscribers.forEach(unsubscribe => unsubscribe());
          log('All subscriptions stopped.');
        };

      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        setError(`FATAL: ${errorMessage}`);
        log(`FATAL ERROR: ${errorMessage}. The app may not function correctly.`);
        console.error("Failed to initialize data from Firestore:", e);
        setLoading(false);
      }
    };

    const unsubscribePromise = initializeApp();

    return () => {
      unsubscribePromise.then(cleanup => cleanup && cleanup());
    };
  }, [log]);
  
  // --- AUTH ---
  const loginUser = async (email: string, pass: string): Promise<User | null> => {
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (foundUser && foundUser.password === pass) {
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(foundUser));
          log(`User "${foundUser.name}" logged in successfully.`);
          return foundUser;
      }
      log(`Login failed for email: ${email}. User not found or password incorrect.`);
      return null;
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
    debugLog,
    isDebugWindowVisible,
    toggleDebugWindow,
    // Auth
    loginUser,
    // Users
    createUser: createUserService,
    updateUser: updateUserService,
    deleteUser: deleteUserService,
    // Clients
    createClient: createClientService,
    updateClient: updateClientService,
    deleteClient: deleteClientService,
    // Systems
    createSystem: createSystemService,
    updateSystem: updateSystemService,
    deleteSystem: deleteSystemService,
    // Equipments
    createEquipment: createEquipmentService,
    updateEquipment: updateEquipmentService,
    deleteEquipment: deleteEquipmentService,
    // Protocols
    createProtocol: createProtocolService,
    updateProtocol: updateProtocolService,
    deleteProtocol: deleteProtocolService,
    // Cedulas
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
