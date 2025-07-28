import { v4 as uuidv4 } from 'uuid';
import { 
    mockUsers, mockClients, mockSystems, mockEquipments, mockProtocols, mockCedulas, ACTIVE_USER_STORAGE_KEY
} from './mock-data';

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


// --- MOCKED DATA ---
let users: User[] = mockUsers;
let clients: Client[] = mockClients;
let systems: System[] = mockSystems;
let equipments: Equipment[] = mockEquipments;
let protocols: Protocol[] = mockProtocols;
let cedulas: Cedula[] = mockCedulas;
let companySettings: CompanySettings = { id: '1', logoUrl: 'https://storage.googleapis.com/builder-prod.appspot.com/assets%2Fescudo.png?alt=media&token=e179a63c-3965-4f7c-a25e-315135118742' };
let mediaLibrary: MediaFile[] = [];

// Simulate API latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- AUTH ---
export async function loginUser(email: string, pass: string): Promise<User | null> {
    await delay(500);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
    if (user) {
        return { ...user };
    }
    return null;
}

// --- GENERIC GETTERS ---
export const getUsers = async (): Promise<User[]> => { await delay(100); return [...users]; };
export const getClients = async (): Promise<Client[]> => { await delay(100); return [...clients]; };
export const getSystems = async (): Promise<System[]> => { await delay(100); return [...systems]; };
export const getEquipments = async (): Promise<Equipment[]> => { await delay(100); return [...equipments]; };
export const getProtocols = async (): Promise<Protocol[]> => { await delay(100); return [...protocols]; };
export const getCedulas = async (): Promise<Cedula[]> => { await delay(100); return [...cedulas]; };
export const getCompanySettings = async (): Promise<CompanySettings> => { await delay(50); return { ...companySettings }; };

// --- USER MUTATIONS ---
export async function createUser(userData: Omit<User, 'id'>): Promise<User> {
    await delay(300);
    const newUser: User = { id: uuidv4(), ...userData };
    users.push(newUser);
    return newUser;
}

export async function updateUser(userId: string, userData: Partial<User>): Promise<User> {
    await delay(300);
    let updatedUser: User | undefined;
    users = users.map(u => {
        if (u.id === userId) {
            updatedUser = { ...u, ...userData };
            return updatedUser;
        }
        return u;
    });
    if (!updatedUser) throw new Error("User not found");
    return updatedUser;
}

export async function deleteUser(userId: string): Promise<void> {
    await delay(300);
    users = users.filter(u => u.id !== userId);
}

// --- CLIENT MUTATIONS ---
export async function createClient(clientData: Omit<Client, 'id'>): Promise<Client> {
    await delay(300);
    const newClient: Client = { id: uuidv4(), ...clientData };
    clients.push(newClient);
    return newClient;
}

export async function updateClient(clientId: string, clientData: Partial<Client>): Promise<Client> {
    await delay(300);
    let updatedClient: Client | undefined;
    clients = clients.map(c => {
        if (c.id === clientId) {
            updatedClient = { ...c, ...clientData };
            return updatedClient;
        }
        return c;
    });
    if (!updatedClient) throw new Error("Client not found");
    return updatedClient;
}

export async function deleteClient(clientId: string): Promise<void> {
    await delay(300);
    clients = clients.filter(c => c.id !== clientId);
}

// --- SYSTEM MUTATIONS ---
export async function createSystem(systemData: Omit<System, 'id'>): Promise<System> {
    await delay(300);
    const newSystem: System = { id: uuidv4(), ...systemData };
    systems.push(newSystem);
    return newSystem;
}

export async function updateSystem(systemId: string, systemData: Partial<System>): Promise<System> {
    await delay(300);
    let updatedSystem: System | undefined;
    systems = systems.map(s => {
        if (s.id === systemId) {
            updatedSystem = { ...s, ...systemData };
            return updatedSystem;
        }
        return s;
    });
    if (!updatedSystem) throw new Error("System not found");
    return updatedSystem;
}

export async function deleteSystem(systemId: string): Promise<void> {
    await delay(300);
    systems = systems.filter(s => s.id !== systemId);
}

// --- EQUIPMENT MUTATIONS ---
export async function createEquipment(equipmentData: Omit<Equipment, 'id'>): Promise<Equipment> {
    await delay(300);
    const newEquipment: Equipment = { id: uuidv4(), ...equipmentData };
    equipments.push(newEquipment);
    return newEquipment;
}

export async function updateEquipment(equipmentId: string, equipmentData: Partial<Equipment>): Promise<Equipment> {
    await delay(300);
    let updatedEquipment: Equipment | undefined;
    equipments = equipments.map(e => {
        if (e.id === equipmentId) {
            updatedEquipment = { ...e, ...equipmentData };
            return updatedEquipment;
        }
        return e;
    });
    if (!updatedEquipment) throw new Error("Equipment not found");
    return updatedEquipment;
}

export async function deleteEquipment(equipmentId: string): Promise<void> {
    await delay(300);
    equipments = equipments.filter(e => e.id !== equipmentId);
}

// --- PROTOCOL MUTATIONS ---
export async function createProtocol(protocolData: Omit<Protocol, 'id'>, id?: string): Promise<Protocol> {
    await delay(300);
    const newProtocol: Protocol = { id: id || uuidv4(), ...protocolData };
    protocols.push(newProtocol);
    return newProtocol;
}

export async function updateProtocol(protocolId: string, protocolData: Partial<Protocol>): Promise<Protocol> {
    await delay(300);
    let updatedProtocol: Protocol | undefined;
    protocols = protocols.map(p => {
        if (p.id === protocolId) {
            updatedProtocol = { ...p, ...protocolData };
            return updatedProtocol;
        }
        return p;
    });
    if (!updatedProtocol) throw new Error("Protocol not found");
    return updatedProtocol;
}

export async function deleteProtocol(protocolId: string): Promise<void> {
    await delay(300);
    protocols = protocols.filter(p => p.id !== protocolId);
}

// --- CEDULA MUTATIONS ---
export async function createCedula(cedulaData: Omit<Cedula, 'id'>): Promise<Cedula> {
    await delay(300);
    const newCedula: Cedula = { id: uuidv4(), ...cedulaData };
    cedulas.push(newCedula);
    return newCedula;
}

export async function updateCedula(cedulaId: string, cedulaData: Partial<Cedula>, onStep?: (log: string) => void): Promise<Cedula> {
    await delay(500);
    onStep?.("Iniciando actualización...");
    
    let updatedCedula: Cedula | undefined;
    cedulas = cedulas.map(c => {
        if (c.id === cedulaId) {
            onStep?.(`Cédula con folio ${c.folio} encontrada. Aplicando cambios...`);
            updatedCedula = { ...c, ...cedulaData };
             onStep?.("Cambios aplicados en memoria.");
            return updatedCedula;
        }
        return c;
    });
    
    if (!updatedCedula) {
        onStep?.(`ERROR: No se encontró la cédula con ID ${cedulaId}.`);
        throw new Error("Cedula not found");
    }

    onStep?.("Actualización finalizada con éxito.");
    return updatedCedula;
}

export async function deleteCedula(cedulaId: string): Promise<void> {
    await delay(300);
    cedulas = cedulas.filter(c => c.id !== cedulaId);
}

// --- SETTINGS MUTATIONS ---
export async function updateCompanySettings(settingsData: Partial<CompanySettings>): Promise<CompanySettings> {
    await delay(200);
    companySettings = { ...companySettings, ...settingsData };
    return { ...companySettings };
}

// --- MEDIA LIBRARY (MOCKED) ---
export function subscribeToMediaLibrary(setFiles: (files: MediaFile[]) => void): () => void {
    const interval = setInterval(() => {
        setFiles([...mediaLibrary].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, 1000); // Simulate real-time updates polling
    
    // Initial load
    setFiles([...mediaLibrary].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    return () => clearInterval(interval);
}

export async function uploadFile(files: File[], onProgress: (percentage: number) => void, logAudit: (message: string) => void): Promise<void> {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        logAudit(`Subiendo ${file.name}...`);
        
        // Simulate upload progress
        let progress = 0;
        while (progress < 100) {
            await delay(50); // Simulate network latency
            progress += Math.random() * 20;
            if (progress > 100) progress = 100;
            const overallProgress = ((i + (progress / 100)) / files.length) * 100;
            onProgress(overallProgress);
        }

        const newMediaFile: MediaFile = {
            id: uuidv4(),
            name: file.name,
            url: URL.createObjectURL(file), // Use blob URL for local preview
            type: file.type,
            size: file.size,
            createdAt: new Date().toISOString(),
        };
        mediaLibrary.push(newMediaFile);
        logAudit(`${file.name} subido exitosamente.`);
    }
}

export async function deleteMediaFile(file: MediaFile): Promise<void> {
    await delay(300);
    mediaLibrary = mediaLibrary.filter(f => f.id !== file.id);
    // In a real scenario, you'd also revoke the object URL if it's a blob URL
    // URL.revokeObjectURL(file.url);
}
