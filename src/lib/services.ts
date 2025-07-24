
import { 
    mockUsers, mockClients, mockSystems, mockEquipments, mockProtocols, mockCedulas,
    USERS_STORAGE_KEY, CLIENTS_STORAGE_KEY, SYSTEMS_STORAGE_KEY,
    EQUIPMENTS_STORAGE_KEY, PROTOCOLS_STORAGE_KEY, CEDULAS_STORAGE_KEY
} from './mock-data';

// Interfaces based on mock-data structure
export type Almacen = { nombre: string; direccion: string };
export type Client = typeof mockClients[0] & { id: string };
export type Equipment = typeof mockEquipments[0] & { id: string };
export type System = typeof mockSystems[0] & { id: string };
export type User = typeof mockUsers[0] & { id: string };
export type ProtocolStep = typeof mockProtocols[0]['steps'][0];
export type Protocol = { id: string, equipmentId: string; steps: ProtocolStep[] };
export type Cedula = typeof mockCedulas[0] & { id: string };

const collectionsToSeed = {
    [USERS_STORAGE_KEY]: mockUsers,
    [CLIENTS_STORAGE_KEY]: mockClients,
    [SYSTEMS_STORAGE_KEY]: mockSystems,
    [EQUIPMENTS_STORAGE_KEY]: mockEquipments,
    [PROTOCOLS_STORAGE_KEY]: mockProtocols,
    [CEDULAS_STORAGE_KEY]: mockCedulas,
};

// --- LocalStorage Seeding ---
export const seedDatabase = (updateMessage: (message: string) => void) => {
  return new Promise<void>((resolve) => {
    updateMessage("Starting local database seed process...");
    for (const [key, data] of Object.entries(collectionsToSeed)) {
        updateMessage(`Seeding local collection: ${key}...`);
        localStorage.setItem(key, JSON.stringify(data));
        updateMessage(`Successfully seeded ${key}.`);
    }
    updateMessage("Local database seeding process fully completed.");
    resolve();
  });
};

// --- Generic LocalStorage Service Functions ---

function getCollection<T>(collectionKey: string): T[] {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(collectionKey);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error(`Error getting collection ${collectionKey} from localStorage:`, error);
        return [];
    }
}

function getDocumentById<T extends {id: string}>(collectionKey: string, id: string): T | null {
    const collection = getCollection<T>(collectionKey);
    return collection.find(item => item.id === id) || null;
}

function createDocument<T>(collectionKey: string, data: Omit<T, 'id'>): T {
    const collection = getCollection<T>(collectionKey);
    const newId = String(Date.now() + Math.random());
    const newItem = { ...data, id: newId } as T;
    localStorage.setItem(collectionKey, JSON.stringify([...collection, newItem]));
    return newItem;
}

function updateDocument<T extends {id: string}>(collectionKey: string, id: string, data: Partial<Omit<T, 'id'>>): T | null {
    const collection = getCollection<T>(collectionKey);
    const index = collection.findIndex(item => item.id === id);
    if (index > -1) {
        const updatedItem = { ...collection[index], ...data };
        collection[index] = updatedItem;
        localStorage.setItem(collectionKey, JSON.stringify(collection));
        return updatedItem;
    }
    return null;
}

function deleteDocument(collectionKey: string, id: string): boolean {
    let collection = getCollection<{id: string}>(collectionKey);
    const initialLength = collection.length;
    collection = collection.filter(item => item.id !== id);
    if (collection.length < initialLength) {
        localStorage.setItem(collectionKey, JSON.stringify(collection));
        return true;
    }
    return false;
}

// --- Specific Service Functions ---

// USERS
export const getUsers = (): User[] => getCollection<User>(USERS_STORAGE_KEY);
export const getUser = (id: string): User | null => getDocumentById<User>(USERS_STORAGE_KEY, id);
export const createUser = (data: Omit<User, 'id'>): User => createDocument<User>(USERS_STORAGE_KEY, data);
export const updateUser = (id: string, data: Partial<User>): User | null => updateDocument<User>(USERS_STORAGE_KEY, id, data);
export const deleteUser = (id: string): boolean => deleteDocument(USERS_STORAGE_KEY, id);

// CLIENTS
export const getClients = (): Client[] => getCollection<Client>(CLIENTS_STORAGE_KEY);
export const getClient = (id: string): Client | null => getDocumentById<Client>(CLIENTS_STORAGE_KEY, id);
export const createClient = (data: Omit<Client, 'id'>): Client => createDocument<Client>(CLIENTS_STORAGE_KEY, data);
export const updateClient = (id: string, data: Partial<Client>): Client | null => updateDocument<Client>(CLIENTS_STORAGE_KEY, id, data);
export const deleteClient = (id: string): boolean => deleteDocument(CLIENTS_STORAGE_KEY, id);

// EQUIPMENTS
export const getEquipments = (): Equipment[] => getCollection<Equipment>(EQUIPMENTS_STORAGE_KEY);
export const getEquipment = (id: string): Equipment | null => getDocumentById<Equipment>(EQUIPMENTS_STORAGE_KEY, id);
export const createEquipment = (data: Omit<Equipment, 'id'>): Equipment => createDocument<Equipment>(EQUIPMENTS_STORAGE_KEY, data);
export const updateEquipment = (id: string, data: Partial<Equipment>): Equipment | null => updateDocument<Equipment>(EQUIPMENTS_STORAGE_KEY, id, data);
export const deleteEquipment = (id: string): boolean => deleteDocument(EQUIPMENTS_STORAGE_KEY, id);

// SYSTEMS
export const getSystems = (): System[] => getCollection<System>(SYSTEMS_STORAGE_KEY);
export const getSystem = (id: string): System | null => getDocumentById<System>(SYSTEMS_STORAGE_KEY, id);
export const createSystem = (data: Omit<System, 'id'>): System => createDocument<System>(SYSTEMS_STORAGE_KEY, data);
export const updateSystem = (id: string, data: Partial<System>): System | null => updateDocument<System>(SYSTEMS_STORAGE_KEY, id, data);
export const deleteSystem = (id: string): boolean => deleteDocument(SYSTEMS_STORAGE_KEY, id);

// PROTOCOLS
export const getProtocols = (): Protocol[] => getCollection<Protocol>(PROTOCOLS_STORAGE_KEY);
export const getProtocol = (id: string): Protocol | null => getDocumentById<Protocol>(PROTOCOLS_STORAGE_KEY, id);
export const createProtocol = (data: Omit<Protocol, 'id'>): Protocol => createDocument<Protocol>(PROTOCOLS_STORAGE_KEY, data);
export const updateProtocol = (id: string, data: Partial<Protocol>): Protocol | null => updateDocument<Protocol>(PROTOCOLS_STORAGE_KEY, id, data);
export const deleteProtocol = (id: string): boolean => deleteDocument(PROTOCOLS_STORAGE_KEY, id);

export function deleteProtocolByEquipmentId(equipmentId: string): boolean {
    let protocols = getCollection<Protocol>(PROTOCOLS_STORAGE_KEY);
    const initialLength = protocols.length;
    protocols = protocols.filter(p => p.equipmentId !== equipmentId);
    if (protocols.length < initialLength) {
        localStorage.setItem(PROTOCOLS_STORAGE_KEY, JSON.stringify(protocols));
        return true;
    }
    return false;
}

// CEDULAS
export const getCedulas = (): Cedula[] => getCollection<Cedula>(CEDULAS_STORAGE_KEY);
export const getCedula = (id: string): Cedula | null => getDocumentById<Cedula>(CEDULAS_STORAGE_KEY, id);
export const createCedula = (data: Omit<Cedula, 'id'>): Cedula => createDocument<Cedula>(CEDULAS_STORAGE_KEY, data);
export const updateCedula = (id: string, data: Partial<Cedula>): Cedula | null => updateDocument<Cedula>(CEDULAS_STORAGE_KEY, id, data);
export const deleteCedula = (id: string): boolean => deleteDocument(CEDULAS_STORAGE_KEY, id);
