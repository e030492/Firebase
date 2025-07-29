import { 
    collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, setDoc, where, query, limit, onSnapshot, writeBatch
} from "firebase/firestore";
import { 
    signInWithEmailAndPassword, createUserWithEmailAndPassword,
    signOut
} from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, auth, storage } from './firebase';
import { adminUser } from './mock-data';

// Interfaces for our data structures
export type Plano = { url: string; name: string; size: number };
export type Almacen = { nombre: string; direccion: string; };
export type Client = { id: string; name: string; responsable: string; direccion: string; phone1?: string; phone2?: string; almacenes: Almacen[] };
export type Equipment = { id: string; name: string; alias?: string; description: string; brand: string; model: string; type: string; serial: string; client: string; system: string; location: string; status: 'Activo' | 'Inactivo' | 'En Mantenimiento'; maintenanceStartDate?: string; maintenancePeriodicity?: string; imageUrl?: string | null; ipAddress?: string; configUser?: string; configPassword?: string; protocolId?: string | null; };
export type System = { id: string; name: string; description: string; color: string; };
export type User = { 
    id: string; 
    name: string; 
    email: string; 
    role: 'Administrador' | 'Supervisor' | 'Técnico' | 'Cliente'; 
    password?: string; 
    permissions: any; 
    clientId?: string; 
    photoUrl?: string | null; 
    signatureUrl?: string | null; 
};
export type ProtocolStep = { step: string; priority: 'baja' | 'media' | 'alta'; percentage: number; completion: number; notes: string; imageUrl?: string | null; };
export type Protocol = { id: string; type: string; brand: string; model: string; steps: ProtocolStep[]; };
export type Cedula = { id: string; folio: string; client: string; equipment: string; technician: string; supervisor: string; creationDate: string; status: 'Pendiente' | 'En Progreso' | 'Completada'; description: string; protocolSteps: ProtocolStep[]; semaforo: 'Verde' | 'Naranja' | 'Rojo' | ''; };
export type CompanySettings = { id: string; logoUrl: string | null };
export type MediaFile = { id: string; name: string; url: string; type: string; size: number; createdAt: string; };


// --- Firestore Collection Getters ---
const getCollectionData = async <T extends { id: string }>(collectionName: string): Promise<T[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (error) {
        console.error(`Error getting ${collectionName}:`, error);
        throw error;
    }
};

export const getUsers = () => getCollectionData<User>('users');
export const getClients = () => getCollectionData<Client>('clients');
export const getSystems = () => getCollectionData<System>('systems');
export const getEquipments = () => getCollectionData<Equipment>('equipments');
export const getProtocols = () => getCollectionData<Protocol>('protocols');
export const getCedulas = () => getCollectionData<Cedula>('cedulas');

// --- AUTH & ADMIN SEEDING ---
export async function loginUser(email: string, pass: string): Promise<User | null> {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const authUid = userCredential.user.uid;
    
    const userDocRef = doc(db, "users", authUid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
        await signOut(auth);
        throw new Error("No user document found for this UID in Firestore.");
    }
    const userData = { id: userDocSnap.id, ...userDocSnap.data() } as User;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userToStore } = userData;
    return userToStore;
}

export async function seedAdminUser() {
    console.log("Verifying admin user...");
    const adminEmail = adminUser.email;
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", adminEmail), limit(1));
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.log(`Admin user '${adminEmail}' not found in Firestore. Creating...`);
        try {
            // This assumes you are running this with temporary elevated privileges
            // or that your security rules allow the creation of the first user.
            // A more robust solution for production would be a Cloud Function.
            const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminUser.password);
            const authUid = userCredential.user.uid;

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password, id, ...adminDataToSave } = adminUser;
            
            const docRef = doc(db, 'users', authUid);
            await setDoc(docRef, adminDataToSave);
            console.log(`Successfully created admin user ${adminEmail} in Auth and Firestore.`);
        } catch (error: any) {
            // If user already exists in Auth but not Firestore (e.g., from a failed previous attempt)
            if (error.code === 'auth/email-already-in-use') {
                 console.warn(`User ${adminEmail} already exists in Auth. Will not create in Firestore.`);
            } else {
                 console.error(`Failed to create admin user ${adminEmail}:`, error);
                 throw error;
            }
        }
    } else {
        console.log(`Admin user ${adminEmail} already exists.`);
    }
}


// --- COMPANY SETTINGS ---
export async function getCompanySettings(): Promise<CompanySettings> {
    const docRef = doc(db, 'settings', 'company');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as CompanySettings;
    } else {
        return { id: 'company', logoUrl: null };
    }
}

export async function updateCompanySettings(settingsData: Partial<CompanySettings>): Promise<CompanySettings> {
    const docRef = doc(db, 'settings', 'company');
    await setDoc(docRef, settingsData, { merge: true });
    return getCompanySettings();
}

// --- USER MUTATIONS ---
export const createUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    if (!userData.password) throw new Error("Password is required to create a user.");
    
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const authUid = userCredential.user.uid;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userDataToSave } = userData;
    const docRef = doc(db, 'users', authUid);
    await setDoc(docRef, userDataToSave);

    return { id: authUid, ...userDataToSave };
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, userData);
    const updatedDoc = await getDoc(docRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as User;
};

export const deleteUser = async (userId: string) => {
    // IMPORTANT: This only deletes the Firestore document. Deleting the Firebase Auth
    // user requires admin privileges, typically from a backend/cloud function.
    await deleteDoc(doc(db, "users", userId));
};


// --- GENERIC MUTATIONS ---
const createDocument = async <T extends {id: string}>(collectionName: string, data: Omit<T, 'id'>, id?: string): Promise<T> => {
    if (id) {
        const docRef = doc(db, collectionName, id);
        await setDoc(docRef, data);
        return { id, ...data } as T;
    } else {
        const docRef = await addDoc(collection(db, collectionName), data);
        return { id: docRef.id, ...data } as T;
    }
};

const updateDocument = async <T extends {id: string}>(collectionName: string, id: string, data: Partial<Omit<T, 'id'>>): Promise<T> => {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data);
    const updatedDoc = await getDoc(docRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as T;
};

const deleteDocument = (collectionName: string, id: string): Promise<void> => {
    return deleteDoc(doc(db, collectionName, id));
};


// --- CLIENT MUTATIONS ---
export const createClient = (clientData: Omit<Client, 'id'>) => createDocument<Client>('clients', clientData);
export const updateClient = (clientId: string, clientData: Partial<Client>) => updateDocument<Client>('clients', clientId, clientData);
export const deleteClient = (clientId: string) => deleteDocument('clients', clientId);

// --- SYSTEM MUTATIONS ---
export const createSystem = (systemData: Omit<System, 'id'>) => createDocument<System>('systems', systemData);
export const updateSystem = (systemId: string, systemData: Partial<System>) => updateDocument<System>('systems', systemId, systemData);
export const deleteSystem = (systemId: string) => deleteDocument('systems', systemId);

// --- EQUIPMENT MUTATIONS ---
export const createEquipment = (equipmentData: Omit<Equipment, 'id'>) => createDocument<Equipment>('equipments', equipmentData);
export const updateEquipment = (equipmentId: string, equipmentData: Partial<Equipment>) => updateDocument<Equipment>('equipments', equipmentId, equipmentData);
export const deleteEquipment = (equipmentId: string) => deleteDocument('equipments', equipmentId);

// --- PROTOCOL MUTATIONS ---
export const createProtocol = (protocolData: Omit<Protocol, 'id'>, id?: string) => createDocument<Protocol>('protocols', protocolData, id);
export const updateProtocol = (protocolId: string, protocolData: Partial<Protocol>) => updateDocument<Protocol>('protocols', protocolId, protocolData);
export const deleteProtocol = (protocolId: string) => deleteDocument('protocols', protocolId);

// --- CEDULA MUTATIONS ---
export const createCedula = (cedulaData: Omit<Cedula, 'id'>) => createDocument<Cedula>('cedulas', cedulaData);
export const updateCedula = (cedulaId: string, cedulaData: Partial<Cedula>, onStep?: (log: string) => void) => updateDocument<Cedula>('cedulas', cedulaId, cedulaData);
export const deleteCedula = (cedulaId: string) => deleteDocument('cedulas', cedulaId);

// --- MEDIA LIBRARY ---
export function subscribeToMediaLibrary(setFiles: (files: MediaFile[]) => void): () => void {
    const mediaRef = collection(db, 'mediaLibrary');
    const q = query(mediaRef);
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const files: MediaFile[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaFile));
        files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setFiles(files);
    }, (error) => {
        console.error("Error subscribing to media library:", error);
    });

    return unsubscribe;
}

export async function uploadFile(files: File[], onProgress: (percentage: number) => void, logAudit: (message: string) => void): Promise<void> {
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    let totalUploaded = 0;
    const batch = writeBatch(db);

    const uploadPromises = files.map(file => {
        const fileId = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const storageRef = ref(storage, `mediaLibrary/${fileId}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise<void>((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    // This part is tricky for overall progress. We calculate it after each success.
                },
                (error) => {
                    logAudit(`ERROR al subir ${file.name}: ${error.message}`);
                    reject(error);
                },
                async () => {
                    totalUploaded += file.size;
                    const overallProgress = (totalUploaded / totalSize) * 100;
                    onProgress(overallProgress);
                    
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    logAudit(`Archivo ${file.name} subido, URL obtenida.`);
                    
                    const docId = doc(collection(db, "mediaLibrary")).id;
                    const mediaFileRef = doc(db, 'mediaLibrary', docId);

                    batch.set(mediaFileRef, {
                        name: file.name,
                        url: downloadURL,
                        type: file.type,
                        size: file.size,
                        createdAt: new Date().toISOString(),
                    });
                    
                    logAudit(`Metadatos de ${file.name} preparados para guardar.`);
                    resolve();
                }
            );
        });
    });

    await Promise.all(uploadPromises);
    await batch.commit();
    logAudit('Todos los metadatos guardados en Firestore.');
}

export async function deleteMediaFile(file: MediaFile): Promise<void> {
    const fileRef = ref(storage, file.url);
    await deleteObject(fileRef);
    await deleteDocument('mediaLibrary', file.id);
}
