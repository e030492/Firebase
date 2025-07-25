
export const ACTIVE_USER_STORAGE_KEY = 'guardian_shield_active_user';

export const mockUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@escuadra.com',
    role: 'Administrador',
    password: 'admin',
    signatureUrl: '',
    photoUrl: 'https://placehold.co/100x100.png',
    permissions: {
        clients: { create: true, update: true, delete: true },
        equipments: { create: true, update: true, delete: true },
        systems: { create: true, update: true, delete: true },
        users: { create: true, update: true, delete: true },
        protocols: { create: true, update: true, delete: true },
        cedulas: { create: true, update: true, delete: true },
    }
  },
  {
    id: '5',
    name: 'Root Administrator',
    email: 'root@escuadra.com',
    role: 'Administrador',
    password: 'admin',
    signatureUrl: '',
    photoUrl: 'https://placehold.co/100x100.png',
    permissions: {
        clients: { create: true, update: true, delete: true },
        equipments: { create: true, update: true, delete: true },
        systems: { create: true, update: true, delete: true },
        users: { create: true, update: true, delete: true },
        protocols: { create: true, update: true, delete: true },
        cedulas: { create: true, update: true, delete: true },
    }
  },
    {
    id: '6',
    name: 'Super Admin',
    email: 'super@escuadra.com',
    role: 'Administrador',
    password: 'admin',
    signatureUrl: '',
    photoUrl: 'https://placehold.co/100x100.png',
    permissions: {
        clients: { create: true, update: true, delete: true },
        equipments: { create: true, update: true, delete: true },
        systems: { create: true, update: true, delete: true },
        users: { create: true, update: true, delete: true },
        protocols: { create: true, update: true, delete: true },
        cedulas: { create: true, update: true, delete: true },
    }
  },
  {
    id: '2',
    name: 'Blanca (Técnico)',
    email: 'blanca@escuadra.com',
    role: 'Técnico',
    password: 'tech',
    signatureUrl: '',
    photoUrl: 'https://placehold.co/100x100.png',
    permissions: {
        clients: { create: false, update: false, delete: false },
        equipments: { create: false, update: true, delete: false },
        systems: { create: false, update: false, delete: false },
        users: { create: false, update: false, delete: false },
        protocols: { create: true, update: true, delete: false },
        cedulas: { create: true, update: true, delete: false },
    }
  },
  {
    id: '3',
    name: 'Carlos (Técnico)',
    email: 'carlos@escuadra.com',
    role: 'Técnico',
    password: 'tech',
    signatureUrl: '',
    photoUrl: 'https://placehold.co/100x100.png',
    permissions: {
        clients: { create: false, update: false, delete: false },
        equipments: { create: false, update: true, delete: false },
        systems: { create: false, update: false, delete: false },
        users: { create: false, update: false, delete: false },
        protocols: { create: true, update: true, delete: false },
        cedulas: { create: true, update: true, delete: false },
    }
  },
    {
    id: '4',
    name: 'Supervisor General',
    email: 'supervisor@escuadra.com',
    role: 'Supervisor',
    password: 'super',
    signatureUrl: '',
    photoUrl: 'https://placehold.co/100x100.png',
    permissions: {
        clients: { create: true, update: true, delete: false },
        equipments: { create: true, update: true, delete: false },
        systems: { create: true, update: true, delete: false },
        users: { create: false, update: false, delete: false },
        protocols: { create: true, update: true, delete: true },
        cedulas: { create: true, update: true, delete: true },
    }
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
    color: '#3b82f6',
  },
  {
    id: '2',
    name: 'Circuito Cerrado de Televisión (CCTV)',
    description: 'Sistema de videovigilancia con cámaras IP de alta definición.',
    color: '#22c55e',
  },
  {
    id: '3',
    name: 'Sistema de Detección de Incendios',
    description: 'Detectores de humo y calor conectados a una central de alarmas.',
    color: '#ef4444',
  },
  {
    id: '4',
    name: 'Alarma de Intrusión Perimetral',
    description: 'Sensores de movimiento y barreras infrarrojas para proteger el perímetro.',
    color: '#f97316',
  },
];

export const mockEquipments = [
  {
    id: '1',
    name: 'Cámara Domo PTZ',
    alias: 'Cámara Entrada Principal',
    description: 'Cámara de vigilancia exterior con zoom óptico 20x.',
    brand: 'Hikvision',
    model: 'DS-2DE4225IW-DE',
    type: 'Domo PTZ',
    serial: 'SN-HIK-12345',
    client: 'Acme Corp',
    system: 'Circuito Cerrado de Televisión (CCTV)',
    location: 'Almacén Central',
    status: 'Activo' as const,
    maintenanceStartDate: '2024-01-15',
    maintenancePeriodicity: 'Anual',
    imageUrl: 'https://placehold.co/400x300.png',
    ipAddress: '192.168.1.100',
    configUser: 'admin',
    configPassword: 'password123',
  },
  {
    id: '2',
    name: 'Lector de Tarjetas RFID',
    alias: 'Lector Oficina',
    description: 'Lector de proximidad para puerta de oficina.',
    brand: 'ZKTeco',
    model: 'KR500',
    type: 'Lector RFID',
    serial: 'SN-ZKT-67890',
    client: 'Soluciones Tech',
    system: 'Sistema de Control de Acceso',
    location: 'Bodega Principal',
    status: 'Activo' as const,
    maintenanceStartDate: '2023-11-20',
    maintenancePeriodicity: 'Anual',
    imageUrl: 'https://placehold.co/400x300.png',
    ipAddress: '',
    configUser: '',
    configPassword: '',
  },
  {
    id: '3',
    name: 'Detector de Humo Fotoeléctrico',
    alias: 'Detector Servidores',
    description: 'Detector de humo para área de servidores.',
    brand: 'Honeywell',
    model: 'System Sensor 2W-B',
    type: 'Detector de Humo',
    serial: 'SN-HON-11223',
    client: 'Innovate Co.',
    system: 'Sistema de Detección de Incendios',
    location: 'Oficina Principal',
    status: 'En Mantenimiento' as const,
    maintenanceStartDate: '2024-07-01',
    maintenancePeriodicity: 'Semestral',
    imageUrl: '',
    ipAddress: '',
    configUser: '',
    configPassword: '',
  },
    {
    id: '4',
    name: 'Barrera Infrarroja Perimetral',
    alias: 'Barrera Barda Norte',
    description: 'Barrera de 4 haces para protección de barda perimetral.',
    brand: 'Optex',
    model: 'SL-200QN',
    type: 'Barrera IR',
    serial: 'SN-OPT-44556',
    client: 'Guardianes Nocturnos Ltda.',
    system: 'Alarma de Intrusión Perimetral',
    location: 'Almacén Norte',
    status: 'Inactivo' as const,
    maintenanceStartDate: '2022-05-10',
    maintenancePeriodicity: 'Anual',
    imageUrl: 'https://placehold.co/400x300.png',
    ipAddress: '192.168.2.50',
    configUser: 'service',
    configPassword: 'password',
  },
];

export const mockProtocols = [
  {
    equipmentId: '1', // Cámara Domo PTZ
    id: 'proto-1',
    steps: [
      { step: 'Revisar y limpiar la carcasa exterior y el domo.', priority: 'alta' as const, percentage: 10, completion: 0, notes: '', imageUrl: '' },
      { step: 'Verificar el movimiento PTZ (paneo, inclinación, zoom) en todo su rango.', priority: 'alta' as const, percentage: 25, completion: 0, notes: '', imageUrl: '' },
      { step: 'Comprobar la nitidez de la imagen y el enfoque automático.', priority: 'media' as const, percentage: 20, completion: 0, notes: '', imageUrl: '' },
      { step: 'Asegurar que la conexión de red y alimentación esté firme.', priority: 'baja' as const, percentage: 15, completion: 0, notes: '', imageUrl: '' },
      { step: 'Actualizar firmware si hay una nueva versión disponible.', priority: 'media' as const, percentage: 30, completion: 0, notes: '', imageUrl: '' },
    ]
  },
  {
    equipmentId: '2', // Lector de Tarjetas RFID
    id: 'proto-2',
    steps: [
        { step: 'Limpiar la superficie del lector con un paño suave.', priority: 'baja' as const, percentage: 20, completion: 0, notes: '', imageUrl: '' },
        { step: 'Probar la lectura con varias tarjetas de prueba.', priority: 'alta' as const, percentage: 40, completion: 0, notes: '', imageUrl: '' },
        { step: 'Verificar que los LEDs indicadores (acceso concedido/denegado) funcionen.', priority: 'media' as const, percentage: 30, completion: 0, notes: '', imageUrl: '' },
        { step: 'Inspeccionar el cableado por posibles daños.', priority: 'baja' as const, percentage: 10, completion: 0, notes: '', imageUrl: '' },
    ]
  }
];

export const mockCedulas = [
  {
    id: '1',
    folio: 'C-2024-001',
    client: 'Acme Corp',
    equipment: 'Cámara Domo PTZ',
    technician: 'Blanca (Técnico)',
    supervisor: 'Supervisor General',
    creationDate: '2024-07-20T10:30:00',
    status: 'Pendiente' as const,
    description: 'Revisión trimestral de la cámara de la entrada principal.',
    protocolSteps: (mockProtocols.find(p => p.equipmentId === '1')?.steps || []).map(step => ({
        step: step.step,
        priority: step.priority,
        completion: 0,
        imageUrl: '',
        notes: '',
        percentage: 0,
    })),
    semaforo: '' as const,
  },
  {
    id: '2',
    folio: 'C-2024-002',
    client: 'Soluciones Tech',
    equipment: 'Lector de Tarjetas RFID',
    technician: 'Carlos (Técnico)',
    supervisor: 'Supervisor General',
    creationDate: '2024-07-18T14:00:00',
    status: 'Completada' as const,
    description: 'Cambio de batería y limpieza de lector.',
    protocolSteps: (mockProtocols.find(p => p.equipmentId === '2')?.steps || []).map(step => ({
        step: step.step,
        priority: step.priority,
        completion: 100,
        imageUrl: 'https://placehold.co/400x300.png',
        notes: 'Protocolo completado sin incidencias.',
        percentage: 100,
    })),
    semaforo: 'Verde' as const,
  },
  {
    id: '3',
    folio: 'C-2024-003',
    client: 'Innovate Co.',
    equipment: 'Detector de Humo Fotoeléctrico',
    technician: 'Blanca (Técnico)',
    supervisor: 'Supervisor General',
    creationDate: '2024-07-15T09:00:00',
    status: 'En Progreso' as const,
    description: 'Pruebas de funcionamiento y limpieza de sensores.',
    protocolSteps: [],
    semaforo: 'Naranja' as const,
  },
  {
    id: '4',
    folio: 'C-2024-004',
    client: 'Guardianes Nocturnos Ltda.',
    equipment: 'Barrera Infrarroja Perimetral',
    technician: 'Carlos (Técnico)',
    supervisor: 'Supervisor General',
    creationDate: '2024-07-21T16:45:00',
    status: 'Pendiente' as const,
    description: 'Alineación de haces infrarrojos y prueba de alcance.',
    protocolSteps: [],
    semaforo: '' as const,
  },
];
