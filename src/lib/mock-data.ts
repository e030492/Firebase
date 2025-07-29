
export const ACTIVE_USER_STORAGE_KEY = 'guardian_shield_active_user';

// This is the single source of truth for the initial admin user.
// The password is used only for the initial creation in Firebase Auth.
export const adminUser = {
  id: 'admin@escuadramx.com', // Using email as a stable ID for seeding
  name: 'Administrador Principal',
  email: 'admin@escuadramx.com',
  role: 'Administrador' as const,
  password: 'admin123',
  signatureUrl: '',
  photoUrl: '',
  permissions: {
      clients: { create: true, update: true, delete: true },
      equipments: { create: true, update: true, delete: true },
      systems: { create: true, update: true, delete: true },
      users: { create: true, update: true, delete: true },
      protocols: { create: true, update: true, delete: true },
      cedulas: { create: true, update: true, delete: true },
  }
};
