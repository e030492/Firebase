

import { getFirestore, collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, writeBatch, query, where, onSnapshot, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import { db, storage } from './firebase';
import { 
    mockUsers, mockClients, mockSystems, mockEquipments, mockProtocols, mockCedulas,
} from './mock-data';

// Interfaces based on mock-data structure
export type Plano = { url: string; name: string; size: number };
export type Almacen = { nombre: string; direccion: string; };
export type Client = Omit<typeof mockClients[0], 'almacenes'> & { id: string; almacenes: Almacen[]};
export type Equipment = typeof mockEquipments[0] & { id: string, imageUrl?: string | null };
export type System = typeof mockSystems[0] & { id: string };
export type User = typeof mockUsers[0] & { id: string; clientId?: string, photoUrl?: string | null, signatureUrl?: string | null };
export type ProtocolStep = typeof mockProtocols[0]['steps'][0] & { imageUrl?: string | null };
export type Protocol = { 
    id: string; 
    steps: ProtocolStep[];
    // Base Protocol fields
    type: string;
    brand: string;
    model: string;
};
export type Cedula = typeof mockCedulas[0] & { id: string };
export type CompanySettings = { id: string; logoUrl: string | null };


const collections = {
    users: 'users',
    clients: 'clients',
    systems: 'systems',
    equipments: 'equipments',
    protocols: 'protocols',
    cedulas: 'cedulas',
    settings: 'settings',
    _connectionTest: '_connectionTest',
};

const mockDataMap: { [key: string]: any[] } = {
    [collections.users]: mockUsers,
    [collections.clients]: mockClients,
    [collections.systems]: mockSystems,
    [collections.equipments]: mockEquipments,
    [collections.protocols]: mockProtocols,
    [collections.cedulas]: mockCedulas,
};


// --- Firebase Connection Test ---
export const connectionTest = async () => {
    try {
        const testDocRef = doc(db, collections._connectionTest, 'test');
        await getDoc(testDocRef);
        return true;
    } catch (error: any) {
        throw new Error(`Firestore connection test failed. This often means your security rules are too restrictive. Please ensure they allow read/write access. Original error: ${error.message}`);
    }
}

// --- Firebase Seeding ---
export const seedDatabase = async () => {
    try {
        const usersCollectionRef = collection(db, collections.users);
        const usersSnapshot = await getDocs(usersCollectionRef);

        if (usersSnapshot.empty) {
            const batch = writeBatch(db);
            
            for (const [collectionName, data] of Object.entries(mockDataMap)) {
                const collectionRef = collection(db, collectionName);
                data.forEach(item => {
                    const { id, ...rest } = item;
                    // For mock data that has a specific ID we want to preserve, use it
                    const docRef = id ? doc(collectionRef, id) : doc(collectionRef);
                    batch.set(docRef, rest);
                });
            }
             // Seed initial company settings
            const settingsDocRef = doc(db, collections.settings, 'companyProfile');
            batch.set(settingsDocRef, { logoUrl: '' });

            await batch.commit();
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error("Error seeding database:", error);
        throw error;
    }
};

// --- Generic Firestore Service Functions ---
function subscribeToCollection<T>(collectionName: string, setData: (data: T[]) => void) {
    const collectionRef = collection(db, collectionName);
    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        setData(data);
    }, (error) => {
        console.error(`Error listening to ${collectionName}:`, error);
        setData([]);
    });
    return unsubscribe;
}

async function createDocument<T extends { id: string }>(collectionName: string, data: Omit<T, 'id'>, id?: string): Promise<T> {
    const docRef = id ? doc(db, collectionName, id) : doc(collection(db, collectionName));
    const finalData = JSON.parse(JSON.stringify(data));
    await setDoc(docRef, finalData);
    return { id: docRef.id, ...data } as T;
}


async function updateDocument<T>(collectionName: string, id: string, data: Partial<T>): Promise<T> {
    const docRef = doc(db, collectionName, id);
    const sanitizedData = JSON.parse(JSON.stringify(data));
    await updateDoc(docRef, sanitizedData);
    const updatedDoc = await getDoc(docRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as T;
}

async function deleteDocument(collectionName: string, id: string): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return true;
}

// --- Image Upload Service ---
export async function uploadImageAndGetURL(base64DataUrl: string): Promise<string> {
    // This function is being kept as a placeholder but will not be used
    // until the freezing issue is resolved.
    console.warn("Image upload to Firebase Storage is currently disabled.");
    return base64DataUrl; // Return the base64 string directly
}


// --- Specific Service Functions ---

// LOGIN
export async function loginUser(email: string, pass: string): Promise<User | null> {
    try {
        const usersRef = collection(db, collections.users);
        const q = query(usersRef, where("email", "==", email.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null; // No user with that email
        }

        const userDoc = querySnapshot.docs[0];
        const userData = { id: userDoc.id, ...userDoc.data() } as User;

        if (userData.password === pass) {
            return userData;
        }

        return null; // Incorrect password
    } catch (error) {
        console.error("Error during login query:", error);
        throw new Error("Failed to query user database for login.");
    }
}

// SETTINGS
export const subscribeToCompanySettings = (setSettings: (settings: CompanySettings | null) => void) => {
    const docRef = doc(db, collections.settings, 'companyProfile');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            setSettings({ id: docSnap.id, ...docSnap.data() } as CompanySettings);
        } else {
            setSettings(null);
        }
    }, (error) => {
        console.error("Error listening to company settings:", error);
        setSettings(null);
    });
    return unsubscribe;
};

export const updateCompanySettings = async (data: Partial<CompanySettings>) => {
    const docRef = doc(db, collections.settings, 'companyProfile');
    await setDoc(docRef, data, { merge: true });
};


// USERS
export const subscribeToUsers = (setUsers: (users: User[]) => void) => subscribeToCollection<User>(collections.users, setUsers);
export const createUser = async (data: Omit<User, 'id'>) => {
    return createDocument<User>(collections.users, data);
}
export const updateUser = (id: string, data: Partial<User>) => updateDocument<User>(collections.users, id, data);
export const deleteUser = (id: string): Promise<boolean> => deleteDocument(collections.users, id);

// CLIENTS
export const subscribeToClients = (setClients: (clients: Client[]) => void) => subscribeToCollection<Client>(collections.clients, setClients);
export const createClient = async (data: Omit<Client, 'id'>): Promise<Client> => {
     return createDocument<Client>(collections.clients, data);
};
export const updateClient = (id: string, data: Partial<Client>) => updateDocument<Client>(collections.clients, id, data);
export const deleteClient = (id: string): Promise<boolean> => deleteDocument(collections.clients, id);

// EQUIPMENTS
export const subscribeToEquipments = (setEquipments: (equipments: Equipment[]) => void) => subscribeToCollection<Equipment>(collections.equipments, setEquipments);
export const createEquipment = async (data: Omit<Equipment, 'id'>) => {
    return createDocument<Equipment>(collections.equipments, data);
};
export const updateEquipment = (id: string, data: Partial<Equipment>) => updateDocument<Equipment>(collections.equipments, id, data);
export const deleteEquipment = (id: string): Promise<boolean> => deleteDocument(collections.equipments, id);

// SYSTEMS
export const subscribeToSystems = (setSystems: (systems: System[]) => void) => subscribeToCollection<System>(collections.systems, setSystems);
export const createSystem = async (data: Omit<System, 'id'>): Promise<System> => {
    return createDocument<System>(collections.systems, data);
}
export const updateSystem = (id: string, data: Partial<System>): Promise<System> => updateDocument<System>(collections.systems, id, data);
export const deleteSystem = (id: string): Promise<boolean> => deleteDocument(collections.systems, id);

// PROTOCOLS
export const subscribeToProtocols = (setProtocols: (protocols: Protocol[]) => void) => subscribeToCollection<Protocol>(collections.protocols, setProtocols);

const sanitizeStepsForFirestore = (steps: ProtocolStep[]): any[] => {
    return steps.map(step => ({
        step: step.step || '',
        priority: step.priority || 'baja',
        percentage: typeof step.percentage === 'number' ? step.percentage : 0,
        completion: typeof step.completion === 'number' ? step.completion : 0,
        notes: step.notes || '',
        imageUrl: step.imageUrl || '',
    }));
};


export const createProtocol = (data: Omit<Protocol, 'id'>, id: string): Promise<Protocol> => {
    const sanitizedData = {
        ...data,
        steps: sanitizeStepsForFirestore(data.steps)
    };
    return createDocument<Protocol>(collections.protocols, sanitizedData, id);
};

export const updateProtocol = (id: string, data: Partial<Protocol>): Promise<Protocol> => {
    const sanitizedData: Partial<Protocol> = { ...data };
    if (data.steps) {
        sanitizedData.steps = sanitizeStepsForFirestore(data.steps);
    }
    return updateDocument<Protocol>(collections.protocols, id, sanitizedData);
};

export const deleteProtocol = (id: string): Promise<boolean> => deleteDocument(collections.protocols, id);


// CEDULAS
export const subscribeToCedulas = (setCedulas: (cedulas: Cedula[]) => void) => subscribeToCollection<Cedula>(collections.cedulas, setCedulas);
export const createCedula = async (data: Omit<Cedula, 'id'>) => {
    return createDocument<Cedula>(collections.cedulas, data);
}
export const updateCedula = (id: string, data: Partial<Cedula>) => updateDocument<Cedula>(collections.cedulas, id, data);
export const deleteCedula = (id: string): Promise<boolean> => deleteDocument(collections.cedulas, id);
