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

export const mockEquipments = [
  {
    id: '1',
    name: 'Cámara Domo PTZ',
    description: 'Cámara de vigilancia exterior con zoom óptico 20x.',
    client: 'Acme Corp',
    system: 'Circuito Cerrado de Televisión (CCTV)',
    location: 'Almacén Central - Puerta Principal',
    status: 'Activo' as const,
    maintenanceStartDate: '2024-01-15',
    nextMaintenanceDate: '2025-01-15',
  },
  {
    id: '2',
    name: 'Lector de Tarjetas RFID',
    description: 'Lector de proximidad para puerta de oficina.',
    client: 'Soluciones Tech',
    system: 'Sistema de Control de Acceso',
    location: 'Oficina Principal - Entrada',
    status: 'Activo' as const,
    maintenanceStartDate: '2023-11-20',
    nextMaintenanceDate: '2024-11-20',
  },
  {
    id: '3',
    name: 'Detector de Humo Fotoeléctrico',
    description: 'Detector de humo para área de servidores.',
    client: 'Innovate Co.',
    system: 'Sistema de Detección de Incendios',
    location: 'Sala de Servidores',
    status: 'En Mantenimiento' as const,
    maintenanceStartDate: '2024-07-01',
    nextMaintenanceDate: '2025-01-01',
  },
    {
    id: '4',
    name: 'Barrera Infrarroja Perimetral',
    description: 'Barrera de 4 haces para protección de barda perimetral.',
    client: 'Guardianes Nocturnos Ltda.',
    system: 'Alarma de Intrusión Perimetral',
    location: 'Barda Norte',
    status: 'Inactivo' as const,
    maintenanceStartDate: '2022-05-10',
    nextMaintenanceDate: '2024-05-10',
  },
];
