"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
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
import { ArrowLeft, Camera, User as UserIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { usePermissions } from '@/hooks/use-permissions';
import { User, Client } from '@/lib/services';
import { useData } from '@/hooks/use-data-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type Permissions = User['permissions'];
type ModuleKey = keyof Permissions;
type ActionKey = keyof Permissions[ModuleKey];

const roleToValueMap: { [key: string]: string } = {
  'Administrador': 'admin',
  'Técnico': 'tecnico',
  'Supervisor': 'supervisor',
  'Cliente': 'cliente',
};

const valueToRoleMap: { [key: string]: string } = {
  'admin': 'Administrador',
  'tecnico': 'Técnico',
  'supervisor': 'Supervisor',
  'cliente': 'Cliente',
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
    clients: { create: true, update: true, delete: false }, // Ajustado de ejemplo
    systems: { create: true, update: true, delete: false }, // Ajustado de ejemplo
    equipments: { create: true, update: true, delete: false }, // Ajustado de ejemplo
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
    equipments: { create: false, update: false, delete: false },
    protocols: { create: true, update: true, delete: false },
    cedulas: { create: true, update: true, delete: false },
  },
  cliente: {
    users: { create: false, update: false, delete: false },
    clients: { create: false, update: false, delete: false },
    systems: { create: false, update: false, delete: false },
    equipments: { create: false, update: false, delete: false },
    protocols: { create: false, update: false, delete: false },
    cedulas: { create: false, update: false, delete: false },
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
  const { users, clients, updateUser, loading: dataLoading } = useData();
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [permissions, setPermissions] = useState<Permissions>(initialPermissions);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>('');
  
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
            setSignatureUrl(foundUser.signatureUrl || null);
            setPhotoUrl(foundUser.photoUrl || null);
            setSelectedClientId(foundUser.clientId);
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
    // Reset selectedClientId when role changes if it's not 'cliente'
    if (newRoleValue !== 'cliente') {
        setSelectedClientId(undefined);
    }
  };
  
  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatureUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
            signatureUrl: signatureUrl || null,
            photoUrl: photoUrl || null,
        };

        if (role === 'cliente') {
            updatedData.clientId = selectedClientId || '';
        } else {
            // Ensure clientId is not part of the update if the role is not 'cliente'
            // This prevents sending `undefined` to Firestore.
            delete (updatedData as Partial<User & { clientId: any }>).clientId;
        }

        if (password) {
            updatedData.password = password;
        }

        await updateUser(userId, updatedData); // Se pasa updatedData a updateUser
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
                <Label>Foto de Perfil</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={photoUrl || undefined} alt={name} data-ai-hint="user photo" />
                    <AvatarFallback><UserIcon className="h-10 w-10" /></AvatarFallback>
                  </Avatar>
                  <div>
                  <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()} disabled={!canUpdateUsers || isSaving}>
                    <Camera className="mr-2 h-4 w-4" />
                    Subir Foto
                  </Button>
                  </div>

                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    ref={photoInputRef}
                    onChange={handlePhotoChange}
                    className="hidden"
                    disabled={!canUpdateUsers || isSaving}
                  />
                </div>
              </div>
              <Separator/>
              <div className="grid gap-3">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input id="nombre" value={name} onChange={(e) => setName(e.target.value)} required disabled={!canUpdateUsers || isSaving} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={!canUpdateUsers || isSaving} />
              </div>
               <div className="grid md:grid-cols-2 gap-4">
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
                      <SelectItem value="cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                 {role === 'cliente' && (
                    <div className="grid gap-3">
                        <Label htmlFor="cliente">Cliente Asociado</Label>
                        <Select onValueChange={setSelectedClientId} value={selectedClientId} required={role === 'cliente'} disabled={!canUpdateUsers || isSaving}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione un cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
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
              <Separator />
              <div className="grid gap-3">
                <Label>Firma del Usuario</Label>
                <div className="w-full aspect-[2/1] bg-muted rounded-md flex items-center justify-center p-2 border">
                    {signatureUrl ? (
                        <Image src={signatureUrl} alt="Firma del usuario" width={300} height={150} data-ai-hint="user signature" className="object-contain" />
                    ) : (
                        <p className="text-sm text-muted-foreground">Sin firma</p>
                    )}
                </div>
                 <div>
                    <Button type="button" variant="outline" onClick={() => signatureInputRef.current?.click()} disabled={!canUpdateUsers || isSaving}>
                        <Camera className="mr-2 h-4 w-4" />
                        {signatureUrl ? 'Cambiar Firma' : 'Subir Firma'}
                    </Button>
                </div>
                <Input
                    id="signature-upload"
                    type="file"
                    accept="image/*"
                    ref={signatureInputRef}
                    onChange={handleSignatureChange}
                    className="hidden"
                    disabled={!canUpdateUsers || isSaving}
                />
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
                                        disabled={!canUpdateUsers || isSaving || role === 'cliente'}
                                    />
                                </TableCell>
                                <TableCell className="text-center">
                                     <Checkbox
                                        checked={permissions[module.key]?.update}
                                        onCheckedChange={(checked) => handlePermissionChange(module.key, 'update', !!checked)}
                                        disabled={!canUpdateUsers || isSaving || role === 'cliente'}
                                    />
                                </TableCell>
                                <TableCell className="text-center">
                                     <Checkbox
                                        checked={permissions[module.key]?.delete}
                                        onCheckedChange={(checked) => handlePermissionChange(module.key, 'delete', !!checked)}
                                        disabled={!canUpdateUsers || isSaving || role === 'cliente'}
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
