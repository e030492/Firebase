export const mockUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@guardianshield.com',
    role: 'Administrador',
  },
  {
    id: '2',
    name: 'Technician Uno',
    email: 'tech1@guardianshield.com',
    role: 'Técnico',
  },
  {
    id: '3',
    name: 'Technician Dos',
    email: 'tech2@guardianshield.com',
    role: 'Técnico',
  },
    {
    id: '4',
    name: 'Supervisor',
    email: 'supervisor@guardianshield.com',
    role: 'Supervisor',
  },
];

export const mockClients = [
  {
    id: '1',
    name: 'Acme Corp',
    responsable: 'Juan Pérez',
    direccion: 'Av. Siempre Viva 123, Springfield',
    almacenes: [
      { nombre: 'Almacén Central', direccion: 'Av. Siempre Viva 123, Springfield' }
    ]
  },
  {
    id: '2',
    name: 'Soluciones Tech',
    responsable: 'María García',
    direccion: 'Calle Falsa 456, Capital City',
    almacenes: [
      { nombre: 'Bodega Principal', direccion: 'Calle Falsa 456, Capital City' }
    ]
  },
  {
    id: '3',
    name: 'Innovate Co.',
    responsable: 'Carlos Rodriguez',
    direccion: 'Blvd. de los Sueños 789, Metropolis',
    almacenes: []
  },
  {
    id: '4',
    name: 'Guardianes Nocturnos Ltda.',
    responsable: 'Ana Martinez',
    direccion: 'Paseo de la Reforma 101, CDMX',
    almacenes: [
        { nombre: 'Almacén Sur', direccion: 'Insurgentes Sur 123, CDMX' },
        { nombre: 'Almacén Norte', direccion: 'Vallejo 456, CDMX' }
    ]
  },
];

export const mockSystems = [
  {
    id: '1',
    name: 'Sistema de Control de Acceso',
    description: 'Gestiona entradas y salidas mediante tarjetas RFID y biométricos.',
  },
  {
    id: '2',
    name: 'Circuito Cerrado de Televisión (CCTV)',
    description: 'Sistema de videovigilancia con cámaras IP de alta definición.',
  },
  {
    id: '3',
    name: 'Sistema de Detección de Incendios',
    description: 'Detectores de humo y calor conectados a una central de alarmas.',
  },
  {
    id: '4',
    name: 'Alarma de Intrusión Perimetral',
    description: 'Sensores de movimiento y barreras infrarrojas para proteger el perímetro.',
  },
];
