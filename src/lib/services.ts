
import { 
    collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, 
    query, where, writeBatch, documentId, onSnapshot 
} from "firebase/firestore"; 
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { 
    getAuth, onAuthStateChanged, signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, updatePassword as firebaseUpdatePassword 
} from "firebase/auth";
import { v4 as uuidv4 } from 'uuid';
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

export const auth = getAuth();

// --- AUTH ---
export async function loginUser(email: string, pass: string): Promise<User | null> {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    if (userCredential.user) {
        const userDocRef = doc(db, "users", userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            return { id: userDoc.id, ...userDoc.data() } as User;
        }
    }
    return null;
}

// --- GENERIC GETTERS ---
async function getCollectionData<T>(collectionName: string): Promise<T[]> {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}

export const getUsers = () => getCollectionData<User>('users');
export const getClients = () => getCollectionData<Client>('clients');
export const getSystems = () => getCollectionData<System>('systems');
export const getEquipments = () => getCollectionData<Equipment>('equipments');
export const getProtocols = () => getCollectionData<Protocol>('protocols');
export const getCedulas = () => getCollectionData<Cedula>('cedulas');

export const getCompanySettings = async (): Promise<CompanySettings | null> => {
    const docRef = doc(db, "settings", "companyProfile");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as CompanySettings;
    }
    // If it doesn't exist, create a default one
    const defaultSettings: Omit<CompanySettings, 'id'> = { logoUrl: 'https://storage.googleapis.com/builder-prod.appspot.com/assets%2Fescudo.png?alt=media&token=e179a63c-3965-4f7c-a25e-315135118742' };
    await updateDoc(docRef, defaultSettings);
    return { id: 'companyProfile', ...defaultSettings };
};

// --- USER MUTATIONS ---
export async function createUser(userData: Omit<User, 'id'>): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password!);
    const uid = userCredential.user.uid;
    const { password, ...userDataToSave } = userData;
    await updateDoc(doc(db, "users", uid), userDataToSave);
    return { id: uid, ...userData };
}

export async function updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const { password, ...userDataToSave } = userData;
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, userDataToSave);

    if (password && auth.currentUser && auth.currentUser.uid === userId) {
        await firebaseUpdatePassword(auth.currentUser, password);
    }
    const updatedDoc = await getDoc(userDocRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as User;
}

export async function deleteUser(userId: string): Promise<void> {
    // Note: Deleting from Firebase Auth is a separate, more complex operation.
    // Here we only delete from Firestore.
    await deleteDoc(doc(db, "users", userId));
}

// --- CLIENT MUTATIONS ---
export async function createClient(clientData: Omit<Client, 'id'>): Promise<Client> {
    const docRef = await addDoc(collection(db, "clients"), clientData);
    return { id: docRef.id, ...clientData };
}

export async function updateClient(clientId: string, clientData: Partial<Client>): Promise<Client> {
    const docRef = doc(db, "clients", clientId);
    await updateDoc(docRef, clientData);
    const updatedDoc = await getDoc(docRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as Client;
}

export async function deleteClient(clientId: string): Promise<void> {
    await deleteDoc(doc(db, "clients", clientId));
}

// --- SYSTEM MUTATIONS ---
export async function createSystem(systemData: Omit<System, 'id'>): Promise<System> {
    const docRef = await addDoc(collection(db, "systems"), systemData);
    return { id: docRef.id, ...systemData };
}

export async function updateSystem(systemId: string, systemData: Partial<System>): Promise<System> {
    const docRef = doc(db, "systems", systemId);
    await updateDoc(docRef, systemData);
    const updatedDoc = await getDoc(docRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as System;
}

export async function deleteSystem(systemId: string): Promise<void> {
    await deleteDoc(doc(db, "systems", systemId));
}

// --- EQUIPMENT MUTATIONS ---
export async function createEquipment(equipmentData: Omit<Equipment, 'id'>): Promise<Equipment> {
    const docRef = await addDoc(collection(db, "equipments"), equipmentData);
    return { id: docRef.id, ...equipmentData };
}

export async function updateEquipment(equipmentId: string, equipmentData: Partial<Equipment>): Promise<void> {
    await updateDoc(doc(db, "equipments", equipmentId), equipmentData);
}

export async function deleteEquipment(equipmentId: string): Promise<void> {
    await deleteDoc(doc(db, "equipments", equipmentId));
}

// --- PROTOCOL MUTATIONS ---
export async function createProtocol(protocolData: Omit<Protocol, 'id'>, id?: string): Promise<Protocol> {
    const docRef = doc(db, "protocols", id || uuidv4());
    await updateDoc(docRef, protocolData);
    return { id: docRef.id, ...protocolData };
}

export async function updateProtocol(protocolId: string, protocolData: Partial<Protocol>): Promise<Protocol> {
    const docRef = doc(db, "protocols", protocolId);
    await updateDoc(docRef, protocolData);
    const updatedDoc = await getDoc(docRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as Protocol;
}

export async function deleteProtocol(protocolId: string): Promise<void> {
    await deleteDoc(doc(db, "protocols", protocolId));
}

// --- CEDULA MUTATIONS ---
export async function createCedula(cedulaData: Omit<Cedula, 'id'>): Promise<Cedula> {
    const docRef = await addDoc(collection(db, "cedulas"), cedulaData);
    return { id: docRef.id, ...cedulaData };
}

export async function updateCedula(cedulaId: string, cedulaData: Partial<Cedula>, onStep?: (log: string) => void): Promise<void> {
    await updateDoc(doc(db, "cedulas", cedulaId), cedulaData);
}


export async function deleteCedula(cedulaId: string): Promise<void> {
    await deleteDoc(doc(db, "cedulas", cedulaId));
}

// --- SETTINGS MUTATIONS ---
export async function updateCompanySettings(settingsData: Partial<CompanySettings>): Promise<void> {
    await updateDoc(doc(db, "settings", "companyProfile"), settingsData);
}

// --- MEDIA LIBRARY ---
export function subscribeToMediaLibrary(setFiles: (files: MediaFile[]) => void): () => void {
    const q = query(collection(db, "mediaLibrary"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const files: MediaFile[] = [];
        querySnapshot.forEach((doc) => {
            files.push({ id: doc.id, ...doc.data() } as MediaFile);
        });
        setFiles(files);
    });
    return unsubscribe;
}

export async function uploadFile(files: File[], onProgress: (percentage: number) => void, logAudit: (message: string) => void): Promise<void> {
    logAudit(`Starting upload for ${files.length} files.`);
    let totalBytes = files.reduce((acc, file) => acc + file.size, 0);
    let totalBytesTransferred = 0;

    const uploadPromises = files.map(file => {
        const storageRef = ref(storage, `media/${uuidv4()}-${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise<void>((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    // This reports individual progress, we need to aggregate.
                },
                (error) => {
                    logAudit(`ERROR uploading ${file.name}: ${error.message}`);
                    reject(error);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    logAudit(`File ${file.name} uploaded successfully. URL: ${downloadURL}`);
                    const mediaFileData = {
                        name: file.name,
                        url: downloadURL,
                        type: file.type,
                        size: file.size,
                        createdAt: new Date().toISOString(),
                    };
                    await addDoc(collection(db, "mediaLibrary"), mediaFileData);
                    
                    totalBytesTransferred += file.size;
                    const progress = (totalBytesTransferred / totalBytes) * 100;
                    onProgress(progress);
                    logAudit(`Total progress: ${progress.toFixed(2)}%`);
                    
                    resolve();
                }
            );
        });
    });

    await Promise.all(uploadPromises);
}


export async function deleteMediaFile(file: MediaFile): Promise<void> {
    const fileRef = ref(storage, file.url);
    await deleteObject(fileRef);
    await deleteDoc(doc(db, "mediaLibrary", file.id));
}
