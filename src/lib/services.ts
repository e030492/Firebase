import { 
    collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, setDoc, onSnapshot, query
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from './firebase';

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
        throw new Error(`Failed to fetch ${collectionName}. Check Firestore rules and network connection.`);
    }
};

export const getClients = () => getCollectionData<Client>('clients');
export const getSystems = () => getCollectionData<System>('systems');
export const getEquipments = () => getCollectionData<Equipment>('equipments');
export const getProtocols = () => getCollectionData<Protocol>('protocols');
export const getCedulas = () => getCollectionData<Cedula>('cedulas');
// Users are no longer managed by the app, so this is removed.
export const getUsers = async (): Promise<User[]> => Promise.resolve([]);

// --- COMPANY SETTINGS ---
export async function getCompanySettings(): Promise<CompanySettings> {
    const docRef = doc(db, 'settings', 'company');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as CompanySettings;
    } else {
        const defaultSettings = { logoUrl: null };
        await setDoc(docRef, defaultSettings);
        return { id: 'company', ...defaultSettings };
    }
}

export async function updateCompanySettings(settingsData: Partial<CompanySettings>): Promise<CompanySettings> {
    const docRef = doc(db, 'settings', 'company');
    await setDoc(docRef, settingsData, { merge: true });
    return getCompanySettings();
}

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

// Since users are no longer managed, all user-related functions are removed.
export const createUser = (userData: Omit<User, 'id'>) => Promise.reject("User management is disabled.");
export const updateUser = (userId: string, userData: Partial<User>) => Promise.reject("User management is disabled.");
export const deleteUser = (userId: string) => Promise.reject("User management is disabled.");


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

    for (const file of files) {
        const fileId = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const storageRef = ref(storage, `mediaLibrary/${fileId}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    const overallProgress = ((totalUploaded + snapshot.bytesTransferred) / totalSize) * 100;
                    onProgress(overallProgress);
                },
                (error) => {
                    logAudit(`ERROR al subir ${file.name}: ${error.message}`);
                    reject(error);
                },
                async () => {
                    totalUploaded += file.size;
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    logAudit(`Archivo ${file.name} subido, URL obtenida.`);
                    
                    const docData = {
                        name: file.name,
                        url: downloadURL,
                        type: file.type,
                        size: file.size,
                        createdAt: new Date().toISOString(),
                    };
                    await addDoc(collection(db, "mediaLibrary"), docData);
                    
                    logAudit(`Metadatos de ${file.name} guardados.`);
                    resolve();
                }
            );
        });
    }
}

export async function deleteMediaFile(file: MediaFile): Promise<void> {
    const fileRef = ref(storage, file.url);
    await deleteObject(fileRef);
    await deleteDocument('mediaLibrary', file.id);
}
