
import { collection, getDocs, writeBatch, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, app } from './firebase';
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

// --- Firestore Seeding ---
export async function verifyFirestoreConnection(updateMessage: (message: string) => void) {
    updateMessage("Initializing Firebase...");
    try {
        // The 'app' import ensures Firebase is initialized.
        updateMessage(`Firebase app initialized for project: ${app.options.projectId}`);
        updateMessage("Getting Firestore instance...");
        // The 'db' import ensures Firestore is initialized.
        updateMessage("Firestore instance acquired. Testing connection...");
        
        // Attempt to read a non-existent document. This tests security rules.
        const testDocRef = doc(db, "health_check", "test");
        await getDoc(testDocRef);
        
        updateMessage("Connection and security rules test successful.");
    } catch (error: any) {
        console.error("Firebase connection test failed:", error);
        let errorMessage = `Firestore connection test failed. This often means your security rules are too restrictive. Please ensure they allow read/write access for authenticated users. Original error: ${error.message}`;
        if (error.code === 'permission-denied') {
            errorMessage = "Firestore permission denied. Please check your security rules in the Firebase console to allow read/write operations.";
        }
        updateMessage(errorMessage);
        throw new Error(errorMessage);
    }
}


export const seedDatabase = async (updateMessage: (message: string) => void) => {
    updateMessage("Starting database seed process...");
    const batch = writeBatch(db);

    for (const [collectionName, data] of Object.entries(mockDataMap)) {
        updateMessage(`Preparing to seed collection: ${collectionName}...`);
        for (const item of data) {
            const docRef = doc(db, collectionName, item.id);
            batch.set(docRef, item);
        }
        updateMessage(`Collection ${collectionName} added to batch.`);
    }

    try {
        await batch.commit();
        updateMessage("Database seeding process fully completed.");
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        updateMessage(`Error committing batch: ${errorMessage}`);
        console.error("Error seeding database:", error);
        throw error;
    }
};

// --- Generic Firestore Service Functions ---
async function getCollection<T>(collectionName: string): Promise<T[]> {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}

async function getDocumentById<T extends {id: string}>(collectionName: string, id: string): Promise<T> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error(`Document with id ${id} not found in ${collectionName}`);
    return { id: docSnap.id, ...docSnap.data() } as T;
}

async function createDocument<T>(collectionName: string, data: Omit<T, 'id'>): Promise<T> {
    const newDocRef = doc(collection(db, collectionName));
    const newItem = { ...data, id: newDocRef.id };
    await setDoc(newDocRef, data);
    return newItem as T;
}

async function updateDocument<T extends {id: string}>(collectionName: string, id: string, data: Partial<Omit<T, 'id'>>): Promise<T> {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data);
    const updatedDoc = await getDoc(docRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as T;
}

async function deleteDocument(collectionName: string, id: string): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
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
    const protocols = await getProtocols();
    const protocolToDelete = protocols.find(p => p.equipmentId === equipmentId);
    if (protocolToDelete) {
        await deleteProtocol(protocolToDelete.id);
        return true;
    }
    return false;
}

// CEDULAS
export const getCedulas = (): Promise<Cedula[]> => getCollection<Cedula>(collections.cedulas);
export const getCedula = (id: string): Promise<Cedula> => getDocumentById<Cedula>(collections.cedulas, id);
export const createCedula = (data: Omit<Cedula, 'id'>): Promise<Cedula> => createDocument<Cedula>(collections.cedulas, data);
export const updateCedula = (id: string, data: Partial<Cedula>): Promise<Cedula> => updateDocument<Cedula>(collections.cedulas, id, data);
export const deleteCedula = (id: string): Promise<boolean> => deleteDocument(collections.cedulas, id);
