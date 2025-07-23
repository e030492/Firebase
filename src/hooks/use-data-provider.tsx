
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { 
    getCedulas, 
    getClients, 
    getEquipments, 
    getSystems, 
    getProtocols,
    getUsers,
    seedDatabase,
    Cedula,
    Client,
    Equipment,
    System,
    Protocol,
    User
} from "@/lib/services";

type DataContextType = {
    loading: boolean;
    cedulas: Cedula[];
    clients: Client[];
    allEquipments: Equipment[];
    systems: System[];
    protocols: Protocol[];
    users: User[];
    error: string | null;
    refreshData: () => Promise<void>;
};

const DataContext = createContext<DataContextType>({
    loading: true,
    cedulas: [],
    clients: [],
    allEquipments: [],
    systems: [],
    protocols: [],
    users: [],
    error: null,
    refreshData: async () => {},
});

export function DataProvider({ children }: { children: ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState({
        cedulas: [],
        clients: [],
        allEquipments: [],
        systems: [],
        protocols: [],
        users: [],
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // First, check if users exist to decide whether to seed
            let usersList = await getUsers();
            if (usersList.length === 0) {
                console.log("No users found, attempting to seed database...");
                await seedDatabase();
                // After seeding, refetch users
                usersList = await getUsers();
            }

            const [
                cedulasData,
                clientsData,
                equipmentsData,
                systemsData,
                protocolsData,
            ] = await Promise.all([
                getCedulas(),
                getClients(),
                getEquipments(),
                getSystems(),
                getProtocols(),
            ]);

            setData({
                users: usersList,
                cedulas: cedulasData,
                clients: clientsData,
                allEquipments: equipmentsData,
                systems: systemsData,
                protocols: protocolsData,
            } as any);

        } catch (e: any) {
            console.error("Failed to load dashboard data:", e);
            setError("No se pudieron cargar los datos del dashboard. Verifique su conexión y la configuración de Firebase.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return (
        <DataContext.Provider value={{ loading, error, ...data, refreshData: loadData }}>
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
