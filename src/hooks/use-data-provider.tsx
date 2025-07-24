
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
    setDebugMessage('Checking database status...');
    setError(null);
    try {
        await seedDatabase((message) => setDebugMessage(message));
        
        setDebugMessage('Fetching all collections from Firestore...');
        const [usersData, clientsData, systemsData, equipmentsData, protocolsData, cedulasData] = await Promise.all([
            getUsers(),
            getClients(),
            getSystems(),
            getEquipments(),
            getProtocols(),
            getCedulas(),
        ]);
        
        setUsers(usersData);
        setClients(clientsData);
        setSystems(systemsData);
        setEquipments(equipmentsData);
        setProtocols(protocolsData);
        setCedulas(cedulasData);
        
        setDebugMessage('All data loaded successfully from Firestore.');

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      setError(errorMessage);
      setDebugMessage(`FATAL ERROR: ${errorMessage}`);
      console.error("Failed to load data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);
  
  // --- USER MUTATIONS ---
  const createUser = async (userData: Omit<User, 'id'>) => {
    const newUser = await createUserService(userData);
    setUsers(prev => [...prev, newUser]);
    setDebugMessage(`User "${newUser.name}" created in Firestore.`);
  };
  const updateUser = async (userId: string, userData: Partial<User>) => {
    const updatedUser = await updateUserService(userId, userData);
    if(updatedUser) {
        setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        setDebugMessage(`User "${updatedUser.name}" updated in Firestore.`);
    }
  };
  const deleteUser = async (userId: string) => {
    await deleteUserService(userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    setDebugMessage(`User with ID ${userId} deleted from Firestore.`);
  };
  
  // --- CLIENT MUTATIONS ---
  const createClient = async (clientData: Omit<Client, 'id'>) => {
    const newClient = await createClientService(clientData);
    setClients(prev => [...prev, newClient]);
    setDebugMessage(`Client "${newClient.name}" created in Firestore.`);
  };
  const updateClient = async (clientId: string, clientData: Partial<Client>) => {
    const updatedClient = await updateClientService(clientId, clientData);
    if (updatedClient) {
        setClients(prev => prev.map(c => c.id === clientId ? updatedClient : c));
        setDebugMessage(`Client "${updatedClient.name}" updated in Firestore.`);
    }
  };
  const deleteClient = async (clientId: string) => {
    await deleteClientService(clientId);
    setClients(prev => prev.filter(c => c.id !== clientId));
    setDebugMessage(`Client with ID ${clientId} deleted from Firestore.`);
  };

  // --- SYSTEM MUTATIONS ---
  const createSystem = async (systemData: Omit<System, 'id'>) => {
    const newSystem = await createSystemService(systemData);
    setSystems(prev => [...prev, newSystem]);
    setDebugMessage(`System "${newSystem.name}" created in Firestore.`);
  };
  const updateSystem = async (systemId: string, systemData: Partial<System>) => {
    const updatedSystem = await updateSystemService(systemId, systemData);
    if (updatedSystem) {
        setSystems(prev => prev.map(s => s.id === systemId ? updatedSystem : s));
        setDebugMessage(`System "${updatedSystem.name}" updated in Firestore.`);
    }
  };
  const deleteSystem = async (systemId: string) => {
    await deleteSystemService(systemId);
    setSystems(prev => prev.filter(s => s.id !== systemId));
    setDebugMessage(`System with ID ${systemId} deleted from Firestore.`);
  };

  // --- EQUIPMENT MUTATIONS ---
  const createEquipment = async (equipmentData: Omit<Equipment, 'id'>) => {
    const newEquipment = await createEquipmentService(equipmentData);
    setEquipments(prev => [...prev, newEquipment]);
    setDebugMessage(`Equipment "${newEquipment.name}" created in Firestore.`);
  };
  const updateEquipment = async (equipmentId: string, equipmentData: Partial<Equipment>) => {
    const updatedEquipment = await updateEquipmentService(equipmentId, equipmentData);
    if (updatedEquipment) {
        setEquipments(prev => prev.map(e => e.id === equipmentId ? updatedEquipment : e));
        setDebugMessage(`Equipment "${updatedEquipment.name}" updated in Firestore.`);
    }
  };
  const deleteEquipment = async (equipmentId: string) => {
    await deleteEquipmentService(equipmentId);
    await deleteProtocolByEquipmentIdService(equipmentId);
    setEquipments(prev => prev.filter(e => e.id !== equipmentId));
    setProtocols(prev => prev.filter(p => p.equipmentId !== equipmentId));
    setDebugMessage(`Equipment with ID ${equipmentId} and its protocol deleted from Firestore.`);
  };

  // --- PROTOCOL MUTATIONS ---
    const createProtocol = async (protocolData: Omit<Protocol, 'id'>) => {
        const newProtocol = await createProtocolService(protocolData);
        setProtocols(prev => [...prev, newProtocol]);
        setDebugMessage(`Protocol for equipment ID ${newProtocol.equipmentId} created in Firestore.`);
    };

    const updateProtocol = async (protocolId: string, protocolData: Partial<Protocol>) => {
        const updatedProtocol = await updateProtocolService(protocolId, protocolData);
        if (updatedProtocol) {
            setProtocols(prev => prev.map(p => p.id === protocolId ? updatedProtocol : p));
            setDebugMessage(`Protocol with ID ${protocolId} updated in Firestore.`);
        }
    };

    const deleteProtocol = async (protocolId: string) => {
        await deleteProtocolService(protocolId);
        setProtocols(prev => prev.filter(p => p.id !== protocolId));
        setDebugMessage(`Protocol with ID ${protocolId} deleted from Firestore.`);
    };
    
  // --- CEDULA MUTATIONS ---
    const createCedula = async (cedulaData: Omit<Cedula, 'id'>) => {
        const newCedula = await createCedulaService(cedulaData);
        setCedulas(prev => [...prev, newCedula]);
        setDebugMessage(`Cédula with folio ${newCedula.folio} created in Firestore.`);
    };
    const updateCedula = async (cedulaId: string, cedulaData: Partial<Cedula>) => {
        const updatedCedula = await updateCedulaService(cedulaId, cedulaData);
        if (updatedCedula) {
            setCedulas(prev => prev.map(c => c.id === cedulaId ? updatedCedula : c));
            setDebugMessage(`Cédula with folio ${updatedCedula.folio} updated in Firestore.`);
        }
    };
    const deleteCedula = async (cedulaId: string) => {
        await deleteCedulaService(cedulaId);
        setCedulas(prev => prev.filter(c => c.id !== cedulaId));
        setDebugMessage(`Cédula with ID ${cedulaId} deleted from Firestore.`);
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
