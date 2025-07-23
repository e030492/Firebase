
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
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
export type Client = typeof mockClients[0];
export type Equipment = typeof mockEquipments[0];
export type System = typeof mockSystems[0];
export type User = typeof mockUsers[0];
export type ProtocolStep = { step: string; priority: 'baja' | 'media' | 'alta'; completion: number; imageUrl?: string, notes?: string };
export type Protocol = { equipmentId: string; steps: ProtocolStep[] };
export type Cedula = typeof mockCedulas[0];

// Generic function to fetch all documents from a collection
async function getCollection<T>(collectionName: string): Promise<T[]> {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}

// Generic function to fetch a single document from a collection
async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as T) : null;
}

// Service functions for each collection
export const getClients = () => getCollection<Client>('clients');
export const getClient = (id: string) => getDocument<Client>('clients', id);
export const createClient = (data: Omit<Client, 'id'>) => addDoc(collection(db, 'clients'), data);
export const updateClient = (id: string, data: Partial<Client>) => updateDoc(doc(db, 'clients', id), data);
export const deleteClient = (id: string) => deleteDoc(doc(db, 'clients', id));

export const getEquipments = () => getCollection<Equipment>('equipments');
export const getEquipment = (id: string) => getDocument<Equipment>('equipments', id);
export const createEquipment = (data: Omit<Equipment, 'id'>) => addDoc(collection(db, 'equipments'), data);
export const updateEquipment = (id: string, data: Partial<Equipment>) => updateDoc(doc(db, 'equipments', id), data);
export const deleteEquipment = (id: string) => deleteDoc(doc(db, 'equipments', id));

export const getSystems = () => getCollection<System>('systems');
export const getSystem = (id: string) => getDocument<System>('systems', id);
export const createSystem = (data: Omit<System, 'id'>) => addDoc(collection(db, 'systems'), data);
export const updateSystem = (id: string, data: Partial<System>) => updateDoc(doc(db, 'systems', id), data);
export const deleteSystem = (id: string) => deleteDoc(doc(db, 'systems', id));

export const getUsers = () => getCollection<User>('users');
export const getUser = (id: string) => getDocument<User>('users', id);
export const createUser = (data: Omit<User, 'id'>) => addDoc(collection(db, 'users'), data);
export const updateUser = (id: string, data: Partial<User>) => updateDoc(doc(db, 'users', id), data);
export const deleteUser = (id: string) => deleteDoc(doc(db, 'users', id));

export const getProtocols = () => getCollection<Protocol>('protocols');
export const getProtocol = (id: string) => getDocument<Protocol>('protocols', id);
export const createProtocol = (data: Omit<Protocol, 'id'>) => addDoc(collection(db, 'protocols'), data);
export const updateProtocol = (id: string, data: Partial<Protocol>) => updateDoc(doc(db, 'protocols', id), data);
export const deleteProtocol = (id: string) => deleteDoc(doc(db, 'protocols', id));
export const deleteProtocolByEquipmentId = async (equipmentId: string) => {
    const protocols = await getProtocols();
    const protocolToDelete = protocols.find(p => p.equipmentId === equipmentId);
    if(protocolToDelete) {
        await deleteDoc(doc(db, 'protocols', protocolToDelete.id));
    }
};

export const getCedulas = () => getCollection<Cedula>('cedulas');
export const getCedula = (id: string) => getDocument<Cedula>('cedulas', id);
export const createCedula = (data: Omit<Cedula, 'id'>) => addDoc(collection(db, 'cedulas'), data);
export const updateCedula = (id: string, data: Partial<Cedula>) => updateDoc(doc(db, 'cedulas', id), data);
export const deleteCedula = (id: string) => deleteDoc(doc(db, 'cedulas', id));


// Database Seeding Function
export async function checkAndSeedDatabase() {
    const collections = {
        users: mockUsers,
        clients: mockClients,
        systems: mockSystems,
        equipments: mockEquipments,
        protocols: mockProtocols,
        cedulas: mockCedulas
    };

    for (const [collectionName, mockData] of Object.entries(collections)) {
        const snapshot = await getDocs(collection(db, collectionName));
        if (snapshot.empty) {
            console.log(`Seeding ${collectionName}...`);
            const batch = writeBatch(db);
            mockData.forEach(item => {
                const { id, ...data } = item; // Exclude mock ID
                const docRef = doc(collection(db, collectionName)); // Firestore generates ID
                batch.set(docRef, data);
            });
            await batch.commit();
            console.log(`${collectionName} seeded successfully.`);
        }
    }
}
