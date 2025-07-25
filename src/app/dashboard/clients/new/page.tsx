
"use client";
import { useState, useRef } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Upload, FileText, Trash2, Camera } from 'lucide-react';
import { Client, User } from '@/lib/services';
import type { Almacen } from '@/lib/services';
import { useData } from '@/hooks/use-data-provider';
import { Switch } from '@/components/ui/switch';

type Plano = {
  url: string;
  name: string;
  size: number;
};

type AlmacenWithPhotos = Omit<Almacen, 'planos' | 'photoUrl'> & { 
    planos: Plano[], 
    photoUrl?: string 
};

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

export default function NewClientPage() {
  const router = useRouter();
  const { createClient, createUser } = useData();
  const [name, setName] = useState('');
  const [responsable, setResponsable] = useState('');
  const [direccion, setDireccion] = useState('');
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [officePhotoUrl, setOfficePhotoUrl] = useState<string | null>(null);
  const [almacenes, setAlmacenes] = useState<AlmacenWithPhotos[]>([
    { nombre: '', direccion: '', planos: [], photoUrl: '' },
    { nombre: '', direccion: '', planos: [], photoUrl: '' }
  ]);
  
  const [generateUserAccess, setGenerateUserAccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const officePhotoInputRef = useRef<HTMLInputElement>(null);
  const almacenPhotoInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];


  const handleAlmacenChange = (index: number, field: keyof Omit<Almacen, 'planos' | 'photoUrl'>, value: string) => {
    const newAlmacenes = [...almacenes];
    newAlmacenes[index] = { ...newAlmacenes[index], [field]: value };
    setAlmacenes(newAlmacenes);
  };
  
  const handlePlanoFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const filePromises = Array.from(files).map(file => {
        return new Promise<Plano>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              url: reader.result as string,
              name: file.name,
              size: file.size,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(filePromises).then(newPlanos => {
        const newAlmacenes = [...almacenes];
        const currentPlanos = newAlmacenes[index].planos || [];
        newAlmacenes[index].planos = [...currentPlanos, ...newPlanos];
        setAlmacenes(newAlmacenes);
      });
    }
  };
  
  const removePlano = (almacenIndex: number, planoIndex: number) => {
    const newAlmacenes = [...almacenes];
    newAlmacenes[almacenIndex].planos?.splice(planoIndex, 1);
    setAlmacenes(newAlmacenes);
  };

  const handlePhotoChange = (setter: (url: string | null) => void, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setter(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleAlmacenPhotoChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const newAlmacenes = [...almacenes];
            newAlmacenes[index].photoUrl = reader.result as string;
            setAlmacenes(newAlmacenes);
        };
        reader.readAsDataURL(file);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !responsable || !direccion) {
        alert('Por favor, complete todos los campos obligatorios del cliente.');
        return;
    }
    if (generateUserAccess && (!userEmail || !userPassword)) {
        alert('Por favor, complete el email y la contraseña para el acceso del cliente.');
        return;
    }
    setLoading(true);

    try {
        const almacenesToSave = almacenes
            .filter(a => a.nombre.trim() !== '')
            .map(a => ({
                nombre: a.nombre,
                direccion: a.direccion,
                photoUrl: a.photoUrl || '',
                planos: (a.planos || []).map(p => ({
                    url: p.url,
                    name: p.name,
                    size: p.size,
                }))
            }));

        const newClientData: Omit<Client, 'id'> = {
            name,
            responsable,
            direccion,
            phone1,
            phone2,
            officePhotoUrl: officePhotoUrl || '',
            almacenes: almacenesToSave,
        };

        const newClient = await createClient(newClientData);
        
        if (generateUserAccess && newClient) {
            const newUserForClient: Omit<User, 'id'> = {
                name: `${name} (Cliente)`,
                email: userEmail,
                password: userPassword,
                role: 'Cliente',
                permissions: defaultPermissionsByRole.cliente,
                clientId: newClient.id,
                photoUrl: '',
                signatureUrl: ''
            };
            await createUser(newUserForClient);
        }

        alert('Cliente creado con éxito.');
        router.push('/dashboard/clients');
    } catch (error) {
        console.error("Failed to create client:", error);
        alert("Error al crear el cliente.");
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mx-auto grid max-w-4xl auto-rows-max items-start gap-4 lg:gap-8">
        <div className="flex items-center gap-4">
           <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()} disabled={loading}>
             <ArrowLeft className="h-4 w-4" />
             <span className="sr-only">Atrás</span>
           </Button>
           <div className="grid gap-0.5">
            <h1 className="font-headline text-2xl font-bold">Registrar Nuevo Cliente</h1>
            <p className="text-muted-foreground">
                Complete los datos para agregar un nuevo cliente al sistema.
            </p>
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
                  <Input id="nombre" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Acme Corp" required disabled={loading} />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="responsable">Contacto Responsable</Label>
                  <Input id="responsable" value={responsable} onChange={e => setResponsable(e.target.value)} placeholder="Ej. Juan Pérez" required disabled={loading}/>
                </div>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="direccion">Dirección Principal</Label>
                <Input id="direccion" value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Ej. Av. Siempre Viva 123, Springfield" required disabled={loading}/>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-3">
                    <Label htmlFor="phone1">Teléfono de Contacto 1</Label>
                    <Input id="phone1" value={phone1} onChange={e => setPhone1(e.target.value)} placeholder="Ej. 55-1234-5678" disabled={loading} />
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="phone2">Teléfono de Contacto 2</Label>
                    <Input id="phone2" value={phone2} onChange={e => setPhone2(e.target.value)} placeholder="Ej. 55-8765-4321" disabled={loading}/>
                </div>
              </div>
               <div className="grid gap-3">
                  <Label>Foto de las Oficinas</Label>
                  {officePhotoUrl ? (
                      <Image src={officePhotoUrl} alt="Foto de las oficinas" width={400} height={300} data-ai-hint="client office" className="rounded-md object-cover aspect-video" />
                  ) : (
                      <div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center">
                          <Camera className="h-10 w-10 text-muted-foreground" />
                      </div>
                  )}
                  <Input
                      id="office-photo-upload"
                      type="file"
                      accept="image/*"
                      ref={officePhotoInputRef}
                      onChange={(e) => handlePhotoChange(setOfficePhotoUrl, e)}
                      className="hidden"
                      disabled={loading}
                  />
                  <Button type="button" variant="outline" onClick={() => officePhotoInputRef.current?.click()} disabled={loading}>
                      <Camera className="mr-2 h-4 w-4" />
                      {officePhotoUrl ? 'Cambiar Foto' : 'Subir Foto'}
                  </Button>
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
                      <Input id={`almacen${index + 1}`} value={almacen.nombre} onChange={(e) => handleAlmacenChange(index, 'nombre', e.target.value)} placeholder={`Ej. Almacén ${index === 0 ? 'Central' : 'Secundario'}`} disabled={loading} />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor={`direccion_almacen${index + 1}`}>Dirección Almacén {index + 1}</Label>
                      <Input id={`direccion_almacen${index + 1}`} value={almacen.direccion} onChange={(e) => handleAlmacenChange(index, 'direccion', e.target.value)} placeholder="Dirección completa del almacén" disabled={loading} />
                    </div>
                  </div>
                  <div className="grid gap-3">
                      <Label>Foto del Almacén {index + 1}</Label>
                      {almacen.photoUrl ? (
                          <Image src={almacen.photoUrl} alt={`Foto del almacén ${almacen.nombre}`} width={400} height={300} data-ai-hint="client warehouse" className="rounded-md object-cover aspect-video" />
                      ) : (
                          <div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center">
                              <Camera className="h-10 w-10 text-muted-foreground" />
                          </div>
                      )}
                      <Input
                          id={`almacen-photo-upload-${index}`}
                          type="file"
                          accept="image/*"
                          ref={almacenPhotoInputRefs[index]}
                          onChange={(e) => handleAlmacenPhotoChange(index, e)}
                          className="hidden"
                          disabled={loading}
                      />
                      <Button type="button" variant="outline" onClick={() => almacenPhotoInputRefs[index].current?.click()} disabled={loading}>
                          <Camera className="mr-2 h-4 w-4" />
                          {almacen.photoUrl ? 'Cambiar Foto' : 'Subir Foto'}
                      </Button>
                  </div>
                  <div className="grid gap-3">
                      <Label>Planos del Almacén {index + 1} (PDF)</Label>
                      <Button type="button" variant="outline" onClick={() => fileInputRefs[index].current?.click()} disabled={loading}>
                          <Upload className="mr-2 h-4 w-4" />
                          Subir Planos
                      </Button>
                      <Input type="file" accept="application/pdf" multiple ref={fileInputRefs[index]} onChange={(e) => handlePlanoFileChange(index, e)} className="hidden" />
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {(almacen.planos || []).map((plano, i) => (
                          <div key={i} className="relative group border rounded-md p-2 flex flex-col items-center justify-center text-center">
                            <FileText className="h-10 w-10 text-muted-foreground" />
                            <a href={plano.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline mt-2 truncate w-full" title={plano.name}>
                              {plano.name}
                            </a>
                             <p className="text-xs text-muted-foreground">{formatBytes(plano.size)}</p>
                            <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6" onClick={() => removePlano(index, i)} disabled={loading}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
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
                Active esta opción para crear una cuenta de usuario para que el cliente pueda ver su propia información.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="generate-access"
                        checked={generateUserAccess}
                        onCheckedChange={setGenerateUserAccess}
                        disabled={loading}
                    />
                    <Label htmlFor="generate-access">Generar acceso al sistema para este cliente</Label>
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
                                disabled={loading}
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="userPassword">Contraseña para el Cliente</Label>
                            <Input
                                id="userPassword"
                                type="password"
                                placeholder="Contraseña segura"
                                value={userPassword}
                                onChange={(e) => setUserPassword(e.target.value)}
                                required={generateUserAccess}
                                disabled={loading}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Cliente"}
                </Button>
            </CardFooter>
        </Card>
      </div>
    </form>
  );
}
