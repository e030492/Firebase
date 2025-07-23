
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

const collectionsToSeed = {
    users: mockUsers,
    clients: mockClients,
    systems: mockSystems,
    equipments: mockEquipments,
    protocols: mockProtocols,
    cedulas: mockCedulas
};

export const seedDatabase = async () => {
  console.log("Seeding database...");
  for (const [collectionName, mockData] of Object.entries(collectionsToSeed)) {
      const batch = writeBatch(db);
      mockData.forEach(item => {
          const { id, ...data } = item; // Exclude mock ID
          // For protocols, we don't create a random ID, we use the equipmentId based one
          const docRef = collectionName === 'protocols' ? doc(db, collectionName, data.equipmentId) : doc(collection(db, collectionName));
          batch.set(docRef, data);
      });
      await batch.commit();
  }
  console.log("Database seeded successfully.");
};


// Generic function to fetch all documents from a collection
async function getCollection<T extends {id: string}>(collectionName: string): Promise<T[]> {
  let querySnapshot = await getDocs(collection(db, collectionName));
  
  if (querySnapshot.empty) {
    console.warn(`Collection '${collectionName}' is empty. Seeding database...`);
    await seedDatabase();
    // Re-fetch the collection after seeding
    querySnapshot = await getDocs(collection(db, collectionName));
  }
  
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
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
    return await addDoc(collection(db, 'clients'), data);
}
export async function updateClient(id: string, data: Partial<Client>) {
    return await updateDoc(doc(db, 'clients', id), data);
}
export async function deleteClient(id: string) {
    return await deleteDoc(doc(db, 'clients', id));
}

export async function getEquipments(): Promise<Equipment[]> { return getCollection<Equipment>('equipments'); }
export const getEquipment = (id: string) => getDocument<Equipment>('equipments', id);
export async function createEquipment(data: Omit<Equipment, 'id'>) {
    return await addDoc(collection(db, 'equipments'), data);
}
export async function updateEquipment(id: string, data: Partial<Equipment>) {
    return await updateDoc(doc(db, 'equipments', id), data);
}
export async function deleteEquipment(id: string) {
    return await deleteDoc(doc(db, 'equipments', id));
}

export async function getSystems(): Promise<System[]> { return getCollection<System>('systems'); }
export const getSystem = (id: string) => getDocument<System>('systems', id);
export async function createSystem(data: Omit<System, 'id'>) {
    return await addDoc(collection(db, 'systems'), data);
}
export async function updateSystem(id: string, data: Partial<System>) {
    return await updateDoc(doc(db, 'systems', id), data);
}
export async function deleteSystem(id: string) {
    return await deleteDoc(doc(db, 'systems', id));
}

export async function getUsers(): Promise<User[]> { return getCollection<User>('users'); }
export const getUser = (id: string) => getDocument<User>('users', id);
export async function createUser(data: Omit<User, 'id'>) {
    return await addDoc(collection(db, 'users'), data);
}
export async function updateUser(id: string, data: Partial<User>) {
    return await updateDoc(doc(db, 'users', id), data);
}
export async function deleteUser(id: string) {
    return await deleteDoc(doc(db, 'users', id));
}

export async function getProtocols(): Promise<Protocol[]> { return getCollection<Protocol>('protocols'); }
export const getProtocol = (id: string) => getDocument<Protocol>('protocols', id);
export async function createProtocol(data: Omit<Protocol, 'id'>) {
    return await addDoc(collection(db, 'protocols'), data);
}
export async function updateProtocol(id: string, data: Partial<Protocol>) {
    return await updateDoc(doc(db, 'protocols', id), data);
}
export async function deleteProtocol(id: string) {
    return await deleteDoc(doc(db, 'protocols', id));
}
export const deleteProtocolByEquipmentId = async (equipmentId: string) => {
    const protocolsQuery = query(collection(db, "protocols"), where("equipmentId", "==", equipmentId));
    const querySnapshot = await getDocs(protocolsQuery);
    if (!querySnapshot.empty) {
        const protocolToDelete = querySnapshot.docs[0];
        await deleteDoc(doc(db, 'protocols', protocolToDelete.id));
    }
};

export async function getCedulas(): Promise<Cedula[]> { return getCollection<Cedula>('cedulas'); }
export const getCedula = (id: string) => getDocument<Cedula>('cedulas', id);
export async function createCedula(data: Omit<Cedula, 'id'>) {
    return await addDoc(collection(db, 'cedulas'), data);
}
export async function updateCedula(id: string, data: Partial<Cedula>) {
    return await updateDoc(doc(db, 'cedulas', id), data);
}
export async function deleteCedula(id: string) {
    return await deleteDoc(doc(db, 'cedulas', id));
}
