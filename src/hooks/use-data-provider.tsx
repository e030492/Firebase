
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
    getClients, getSystems, getEquipments, getProtocols, getCedulas,
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

type DataContextType = {
  clients: Client[];
  systems: System[];
  equipments: Equipment[];
  protocols: Protocol[];
  cedulas: Cedula[];
  companySettings: CompanySettings | null;
  loading: boolean;
  error: string | null;
  subscribeToMediaLibrary: (setFiles: (files: MediaFile[]) => void) => () => void;
  uploadFile: (files: File[], onProgress: (percentage: number) => void, logAudit: (message: string) => void) => Promise<void>;
  deleteMediaFile: (file: MediaFile) => Promise<void>;
  updateCompanySettings: (settingsData: Partial<CompanySettings>) => Promise<void>;
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
  const [clients, setClients] = useState<Client[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [cedulas, setCedulas] = useState<Cedula[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
        const [clientsData, systemsData, equipmentsData, protocolsData, cedulasData, settingsData] = await Promise.all([
            getClients(), getSystems(), getEquipments(), getProtocols(), getCedulas(), getCompanySettings()
        ]);
        setClients(clientsData);
        setSystems(systemsData);
        setEquipments(equipmentsData);
        setProtocols(protocolsData);
        setCedulas(cedulasData);
        setCompanySettings(settingsData);
        setError(null);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during data fetching";
        setError(errorMessage);
        console.error("Data fetching error:", err);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // --- CRUD MUTATIONS ---
  const createClient = (data: Omit<Client, 'id'>) => apiCreateClient(data).then(n => { setClients(p => [...p, n]); return n; });
  const updateClient = (id: string, data: Partial<Client>) => apiUpdateClient(id, data).then(u => { setClients(p => p.map(c => c.id === id ? u : c)); return u; });
  const deleteClient = (id: string) => apiDeleteClient(id).then(() => setClients(p => p.filter(c => c.id !== id)));

  const createSystem = (data: Omit<System, 'id'>) => apiCreateSystem(data).then(n => { setSystems(p => [...p, n]); return n; });
  const updateSystem = (id: string, data: Partial<System>) => apiUpdateSystem(id, data).then(u => { setSystems(p => p.map(s => s.id === id ? u : s)); return u; });
  const deleteSystem = (id: string) => apiDeleteSystem(id).then(() => setSystems(p => p.filter(s => s.id !== id)));
  
  const createEquipment = (data: Omit<Equipment, 'id'>) => apiCreateEquipment(data).then(n => { setEquipments(p => [...p, n]); return n; });
  const updateEquipment = (id: string, data: Partial<Equipment>) => apiUpdateEquipment(id, data).then(() => { const updatedEquipment = { ...equipments.find(e=>e.id===id)!, ...data }; setEquipments(p => p.map(e => e.id === id ? updatedEquipment as Equipment : e))});
  const deleteEquipment = (id: string) => apiDeleteEquipment(id).then(() => setEquipments(p => p.filter(e => e.id !== id)));

  const createProtocol = (data: Omit<Protocol, 'id'>, id?: string) => apiCreateProtocol(data, id).then(n => { setProtocols(p => [...p, n]); return n; });
  const updateProtocol = (id: string, data: Partial<Protocol>) => apiUpdateProtocol(id, data).then(u => { setProtocols(p => p.map(proto => proto.id === id ? u : proto)); return u; });
  const deleteProtocol = (id: string) => apiDeleteProtocol(id).then(() => setProtocols(p => p.filter(proto => proto.id !== id)));

  const createCedula = (data: Omit<Cedula, 'id'>) => apiCreateCedula(data).then(n => { setCedulas(p => [...p, n]); return n; });
  const updateCedula = (id: string, data: Partial<Cedula>, onStep?: (log: string) => void) => apiUpdateCedula(id, data, onStep).then(() => { const updatedCedula = { ...cedulas.find(c=>c.id===id)!, ...data }; setCedulas(p => p.map(c => c.id === id ? updatedCedula as Cedula : c))});
  const deleteCedula = (id: string) => apiDeleteCedula(id).then(() => setCedulas(p => p.filter(c => c.id !== id)));

  const updateCompanySettings = (data: Partial<CompanySettings>) => apiUpdateCompanySettings(data).then(newSettings => setCompanySettings(newSettings));
  const subscribeToMediaLibrary = (setFiles: (files: MediaFile[]) => void) => apiSubscribeToMediaLibrary(setFiles);
  const uploadFile = (files: File[], onProgress: (p: number) => void, logAudit: (m: string) => void) => apiUploadFile(files, onProgress, logAudit);
  const deleteMediaFile = (file: MediaFile) => apiDeleteMediaFile(file);
  
  const value: DataContextType = {
    clients, systems, equipments, protocols, cedulas, companySettings,
    loading, error,
    subscribeToMediaLibrary, uploadFile, deleteMediaFile,
    updateCompanySettings,
    createClient, updateClient, deleteClient,
    createSystem, updateSystem, deleteSystem,
    createEquipment, updateEquipment, deleteEquipment,
    createProtocol, updateProtocol, deleteProtocol,
    createCedula, updateCedula, deleteCedula,
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
