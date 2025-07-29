

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from '@/lib/firebase';
import { 
    loginUser as apiLoginUser,
    getUsers, getClients, getSystems, getEquipments, getProtocols, getCedulas,
    createUser as apiCreateUser,
    updateUser as apiUpdateUser,
    deleteUser as apiDeleteUser,
    createClient as apiCreateClient,
    updateClient as apiUpdateClient,
    deleteClient as apiDeleteClient,
    createSystem as apiCreateSystem,
    updateSystem as apiUpdateSystem,
    deleteSystem as apiDeleteSystem,
    createEquipment as apiCreateEquipment,
    updateEquipment as apiUpdateEquipment,
    deleteEquipment as apiDeleteEquipment,
    createProtocol as apiCreateProtocol,
    updateProtocol as apiUpdateProtocol,
    deleteProtocol as apiDeleteProtocol,
    createCedula as apiCreateCedula,
    updateCedula as apiUpdateCedula,
    deleteCedula as apiDeleteCedula,
    updateCompanySettings as apiUpdateCompanySettings,
    getCompanySettings,
    subscribeToMediaLibrary as apiSubscribeToMediaLibrary,
    uploadFile as apiUploadFile,
    deleteMediaFile as apiDeleteMediaFile,
    seedMockUsers
} from '@/lib/services';

import type { User, Client, System, Equipment, Protocol, Cedula, CompanySettings, MediaFile } from '@/lib/services';
import { ACTIVE_USER_STORAGE_KEY } from '@/lib/mock-data';

export type LoadingStatus = 'idle' | 'seeding' | 'authenticating' | 'loading_data' | 'ready' | 'error';

type DataContextType = {
  users: User[];
  clients: Client[];
  systems: System[];
  equipments: Equipment[];
  protocols: Protocol[];
  cedulas: Cedula[];
  companySettings: CompanySettings | null;
  loading: boolean;
  loadingStatus: LoadingStatus;
  error: string | null;
  isAuthReady: boolean;
  loginUser: (email: string, pass: string) => Promise<User | null>;
  subscribeToMediaLibrary: (setFiles: (files: MediaFile[]) => void) => () => void;
  uploadFile: (files: File[], onProgress: (percentage: number) => void, logAudit: (message: string) => void) => Promise<void>;
  deleteMediaFile: (file: MediaFile) => Promise<void>;
  updateCompanySettings: (settingsData: Partial<CompanySettings>) => Promise<void>;
  createUser: (userData: Omit<User, 'id'>) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<User>;
  createClient: (clientData: Omit<Client, 'id'>) => Promise<Client>;
  updateClient: (clientId: string, clientData: Partial<Client>) => Promise<Client>;
  deleteClient: (clientId: string) => Promise<void>;
  createSystem: (systemData: Omit<System, 'id'>) => Promise<System>;
  updateSystem: (systemId: string, systemData: Partial<System>) => Promise<System>;
  deleteSystem: (systemId: string) => Promise<void>;
  createEquipment: (equipmentData: Omit<Equipment, 'id'>) => Promise<Equipment>;
  updateEquipment: (equipmentId: string, equipmentData: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (equipmentId: string) => Promise<void>;
  createProtocol: (protocolData: Omit<Protocol, 'id'>, id?: string) => Promise<Protocol>;
  updateProtocol: (protocolId: string, protocolData: Partial<Protocol>) => Promise<Protocol>;
  deleteProtocol: (protocolId: string) => Promise<void>;
  createCedula: (cedulaData: Omit<Cedula, 'id'>) => Promise<Cedula>;
  updateCedula: (cedulaId: string, cedulaData: Partial<Cedula>, onStep?: (log: string) => void) => Promise<void>;
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
  
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
      async function initialize() {
          setLoadingStatus('seeding');
          try {
              await seedMockUsers();
          } catch (seedError) {
              console.error("Failed to seed admin user:", seedError);
              setError("Error al configurar la cuenta de administrador.");
              setLoadingStatus('error');
              return;
          }
          setIsAuthReady(true);
      }
      initialize();
  }, []);

  const fetchAllData = useCallback(async (firebaseUser: FirebaseUser) => {
    setLoadingStatus('loading_data');
    try {
        await firebaseUser.getIdToken(true); 

        const [usersData, clientsData, systemsData, equipmentsData, protocolsData, cedulasData, settingsData] = await Promise.all([
            getUsers(), getClients(), getSystems(), getEquipments(), getProtocols(), getCedulas(), getCompanySettings()
        ]);
        setUsers(usersData);
        setClients(clientsData);
        setSystems(systemsData);
        setEquipments(equipmentsData);
        setProtocols(protocolsData);
        setCedulas(cedulasData);
        setCompanySettings(settingsData);
        setError(null);
        setLoadingStatus('ready');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during data fetching";
        setError(errorMessage);
        setLoadingStatus('error');
        console.error("Data fetching error:", err);
    }
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    setLoadingStatus('authenticating');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchAllData(user);
      } else {
        setUsers([]);
        setClients([]);
        setSystems([]);
        setEquipments([]);
        setProtocols([]);
        setCedulas([]);
        setCompanySettings(null); 
        localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
        setLoadingStatus('ready');
      }
    });
    return () => unsubscribe();
  }, [isAuthReady, fetchAllData]);


  const loginUser = async (email: string, pass: string): Promise<User | null> => {
      const user = await apiLoginUser(email, pass);
      if (user) {
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(user));
          // onAuthStateChanged will trigger data fetch.
      }
      return user;
  };

  // --- USER MUTATIONS ---
  const createUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    const newUser = await apiCreateUser(userData);
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
      const updatedUser = await apiUpdateUser(userId, userData);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedUser } : u));
      return updatedUser;
  };
  
  const deleteUser = async (userId: string): Promise<void> => {
      await apiDeleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
  };


  // --- CLIENT MUTATIONS ---
  const createClient = async (clientData: Omit<Client, 'id'>) => {
    const newClient = await apiCreateClient(clientData);
    setClients(prev => [...prev, newClient]);
    return newClient;
  };

  const updateClient = async (clientId: string, clientData: Partial<Client>) => {
    const updatedClient = await apiUpdateClient(clientId, clientData);
    setClients(prev => prev.map(c => c.id === clientId ? updatedClient : c));
    return updatedClient;
  };

  const deleteClient = async (clientId: string) => {
    await apiDeleteClient(clientId);
    setClients(prev => prev.filter(c => c.id !== clientId));
  };

  // --- SYSTEM MUTATIONS ---
  const createSystem = async (systemData: Omit<System, 'id'>) => {
    const newSystem = await apiCreateSystem(systemData);
    setSystems(prev => [...prev, newSystem]);
    return newSystem;
  };

  const updateSystem = async (systemId: string, systemData: Partial<System>) => {
    const updatedSystem = await apiUpdateSystem(systemId, systemData);
    setSystems(prev => prev.map(s => s.id === systemId ? updatedSystem : s));
    return updatedSystem;
  };
  const deleteSystem = async (systemId: string) => {
    await apiDeleteSystem(systemId);
    setSystems(prev => prev.filter(s => s.id !== systemId));
  };

  // --- EQUIPMENT MUTATIONS ---
  const createEquipment = async (equipmentData: Omit<Equipment, 'id'>) => {
    const newEquipment = await apiCreateEquipment(equipmentData);
    setEquipments(prev => [...prev, newEquipment]);
    return newEquipment;
  };
  const updateEquipment = async (equipmentId: string, equipmentData: Partial<Equipment>) => {
    await apiUpdateEquipment(equipmentId, equipmentData);
    setEquipments(prev => prev.map(eq => eq.id === equipmentId ? {...eq, ...equipmentData} : eq));
  };
  const deleteEquipment = async (equipmentId: string) => {
    await apiDeleteEquipment(equipmentId);
    setEquipments(prev => prev.filter(e => e.id !== equipmentId));
  };

  // --- PROTOCOL MUTATIONS ---
  const createProtocol = async (protocolData: Omit<Protocol, 'id'>, id?: string) => {
    const newProtocol = await apiCreateProtocol(protocolData, id);
    setProtocols(prev => [...prev, newProtocol]);
    return newProtocol;
  };
  const updateProtocol = async (protocolId: string, protocolData: Partial<Protocol>) => {
    const updatedProtocol = await apiUpdateProtocol(protocolId, protocolData);
    setProtocols(prev => prev.map(p => p.id === protocolId ? updatedProtocol : p));
    return updatedProtocol;
  };
  const deleteProtocol = async (protocolId: string) => {
    await apiDeleteProtocol(protocolId);
    setProtocols(prev => prev.filter(p => p.id !== protocolId));
  };

  // --- CEDULA MUTATIONS ---
  const createCedula = async (cedulaData: Omit<Cedula, 'id'>) => {
    const newCedula = await apiCreateCedula(cedulaData);
    setCedulas(prev => [...prev, newCedula]);
    return newCedula;
  };
  const updateCedula = async (cedulaId: string, cedulaData: Partial<Cedula>, onStep?: (log: string) => void) => {
     await apiUpdateCedula(cedulaId, cedulaData, onStep);
     setCedulas(prev => prev.map(c => c.id === cedulaId ? {...c, ...cedulaData} : c));
  };
  const deleteCedula = async (cedulaId: string) => {
    await apiDeleteCedula(cedulaId);
    setCedulas(prev => prev.filter(c => c.id !== cedulaId));
  };

  // --- MEDIA LIBRARY ---
  const subscribeToMediaLibrary = (setFiles: (files: MediaFile[]) => void) => apiSubscribeToMediaLibrary(setFiles);
  const uploadFile = (files: File[], onProgress: (percentage: number) => void, logAudit: (message: string) => void) => apiUploadFile(files, onProgress, logAudit);
  const deleteMediaFile = (file: MediaFile) => apiDeleteMediaFile(file);


  const updateCompanySettings = async (settingsData: Partial<CompanySettings>): Promise<void> => {
      const newSettings = await apiUpdateCompanySettings(settingsData);
      setCompanySettings(newSettings);
  };
  
  const value: DataContextType = {
    users,
    clients,
    systems,
    equipments,
    protocols,
    cedulas,
    companySettings,
    loading: loadingStatus !== 'ready',
    loadingStatus,
    error,
    isAuthReady,
    loginUser,
    subscribeToMediaLibrary,
    uploadFile,
    deleteMediaFile,
    updateCompanySettings,
    createUser,
    deleteUser,
    updateUser,
    createClient,
    updateClient,
    deleteClient,
    createSystem,
    updateSystem,
    deleteSystem,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    createProtocol,
    updateProtocol,
    deleteProtocol,
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
