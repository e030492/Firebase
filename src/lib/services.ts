
import { 
    mockUsers, mockClients, mockSystems, mockEquipments, mockProtocols, mockCedulas,
    USERS_STORAGE_KEY, CLIENTS_STORAGE_KEY, SYSTEMS_STORAGE_KEY, EQUIPMENTS_STORAGE_KEY,
    PROTOCOLS_STORAGE_KEY, CEDULAS_STORAGE_KEY
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

const collections = {
    users: USERS_STORAGE_KEY,
    clients: CLIENTS_STORAGE_KEY,
    systems: SYSTEMS_STORAGE_KEY,
    equipments: EQUIPMENTS_STORAGE_KEY,
    protocols: PROTOCOLS_STORAGE_KEY,
    cedulas: CEDULAS_STORAGE_KEY,
};

const mockDataMap = {
    [collections.users]: mockUsers,
    [collections.clients]: mockClients,
    [collections.systems]: mockSystems,
    [collections.equipments]: mockEquipments,
    [collections.protocols]: mockProtocols,
    [collections.cedulas]: mockCedulas,
};


// --- LocalStorage Seeding ---
export const seedDatabase = (updateMessage: (message: string) => void) => {
    updateMessage("Checking localStorage database status...");
    const usersExist = localStorage.getItem(USERS_STORAGE_KEY);

    if (!usersExist) {
        updateMessage("localStorage is empty. Seeding database...");

        for (const [collectionName, data] of Object.entries(mockDataMap)) {
            localStorage.setItem(collectionName, JSON.stringify(data));
            updateMessage(`Collection ${collectionName} seeded in localStorage.`);
        }
        
        updateMessage("localStorage database seeding process fully completed.");
    } else {
        updateMessage("localStorage database already contains data.");
    }
};

// --- Generic LocalStorage Service Functions ---
async function getCollection<T>(collectionName: string): Promise<T[]> {
    const data = localStorage.getItem(collectionName);
    return data ? JSON.parse(data) : [];
}

async function getDocumentById<T extends {id: string}>(collectionName: string, id: string): Promise<T> {
    const data = await getCollection<T>(collectionName);
    const item = data.find(item => item.id === id);
    if (!item) throw new Error(`Document with id ${id} not found in ${collectionName}`);
    return item;
}

async function createDocument<T>(collectionName: string, data: Omit<T, 'id'>): Promise<T> {
    const collectionData = await getCollection<T & {id: string}>(collectionName);
    const newId = String(Date.now() + Math.random());
    const newItem = { ...data, id: newId } as T & {id: string};
    collectionData.push(newItem);
    localStorage.setItem(collectionName, JSON.stringify(collectionData));
    return newItem;
}

async function updateDocument<T extends {id: string}>(collectionName: string, id: string, data: Partial<Omit<T, 'id'>>): Promise<T> {
    const collectionData = await getCollection<T>(collectionName);
    const itemIndex = collectionData.findIndex(item => item.id === id);
    if (itemIndex === -1) throw new Error(`Document with id ${id} not found for update in ${collectionName}`);
    
    const updatedItem = { ...collectionData[itemIndex], ...data };
    collectionData[itemIndex] = updatedItem;
    localStorage.setItem(collectionName, JSON.stringify(collectionData));
    return updatedItem;
}

async function deleteDocument(collectionName: string, id: string): Promise<boolean> {
    let collectionData = await getCollection<{id: string}>(collectionName);
    const initialLength = collectionData.length;
    collectionData = collectionData.filter(item => item.id !== id);
    if(collectionData.length === initialLength) {
        console.warn(`Document with id ${id} not found for deletion in ${collectionName}`);
        return false;
    }
    localStorage.setItem(collectionName, JSON.stringify(collectionData));
    return true;
}

// --- Specific Service Functions ---

// USERS
export const getUsers = (): Promise<User[]> => getCollection<User>(collections.users);
export const getUser = (id: string): Promise<User> => getDocumentById<User>(collections.users, id);
export const createUser = (data: Omit<User, 'id'>): Promise<User> => createDocument<User>(collections.users, data);
export const updateUser = (id: string, data: Partial<User>): Promise<User> => updateDocument<User>(collections.users, id, data);
export const deleteUser = (id: string): Promise<boolean> => deleteDocument(collections.users, id);

// CLIENTS
export const getClients = (): Promise<Client[]> => getCollection<Client>(collections.clients);
export const getClient = (id: string): Promise<Client> => getDocumentById<Client>(collections.clients, id);
export const createClient = (data: Omit<Client, 'id'>): Promise<Client> => createDocument<Client>(collections.clients, data);
export const updateClient = (id: string, data: Partial<Client>): Promise<Client> => updateDocument<Client>(collections.clients, id, data);
export const deleteClient = (id: string): Promise<boolean> => deleteDocument(collections.clients, id);

// EQUIPMENTS
export const getEquipments = (): Promise<Equipment[]> => getCollection<Equipment>(collections.equipments);
export const getEquipment = (id: string): Promise<Equipment> => getDocumentById<Equipment>(collections.equipments, id);
export const createEquipment = (data: Omit<Equipment, 'id'>): Promise<Equipment> => createDocument<Equipment>(collections.equipments, data);
export const updateEquipment = (id: string, data: Partial<Equipment>): Promise<Equipment> => updateDocument<Equipment>(collections.equipments, id, data);
export const deleteEquipment = (id: string): Promise<boolean> => deleteDocument(collections.equipments, id);

// SYSTEMS
export const getSystems = (): Promise<System[]> => getCollection<System>(collections.systems);
export const getSystem = (id: string): Promise<System> => getDocumentById<System>(collections.systems, id);
export const createSystem = (data: Omit<System, 'id'>): Promise<System> => createDocument<System>(collections.systems, data);
export const updateSystem = (id: string, data: Partial<System>): Promise<System> => updateDocument<System>(collections.systems, id, data);
export const deleteSystem = (id: string): Promise<boolean> => deleteDocument(collections.systems, id);

// PROTOCOLS
export const getProtocols = (): Promise<Protocol[]> => getCollection<Protocol>(collections.protocols);
export const getProtocol = (id: string): Promise<Protocol> => getDocumentById<Protocol>(collections.protocols, id);
export const createProtocol = (data: Omit<Protocol, 'id'>): Promise<Protocol> => createDocument<Protocol>(collections.protocols, data);
export const updateProtocol = (id: string, data: Partial<Protocol>): Promise<Protocol> => updateDocument<Protocol>(collections.protocols, id, data);
export const deleteProtocol = (id: string): Promise<boolean> => deleteDocument(collections.protocols, id);

export async function deleteProtocolByEquipmentId(equipmentId: string): Promise<boolean> {
    let protocols = await getProtocols();
    const filteredProtocols = protocols.filter(p => p.equipmentId !== equipmentId);
    if(protocols.length === filteredProtocols.length) return false;
    localStorage.setItem(PROTOCOLS_STORAGE_KEY, JSON.stringify(filteredProtocols));
    return true;
}

// CEDULAS
export const getCedulas = (): Promise<Cedula[]> => getCollection<Cedula>(collections.cedulas);
export const getCedula = (id: string): Promise<Cedula> => getDocumentById<Cedula>(collections.cedulas, id);
export const createCedula = (data: Omit<Cedula, 'id'>): Promise<Cedula> => createDocument<Cedula>(collections.cedulas, data);
export const updateCedula = (id: string, data: Partial<Cedula>): Promise<Cedula> => updateDocument<Cedula>(collections.cedulas, id, data);
export const deleteCedula = (id: string): Promise<boolean> => deleteDocument(collections.cedulas, id);
