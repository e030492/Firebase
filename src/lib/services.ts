

import { getFirestore, collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, writeBatch, query, where, onSnapshot, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import { db, storage } from './firebase';
import { 
    mockUsers, mockClients, mockSystems, mockEquipments, mockProtocols, mockCedulas,
} from './mock-data';

// Interfaces based on mock-data structure
export type Plano = { url: string; name: string; size: number };
export type Almacen = { nombre: string; direccion: string; };
export type Client = Omit<typeof mockClients[0], 'almacenes'> & { id: string; almacenes: Almacen[]};
export type Equipment = Omit<typeof mockEquipments[0], 'id'> & { id: string; imageUrl?: string | null; protocolId?: string | null };
export type System = typeof mockSystems[0] & { id: string };
export type User = typeof mockUsers[0] & { id: string; clientId?: string, photoUrl?: string | null, signatureUrl?: string | null };
export type ProtocolStep = typeof mockProtocols[0]['steps'][0] & { imageUrl?: string | null; notes?: string };
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
export type MediaFile = {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
};

const collections = {
    users: 'users',
    clients: 'clients',
    systems: 'systems',
    equipments: 'equipments',
    protocols: 'protocols',
    cedulas: 'cedulas',
    settings: 'settings',
    mediaLibrary: 'mediaLibrary',
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
    const unsubscribe = onSnapshot(collectionRef, async (snapshot) => {
        const dataPromises = snapshot.docs.map(async (doc) => {
            const docData = { id: doc.id, ...doc.data() } as T & { protocolSteps?: any[] };
            
            // Re-hydrate image URLs for cedulas from separate fields
            if (collectionName === collections.cedulas && docData.protocolSteps) {
                 const stepImagePromises = docData.protocolSteps.map(async (step, index) => {
                    const stepImageRef = doc(db, `${collectionName}/${doc.id}/stepImages`, `${index}`);
                    const stepImageSnap = await getDoc(stepImageRef);
                    const imageUrl = stepImageSnap.exists() ? stepImageSnap.data().imageUrl : '';
                    return { ...step, imageUrl };
                });
                docData.protocolSteps = await Promise.all(stepImagePromises);
            }
            return docData as T;
        });
        const data = await Promise.all(dataPromises);
        setData(data);
    }, (error) => {
        console.error(`Error listening to ${collectionName}:`, error);
        setData([]);
    });
    return unsubscribe;
}

async function createDocument<T extends { id: string }>(collectionName: string, data: Omit<T, 'id'>, id?: string): Promise<T> {
    const docId = id || uuidv4();
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data);
    return { id: docId, ...data } as T;
}


async function updateDocument<T>(collectionName: string, id: string, data: Partial<T>): Promise<T> {
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

export const updateCompanySettings = (data: Partial<CompanySettings>) => updateDocument<CompanySettings>(collections.settings, 'companyProfile', data);


// USERS
export const subscribeToUsers = (setUsers: (users: User[]) => void) => subscribeToCollection<User>(collections.users, setUsers);
export const createUser = (data: Omit<User, 'id'>) => createDocument<User>(collections.users, data);
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
export const updateEquipment = async (id: string, data: Partial<Equipment>) => {
    return updateDocument<Equipment>(collections.equipments, id, data);
};
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

export const createProtocol = async (data: Omit<Protocol, 'id'>, id?: string): Promise<Protocol> => {
    return createDocument<Protocol>(collections.protocols, data, id);
};


export const updateProtocol = async (id: string, data: Partial<Protocol>): Promise<Protocol> => {
    return updateDocument<Protocol>(collections.protocols, id, data);
};

export const deleteProtocol = (id: string): Promise<boolean> => deleteDocument(collections.protocols, id);


// CEDULAS
export const subscribeToCedulas = (setCedulas: (cedulas: Cedula[]) => void) => subscribeToCollection<Cedula>(collections.cedulas, setCedulas);

export const createCedula = async (data: Omit<Cedula, 'id'>) => {
    const cedulaRef = doc(collection(db, collections.cedulas));
    await setDoc(cedulaRef, data);
    return { id: cedulaRef.id, ...data } as Cedula;
};

export const updateCedula = async (id: string, data: Partial<Cedula>, onStep?: (log: string) => void) => {
    onStep?.('Iniciando actualización de cédula...');
    const dataToSave: { [key: string]: any } = { ...data };

    if (dataToSave.protocolSteps) {
        onStep?.(`Procesando ${dataToSave.protocolSteps.length} pasos del protocolo...`);
        
        dataToSave.protocolSteps.forEach((step: ProtocolStep, index: number) => {
            if (step.imageUrl && step.imageUrl.startsWith('data:image')) {
                onStep?.(`Paso ${index + 1}: Imagen detectada. Guardando en campo separado.`);
                dataToSave[`stepImage_${index}`] = step.imageUrl;
            }
            // Ensure imageUrl is not saved inside the array
            delete step.imageUrl;
        });

        onStep?.('Protocolo procesado.');
    } else {
        onStep?.('No hay protocolo para procesar.');
    }

    const cedulaRef = doc(db, collections.cedulas, id);
    onStep?.('Enviando datos a Firestore...');
    await updateDoc(cedulaRef, dataToSave);
    onStep?.('¡Actualización completada con éxito!');
};


export const deleteCedula = (id: string): Promise<boolean> => deleteDocument(collections.cedulas, id);


// --- MEDIA LIBRARY (FOR TESTS) ---
export const subscribeToMediaLibrary = (setFiles: (files: MediaFile[]) => void) => {
    const q = query(collection(db, collections.mediaLibrary));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const files = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaFile));
        setFiles(files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });
    return unsubscribe;
};

export async function uploadFile(files: File[], onProgress: (percentage: number) => void) {
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    let totalUploaded = 0;

    const uploadPromises = files.map(file => {
        const fileId = uuidv4();
        const storageRef = ref(storage, `${collections.mediaLibrary}/${fileId}-${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise<void>((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    // This reports progress for a single file, we need to aggregate it.
                     const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                     // This is a rough approximation for multiple files
                     onProgress(progress);
                },
                (error) => {
                    console.error("Upload failed for file:", file.name, error);
                    reject(error);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    const fileData: Omit<MediaFile, 'id'> = {
                        name: file.name,
                        url: downloadURL,
                        type: file.type,
                        size: file.size,
                        createdAt: new Date().toISOString(),
                    };
                    const docRef = doc(db, collections.mediaLibrary, fileId);
                    await setDoc(docRef, fileData);

                    // Update total progress
                    totalUploaded += file.size;
                    const overallProgress = (totalUploaded / totalSize) * 100;
                    onProgress(overallProgress);
                    resolve();
                }
            );
        });
    });

    await Promise.all(uploadPromises);
}


export async function deleteMediaFile(file: MediaFile): Promise<void> {
    const storageRef = ref(storage, file.url);
    try {
        await deleteObject(storageRef);
    } catch (error: any) {
        // If the file doesn't exist in storage, we can ignore the error and proceed to delete from Firestore.
        if (error.code !== 'storage/object-not-found') {
            console.error("Error deleting file from storage:", error);
            throw error;
        }
    }
    
    const docRef = doc(db, collections.mediaLibrary, file.id);
    await deleteDoc(docRef);
}
