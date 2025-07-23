
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { getClients, getEquipments, getSystems, getUsers, getProtocols, getCedulas, seedDatabase, Client, Equipment, System, User, Protocol, Cedula } from "@/lib/services";

type Status = 'idle' | 'loading' | 'success' | 'error';

type DataContextType = {
  clients: Client[];
  equipments: Equipment[];
  systems: System[];
  users: User[];
  protocols: Protocol[];
  cedulas: Cedula[];
  status: Status;
  error: string | null;
  statusMessage: string;
  refreshData: () => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [cedulas, setCedulas] = useState<Cedula[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Sistema inactivo.');

  const loadData = useCallback(async () => {
    setStatus('loading');
    setError(null);
    setStatusMessage('Sincronizando con la base de datos...');
    try {
      
      const initialUsers = await getUsers();
      if (initialUsers.length === 0) {
        setStatusMessage("Base de datos vacía. Sembrando datos iniciales...");
        await seedDatabase();
      }

      setStatusMessage("Cargando colecciones...");
      const [
        clientsData,
        equipmentsData,
        systemsData,
        usersData,
        protocolsData,
        cedulasData
      ] = await Promise.all([
        getClients(),
        getEquipments(),
        getSystems(),
        getUsers(),
        getProtocols(),
        getCedulas(),
      ]);

      setClients(clientsData);
      setEquipments(equipmentsData);
      setSystems(systemsData);
      setUsers(usersData);
      setProtocols(protocolsData);
      setCedulas(cedulasData);

      setStatus('success');
      setStatusMessage('Datos sincronizados correctamente.');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      console.error("Failed to load data:", err);
      setError(errorMessage);
      setStatus('error');
      setStatusMessage('Error de conexión con la base de datos.');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const value = {
    clients,
    equipments,
    systems,
    users,
    protocols,
    cedulas,
    loading: status === 'loading', // For convenience in components
    status,
    error,
    statusMessage,
    refreshData: loadData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
