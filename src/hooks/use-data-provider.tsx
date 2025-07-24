
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
    getUsers, getClients, getSystems, getEquipments, getProtocols, getCedulas,
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
  isDebugWindowVisible: boolean;
  toggleDebugWindow: () => void;
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
  const [debugMessage, setDebugMessage] = useState('Initializing DataProvider...');
  const [isDebugWindowVisible, setIsDebugWindowVisible] = useState(true);

  const toggleDebugWindow = () => {
    setIsDebugWindowVisible(prev => !prev);
  };

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
  
  // --- USER MUTATIONS (OPTIMIZED) ---
  const createUser = async (userData: Omit<User, 'id'>) => {
    const newUser = createUserService(userData);
    setUsers(prev => [...prev, newUser]);
    setDebugMessage(`User "${newUser.name}" created.`);
  };
  const updateUser = async (userId: string, userData: Partial<User>) => {
    const updatedUser = updateUserService(userId, userData);
    if(updatedUser) {
        setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        setDebugMessage(`User "${updatedUser.name}" updated.`);
    }
  };
  const deleteUser = async (userId: string) => {
    if (deleteUserService(userId)) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setDebugMessage(`User with ID ${userId} deleted.`);
    }
  };
  
  // --- CLIENT MUTATIONS (OPTIMIZED) ---
  const createClient = async (clientData: Omit<Client, 'id'>) => {
    const newClient = createClientService(clientData);
    setClients(prev => [...prev, newClient]);
    setDebugMessage(`Client "${newClient.name}" created.`);
  };
  const updateClient = async (clientId: string, clientData: Partial<Client>) => {
    const updatedClient = updateClientService(clientId, clientData);
    if (updatedClient) {
        setClients(prev => prev.map(c => c.id === clientId ? updatedClient : c));
        setDebugMessage(`Client "${updatedClient.name}" updated.`);
    }
  };
  const deleteClient = async (clientId: string) => {
    if (deleteClientService(clientId)) {
        setClients(prev => prev.filter(c => c.id !== clientId));
        setDebugMessage(`Client with ID ${clientId} deleted.`);
    }
  };

  // --- SYSTEM MUTATIONS (OPTIMIZED) ---
  const createSystem = async (systemData: Omit<System, 'id'>) => {
    const newSystem = createSystemService(systemData);
    setSystems(prev => [...prev, newSystem]);
    setDebugMessage(`System "${newSystem.name}" created.`);
  };
  const updateSystem = async (systemId: string, systemData: Partial<System>) => {
    const updatedSystem = updateSystemService(systemId, systemData);
    if (updatedSystem) {
        setSystems(prev => prev.map(s => s.id === systemId ? updatedSystem : s));
        setDebugMessage(`System "${updatedSystem.name}" updated.`);
    }
  };
  const deleteSystem = async (systemId: string) => {
    if (deleteSystemService(systemId)) {
        setSystems(prev => prev.filter(s => s.id !== systemId));
        setDebugMessage(`System with ID ${systemId} deleted.`);
    }
  };

  // --- EQUIPMENT MUTATIONS (OPTIMIZED) ---
  const createEquipment = async (equipmentData: Omit<Equipment, 'id'>) => {
    const newEquipment = createEquipmentService(equipmentData);
    setEquipments(prev => [...prev, newEquipment]);
    setDebugMessage(`Equipment "${newEquipment.name}" created.`);
  };
  const updateEquipment = async (equipmentId: string, equipmentData: Partial<Equipment>) => {
    const updatedEquipment = updateEquipmentService(equipmentId, equipmentData);
    if (updatedEquipment) {
        setEquipments(prev => prev.map(e => e.id === equipmentId ? updatedEquipment : e));
        setDebugMessage(`Equipment "${updatedEquipment.name}" updated.`);
    }
  };
  const deleteEquipment = async (equipmentId: string) => {
    if (deleteEquipmentService(equipmentId)) {
        deleteProtocolByEquipmentIdService(equipmentId); // Also delete associated protocol
        setEquipments(prev => prev.filter(e => e.id !== equipmentId));
        setProtocols(prev => prev.filter(p => p.equipmentId !== equipmentId));
        setDebugMessage(`Equipment with ID ${equipmentId} and its protocol deleted.`);
    }
  };

  // --- PROTOCOL MUTATIONS (OPTIMIZED) ---
    const createProtocol = async (protocolData: Omit<Protocol, 'id'>) => {
        const newProtocol = createProtocolService(protocolData);
        setProtocols(prev => [...prev, newProtocol]);
        setDebugMessage(`Protocol for equipment ID ${newProtocol.equipmentId} created.`);
    };

    const updateProtocol = async (protocolId: string, protocolData: Partial<Protocol>) => {
        const updatedProtocol = updateProtocolService(protocolId, protocolData);
        if (updatedProtocol) {
            setProtocols(prev => prev.map(p => p.id === protocolId ? updatedProtocol : p));
            setDebugMessage(`Protocol with ID ${protocolId} updated.`);
        }
    };

    const deleteProtocol = async (protocolId: string) => {
        if (deleteProtocolService(protocolId)) {
            setProtocols(prev => prev.filter(p => p.id !== protocolId));
            setDebugMessage(`Protocol with ID ${protocolId} deleted.`);
        }
    };
    
  // --- CEDULA MUTATIONS (OPTIMIZED) ---
    const createCedula = async (cedulaData: Omit<Cedula, 'id'>) => {
        const newCedula = createCedulaService(cedulaData);
        setCedulas(prev => [...prev, newCedula]);
        setDebugMessage(`Cédula with folio ${newCedula.folio} created.`);
    };
    const updateCedula = async (cedulaId: string, cedulaData: Partial<Cedula>) => {
        const updatedCedula = updateCedulaService(cedulaId, cedulaData);
        if (updatedCedula) {
            setCedulas(prev => prev.map(c => c.id === cedulaId ? updatedCedula : c));
            setDebugMessage(`Cédula with folio ${updatedCedula.folio} updated.`);
        }
    };
    const deleteCedula = async (cedulaId: string) => {
        if (deleteCedulaService(cedulaId)) {
            setCedulas(prev => prev.filter(c => c.id !== cedulaId));
            setDebugMessage(`Cédula with ID ${cedulaId} deleted.`);
        }
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
    isDebugWindowVisible,
    toggleDebugWindow,
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
    // Protocols
    createProtocol,
    updateProtocol,
    deleteProtocol,
    // Cedulas
    createCedula,
    updateCedula,
    deleteCedula,
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
