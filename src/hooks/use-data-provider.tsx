
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
    getUsers, getClients, getSystems, getEquipments, getProtocols, getCedulas,
    createUser as createUserService,
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
  
  // --- USER MUTATIONS ---
  const createUser = async (userData: Omit<User, 'id'>) => {
    createUserService(userData);
    await loadAllData();
  };
  const updateUser = async (userId: string, userData: Partial<User>) => {
    updateUserService(userId, userData);
    await loadAllData();
  };
  const deleteUser = async (userId: string) => {
    deleteUserService(userId);
    await loadAllData();
  };
  
  // --- CLIENT MUTATIONS ---
  const createClient = async (clientData: Omit<Client, 'id'>) => {
    createClientService(clientData);
    await loadAllData();
  };
  const updateClient = async (clientId: string, clientData: Partial<Client>) => {
    updateClientService(clientId, clientData);
    await loadAllData();
  };
  const deleteClient = async (clientId: string) => {
    deleteClientService(clientId);
    await loadAllData();
  };

  // --- SYSTEM MUTATIONS ---
  const createSystem = async (systemData: Omit<System, 'id'>) => {
    createSystemService(systemData);
    await loadAllData();
  };
  const updateSystem = async (systemId: string, systemData: Partial<System>) => {
    updateSystemService(systemId, systemData);
    await loadAllData();
  };
  const deleteSystem = async (systemId: string) => {
    deleteSystemService(systemId);
    await loadAllData();
  };

  // --- EQUIPMENT MUTATIONS ---
  const createEquipment = async (equipmentData: Omit<Equipment, 'id'>) => {
    createEquipmentService(equipmentData);
    await loadAllData();
  };
  const updateEquipment = async (equipmentId: string, equipmentData: Partial<Equipment>) => {
    updateEquipmentService(equipmentId, equipmentData);
    await loadAllData();
  };
  const deleteEquipment = async (equipmentId: string) => {
    deleteEquipmentService(equipmentId);
    deleteProtocolByEquipmentIdService(equipmentId); // Also delete associated protocol
    await loadAllData();
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
    // Users
    createUser,
    updateUser,
    deleteUser,
    // Clients
    createClient,
    updateClient,
    deleteClient,
    // Systems
    createSystem,
    updateSystem,
    deleteSystem,
    // Equipments
    createEquipment,
    updateEquipment,
    deleteEquipment,
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
