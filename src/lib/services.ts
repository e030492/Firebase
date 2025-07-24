
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
export type Client = { id: string, name: string, responsable: string, direccion: string, almacenes: Almacen[] };
export type Equipment = { id: string, name: string, description: string, brand: string, model: string, type: string, serial: string, client: string, system: string, location: string, status: 'Activo' | 'Inactivo' | 'En Mantenimiento', maintenanceStartDate: string, maintenancePeriodicity: string, imageUrl: string };
export type System = { id: string, name: string, description: string, color: string };
export type User = typeof mockUsers[0] & { id: string };
export type ProtocolStep = { step: string; priority: 'baja' | 'media' | 'alta'; completion: number; imageUrl?: string, notes?: string, percentage?: number };
export type Protocol = { id: string, equipmentId: string; steps: ProtocolStep[] };
export type Cedula = { id: string, folio: string, client: string, equipment: string, technician: string, supervisor: string, creationDate: string, status: 'Pendiente' | 'En Progreso' | 'Completada', description: string, protocolSteps: any[], semaforo: 'Verde' | 'Naranja' | 'Rojo' | '' };


export const ACTIVE_USER_STORAGE_KEY = 'guardian_shield_active_user';

const collectionsToSeed = {
    users: mockUsers,
    clients: mockClients,
    systems: mockSystems,
    equipments: mockEquipments,
    protocols: mockProtocols,
    cedulas: mockCedulas,
};

export const seedDatabase = async (updateMessage: (message: string) => void) => {
  updateMessage("Starting database seed process...");
  
  for (const [collectionName, data] of Object.entries(collectionsToSeed)) {
      try {
          updateMessage(`Seeding collection: ${collectionName}...`);
          const batch = writeBatch(db);
          data.forEach(item => {
              // We let firestore generate the ID to avoid conflicts
              const docRef = doc(collection(db, collectionName));
              batch.set(docRef, item);
          });
          await batch.commit();
          updateMessage(`Successfully seeded ${collectionName}.`);
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Error seeding collection ${collectionName}:`, error);
          updateMessage(`ERROR seeding ${collectionName}: ${errorMessage}`);
          // Re-throw the error to be caught by the calling function in DataProvider
          throw error;
      }
  }
  
  updateMessage("Database seeding process fully completed.");
};


// Generic function to fetch all documents from a collection
async function getCollection<T extends {id: string}>(collectionName: string): Promise<T[]> {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  } catch (error) {
    console.error(`Could not connect to Firestore to get ${collectionName}. Error:`, error);
    // In a real app, you might want to throw the error to be handled by the caller
    // For this prototype, returning an empty array might be safer to prevent UI crashes.
    return [];
  }
}

async function getDocumentById<T extends {id: string}>(collectionName: string, id: string): Promise<T | null> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
    } else {
        return null;
    }
}

async function createDocument<T>(collectionName: string, data: T) {
    return await addDoc(collection(db, collectionName), data);
}

async function updateDocument<T>(collectionName: string, id: string, data: Partial<T>) {
    return await updateDoc(doc(db, collectionName, id), data);
}

async function deleteDocument(collectionName: string, id: string) {
    return await deleteDoc(doc(db, collectionName, id));
}


// Service functions for each collection

// USERS
export async function getUsers(): Promise<User[]> { 
    return getCollection<User>('users');
}
export async function getUser(id: string): Promise<User | null> {
    return getDocumentById<User>('users', id);
}
export async function createUser(data: Omit<User, 'id'>) {
    return await createDocument('users', data);
}
export async function updateUser(id: string, data: Partial<User>) {
    return await updateDocument('users', id, data);
}
export async function deleteUser(id: string) {
    return await deleteDocument('users', id);
}


// CLIENTS
export async function getClients(): Promise<Client[]> { 
    return getCollection<Client>('clients');
}
export async function getClient(id: string): Promise<Client | null> {
    return getDocumentById<Client>('clients', id);
}
export async function createClient(data: Omit<Client, 'id'>) {
    return await createDocument('clients', data);
}
export async function updateClient(id: string, data: Partial<Client>) {
    return await updateDocument('clients', id, data);
}
export async function deleteClient(id: string) {
    return await deleteDocument('clients', id);
}

// EQUIPMENTS
export async function getEquipments(): Promise<Equipment[]> { 
    return getCollection<Equipment>('equipments');
}
export async function getEquipment(id: string): Promise<Equipment | null> {
    return getDocumentById<Equipment>('equipments', id);
}
export async function createEquipment(data: Omit<Equipment, 'id'>) {
    return await createDocument('equipments', data);
}
export async function updateEquipment(id: string, data: Partial<Equipment>) {
    return await updateDocument('equipments', id, data);
}
export async function deleteEquipment(id: string) {
    return await deleteDocument('equipments', id);
}

// SYSTEMS
export async function getSystems(): Promise<System[]> { 
    return getCollection<System>('systems');
}
export async function getSystem(id: string): Promise<System | null> {
    return getDocumentById<System>('systems', id);
}
export async function createSystem(data: Omit<System, 'id'>) {
    return await createDocument('systems', data);
}
export async function updateSystem(id: string, data: Partial<System>) {
    return await updateDocument('systems', id, data);
}
export async function deleteSystem(id: string) {
    return await deleteDocument('systems', id);
}

// PROTOCOLS
export async function getProtocols(): Promise<Protocol[]> { 
    return getCollection<Protocol>('protocols');
}
export async function getProtocol(id: string): Promise<Protocol | null> {
    return getDocumentById<Protocol>('protocols', id);
}
export async function createProtocol(data: Omit<Protocol, 'id'>) {
    return await createDocument('protocols', data);
}
export async function updateProtocol(id: string, data: Partial<Protocol>) {
    return await updateDocument('protocols', id, data);
}
export async function deleteProtocol(id: string) {
    return await deleteDocument('protocols', id);
}
export async function deleteProtocolByEquipmentId(equipmentId: string) {
    const q = query(collection(db, "protocols"), where("equipmentId", "==", equipmentId));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });
    return await batch.commit();
}


// CEDULAS
export async function getCedulas(): Promise<Cedula[]> { 
    return getCollection<Cedula>('cedulas');
}
export async function getCedula(id: string): Promise<Cedula | null> {
    return getDocumentById<Cedula>('cedulas', id);
}
export async function createCedula(data: Omit<Cedula, 'id'>) {
    return await createDocument('cedulas', data);
}
export async function updateCedula(id: string, data: Partial<Cedula>) {
    return await updateDocument('cedulas', id, data);
}
export async function deleteCedula(id: string) {
    return await deleteDocument('cedulas', id);
}
