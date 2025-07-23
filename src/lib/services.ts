
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, writeBatch, query, where } from 'firebase/firestore';
import { 
    mockUsers, 
    mockClients, 
    mockSystems, 
    mockEquipments, 
    mockProtocols, 
    mockCedulas 
} from './mock-data';

// Interfaces based on mock-data structure
export type Almacen = { nombre: string; direccion: string };
export type Client = typeof mockClients[0] & { id: string };
export type Equipment = typeof mockEquipments[0] & { id: string };
export type System = typeof mockSystems[0] & { id: string };
export type User = typeof mockUsers[0] & { id: string };
export type ProtocolStep = { step: string; priority: 'baja' | 'media' | 'alta'; completion: number; imageUrl?: string, notes?: string, percentage?: number };
export type Protocol = { id: string, equipmentId: string; steps: ProtocolStep[] };
export type Cedula = typeof mockCedulas[0] & { id: string };


// --- Caching Singleton ---
// This simple cache will hold our data in memory after the first fetch
// to avoid repeated database calls during the user's session.
class DataCache {
    private static instance: DataCache;
    clients: Client[] | null = null;
    equipments: Equipment[] | null = null;
    systems: System[] | null = null;
    users: User[] | null = null;
    protocols: Protocol[] | null = null;
    cedulas: Cedula[] | null = null;

    private constructor() {}

    public static getInstance(): DataCache {
        if (!DataCache.instance) {
            DataCache.instance = new DataCache();
        }
        return DataCache.instance;
    }

    public invalidate(collectionName: keyof DataCache) {
        this[collectionName] = null;
    }
}

const cache = DataCache.getInstance();
// --- End Caching Singleton ---


// Generic function to fetch all documents from a collection, with caching
async function getCollection<T extends {id: string}>(collectionName: keyof DataCache): Promise<T[]> {
  if (cache[collectionName]) {
    return cache[collectionName] as T[];
  }
  const querySnapshot = await getDocs(collection(db, collectionName as string));
  const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  (cache as any)[collectionName] = data;
  return data;
}

// Generic function to fetch a single document from a collection
async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as T) : null;
}

// Service functions for each collection
export async function getClients(): Promise<Client[]> { return getCollection<Client>('clients'); }
export const getClient = (id: string) => getDocument<Client>('clients', id);
export async function createClient(data: Omit<Client, 'id'>) {
    const res = await addDoc(collection(db, 'clients'), data);
    cache.invalidate('clients');
    return res;
}
export async function updateClient(id: string, data: Partial<Client>) {
    const res = await updateDoc(doc(db, 'clients', id), data);
    cache.invalidate('clients');
    return res;
}
export async function deleteClient(id: string) {
    const res = await deleteDoc(doc(db, 'clients', id));
    cache.invalidate('clients');
    return res;
}

export async function getEquipments(): Promise<Equipment[]> { return getCollection<Equipment>('equipments'); }
export const getEquipment = (id: string) => getDocument<Equipment>('equipments', id);
export async function createEquipment(data: Omit<Equipment, 'id'>) {
    const res = await addDoc(collection(db, 'equipments'), data);
    cache.invalidate('equipments');
    return res;
}
export async function updateEquipment(id: string, data: Partial<Equipment>) {
    const res = await updateDoc(doc(db, 'equipments', id), data);
    cache.invalidate('equipments');
    return res;
}
export async function deleteEquipment(id: string) {
    const res = await deleteDoc(doc(db, 'equipments', id));
    cache.invalidate('equipments');
    return res;
}

export async function getSystems(): Promise<System[]> { return getCollection<System>('systems'); }
export const getSystem = (id: string) => getDocument<System>('systems', id);
export async function createSystem(data: Omit<System, 'id'>) {
    const res = await addDoc(collection(db, 'systems'), data);
    cache.invalidate('systems');
    return res;
}
export async function updateSystem(id: string, data: Partial<System>) {
    const res = await updateDoc(doc(db, 'systems', id), data);
    cache.invalidate('systems');
    return res;
}
export async function deleteSystem(id: string) {
    const res = await deleteDoc(doc(db, 'systems', id));
    cache.invalidate('systems');
    return res;
}

export async function getUsers(): Promise<User[]> { return getCollection<User>('users'); }
export const getUser = (id: string) => getDocument<User>('users', id);
export async function createUser(data: Omit<User, 'id'>) {
    const res = await addDoc(collection(db, 'users'), data);
    cache.invalidate('users');
    return res;
}
export async function updateUser(id: string, data: Partial<User>) {
    const res = await updateDoc(doc(db, 'users', id), data);
    cache.invalidate('users');
    return res;
}
export async function deleteUser(id: string) {
    const res = await deleteDoc(doc(db, 'users', id));
    cache.invalidate('users');
    return res;
}


export async function getProtocols(): Promise<Protocol[]> { return getCollection<Protocol>('protocols'); }
export const getProtocol = (id: string) => getDocument<Protocol>('protocols', id);
export async function createProtocol(data: Omit<Protocol, 'id'>) {
    const res = await addDoc(collection(db, 'protocols'), data);
    cache.invalidate('protocols');
    return res;
}
export async function updateProtocol(id: string, data: Partial<Protocol>) {
    const res = await updateDoc(doc(db, 'protocols', id), data);
    cache.invalidate('protocols');
    return res;
}
export async function deleteProtocol(id: string) {
    const res = await deleteDoc(doc(db, 'protocols', id));
    cache.invalidate('protocols');
    return res;
}
export const deleteProtocolByEquipmentId = async (equipmentId: string) => {
    const protocolsQuery = query(collection(db, "protocols"), where("equipmentId", "==", equipmentId));
    const querySnapshot = await getDocs(protocolsQuery);
    if (!querySnapshot.empty) {
        const protocolToDelete = querySnapshot.docs[0];
        await deleteDoc(doc(db, 'protocols', protocolToDelete.id));
        cache.invalidate('protocols');
    }
};

export async function getCedulas(): Promise<Cedula[]> { return getCollection<Cedula>('cedulas'); }
export const getCedula = (id: string) => getDocument<Cedula>('cedulas', id);
export async function createCedula(data: Omit<Cedula, 'id'>) {
    const res = await addDoc(collection(db, 'cedulas'), data);
    cache.invalidate('cedulas');
    return res;
}
export async function updateCedula(id: string, data: Partial<Cedula>) {
    const res = await updateDoc(doc(db, 'cedulas', id), data);
    cache.invalidate('cedulas');
    return res;
}
export async function deleteCedula(id: string) {
    const res = await deleteDoc(doc(db, 'cedulas', id));
    cache.invalidate('cedulas');
    return res;
}


// Database Seeding Function
export async function checkAndSeedDatabase() {
    const collections = {
        users: mockUsers,
        clients: mockClients,
        systems: mockSystems,
        equipments: mockEquipments,
        protocols: mockProtocols,
        cedulas: mockCedulas
    };

    // We only need to check one collection. If users exist, we assume DB is seeded.
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    if (!userSnapshot.empty) {
        return; // Database is already seeded
    }

    console.log("Database is empty. Seeding with initial data...");
    
    for (const [collectionName, mockData] of Object.entries(collections)) {
        console.log(`Seeding ${collectionName}...`);
        const batch = writeBatch(db);
        mockData.forEach(item => {
            const { id, ...data } = item; // Exclude mock ID from mock data
            // Let Firestore generate the ID by creating a new doc reference
            const docRef = doc(collection(db, collectionName));
            batch.set(docRef, data);
        });
        await batch.commit();
        console.log(`${collectionName} seeded successfully.`);
    }

    // Invalidate all caches after seeding
    Object.keys(collections).forEach(key => cache.invalidate(key as keyof DataCache));
}
