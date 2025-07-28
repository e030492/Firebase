
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, Dispatch, SetStateAction } from 'react';
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
    deleteMediaFile as apiDeleteMediaFile
} from '@/lib/services';

import type { User, Client, System, Equipment, Protocol, Cedula, CompanySettings, MediaFile } from '@/lib/services';
import { ACTIVE_USER_STORAGE_KEY } from '@/lib/mock-data';

export type LoadingStatus = 'idle' | 'authenticating' | 'loading_data' | 'ready' | 'error';

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
    setLoadingStatus('authenticating');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthReady(true);
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
  }, [fetchAllData]);


  const loginUser = async (email: string, pass: string): Promise<User | null> => {
      if (!isAuthReady) {
        console.warn("Attempted login before Firebase Auth was ready.");
        throw new Error("La autenticación de Firebase no está lista. Intente de nuevo.");
      }
      const user = await apiLoginUser(email, pass);
      if (user) {
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(user));
      }
      return user;
  };

  // --- USER MUTATIONS ---
  const createUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    const newUser = await apiCreateUser(userData);
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (userId: string, userData: Partial<User>) => apiUpdateUser(userId, userData);
  const deleteUser = (userId: string) => apiDeleteUser(userId);

  // --- CLIENT MUTATIONS ---
  const createClient = (clientData: Omit<Client, 'id'>) => apiCreateClient(clientData);
  const updateClient = (clientId: string, clientData: Partial<Client>) => apiUpdateClient(clientId, clientData);
  const deleteClient = (clientId: string) => apiDeleteClient(clientId);

  // --- SYSTEM MUTATIONS ---
  const createSystem = (systemData: Omit<System, 'id'>) => apiCreateSystem(systemData);
  const updateSystem = (systemId: string, systemData: Partial<System>) => apiUpdateSystem(systemId, systemData);
  const deleteSystem = (systemId: string) => apiDeleteSystem(systemId);

  // --- EQUIPMENT MUTATIONS ---
  const createEquipment = (equipmentData: Omit<Equipment, 'id'>) => apiCreateEquipment(equipmentData);
  const updateEquipment = (equipmentId: string, equipmentData: Partial<Equipment>) => apiUpdateEquipment(equipmentId, equipmentData);
  const deleteEquipment = (equipmentId: string) => apiDeleteEquipment(equipmentId);

  // --- PROTOCOL MUTATIONS ---
  const createProtocol = (protocolData: Omit<Protocol, 'id'>, id?: string) => apiCreateProtocol(protocolData, id);
  const updateProtocol = (protocolId: string, protocolData: Partial<Protocol>) => apiUpdateProtocol(protocolId, protocolData);
  const deleteProtocol = (protocolId: string) => apiDeleteProtocol(protocolId);

  // --- CEDULA MUTATIONS ---
  const createCedula = (cedulaData: Omit<Cedula, 'id'>) => apiCreateCedula(cedulaData);
  const updateCedula = (cedulaId: string, cedulaData: Partial<Cedula>, onStep?: (log: string) => void) => apiUpdateCedula(cedulaId, cedulaData, onStep);
  const deleteCedula = (cedulaId: string) => apiDeleteCedula(cedulaId);

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
    loading: loadingStatus !== 'ready' || !isAuthReady,
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
