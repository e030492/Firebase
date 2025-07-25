
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
import { ArrowLeft, Upload, FileText, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Client, Almacen } from '@/lib/services';
import { useData } from '@/hooks/use-data-provider';

type Plano = {
  url: string;
  name: string;
  size: number;
};

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const { clients, updateClient, loading: dataLoading } = useData();
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const [name, setName] = useState('');
  const [responsable, setResponsable] = useState('');
  const [direccion, setDireccion] = useState('');
  const [almacenes, setAlmacenes] = useState<(Omit<Almacen, 'planos'> & { planos: Plano[] })[]>([
    { nombre: '', direccion: '', planos: [] },
    { nombre: '', direccion: '', planos: [] }
  ]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!dataLoading && clientId) {
      const foundClient = clients.find(c => c.id === clientId);
      if (foundClient) {
        setName(foundClient.name);
        setResponsable(foundClient.responsable);
        setDireccion(foundClient.direccion);
        const clientAlmacenes = foundClient.almacenes || [];
        const displayAlmacenes: (Omit<Almacen, 'planos'> & { planos: Plano[] })[] = [
            { nombre: '', direccion: '', planos: [] },
            { nombre: '', direccion: '', planos: [] },
        ];
        if (clientAlmacenes[0]) {
            displayAlmacenes[0] = { 
                nombre: clientAlmacenes[0].nombre,
                direccion: clientAlmacenes[0].direccion, 
                planos: clientAlmacenes[0].planos?.map(p => ({...p})) || [] 
            };
        }
        if (clientAlmacenes[1]) {
            displayAlmacenes[1] = { 
                nombre: clientAlmacenes[1].nombre,
                direccion: clientAlmacenes[1].direccion, 
                planos: clientAlmacenes[1].planos?.map(p => ({...p})) || []
            };
        }
        setAlmacenes(displayAlmacenes);
        setLoading(false);
      } else {
        setNotFound(true);
        setLoading(false);
      }
    }
  }, [clientId, clients, dataLoading]);

  const handleAlmacenChange = (index: number, field: keyof Omit<Almacen, 'planos'>, value: string) => {
    const newAlmacenes = [...almacenes];
    newAlmacenes[index] = { ...newAlmacenes[index], [field]: value };
    setAlmacenes(newAlmacenes);
  };
  
  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
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
    setIsSaving(true);
    
    try {
        const almacenesToSave = almacenes
            .filter(a => a.nombre.trim() !== '')
            .map(a => ({
                nombre: a.nombre,
                direccion: a.direccion,
                planos: a.planos.map(p => ({
                    url: p.url,
                    name: p.name,
                    size: p.size
                }))
            }));

        const updatedData: Partial<Client> = {
            name,
            responsable,
            direccion,
            almacenes: almacenesToSave,
        };

        await updateClient(clientId, updatedData);
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
                  <div className="grid gap-3">
                      <Label>Planos del Almacén {index + 1} (PDF)</Label>
                      <Button type="button" variant="outline" onClick={() => fileInputRefs[index].current?.click()} disabled={isSaving}>
                          <Upload className="mr-2 h-4 w-4" />
                          Subir Planos
                      </Button>
                      <Input type="file" accept="application/pdf" multiple ref={fileInputRefs[index]} onChange={(e) => handleFileChange(index, e)} className="hidden" />
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {(almacen.planos || []).map((plano, i) => (
                          <div key={i} className="relative group border rounded-md p-2 flex flex-col items-center justify-center text-center">
                            <FileText className="h-10 w-10 text-muted-foreground" />
                            <a href={plano.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline mt-2 truncate w-full" title={plano.name}>
                              {plano.name}
                            </a>
                            <p className="text-xs text-muted-foreground">{formatBytes(plano.size)}</p>
                            <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6" onClick={() => removePlano(index, i)} disabled={isSaving}>
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
