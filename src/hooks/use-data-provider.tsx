
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
    mockUsers, mockClients, mockSystems, mockEquipments, mockProtocols, mockCedulas
} from '@/lib/services';
import { ACTIVE_USER_STORAGE_KEY } from '@/lib/mock-data';
import type { User, Client, System, Equipment, Protocol, Cedula, CompanySettings, MediaFile } from '@/lib/services';
import { v4 as uuidv4 } from 'uuid';

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
  // Media Library - Mock implementation
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

const LOCAL_STORAGE_KEY_PREFIX = 'guardian_shield_';

// Helper to get data from localStorage
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage for key "${key}":`, error);
    return defaultValue;
  }
};

// Helper to set data to localStorage
const setToStorage = <T>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${key}`, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage for key "${key}":`, error);
  }
};


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
  const [error] = useState<string | null>(null);

  // Initialize data from localStorage or mockData
  useEffect(() => {
    setUsers(getFromStorage('users', mockUsers));
    setClients(getFromStorage('clients', mockClients));
    setSystems(getFromStorage('systems', mockSystems));
    setEquipments(getFromStorage('equipments', mockEquipments));
    setProtocols(getFromStorage('protocols', mockProtocols));
    setCedulas(getFromStorage('cedulas', mockCedulas));
    setCompanySettings(getFromStorage('companySettings', { id: 'companyProfile', logoUrl: 'https://storage.googleapis.com/builder-prod.appspot.com/assets%2Fescudo.png?alt=media&token=e179a63c-3965-4f7c-a25e-315135118742' }));
    setMediaLibrary(getFromStorage('mediaLibrary', []));
    setLoading(false);
  }, []);

  // Persist data to localStorage whenever it changes
  useEffect(() => { setToStorage('users', users); }, [users]);
  useEffect(() => { setToStorage('clients', clients); }, [clients]);
  useEffect(() => { setToStorage('systems', systems); }, [systems]);
  useEffect(() => { setToStorage('equipments', equipments); }, [equipments]);
  useEffect(() => { setToStorage('protocols', protocols); }, [protocols]);
  useEffect(() => { setToStorage('cedulas', cedulas); }, [cedulas]);
  useEffect(() => { setToStorage('companySettings', companySettings); }, [companySettings]);
  useEffect(() => { setToStorage('mediaLibrary', mediaLibrary); }, [mediaLibrary]);

  
  const loginUser = async (email: string, pass: string): Promise<User | null> => {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
      if (user) {
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(user));
          return user;
      }
      return null;
  };
  
  const createUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    const newUser = { id: uuidv4(), ...userData } as User;
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
    let updatedUser: User | null = null;
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        updatedUser = { ...u, ...userData };
        return updatedUser;
      }
      return u;
    }));
    if (!updatedUser) throw new Error("User not found");
    return updatedUser;
  };

  const deleteUser = async (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };
  
  const createClient = async (clientData: Omit<Client, 'id'>): Promise<Client> => {
    const newClient = { id: uuidv4(), ...clientData };
    setClients(prev => [...prev, newClient]);
    return newClient;
  };

  const updateClient = async (clientId: string, clientData: Partial<Client>): Promise<Client> => {
      let updatedClient: Client | null = null;
      setClients(prev => prev.map(c => {
          if (c.id === clientId) {
              updatedClient = { ...c, ...clientData };
              return updatedClient;
          }
          return c;
      }));
      if (!updatedClient) throw new Error("Client not found");
      return updatedClient;
  };
  
  const deleteClient = async (clientId: string) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
  };
  
  const createSystem = async (systemData: Omit<System, 'id'>): Promise<System> => {
    const newSystem = { id: uuidv4(), ...systemData };
    setSystems(prev => [...prev, newSystem]);
    return newSystem;
  };

  const updateSystem = async (systemId: string, systemData: Partial<System>): Promise<System> => {
    let updatedSystem: System | null = null;
    setSystems(prev => prev.map(s => {
        if (s.id === systemId) {
            updatedSystem = { ...s, ...systemData };
            return updatedSystem;
        }
        return s;
    }));
    if (!updatedSystem) throw new Error("System not found");
    return updatedSystem;
  };
  
  const deleteSystem = async (systemId: string) => {
    setSystems(prev => prev.filter(s => s.id !== systemId));
  };

  const createEquipment = async (equipmentData: Omit<Equipment, 'id'>): Promise<Equipment> => {
    const newEquipment = { id: uuidv4(), ...equipmentData };
    setEquipments(prev => [...prev, newEquipment]);
    return newEquipment;
  };
  
  const updateEquipment = async (equipmentId: string, equipmentData: Partial<Equipment>) => {
    setEquipments(prev => prev.map(e => e.id === equipmentId ? { ...e, ...equipmentData } : e));
  };
  
  const deleteEquipment = async (equipmentId: string) => {
    setEquipments(prev => prev.filter(e => e.id !== equipmentId));
  };
  
  const createProtocol = async (protocolData: Omit<Protocol, 'id'>, id?: string): Promise<Protocol> => {
    const newProtocol = { id: id || uuidv4(), ...protocolData };
    setProtocols(prev => [...prev, newProtocol]);
    return newProtocol;
  };

  const updateProtocol = async (protocolId: string, protocolData: Partial<Protocol>): Promise<Protocol> => {
      let updatedProtocol: Protocol | null = null;
      setProtocols(prev => prev.map(p => {
          if (p.id === protocolId) {
              updatedProtocol = { ...p, ...protocolData };
              return updatedProtocol;
          }
          return p;
      }));
      if (!updatedProtocol) throw new Error("Protocol not found");
      return updatedProtocol;
  };

  const deleteProtocol = async (protocolId: string) => {
      setProtocols(prev => prev.filter(p => p.id !== protocolId));
  };

  const createCedula = async (cedulaData: Omit<Cedula, 'id'>): Promise<Cedula> => {
    const newCedula = { id: uuidv4(), ...cedulaData };
    setCedulas(prev => [...prev, newCedula]);
    return newCedula;
  };
  
  const updateCedula = async (cedulaId: string, cedulaData: Partial<Cedula>, onStep?: (log: string) => void) => {
    onStep?.('Iniciando actualización de cédula...');
    setCedulas(prev => {
        return prev.map(c => {
            if (c.id === cedulaId) {
                onStep?.(`Cédula con folio ${c.folio} encontrada. Aplicando cambios...`);
                const updatedCedula = { ...c, ...cedulaData };
                onStep?.('Cambios aplicados en memoria.');
                return updatedCedula;
            }
            return c;
        });
    });
    onStep?.('¡Actualización completada con éxito!');
  };

  const deleteCedula = async (cedulaId: string) => {
    setCedulas(prev => prev.filter(c => c.id !== cedulaId));
  };
  
  // Mock Media Library Functions
  const subscribeToMediaLibrary = (callback: (files: MediaFile[]) => void) => {
    callback(mediaLibrary);
    // Return an empty unsubscribe function as this is a mock
    return () => {};
  };

  const uploadFile = async (files: File[], onProgress: (percentage: number) => void, logAudit: (message: string) => void) => {
    logAudit(`Simulando carga para ${files.length} archivos...`);
    let totalProgress = 0;
    const step = 100 / files.length;
    for (const file of files) {
        // Simulate upload delay
        await new Promise(res => setTimeout(res, 500));
        const newMediaFile: MediaFile = {
            id: uuidv4(),
            name: file.name,
            url: URL.createObjectURL(file), // Create a temporary local URL
            type: file.type,
            size: file.size,
            createdAt: new Date().toISOString(),
        };
        setMediaLibrary(prev => [newMediaFile, ...prev]);
        totalProgress += step;
        onProgress(totalProgress);
        logAudit(`Archivo ${file.name} "cargado".`);
    }
    onProgress(100);
    logAudit('Carga simulada completada.');
  };

  const deleteMediaFile = async (fileToDelete: MediaFile) => {
    setMediaLibrary(prev => prev.filter(file => file.id !== fileToDelete.id));
    if (fileToDelete.url.startsWith('blob:')) {
      URL.revokeObjectURL(fileToDelete.url);
    }
  };

  const updateCompanySettings = async (settingsData: Partial<CompanySettings>) => {
    setCompanySettings(prev => ({...prev!, ...settingsData}));
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
    uploadFile,
    deleteMediaFile,
    updateCompanySettings,
    createUser,
    updateUser,
    deleteUser,
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
