
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, writeBatch, getDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { 
    mockUsers, mockClients, mockSystems, mockEquipments, mockProtocols, mockCedulas
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
    users: 'users',
    clients: 'clients',
    systems: 'systems',
    equipments: 'equipments',
    protocols: 'protocols',
    cedulas: 'cedulas',
};

const mockDataMap = {
    [collections.users]: mockUsers,
    [collections.clients]: mockClients,
    [collections.systems]: mockSystems,
    [collections.equipments]: mockEquipments,
    [collections.protocols]: mockProtocols,
    [collections.cedulas]: mockCedulas,
};


// --- Firebase Seeding ---
export const seedDatabase = async (updateMessage: (message: string) => void) => {
    updateMessage("Checking Firestore database status...");
    const usersCollectionRef = collection(db, collections.users);
    const snapshot = await getDocs(usersCollectionRef);

    if (snapshot.empty) {
        updateMessage("Firestore is empty. Seeding database...");
        const batch = writeBatch(db);

        for (const [collectionName, data] of Object.entries(mockDataMap)) {
            updateMessage(`Preparing to seed collection: ${collectionName}...`);
            data.forEach((item) => {
                const docRef = doc(db, collectionName, item.id);
                batch.set(docRef, item);
            });
            updateMessage(`Collection ${collectionName} added to batch.`);
        }
        
        await batch.commit();
        updateMessage("Firestore database seeding process fully completed.");
    } else {
        updateMessage("Firestore database already contains data.");
    }
};

// --- Generic Firestore Service Functions ---
async function getCollection<T>(collectionName: string): Promise<T[]> {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
}

async function getDocumentById<T extends {id: string}>(collectionName: string, id: string): Promise<T | null> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ ...docSnap.data(), id: docSnap.id } as T) : null;
}

async function createDocument<T>(collectionName: string, data: Omit<T, 'id'>): Promise<T> {
    const docRef = await addDoc(collection(db, collectionName), data);
    return { ...data, id: docRef.id } as T;
}

async function updateDocument<T extends {id: string}>(collectionName: string, id: string, data: Partial<Omit<T, 'id'>>): Promise<T | null> {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, data, { merge: true });
    return getDocumentById<T>(collectionName, id);
}

async function deleteDocument(collectionName: string, id: string): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return true;
}

// --- Specific Service Functions ---

// USERS
export const getUsers = (): Promise<User[]> => getCollection<User>(collections.users);
export const getUser = (id: string): Promise<User | null> => getDocumentById<User>(collections.users, id);
export const createUser = (data: Omit<User, 'id'>): Promise<User> => createDocument<User>(collections.users, data);
export const updateUser = (id: string, data: Partial<User>): Promise<User | null> => updateDocument<User>(collections.users, id, data);
export const deleteUser = (id: string): Promise<boolean> => deleteDocument(collections.users, id);

// CLIENTS
export const getClients = (): Promise<Client[]> => getCollection<Client>(collections.clients);
export const getClient = (id: string): Promise<Client | null> => getDocumentById<Client>(collections.clients, id);
export const createClient = (data: Omit<Client, 'id'>): Promise<Client> => createDocument<Client>(collections.clients, data);
export const updateClient = (id: string, data: Partial<Client>): Promise<Client | null> => updateDocument<Client>(collections.clients, id, data);
export const deleteClient = (id: string): Promise<boolean> => deleteDocument(collections.clients, id);

// EQUIPMENTS
export const getEquipments = (): Promise<Equipment[]> => getCollection<Equipment>(collections.equipments);
export const getEquipment = (id: string): Promise<Equipment | null> => getDocumentById<Equipment>(collections.equipments, id);
export const createEquipment = (data: Omit<Equipment, 'id'>): Promise<Equipment> => createDocument<Equipment>(collections.equipments, data);
export const updateEquipment = (id: string, data: Partial<Equipment>): Promise<Equipment | null> => updateDocument<Equipment>(collections.equipments, id, data);
export const deleteEquipment = (id: string): Promise<boolean> => deleteDocument(collections.equipments, id);

// SYSTEMS
export const getSystems = (): Promise<System[]> => getCollection<System>(collections.systems);
export const getSystem = (id: string): Promise<System | null> => getDocumentById<System>(collections.systems, id);
export const createSystem = (data: Omit<System, 'id'>): Promise<System> => createDocument<System>(collections.systems, data);
export const updateSystem = (id: string, data: Partial<System>): Promise<System | null> => updateDocument<System>(collections.systems, id, data);
export const deleteSystem = (id: string): Promise<boolean> => deleteDocument(collections.systems, id);

// PROTOCOLS
export const getProtocols = (): Promise<Protocol[]> => getCollection<Protocol>(collections.protocols);
export const getProtocol = (id: string): Promise<Protocol | null> => getDocumentById<Protocol>(collections.protocols, id);
export const createProtocol = (data: Omit<Protocol, 'id'>): Promise<Protocol> => createDocument<Protocol>(collections.protocols, data);
export const updateProtocol = (id: string, data: Partial<Protocol>): Promise<Protocol | null> => updateDocument<Protocol>(collections.protocols, id, data);
export const deleteProtocol = (id: string): Promise<boolean> => deleteDocument(collections.protocols, id);

export async function deleteProtocolByEquipmentId(equipmentId: string): Promise<boolean> {
    const q = query(collection(db, collections.protocols), where("equipmentId", "==", equipmentId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        return false;
    }
    
    const batch = writeBatch(db);
    querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    return true;
}

// CEDULAS
export const getCedulas = (): Promise<Cedula[]> => getCollection<Cedula>(collections.cedulas);
export const getCedula = (id: string): Promise<Cedula | null> => getDocumentById<Cedula>(collections.cedulas, id);
export const createCedula = (data: Omit<Cedula, 'id'>): Promise<Cedula> => createDocument<Cedula>(collections.cedulas, data);
export const updateCedula = (id: string, data: Partial<Cedula>): Promise<Cedula | null> => updateDocument<Cedula>(collections.cedulas, id, data);
export const deleteCedula = (id: string): Promise<boolean> => deleteDocument(collections.cedulas, id);
