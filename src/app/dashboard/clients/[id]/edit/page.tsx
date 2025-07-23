
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
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getClient, updateClient, Client, Almacen } from '@/lib/services';

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [name, setName] = useState('');
  const [responsable, setResponsable] = useState('');
  const [direccion, setDireccion] = useState('');
  const [almacenes, setAlmacenes] = useState<Almacen[]>([{ nombre: '', direccion: '' }, { nombre: '', direccion: '' }]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (clientId) {
      const fetchClient = async () => {
        try {
          const foundClient = await getClient(clientId);
          if (foundClient) {
            setName(foundClient.name);
            setResponsable(foundClient.responsable);
            setDireccion(foundClient.direccion);
            const clientAlmacenes = foundClient.almacenes || [];
            const displayAlmacenes: Almacen[] = [
                { nombre: '', direccion: '' },
                { nombre: '', direccion: '' },
            ];
            if (clientAlmacenes[0]) displayAlmacenes[0] = clientAlmacenes[0];
            if (clientAlmacenes[1]) displayAlmacenes[1] = clientAlmacenes[1];
            setAlmacenes(displayAlmacenes);
          } else {
            setNotFound(true);
          }
        } catch (error) {
          console.error("Failed to fetch client:", error);
          setNotFound(true);
        } finally {
          setLoading(false);
        }
      };
      fetchClient();
    }
  }, [clientId]);

  const handleAlmacenChange = (index: number, field: keyof Almacen, value: string) => {
    const newAlmacenes = [...almacenes];
    newAlmacenes[index] = { ...newAlmacenes[index], [field]: value };
    setAlmacenes(newAlmacenes);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
        const almacenesToSave = almacenes.filter(a => a.nombre.trim() !== '' || a.direccion.trim() !== '');
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

  if (loading) {
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
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="almacen1">Nombre Almacén 1</Label>
                <Input id="almacen1" value={almacenes[0]?.nombre || ''} onChange={(e) => handleAlmacenChange(0, 'nombre', e.target.value)} placeholder="Ej. Almacén Central" disabled={isSaving}/>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="direccion_almacen1">Dirección Almacén 1</Label>
                <Input id="direccion_almacen1" value={almacenes[0]?.direccion || ''} onChange={(e) => handleAlmacenChange(0, 'direccion', e.target.value)} placeholder="Dirección completa del almacén 1" disabled={isSaving}/>
              </div>
            </div>
            <Separator />
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="almacen2">Nombre Almacén 2 (Opcional)</Label>
                <Input id="almacen2" value={almacenes[1]?.nombre || ''} onChange={(e) => handleAlmacenChange(1, 'nombre', e.target.value)} placeholder="Ej. Bodega Norte" disabled={isSaving}/>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="direccion_almacen2">Dirección Almacén 2</Label>
                <Input id="direccion_almacen2" value={almacenes[1]?.direccion || ''} onChange={(e) => handleAlmacenChange(1, 'direccion', e.target.value)} placeholder="Dirección completa del almacén 2" disabled={isSaving}/>
              </div>
            </div>
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
