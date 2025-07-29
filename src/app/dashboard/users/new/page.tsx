
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { User, Client } from '@/lib/services';
import { useData } from '@/hooks/use-data-provider';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type Permissions = User['permissions'];
type ModuleKey = keyof Permissions;
type ActionKey = keyof Permissions[ModuleKey];

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

export default function NewUserPage() {
  const router = useRouter();
  const { createUser, clients, users } = useData();
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
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (email && users.some(user => user.email === email)) {
      setEmailError('Este correo electrónico ya está registrado.');
    } else {
      setEmailError('');
    }
  }, [email, users]);

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
    setSelectedClientId('');
    const newPermissions = defaultPermissionsByRole[newRoleValue] || initialPermissions;
    setPermissions(newPermissions);
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
    
    if (emailError) {
      alert(emailError);
      return;
    }

    if (!name || !email || !role || !password) {
      alert('Por favor, complete todos los campos.');
      return;
    }
    if (role === 'cliente' && !selectedClientId) {
      alert('Por favor, seleccione un cliente para asociar a este usuario.');
      return;
    }

    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden.');
        return;
    }
    
    setLoading(true);

    try {
        const newUser: Omit<User, 'id'> = {
            name,
            email,
            role: valueToRoleMap[role] as User['role'],
            password,
            permissions,
            signatureUrl: signatureUrl || null,
            photoUrl: photoUrl || null,
            clientId: role === 'cliente' && selectedClientId ? selectedClientId : undefined,
        };

        await createUser(newUser);
        alert('Usuario creado con éxito.');
        router.push('/dashboard/users');
    } catch (error: any) {
        console.error("Failed to create user:", error);
        if (error.code === 'auth/email-already-in-use') {
            setEmailError('Este correo electrónico ya está en uso.');
            alert('Error: El correo electrónico que ha ingresado ya está en uso. Por favor, utilice otro.');
        } else {
            alert("Error al crear el usuario. Revise la consola para más detalles.");
        }
    } finally {
        setLoading(false);
    }
  };

  const isSubmitDisabled = loading || !!emailError;

  return (
    <form onSubmit={handleSubmit}>
      <div className="mx-auto grid max-w-4xl auto-rows-max items-start gap-4 lg:gap-8">
        <div className="flex items-center gap-4">
           <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()} disabled={loading}>
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
                <Label>Foto de Perfil</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={photoUrl || undefined} alt={name} data-ai-hint="user photo" />
                    <AvatarFallback><UserIcon className="h-10 w-10" /></AvatarFallback>
                  </Avatar>
                  <div>
                    <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()} disabled={loading}>
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
                    disabled={loading}
                  />
                </div>
              </div>
              <Separator />
              <div className="grid gap-3">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input id="nombre" placeholder="Ej. Juan Pérez" value={name} onChange={e => setName(e.target.value)} required disabled={loading} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="ejemplo@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                {emailError && <p className="text-sm text-destructive">{emailError}</p>}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="rol">Rol</Label>
                   <Select onValueChange={handleRoleChange} value={role} required disabled={loading}>
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
                        <Select onValueChange={setSelectedClientId} value={selectedClientId} required={role === 'cliente'} disabled={loading}>
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
              <div className="grid gap-3">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
              </div>
               <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={loading} />
              </div>
              <Separator/>
              <div className="grid gap-3">
                <Label>Firma del Usuario</Label>
                <div className="w-full aspect-[2/1] bg-muted rounded-md flex items-center justify-center p-2 border">
                    {signatureUrl ? (
                        <Image src={signatureUrl} alt="Firma del usuario" width={300} height={150} data-ai-hint="user signature" className="object-contain" />
                    ) : (
                        <p className="text-sm text-muted-foreground">Vista previa de la firma</p>
                    )}
                </div>
                <div>
                  <Button type="button" variant="outline" onClick={() => signatureInputRef.current?.click()} disabled={loading}>
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
                    disabled={loading}
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
                                        checked={permissions[module.key].create}
                                        onCheckedChange={(checked) => handlePermissionChange(module.key, 'create', !!checked)}
                                        disabled={loading || role === 'cliente'}
                                    />
                                </TableCell>
                                <TableCell className="text-center">
                                     <Checkbox
                                        checked={permissions[module.key].update}
                                        onCheckedChange={(checked) => handlePermissionChange(module.key, 'update', !!checked)}
                                        disabled={loading || role === 'cliente'}
                                    />
                                </TableCell>
                                <TableCell className="text-center">
                                     <Checkbox
                                        checked={permissions[module.key].delete}
                                        onCheckedChange={(checked) => handlePermissionChange(module.key, 'delete', !!checked)}
                                        disabled={loading || role === 'cliente'}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={isSubmitDisabled}>
                  {loading ? "Guardando..." : "Guardar Usuario"}
                </Button>
            </CardFooter>
        </Card>
      </div>
    </form>
  );
}
