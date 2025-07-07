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
    imageUrl: 'https://placehold.co/400x300.png',
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
    imageUrl: 'https://placehold.co/400x300.png',
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
    imageUrl: '',
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
    imageUrl: 'https://placehold.co/400x300.png',
  },
];

export const mockCedulas = [
  {
    id: '1',
    folio: 'C-2024-001',
    client: 'Acme Corp',
    equipment: 'Cámara Domo PTZ',
    technician: 'Technician Uno',
    creationDate: '2024-07-20',
    status: 'Pendiente' as const,
    description: 'Revisión trimestral de la cámara de la entrada principal.'
  },
  {
    id: '2',
    folio: 'C-2024-002',
    client: 'Soluciones Tech',
    equipment: 'Lector de Tarjetas RFID',
    technician: 'Technician Dos',
    creationDate: '2024-07-18',
    status: 'Completada' as const,
    description: 'Cambio de batería y limpieza de lector.'
  },
  {
    id: '3',
    folio: 'C-2024-003',
    client: 'Innovate Co.',
    equipment: 'Detector de Humo Fotoeléctrico',
    technician: 'Technician Uno',
    creationDate: '2024-07-15',
    status: 'En Progreso' as const,
    description: 'Pruebas de funcionamiento y limpieza de sensores.'
  },
  {
    id: '4',
    folio: 'C-2024-004',
    client: 'Guardianes Nocturnos Ltda.',
    equipment: 'Barrera Infrarroja Perimetral',
    technician: 'Technician Dos',
    creationDate: '2024-07-21',
    status: 'Pendiente' as const,
    description: 'Alineación de haces infrarrojos y prueba de alcance.'
  },
];

export const mockProtocols = [
  {
    equipmentId: '1', // Cámara Domo PTZ
    steps: [
      { step: 'Revisar y limpiar la carcasa exterior y el domo.', priority: 'alta' as const, percentage: 10, imageUrl: 'https://placehold.co/400x300.png' },
      { step: 'Verificar el movimiento PTZ (paneo, inclinación, zoom) en todo su rango.', priority: 'alta' as const, percentage: 25, imageUrl: '' },
      { step: 'Comprobar la nitidez de la imagen y el enfoque automático.', priority: 'media' as const, percentage: 20, imageUrl: '' },
      { step: 'Asegurar que la conexión de red y alimentación esté firme.', priority: 'baja' as const, percentage: 15, imageUrl: '' },
      { step: 'Actualizar firmware si hay una nueva versión disponible.', priority: 'media' as const, percentage: 30, imageUrl: 'https://placehold.co/400x300.png' },
    ]
  },
  {
    equipmentId: '2', // Lector de Tarjetas RFID
    steps: [
        { step: 'Limpiar la superficie del lector con un paño suave.', priority: 'baja' as const, percentage: 20, imageUrl: '' },
        { step: 'Probar la lectura con varias tarjetas de prueba.', priority: 'alta' as const, percentage: 40, imageUrl: '' },
        { step: 'Verificar que los LEDs indicadores (acceso concedido/denegado) funcionen.', priority: 'media' as const, percentage: 30, imageUrl: '' },
        { step: 'Inspeccionar el cableado por posibles daños.', priority: 'baja' as const, percentage: 10, imageUrl: '' },
    ]
  }
];
