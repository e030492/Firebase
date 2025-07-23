
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  getClients, getEquipments, getSystems, getUsers, getProtocols, getCedulas,
  Client, Equipment, System, User, Protocol, Cedula
} from '@/lib/services';
import { 
    mockUsers, 
    mockClients, 
    mockSystems, 
    mockEquipments, 
    mockProtocols, 
    mockCedulas 
} from '@/lib/mock-data';
import { writeBatch, collection, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';


type DataContextType = {
  clients: Client[];
  allEquipments: Equipment[];
  systems: System[];
  users: User[];
  protocols: Protocol[];
  cedulas: Cedula[];
  loading: boolean;
  error: string | null;
  seedDatabase: () => Promise<void>;
  addItem: <T extends { id: string }>(collectionName: keyof Omit<DataContextType, 'loading' | 'error' | 'addItem' | 'updateItem' | 'deleteItem' | 'seedDatabase'>, item: T) => void;
  updateItem: <T extends { id: string }>(collectionName: keyof Omit<DataContextType, 'loading' | 'error' | 'addItem' | 'updateItem' | 'deleteItem' | 'seedDatabase'>, item: T) => void;
  deleteItem: (collectionName: keyof Omit<DataContextType, 'loading' | 'error' | 'addItem' | 'updateItem' | 'deleteItem' | 'seedDatabase'>, id: string) => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState({
    clients: [] as Client[],
    allEquipments: [] as Equipment[],
    systems: [] as System[],
    users: [] as User[],
    protocols: [] as Protocol[],
    cedulas: [] as Cedula[],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        usersData,
        clientsData,
        equipmentsData,
        systemsData,
        protocolsData,
        cedulasData,
      ] = await Promise.all([
        getUsers(),
        getClients(),
        getEquipments(),
        getSystems(),
        getProtocols(),
        getCedulas(),
      ]);

      setData({
        users: usersData,
        clients: clientsData,
        allEquipments: equipmentsData,
        systems: systemsData,
        protocols: protocolsData,
        cedulas: cedulasData,
      });
    } catch (e) {
      console.error("Failed to load data", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const seedDatabase = useCallback(async () => {
    setLoading(true);
    setError("Sembrando base de datos...");
    
    try {
        const collections = {
            users: mockUsers,
            clients: mockClients,
            systems: mockSystems,
            equipments: mockEquipments,
            protocols: mockProtocols,
            cedulas: mockCedulas
        };

        for (const [collectionName, mockData] of Object.entries(collections)) {
            const batch = writeBatch(db);
            mockData.forEach(item => {
                const { id, ...data } = item; // Exclude mock ID
                const docRef = doc(collection(db, collectionName));
                batch.set(docRef, data);
            });
            await batch.commit();
        }
        await loadData(); // Reload all data after seeding to update the state
    } catch (error) {
        console.error("Error seeding database:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
        setLoading(false);
    }
  }, [loadData]);
  
  const addItem = useCallback(<T extends { id: string }>(collectionName: keyof typeof data, item: T) => {
    setData(prevData => ({
        ...prevData,
        [collectionName]: [...(prevData[collectionName] as T[]), item]
    }));
  }, []);

  const updateItem = useCallback(<T extends { id: string }>(collectionName: keyof typeof data, item: T) => {
    setData(prevData => ({
        ...prevData,
        [collectionName]: (prevData[collectionName] as T[]).map(i => i.id === item.id ? item : i)
    }));
  }, []);
  
  const deleteItem = useCallback((collectionName: keyof typeof data, id: string) => {
    setData(prevData => ({
        ...prevData,
        [collectionName]: (prevData[collectionName] as any[]).filter(i => i.id !== id)
    }));
  }, []);

  const value = {
    ...data,
    loading,
    error,
    seedDatabase,
    addItem,
    updateItem,
    deleteItem
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
