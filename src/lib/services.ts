

import { getFirestore, collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, writeBatch, query, where, onSnapshot, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
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
const uploadFile = async (fileDataUrl: string, path: string, onProgress?: (progress: number) => void): Promise<string> => {
    if (!fileDataUrl.startsWith('data:')) {
        return fileDataUrl; // It's already a URL
    }

    try {
        const response = await fetch(fileDataUrl);
        const blob = await response.blob();
        
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, blob);

        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (onProgress) {
                        onProgress(progress);
                    }
                },
                (error) => {
                    console.error("Upload failed:", error);
                    reject(error);
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then(resolve);
                }
            );
        });
    } catch (error) {
        console.error("Error creating blob for upload", error);
        throw error;
    }
};

const processImagesInObject = async (data: any, basePath: string, onProgress?: (progress: number) => void): Promise<any> => {
    const dataWithUrls = { ...data };
    const imageFields: {key: string, url: string}[] = [];
    
    // Check top-level properties
    if (data.imageUrl && data.imageUrl.startsWith('data:')) imageFields.push({key: 'imageUrl', url: data.imageUrl});
    if (data.officePhotoUrl && data.officePhotoUrl.startsWith('data:')) imageFields.push({key: 'officePhotoUrl', url: data.officePhotoUrl});
    if (data.photoUrl && data.photoUrl.startsWith('data:')) imageFields.push({key: 'photoUrl', url: data.photoUrl});
    if (data.signatureUrl && data.signatureUrl.startsWith('data:')) imageFields.push({key: 'signatureUrl', url: data.signatureUrl});

    // Check nested structures like almacenes and protocolSteps
    if (Array.isArray(data.almacenes)) {
        data.almacenes.forEach((almacen: any, index: number) => {
            if(almacen.photoUrl && almacen.photoUrl.startsWith('data:')) {
                imageFields.push({key: `almacenes.${index}.photoUrl`, url: almacen.photoUrl});
            }
        });
    }
    if (Array.isArray(data.protocolSteps)) {
        data.protocolSteps.forEach((step: any, index: number) => {
            if(step.imageUrl && step.imageUrl.startsWith('data:')) {
                imageFields.push({key: `protocolSteps.${index}.imageUrl`, url: step.imageUrl});
            }
        });
    }

    if (imageFields.length === 0) return data;

    let completedUploads = 0;
    const totalUploads = imageFields.length;
    
    const reportOverallProgress = () => {
        if (onProgress) {
            const overallProgress = (completedUploads / totalUploads) * 100;
            onProgress(overallProgress);
        }
    }

    const uploadPromises = imageFields.map(async ({key, url}) => {
        const path = `${basePath}/${key.replace(/\./g, '/')}-${Date.now()}`;
        const downloadURL = await uploadFile(url, path);
        
        // This function updates a nested property based on a string path.
        const setNestedProperty = (obj: any, path: string, value: any) => {
            const keys = path.split('.');
            let current = obj;
            for(let i=0; i<keys.length-1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length-1]] = value;
        }

        setNestedProperty(dataWithUrls, key, downloadURL);
        completedUploads++;
        reportOverallProgress();
    });

    await Promise.all(uploadPromises);

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

async function createDocument<T extends { id: string }>(collectionName: string, data: Omit<T, 'id'>, onProgress?: (progress: number) => void): Promise<T> {
    const processedData = await processImagesInObject(data, collectionName, onProgress);
    const collectionRef = collection(db, collectionName);
    const newDocData = { ...processedData };
    const docRef = await addDoc(collectionRef, newDocData);
    return { ...newDocData, id: docRef.id } as T;
}


async function updateDocument<T>(collectionName: string, id: string, data: Partial<T>, onProgress?: (progress: number) => void): Promise<T> {
    const processedData = await processImagesInObject(data, `${collectionName}/${id}`, onProgress);
    const docRef = doc(db, collectionName, id);
    const updateData = { ...processedData };
    await updateDoc(docRef, updateData);
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

export const createUser = async (data: Omit<User, 'id'>, onProgress?: (progress: number) => void): Promise<void> => {
    await createDocument<User>(collections.users, data, onProgress);
};

export const updateUser = async (id: string, data: Partial<User>, onProgress?: (progress: number) => void): Promise<void> => {
    await updateDocument<User>(collections.users, id, data, onProgress);
};
export const deleteUser = (id: string): Promise<boolean> => deleteDocument(collections.users, id);

// CLIENTS
export const subscribeToClients = (setClients: (clients: Client[]) => void) => subscribeToCollection<Client>(collections.clients, setClients);

export const createClient = async (data: Omit<Client, 'id'>, onProgress?: (progress: number) => void): Promise<Client> => {
    return await createDocument<Client>(collections.clients, data, onProgress);
};
export const updateClient = async (id: string, data: Partial<Client>, onProgress?: (progress: number) => void): Promise<void> => {
    await updateDocument<Client>(collections.clients, id, data, onProgress);
};
export const deleteClient = (id: string): Promise<boolean> => deleteDocument(collections.clients, id);

// EQUIPMENTS
export const subscribeToEquipments = (setEquipments: (equipments: Equipment[]) => void) => subscribeToCollection<Equipment>(collections.equipments, setEquipments);
export const createEquipment = async (data: Omit<Equipment, 'id'>, onProgress?: (progress: number) => void): Promise<void> => {
    await createDocument<Equipment>(collections.equipments, data, onProgress);
};
export const updateEquipment = async (id: string, data: Partial<Equipment>, onProgress?: (progress: number) => void): Promise<void> => {
    await updateDocument<Equipment>(collections.equipments, id, data, onProgress);
};
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
export const createCedula = async (data: Omit<Cedula, 'id'>, onProgress?: (progress: number) => void): Promise<void> => {
    await createDocument<Cedula>(collections.cedulas, data, onProgress);
};
export const updateCedula = async (id: string, data: Partial<Cedula>, onProgress?: (progress: number) => void): Promise<void> => {
    await updateDocument<Cedula>(collections.cedulas, id, data, onProgress);
};
export const deleteCedula = (id: string): Promise<boolean> => deleteDocument(collections.cedulas, id);
