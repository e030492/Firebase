
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Client, Almacen, User } from '@/lib/services';
import { useData } from '@/hooks/use-data-provider';
import { Switch } from '@/components/ui/switch';

const defaultPermissionsByRole: { [key: string]: User['permissions'] } = {
  cliente: {
    users: { create: false, update: false, delete: false },
    clients: { create: false, update: false, delete: false },
    systems: { create: false, update: false, delete: false },
    equipments: { create: false, update: false, delete: false },
    protocols: { create: false, update: false, delete: false },
    cedulas: { create: false, update: false, delete: false },
  },
};

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const { clients, users, createUser, updateUser: updateUserClient, updateClient, loading: dataLoading } = useData();
  
  const [name, setName] = useState('');
  const [responsable, setResponsable] = useState('');
  const [direccion, setDireccion] = useState('');
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [almacenes, setAlmacenes] = useState<Almacen[]>([
    { nombre: '', direccion: '' },
    { nombre: '', direccion: '' }
  ]);
  
  const [generateUserAccess, setGenerateUserAccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [existingUser, setExistingUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    if (!dataLoading && clientId) {
      const foundClient = clients.find(c => c.id === clientId);
      const foundUser = users.find(u => u.clientId === clientId);
      
      if (foundUser) {
          setExistingUser(foundUser);
          setGenerateUserAccess(true);
          setUserEmail(foundUser.email);
      }

      if (foundClient) {
        setName(foundClient.name);
        setResponsable(foundClient.responsable);
        setDireccion(foundClient.direccion);
        setPhone1(foundClient.phone1 || '');
        setPhone2(foundClient.phone2 || '');
        const clientAlmacenes = foundClient.almacenes || [];
        const displayAlmacenes: Almacen[] = [
            { nombre: '', direccion: '' },
            { nombre: '', direccion: '' },
        ];
        if (clientAlmacenes[0]) {
            displayAlmacenes[0] = { 
                nombre: clientAlmacenes[0].nombre,
                direccion: clientAlmacenes[0].direccion, 
            };
        }
        if (clientAlmacenes[1]) {
            displayAlmacenes[1] = { 
                nombre: clientAlmacenes[1].nombre,
                direccion: clientAlmacenes[1].direccion, 
            };
        }
        setAlmacenes(displayAlmacenes);
        setLoading(false);
      } else {
        setNotFound(true);
        setLoading(false);
      }
    }
  }, [clientId, clients, users, dataLoading]);

  const handleAlmacenChange = (index: number, field: keyof Almacen, value: string) => {
    const newAlmacenes = [...almacenes];
    (newAlmacenes[index] as any)[field] = value;
    setAlmacenes(newAlmacenes);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generateUserAccess && !userEmail) {
        alert("Por favor, ingrese el email para la cuenta del cliente.");
        return;
    }
    setIsSaving(true);
    
    try {
        const almacenesToSave = almacenes
            .filter(a => a.nombre.trim() !== '')
            .map(a => ({
                nombre: a.nombre,
                direccion: a.direccion,
            }));

        const updatedData: Partial<Client> = {
            name,
            responsable,
            direccion,
            phone1,
            phone2,
            almacenes: almacenesToSave,
        };

        await updateClient(clientId, updatedData);
        
        if (generateUserAccess) {
            if (existingUser) {
                // Update existing user
                const userUpdateData: Partial<User> = { email: userEmail };
                if (userPassword) {
                    userUpdateData.password = userPassword;
                }
                await updateUserClient(existingUser.id, userUpdateData);
            } else {
                // Create new user
                 if (!userPassword) {
                    alert('Por favor, ingrese una contraseña para el nuevo usuario cliente.');
                    setIsSaving(false);
                    return;
                }
                const newUserForClient: Omit<User, 'id'> = {
                    name: `${name} (Cliente)`,
                    email: userEmail,
                    password: userPassword,
                    role: 'Cliente',
                    permissions: defaultPermissionsByRole.cliente,
                    clientId: clientId,
                    photoUrl: null,
                    signatureUrl: null
                };
                await createUser(newUserForClient);
            }
        }

        alert('Cliente actualizado con éxito.');
        router.push('/dashboard/clients');
    } catch (error) {
        console.error("Failed to update client:", error);
        alert("Error al actualizar el cliente.");
    } finally {
        setIsSaving(false);
    }
  }

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
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                        <Label>Nombre del Cliente</Label>
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="grid gap-3">
                        <Label>Contacto Responsable</Label>
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
                <div className="grid gap-3">
                    <Label>Dirección Principal</Label>
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Almacenes</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                        <Label>Nombre Almacén 1</Label>
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="grid gap-3">
                        <Label>Dirección Almacén 1</Label>
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
                <Separator />
                <div className="grid md:grid-cols-2 gap-4">
                     <div className="grid gap-3">
                        <Label>Nombre Almacén 2</Label>
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="grid gap-3">
                        <Label>Dirección Almacén 2</Label>
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Acceso para el Cliente</CardTitle>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-24 w-full" />
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
         <h1 className="text-2xl font-bold">Cliente no encontrado</h1>
         <p className="text-muted-foreground">No se pudo encontrar al cliente que buscas.</p>
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
             <h1 className="font-headline text-2xl font-bold">Editar Cliente</h1>
             <p className="text-muted-foreground">Modifique los datos del cliente.</p>
           </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="nombre">Nombre del Cliente</Label>
                  <Input id="nombre" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSaving} />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="responsable">Contacto Responsable</Label>
                  <Input id="responsable" value={responsable} onChange={(e) => setResponsable(e.target.value)} required disabled={isSaving}/>
                </div>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="direccion">Dirección Principal</Label>
                <Input id="direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} required disabled={isSaving}/>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-3">
                    <Label htmlFor="phone1">Teléfono de Contacto 1</Label>
                    <Input id="phone1" value={phone1} onChange={e => setPhone1(e.target.value)} placeholder="Ej. 55-1234-5678" disabled={isSaving} />
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="phone2">Teléfono de Contacto 2</Label>
                    <Input id="phone2" value={phone2} onChange={e => setPhone2(e.target.value)} placeholder="Ej. 55-8765-4321" disabled={isSaving}/>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Almacenes</CardTitle>
            <CardDescription>
              Información de los almacenes o ubicaciones del cliente.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {almacenes.map((almacen, index) => (
              <div key={index}>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor={`almacen${index + 1}`}>Nombre Almacén {index + 1}</Label>
                      <Input id={`almacen${index + 1}`} value={almacen.nombre} onChange={(e) => handleAlmacenChange(index, 'nombre', e.target.value)} placeholder={`Ej. Almacén ${index === 0 ? 'Central' : 'Secundario'}`} disabled={isSaving}/>
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor={`direccion_almacen${index + 1}`}>Dirección Almacén {index + 1}</Label>
                      <Input id={`direccion_almacen${index + 1}`} value={almacen.direccion} onChange={(e) => handleAlmacenChange(index, 'direccion', e.target.value)} placeholder="Dirección completa del almacén" disabled={isSaving}/>
                    </div>
                  </div>
                </div>
                {index < almacenes.length - 1 && <Separator className="mt-6"/>}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Acceso para el Cliente</CardTitle>
                <CardDescription>
                    Active o modifique la cuenta de usuario para que el cliente pueda ver su propia información.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="generate-access"
                        checked={generateUserAccess}
                        onCheckedChange={setGenerateUserAccess}
                        disabled={isSaving}
                    />
                    <Label htmlFor="generate-access">
                        {existingUser ? "Modificar acceso del cliente" : "Generar acceso al sistema para este cliente"}
                    </Label>
                </div>
                {generateUserAccess && (
                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                        <div className="grid gap-3">
                            <Label htmlFor="userEmail">Email del Cliente</Label>
                            <Input
                                id="userEmail"
                                type="email"
                                placeholder="cliente@ejemplo.com"
                                value={userEmail}
                                onChange={(e) => setUserEmail(e.target.value)}
                                required={generateUserAccess}
                                disabled={isSaving}
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="userPassword">Contraseña</Label>
                            <Input
                                id="userPassword"
                                type="password"
                                placeholder={existingUser ? "Dejar en blanco para no cambiar" : "Contraseña segura"}
                                value={userPassword}
                                onChange={(e) => setUserPassword(e.target.value)}
                                required={!existingUser && generateUserAccess}
                                disabled={isSaving}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
            </CardFooter>
        </Card>
      </div>
    </form>
  );
}
