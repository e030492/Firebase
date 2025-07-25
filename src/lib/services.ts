

import { getFirestore, collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, writeBatch, query, where, onSnapshot, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from './firebase';
import { 
    mockUsers, mockClients, mockSystems, mockEquipments, mockProtocols, mockCedulas,
} from './mock-data';

// Interfaces based on mock-data structure
export type Plano = { url: string; name: string; size: number };
export type Almacen = { nombre: string; direccion: string; planos?: Plano[], photoUrl?: string };
export type Client = Omit<typeof mockClients[0], 'almacenes'> & { id: string; almacenes: Almacen[], officePhotoUrl?: string | null, phone1?: string, phone2?: string };
export type Equipment = typeof mockEquipments[0] & { id: string, imageUrl?: string | null };
export type System = typeof mockSystems[0] & { id: string };
export type User = typeof mockUsers[0] & { id: string; clientId?: string, photoUrl?: string | null, signatureUrl?: string | null };
export type ProtocolStep = typeof mockProtocols[0]['steps'][0] & { imageUrl?: string | null };
export type Protocol = { id: string, equipmentId: string; steps: ProtocolStep[] };
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

// --- Helper Functions ---
async function uploadFile(fileDataUrl: string, path: string): Promise<string> {
    if (!fileDataUrl || !fileDataUrl.startsWith('data:')) {
        return fileDataUrl; // It's already a URL or empty
    }

    try {
        const response = await fetch(fileDataUrl);
        const blob = await response.blob();
        
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;

    } catch (error) {
        console.error("Upload failed:", error);
        throw error;
    }
};

const processImagesInObject = async (data: any, basePath: string): Promise<any> => {
    const dataWithUrls = { ...data };
    
    if (data.imageUrl && data.imageUrl.startsWith('data:')) {
        const path = `${basePath}/image-${Date.now()}`;
        dataWithUrls.imageUrl = await uploadFile(data.imageUrl, path);
    }
    if (data.officePhotoUrl && data.officePhotoUrl.startsWith('data:')) {
        const path = `${basePath}/officePhoto-${Date.now()}`;
        dataWithUrls.officePhotoUrl = await uploadFile(data.officePhotoUrl, path);
    }
    if (data.photoUrl && data.photoUrl.startsWith('data:')) {
        const path = `${basePath}/photo-${Date.now()}`;
        dataWithUrls.photoUrl = await uploadFile(data.photoUrl, path);
    }
    if (data.signatureUrl && data.signatureUrl.startsWith('data:')) {
        const path = `${basePath}/signature-${Date.now()}`;
        dataWithUrls.signatureUrl = await uploadFile(data.signatureUrl, path);
    }

    if (Array.isArray(data.almacenes)) {
        dataWithUrls.almacenes = await Promise.all(data.almacenes.map(async (almacen: any, index: number) => {
            let processedAlmacen = {...almacen};
            if(almacen.photoUrl && almacen.photoUrl.startsWith('data:')) {
                const path = `${basePath}/almacen-${index}-photo-${Date.now()}`;
                processedAlmacen.photoUrl = await uploadFile(almacen.photoUrl, path);
            }
            if (Array.isArray(almacen.planos)) {
                processedAlmacen.planos = await Promise.all(almacen.planos.map(async (plano: any, planoIndex: number) => {
                    if (plano.url && plano.url.startsWith('data:')) {
                        const path = `${basePath}/almacen-${index}-plano-${planoIndex}-${Date.now()}`;
                        return { ...plano, url: await uploadFile(plano.url, path) };
                    }
                    return plano;
                }));
            }
            return processedAlmacen;
        }));
    }
    
    if (Array.isArray(data.protocolSteps)) {
        dataWithUrls.protocolSteps = await Promise.all(data.protocolSteps.map(async (step: any, index: number) => {
            if(step.imageUrl && step.imageUrl.startsWith('data:')) {
                const path = `${basePath}/protocolStep-${index}-image-${Date.now()}`;
                return { ...step, imageUrl: await uploadFile(step.imageUrl, path) };
            }
            return step;
        }));
    }

    return dataWithUrls;
};


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

async function createDocument<T extends { id: string }>(collectionName: string, data: Omit<T, 'id'>): Promise<T> {
    const docRef = doc(collection(db, collectionName));
    const processedData = await processImagesInObject(data, `${collectionName}/${docRef.id}`);
    await setDoc(docRef, processedData);
    return { ...processedData, id: docRef.id } as T;
}

async function updateDocument<T>(collectionName: string, id: string, data: Partial<T>): Promise<T> {
    const processedData = await processImagesInObject(data, `${collectionName}/${id}`);
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, processedData);
    const updatedDoc = await getDoc(docRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as T;
}

async function deleteDocument(collectionName: string, id: string): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return true;
}


// --- Specific Service Functions ---

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
    const processedData = await processImagesInObject(data, 'settings');
    const docRef = doc(db, collections.settings, 'companyProfile');
    await setDoc(docRef, processedData, { merge: true });
};


// USERS
export const subscribeToUsers = (setUsers: (users: User[]) => void) => subscribeToCollection<User>(collections.users, setUsers);
export const createUser = (data: Omit<User, 'id'>) => createDocument<User>(collections.users, data);
export const updateUser = (id: string, data: Partial<User>) => updateDocument<User>(collections.users, id, data);
export const deleteUser = (id: string): Promise<boolean> => deleteDocument(collections.users, id);

// CLIENTS
export const subscribeToClients = (setClients: (clients: Client[]) => void) => subscribeToCollection<Client>(collections.clients, setClients);
export const createClient = (data: Omit<Client, 'id'>): Promise<Client> => createDocument<Client>(collections.clients, data);
export const updateClient = (id: string, data: Partial<Client>) => updateDocument<Client>(collections.clients, id, data);
export const deleteClient = (id: string): Promise<boolean> => deleteDocument(collections.clients, id);

// EQUIPMENTS
export const subscribeToEquipments = (setEquipments: (equipments: Equipment[]) => void) => subscribeToCollection<Equipment>(collections.equipments, setEquipments);
export const createEquipment = (data: Omit<Equipment, 'id'>) => createDocument<Equipment>(collections.equipments, data);
export const updateEquipment = (id: string, data: Partial<Equipment>) => updateDocument<Equipment>(collections.equipments, id, data);
export const deleteEquipment = (id: string): Promise<boolean> => deleteDocument(collections.equipments, id);

// SYSTEMS
export const subscribeToSystems = (setSystems: (systems: System[]) => void) => subscribeToCollection<System>(collections.systems, setSystems);
export const createSystem = (data: Omit<System, 'id'>): Promise<System> => createDocument<System>(collections.systems, data);
export const updateSystem = (id: string, data: Partial<System>): Promise<System> => updateDocument<System>(collections.systems, id, data);
export const deleteSystem = (id: string): Promise<boolean> => deleteDocument(collections.systems, id);

// PROTOCOLS
export const subscribeToProtocols = (setProtocols: (protocols: Protocol[]) => void) => subscribeToCollection<Protocol>(collections.protocols, setProtocols);
export const createProtocol = (data: Omit<Protocol, 'id'>): Promise<Protocol> => createDocument<Protocol>(collections.protocols, data);
export const updateProtocol = (id: string, data: Partial<Protocol>): Promise<Protocol> => updateDocument<Protocol>(collections.protocols, id, data);
export const deleteProtocol = (id: string): Promise<boolean> => deleteDocument(collections.protocols, id);

export async function deleteProtocolByEquipmentId(equipmentId: string): Promise<boolean> {
    const protocolsRef = collection(db, collections.protocols);
    const q = query(protocolsRef, where("equipmentId", "==", equipmentId));
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
export const subscribeToCedulas = (setCedulas: (cedulas: Cedula[]) => void) => subscribeToCollection<Cedula>(collections.cedulas, setCedulas);
export const createCedula = (data: Omit<Cedula, 'id'>) => createDocument<Cedula>(collections.cedulas, data);
export const updateCedula = (id: string, data: Partial<Cedula>) => updateDocument<Cedula>(collections.cedulas, id, data);
export const deleteCedula = (id: string): Promise<boolean> => deleteDocument(collections.cedulas, id);
