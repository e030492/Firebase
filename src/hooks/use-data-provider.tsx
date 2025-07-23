
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
import { usePathname } from "next/navigation";

type DataContextType = {
    loading: boolean;
    cedulas: Cedula[];
    clients: Client[];
    allEquipments: Equipment[];
    systems: System[];
    protocols: Protocol[];
    users: User[];
    error: string | null;
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

    const pathname = usePathname();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [
                    cedulasData,
                    clientsData,
                    equipmentsData,
                    systemsData,
                    protocolsData,
                    usersData
                ] = await Promise.all([
                    getCedulas(),
                    getClients(),
                    getEquipments(),
                    getSystems(),
                    getProtocols(),
                    getUsers()
                ]);

                if (usersData.length === 0 && pathname.startsWith('/dashboard')) {
                    console.log("No users found, attempting to seed database...");
                    await seedDatabase();
                    // Recargar los datos despues de sembrar
                    const [
                        refreshedCedulas, refreshedClients, refreshedEquipments, 
                        refreshedSystems, refreshedProtocols, refreshedUsers
                    ] = await Promise.all([
                        getCedulas(), getClients(), getEquipments(), 
                        getSystems(), getProtocols(), getUsers()
                    ]);
                     setData({
                        cedulas: refreshedCedulas,
                        clients: refreshedClients,
                        allEquipments: refreshedEquipments,
                        systems: refreshedSystems,
                        protocols: refreshedProtocols,
                        users: refreshedUsers,
                    } as any);

                } else {
                     setData({
                        cedulas: cedulasData,
                        clients: clientsData,
                        allEquipments: equipmentsData,
                        systems: systemsData,
                        protocols: protocolsData,
                        users: usersData,
                    } as any);
                }

            } catch (e: any) {
                console.error("Failed to load dashboard data:", e);
                setError("No se pudieron cargar los datos del dashboard. Verifique su conexión y la configuración de Firebase.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    return (
        <DataContext.Provider value={{ loading, error, ...data }}>
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
