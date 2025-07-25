
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, writeBatch, query, where, onSnapshot, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject, uploadBytesResumable, type UploadTaskSnapshot } from 'firebase/storage';
import { db, app } from './firebase';
import { 
    mockUsers, mockClients, mockSystems, mockEquipments, mockProtocols, mockCedulas,
} from './mock-data';

// Interfaces based on mock-data structure
export type Plano = { url: string; name: string; size: number };
export type Almacen = { nombre: string; direccion: string; planos?: Plano[], photoUrl?: string };
export type Client = Omit<typeof mockClients[0], 'almacenes'> & { id: string; almacenes: Almacen[], officePhotoUrl?: string, phone1?: string, phone2?: string };
export type Equipment = typeof mockEquipments[0] & { id: string };
export type System = typeof mockSystems[0] & { id: string };
export type User = typeof mockUsers[0] & { id: string; clientId?: string };
export type ProtocolStep = typeof mockProtocols[0]['steps'][0];
export type Protocol = { id: string, equipmentId: string; steps: ProtocolStep[] };
export type Cedula = typeof mockCedulas[0] & { id: string };
export type CompanySettings = { id: string; logoUrl: string };
export type ProgressCallback = (progress: number) => void;


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

const storage = getStorage(app);

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

async function createDocument<T extends { id: string }>(collectionName: string, data: Omit<T, 'id'>): Promise<T> {
    const collectionRef = collection(db, collectionName);
    const newDocData = { ...data };
    const docRef = await addDoc(collectionRef, newDocData);
    return { ...newDocData, id: docRef.id } as T;
}

async function updateDocument<T>(collectionName: string, id: string, data: Partial<T>): Promise<T> {
    const docRef = doc(db, collectionName, id);
    const updateData = { ...data };
    await updateDoc(docRef, updateData);
    const updatedDoc = await getDoc(docRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as T;
}

async function deleteDocument(collectionName: string, id: string): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return true;
}

// --- File Upload Service ---
const uploadFile = (
    folder: string,
    fileDataUrl: string | null,
    onProgress?: ProgressCallback
): Promise<string | null> => {
    return new Promise((resolve, reject) => {
        if (!fileDataUrl || !fileDataUrl.startsWith('data:')) {
            resolve(fileDataUrl); // Not a new file, return existing URL or null
            return;
        }

        const storageRef = ref(storage, `${folder}/${new Date().getTime()}-${Math.random().toString(36).substring(2)}`);
        
        // Convert data URL to Blob
        const fetchResponse = fetch(fileDataUrl);
        fetchResponse
            .then(res => res.blob())
            .then(blob => {
                const uploadTask = uploadBytesResumable(storageRef, blob);

                uploadTask.on('state_changed',
                    (snapshot: UploadTaskSnapshot) => {
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
                        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                            resolve(downloadURL);
                        }).catch(reject);
                    }
                );
            }).catch(reject);
    });
};



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

export const updateCompanySettings = async (data: Partial<CompanySettings>, onProgress?: ProgressCallback) => {
    if (data.logoUrl) {
        data.logoUrl = (await uploadFile('company', data.logoUrl, onProgress)) || '';
    }
    const docRef = doc(db, collections.settings, 'companyProfile');
    await setDoc(docRef, data, { merge: true });
};


// USERS
export const subscribeToUsers = (setUsers: (users: User[]) => void) => subscribeToCollection<User>(collections.users, setUsers);

export const createUser = async (data: Omit<User, 'id'>, onProgress?: ProgressCallback): Promise<void> => {
    const photoUrl = await uploadFile('user_photos', data.photoUrl || null, onProgress);
    const signatureUrl = await uploadFile('user_signatures', data.signatureUrl || null, onProgress);
    
    const newUser = {
        ...data,
        photoUrl,
        signatureUrl,
    };
    await createDocument<User>(collections.users, newUser);
};

export const updateUser = async (id: string, data: Partial<User>, onProgress?: ProgressCallback): Promise<void> => {
    const photoUrl = await uploadFile('user_photos', data.photoUrl || null, onProgress);
    const signatureUrl = await uploadFile('user_signatures', data.signatureUrl || null, onProgress);
    
    const updatedUser: Partial<User> = { ...data, photoUrl, signatureUrl };
    
    if (updatedUser.role !== 'Cliente') {
      delete updatedUser.clientId;
    }

    await updateDocument<User>(collections.users, id, updatedUser);
};
export const deleteUser = (id: string): Promise<boolean> => deleteDocument(collections.users, id);

// CLIENTS
export const subscribeToClients = (setClients: (clients: Client[]) => void) => subscribeToCollection<Client>(collections.clients, setClients);

export const createClient = async (data: Omit<Client, 'id'>, onProgress?: ProgressCallback): Promise<void> => {
    data.officePhotoUrl = await uploadFile('client_offices', data.officePhotoUrl || null, onProgress);
    
    if (data.almacenes) {
        for (const almacen of data.almacenes) {
            almacen.photoUrl = await uploadFile('client_warehouses', almacen.photoUrl || null, onProgress);
            if (almacen.planos) {
                for (const plano of almacen.planos) {
                    plano.url = (await uploadFile('client_planos', plano.url, onProgress)) || '';
                }
            }
        }
    }
    await createDocument<Client>(collections.clients, data);
};
export const updateClient = async (id: string, data: Partial<Client>, onProgress?: ProgressCallback): Promise<void> => {
    if(data.officePhotoUrl) {
        data.officePhotoUrl = await uploadFile('client_offices', data.officePhotoUrl || null, onProgress);
    }
    
    if (data.almacenes) {
        for (const almacen of data.almacenes) {
            if(almacen.photoUrl) {
                almacen.photoUrl = await uploadFile('client_warehouses', almacen.photoUrl || null, onProgress);
            }
            if (almacen.planos) {
                for (const plano of almacen.planos) {
                    if (plano.url.startsWith('data:')) {
                         plano.url = (await uploadFile('client_planos', plano.url, onProgress)) || '';
                    }
                }
            }
        }
    }
    
    await updateDocument<Client>(collections.clients, id, data);
};
export const deleteClient = (id: string): Promise<boolean> => deleteDocument(collections.clients, id);

// EQUIPMENTS
export const subscribeToEquipments = (setEquipments: (equipments: Equipment[]) => void) => subscribeToCollection<Equipment>(collections.equipments, setEquipments);
export const createEquipment = async (data: Omit<Equipment, 'id'>, onProgress?: ProgressCallback): Promise<void> => {
    data.imageUrl = await uploadFile('equipments', data.imageUrl || null, onProgress);
    await createDocument<Equipment>(collections.equipments, data);
};
export const updateEquipment = async (id: string, data: Partial<Equipment>, onProgress?: ProgressCallback): Promise<void> => {
    if (data.imageUrl) {
        data.imageUrl = await uploadFile('equipments', data.imageUrl || null, onProgress);
    }
    await updateDocument<Equipment>(collections.equipments, id, data);
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
export const createCedula = async (data: Omit<Cedula, 'id'>, onProgress?: ProgressCallback): Promise<void> => {
    if (data.protocolSteps) {
        for(const step of data.protocolSteps) {
            step.imageUrl = (await uploadFile('cedula_evidence', step.imageUrl, onProgress)) || '';
        }
    }
    await createDocument<Cedula>(collections.cedulas, data);
};
export const updateCedula = async (id: string, data: Partial<Cedula>, onProgress?: ProgressCallback): Promise<void> => {
    if (data.protocolSteps) {
        for(const step of data.protocolSteps) {
            if (step.imageUrl && step.imageUrl.startsWith('data:')) {
                step.imageUrl = (await uploadFile('cedula_evidence', step.imageUrl, onProgress)) || '';
            }
        }
    }
    await updateDocument<Cedula>(collections.cedulas, id, data);
};
export const deleteCedula = (id: string): Promise<boolean> => deleteDocument(collections.cedulas, id);
