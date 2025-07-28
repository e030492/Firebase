
import { v4 as uuidv4 } from 'uuid';
import { 
    mockUsers, mockClients, mockSystems, mockEquipments, mockProtocols, mockCedulas, ACTIVE_USER_STORAGE_KEY
} from './mock-data';

// This file is now a MOCK service layer. It uses the mock-data.ts file
// to simulate a database. This ensures the application is stable and works
// without any dependency on a live Firebase connection.

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

// Re-export mock data so it can be used by the provider
export { 
    mockUsers, mockClients, mockSystems, mockEquipments, mockProtocols, mockCedulas, ACTIVE_USER_STORAGE_KEY
};
