
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { getClients, getEquipments, getSystems, getUsers, getProtocols, getCedulas, seedDatabase, Client, Equipment, System, User, Protocol, Cedula } from "@/lib/services";

type DataContextType = {
  clients: Client[];
  equipments: Equipment[];
  systems: System[];
  users: User[];
  protocols: Protocol[];
  cedulas: Cedula[];
  loading: boolean;
  error: string | null;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // First, check if the users collection is empty. If so, seed the database.
      const initialUsers = await getUsers();
      if (initialUsers.length === 0) {
        console.log("Database empty, seeding...");
        await seedDatabase();
      }

      // Then, fetch all data.
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

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      console.error("Failed to load data:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
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
    loading,
    error,
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
