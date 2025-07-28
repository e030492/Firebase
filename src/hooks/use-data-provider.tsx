

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
    subscribeToMediaLibrary,
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
    createCedula as createCedulaService,
    updateCedula as updateCedulaService,
    deleteCedula as deleteCedulaService,
    connectionTest,
    loginUser as loginUserService,
    uploadFile as uploadFileService,
    deleteMediaFile as deleteMediaFileService,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeApp() {
      try {
        setError(null);
        await seedDatabase();
      } catch (e: any) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        setError(`FATAL: No se pudo inicializar la base de datos. ${errorMessage}`);
        console.error("Failed to initialize database:", e);
      } finally {
        setLoading(false);
      }
    }

    initializeApp();

    const unsubscribers = [
        subscribeToUsers(setUsers),
        subscribeToClients(setClients),
        subscribeToSystems(setSystems),
        subscribeToEquipments(setEquipments),
        subscribeToProtocols(setProtocols),
        subscribeToCedulas(setCedulas),
        subscribeToCompanySettings(setCompanySettings),
    ];

    return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);
  
  // --- AUTH ---
  const loginUser = async (email: string, pass: string): Promise<User | null> => {
      const user = await loginUserService(email, pass);
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
    loading,
    error,
    loginUser,
    subscribeToMediaLibrary,
    uploadFile: uploadFileService,
    deleteMediaFile: async (file) => {
        await deleteMediaFileService(file);
    },
    updateCompanySettings: updateCompanySettingsService,
    createUser: createUserService,
    updateUser: updateUserService,
    deleteUser: async (id) => { await deleteUserService(id); },
    createClient: createClientService,
    updateClient: updateClientService,
    deleteClient: async (id) => { await deleteClientService(id); },
    createSystem: createSystemService,
    updateSystem: updateSystemService,
    deleteSystem: async (id) => { await deleteSystemService(id); },
    createEquipment: createEquipmentService,
    updateEquipment: async (id, data) => { await updateEquipmentService(id, data) },
    deleteEquipment: async (id) => { await deleteEquipmentService(id); },
    createProtocol: createProtocolService,
    updateProtocol: updateProtocolService,
    deleteProtocol: async (id) => { await deleteProtocolService(id); },
    createCedula: createCedulaService,
    updateCedula: async (id, data, onStep) => { await updateCedulaService(id, data, onStep) },
    deleteCedula: async (id) => { await deleteCedulaService(id); },
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
