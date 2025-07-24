
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { usePermissions } from '@/hooks/use-permissions';
import { User } from '@/lib/services';
import { useData } from '@/hooks/use-data-provider';

type Permissions = User['permissions'];
type ModuleKey = keyof Permissions;
type ActionKey = keyof Permissions[ModuleKey];

const roleToValueMap: { [key: string]: string } = {
  'Administrador': 'admin',
  'Técnico': 'tecnico',
  'Supervisor': 'supervisor',
};

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

const defaultPermissionsByRole: { [key: string]: Permissions } = {
  admin: {
    users: { create: true, update: true, delete: true },
    clients: { create: true, update: true, delete: true },
    systems: { create: true, update: true, delete: true },
    equipments: { create: true, update: true, delete: true },
    protocols: { create: true, update: true, delete: true },
    cedulas: { create: true, update: true, delete: true },
  },
  supervisor: {
    users: { create: false, update: false, delete: false },
    clients: { create: true, update: true, delete: false },
    systems: { create: true, update: true, delete: false },
    equipments: { create: true, update: true, delete: false },
    protocols: { create: true, update: true, delete: true },
    cedulas: { create: true, update: true, delete: true },
  },
  tecnico: {
    users: { create: false, update: false, delete: false },
    clients: { create: false, update: false, delete: false },
    systems: { create: false, update: false, delete: false },
    equipments: { create: false, update: true, delete: false },
    protocols: { create: true, update: true, delete: false },
    cedulas: { create: true, update: true, delete: false },
  },
};

const modules: { key: ModuleKey; label: string }[] = [
  { key: 'users', label: 'Usuarios' },
  { key: 'clients', label: 'Clientes' },
  { key: 'systems', label: 'Sistemas' },
  { key: 'equipments', label: 'Equipos' },
  { key: 'protocols', label: 'Protocolos' },
  { key: 'cedulas', label: 'Cédulas' },
];

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { can } = usePermissions();
  const { users, updateUser, loading: dataLoading } = useData();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [permissions, setPermissions] = useState<Permissions>(initialPermissions);
  
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!dataLoading && userId) {
        const foundUser = users.find(u => u.id === userId);
        if (foundUser) {
            setName(foundUser.name);
            setEmail(foundUser.email);
            setRole(roleToValueMap[foundUser.role] || '');
            setPermissions(foundUser.permissions || initialPermissions);
            setLoading(false);
        } else {
            setNotFound(true);
            setLoading(false);
        }
    }
  }, [userId, users, dataLoading]);

  const handlePermissionChange = (module: ModuleKey, action: ActionKey, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: value,
      },
    }));
  };
  
  const handleRoleChange = (newRoleValue: string) => {
    setRole(newRoleValue);
    const newPermissions = defaultPermissionsByRole[newRoleValue] || initialPermissions;
    setPermissions(newPermissions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
        alert('Las nuevas contraseñas no coinciden.');
        return;
    }
    
    setIsSaving(true);

    try {
        const updatedData: Partial<User> = {
            name,
            email,
            role: valueToRoleMap[role],
            permissions,
        };
        if (password) {
            updatedData.password = password;
        }

        await updateUser(userId, updatedData);
        alert('Usuario actualizado con éxito.');
        router.push('/dashboard/users');
    } catch (error) {
        console.error("Failed to update user:", error);
        alert("Error al actualizar el usuario.");
    } finally {
        setIsSaving(false);
    }
  }

  const canUpdateUsers = can('update', 'users');

  if (loading || dataLoading) {
    return (
       <div className="mx-auto grid max-w-4xl auto-rows-max items-start gap-4 lg:gap-8">
        <div className="flex items-center gap-4">
           <Button variant="outline" size="icon" className="h-7 w-7" disabled>
             <ArrowLeft className="h-4 w-4" />
             <span className="sr-only">Atrás</span>
           </Button>
          <div className="grid gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label>Nombre Completo</Label>
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid gap-3">
                <Label>Email</Label>
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid gap-3">
                <Label>Rol</Label>
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Permisos de Acceso</CardTitle>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-64 w-full" />
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <Skeleton className="h-10 w-32" />
            </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center h-full mt-10">
         <h1 className="text-2xl font-bold">Usuario no encontrado</h1>
         <p className="text-muted-foreground">No se pudo encontrar al usuario que buscas.</p>
         <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
         </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mx-auto grid max-w-4xl auto-rows-max items-start gap-4 lg:gap-8">
        <div className="flex items-center gap-4">
           <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()} disabled={isSaving}>
             <ArrowLeft className="h-4 w-4" />
             <span className="sr-only">Atrás</span>
           </Button>
           <div className="grid gap-0.5">
             <h1 className="font-headline text-2xl font-bold">Editar Usuario</h1>
             <p className="text-muted-foreground">Modifique los datos y permisos del usuario.</p>
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
                <Input id="nombre" value={name} onChange={(e) => setName(e.target.value)} required disabled={!canUpdateUsers || isSaving} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={!canUpdateUsers || isSaving} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="rol">Rol</Label>
                 <Select value={role} onValueChange={handleRoleChange} required disabled={!canUpdateUsers || isSaving}>
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
              <Separator />
               <div className="grid gap-3">
                <Label htmlFor="password">Nueva Contraseña (opcional)</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Dejar en blanco para no cambiar" disabled={!canUpdateUsers || isSaving}/>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={!canUpdateUsers || isSaving} />
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
                                        checked={permissions[module.key]?.create}
                                        onCheckedChange={(checked) => handlePermissionChange(module.key, 'create', !!checked)}
                                        disabled={!canUpdateUsers || isSaving}
                                    />
                                </TableCell>
                                <TableCell className="text-center">
                                     <Checkbox
                                        checked={permissions[module.key]?.update}
                                        onCheckedChange={(checked) => handlePermissionChange(module.key, 'update', !!checked)}
                                        disabled={!canUpdateUsers || isSaving}
                                    />
                                </TableCell>
                                <TableCell className="text-center">
                                     <Checkbox
                                        checked={permissions[module.key]?.delete}
                                        onCheckedChange={(checked) => handlePermissionChange(module.key, 'delete', !!checked)}
                                        disabled={!canUpdateUsers || isSaving}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            {canUpdateUsers && (
                <CardFooter className="border-t px-6 py-4">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </CardFooter>
            )}
        </Card>
      </div>
    </form>
  );
}
