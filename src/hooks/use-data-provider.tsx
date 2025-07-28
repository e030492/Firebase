
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
    loginUser as firebaseLogin,
    getUsers, getClients, getSystems, getEquipments, getProtocols, getCedulas,
    createUser as firebaseCreateUser,
    updateUser as firebaseUpdateUser,
    deleteUser as firebaseDeleteUser,
    createClient as firebaseCreateClient,
    updateClient as firebaseUpdateClient,
    deleteClient as firebaseDeleteClient,
    createSystem as firebaseCreateSystem,
    updateSystem as firebaseUpdateSystem,
    deleteSystem as firebaseDeleteSystem,
    createEquipment as firebaseCreateEquipment,
    updateEquipment as firebaseUpdateEquipment,
    deleteEquipment as firebaseDeleteEquipment,
    createProtocol as firebaseCreateProtocol,
    updateProtocol as firebaseUpdateProtocol,
    deleteProtocol as firebaseDeleteProtocol,
    createCedula as firebaseCreateCedula,
    updateCedula as firebaseUpdateCedula,
    deleteCedula as firebaseDeleteCedula,
    updateCompanySettings as firebaseUpdateCompanySettings,
    getCompanySettings,
    subscribeToMediaLibrary as firebaseSubscribeToMediaLibrary,
    uploadFile as firebaseUploadFile,
    deleteMediaFile as firebaseDeleteMediaFile,
    onFirebaseAuthStateChanged
} from '@/lib/services';

import type { User, Client, System, Equipment, Protocol, Cedula, CompanySettings, MediaFile } from '@/lib/services';
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
  // Media Library
  subscribeToMediaLibrary: (setFiles: (files: MediaFile[]) => void) => () => void;
  uploadFile: (files: File[], onProgress: (percentage: number) => void, logAudit: (message: string) => void) => Promise<void>;
  deleteMediaFile: (file: MediaFile) => Promise<void>;
  // Settings
  updateCompanySettings: (settingsData: Partial<CompanySettings>) => Promise<void>;
  // User mutations
  createUser: (userData: Omit<User, 'id'>) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<User>;
  // Client mutations
  createClient: (clientData: Omit<Client, 'id'>) => Promise<Client>;
  updateClient: (clientId: string, clientData: Partial<Client>) => Promise<Client>;
  deleteClient: (clientId: string) => Promise<void>;
  // System mutations
  createSystem: (systemData: Omit<System, 'id'>) => Promise<System>;
  updateSystem: (systemId: string, systemData: Partial<System>) => Promise<System>;
  deleteSystem: (systemId: string) => Promise<void>;
  // Equipment mutations
  createEquipment: (equipmentData: Omit<Equipment, 'id'>) => Promise<Equipment>;
  updateEquipment: (equipmentId: string, equipmentData: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (equipmentId: string) => Promise<void>;
  // Protocol mutations
  createProtocol: (protocolData: Omit<Protocol, 'id'>, id?: string) => Promise<Protocol>;
  updateProtocol: (protocolId: string, protocolData: Partial<Protocol>) => Promise<Protocol>;
  deleteProtocol: (protocolId: string) => Promise<void>;
  // Cedula mutations
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
  const [mediaLibrary, setMediaLibrary] = useState<MediaFile[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onFirebaseAuthStateChanged(async (user) => {
      if (user) {
        try {
          setLoading(true);
          const [
              usersData, clientsData, systemsData, equipmentsData, 
              protocolsData, cedulasData, settingsData
          ] = await Promise.all([
              getUsers(), getClients(), getSystems(), getEquipments(), 
              getProtocols(), getCedulas(), getCompanySettings()
          ]);
          setUsers(usersData);
          setClients(clientsData);
          setSystems(systemsData);
          setEquipments(equipmentsData);
          setProtocols(protocolsData);
          setCedulas(cedulasData);
          setCompanySettings(settingsData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load data from Firebase.");
            console.error(err);
        } finally {
            setLoading(false);
        }
      } else {
        // No user logged in, clear data and finish loading.
        setUsers([]);
        setClients([]);
        setSystems([]);
        setEquipments([]);
        setProtocols([]);
        setCedulas([]);
        setCompanySettings(null);
        setLoading(false);
      }
      setAuthInitialized(true);
    });
    
    return () => unsubscribe();
  }, []);

  const loginUser = async (email: string, pass: string): Promise<User | null> => {
      const user = await firebaseLogin(email, pass);
      if (user) {
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(user));
      }
      return user;
  };
  
  const value: DataContextType = {
    users,
    clients,
    systems,
    equipments,
    protocols,
    cedulas,
    companySettings,
    loading: loading || !authInitialized,
    error,
    loginUser,
    subscribeToMediaLibrary: firebaseSubscribeToMediaLibrary,
    uploadFile: firebaseUploadFile,
    deleteMediaFile: firebaseDeleteMediaFile,
    updateCompanySettings: firebaseUpdateCompanySettings,
    createUser: firebaseCreateUser,
    updateUser: firebaseUpdateUser,
    deleteUser: firebaseDeleteUser,
    createClient: firebaseCreateClient,
    updateClient: firebaseUpdateClient,
    deleteClient: firebaseDeleteClient,
    createSystem: firebaseCreateSystem,
    updateSystem: firebaseUpdateSystem,
    deleteSystem: firebaseDeleteSystem,
    createEquipment: firebaseCreateEquipment,
    updateEquipment: firebaseUpdateEquipment,
    deleteEquipment: firebaseDeleteEquipment,
    createProtocol: firebaseCreateProtocol,
    updateProtocol: firebaseUpdateProtocol,
    deleteProtocol: firebaseDeleteProtocol,
    createCedula: firebaseCreateCedula,
    updateCedula: firebaseUpdateCedula,
    deleteCedula: firebaseDeleteCedula,
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
