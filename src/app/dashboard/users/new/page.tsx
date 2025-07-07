
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import { mockUsers } from '@/lib/mock-data';

const USERS_STORAGE_KEY = 'guardian_shield_users';
type User = typeof mockUsers[0];
type Permissions = User['permissions'];
type ModuleKey = keyof Permissions;
type ActionKey = keyof Permissions[ModuleKey];

const valueToRoleMap: { [key: string]: string } = {
  'admin': 'Administrador',
  'tecnico': 'Técnico',
  'supervisor': 'Supervisor',
};

const initialPermissions: Permissions = {
  users: { create: false, update: false, delete: false },
  clients: { create: false, update: false, delete: false },
  systems: { create: false, update: false, delete: false },
  equipments: { create: false, update: false, delete: false },
  protocols: { create: false, update: false, delete: false },
  cedulas: { create: false, update: false, delete: false },
};

const modules: { key: ModuleKey; label: string }[] = [
  { key: 'users', label: 'Usuarios' },
  { key: 'clients', label: 'Clientes' },
  { key: 'systems', label: 'Sistemas' },
  { key: 'equipments', label: 'Equipos' },
  { key: 'protocols', label: 'Protocolos' },
  { key: 'cedulas', label: 'Cédulas' },
];

export default function NewUserPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [permissions, setPermissions] = useState<Permissions>(initialPermissions);

  const handlePermissionChange = (module: ModuleKey, action: ActionKey, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !role || !password) {
      alert('Por favor, complete todos los campos.');
      return;
    }

    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden.');
        return;
    }

    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    let users: User[] = storedUsers ? JSON.parse(storedUsers) : [];

    const newUser: User = {
      id: new Date().getTime().toString(),
      name,
      email,
      role: valueToRoleMap[role],
      password,
      permissions,
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    alert('Usuario creado con éxito.');
    router.push('/dashboard/users');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mx-auto grid max-w-4xl auto-rows-max items-start gap-4 lg:gap-8">
        <div className="flex items-center gap-4">
           <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
             <ArrowLeft className="h-4 w-4" />
             <span className="sr-only">Atrás</span>
           </Button>
           <div className="grid gap-0.5">
            <h1 className="font-headline text-2xl font-bold">Crear Nuevo Usuario</h1>
            <p className="text-muted-foreground">
                Complete los datos para agregar un nuevo usuario al sistema.
            </p>
           </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input id="nombre" placeholder="Ej. Juan Pérez" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="ejemplo@correo.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="rol">Rol</Label>
                 <Select onValueChange={setRole} value={role} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
               <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Permisos de Acceso</CardTitle>
                <CardDescription>
                    Seleccione las acciones que este usuario podrá realizar en cada módulo.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Módulo</TableHead>
                            <TableHead className="text-center">Crear</TableHead>
                            <TableHead className="text-center">Modificar</TableHead>
                            <TableHead className="text-center">Eliminar</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {modules.map(module => (
                            <TableRow key={module.key}>
                                <TableCell className="font-medium">{module.label}</TableCell>
                                <TableCell className="text-center">
                                    <Checkbox
                                        checked={permissions[module.key].create}
                                        onCheckedChange={(checked) => handlePermissionChange(module.key, 'create', !!checked)}
                                    />
                                </TableCell>
                                <TableCell className="text-center">
                                     <Checkbox
                                        checked={permissions[module.key].update}
                                        onCheckedChange={(checked) => handlePermissionChange(module.key, 'update', !!checked)}
                                    />
                                </TableCell>
                                <TableCell className="text-center">
                                     <Checkbox
                                        checked={permissions[module.key].delete}
                                        onCheckedChange={(checked) => handlePermissionChange(module.key, 'delete', !!checked)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <Button type="submit">Guardar Usuario</Button>
            </CardFooter>
        </Card>
      </div>
    </form>
  );
}
