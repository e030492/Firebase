
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
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { Client } from '@/lib/services';
import type { Almacen } from '@/lib/services';
import { useData } from '@/hooks/use-data-provider';

export default function NewClientPage() {
  const router = useRouter();
  const { createClient } = useData();
  const [name, setName] = useState('');
  const [responsable, setResponsable] = useState('');
  const [direccion, setDireccion] = useState('');
  const [almacenes, setAlmacenes] = useState<Almacen[]>([{ nombre: '', direccion: '' }, { nombre: '', direccion: '' }]);
  const [loading, setLoading] = useState(false);

  const handleAlmacenChange = (index: number, field: keyof Almacen, value: string) => {
    const newAlmacenes = [...almacenes];
    newAlmacenes[index] = { ...newAlmacenes[index], [field]: value };
    setAlmacenes(newAlmacenes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !responsable || !direccion) {
        alert('Por favor, complete todos los campos obligatorios.');
        return;
    }
    setLoading(true);

    try {
        const almacenesToSave = almacenes.filter(a => a.nombre.trim() !== '' && a.direccion.trim() !== '');

        const newClientData: Omit<Client, 'id'> = {
            name,
            responsable,
            direccion,
            almacenes: almacenesToSave,
        };

        await createClient(newClientData);
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
                <Input id="almacen1" value={almacenes[0]?.nombre || ''} onChange={(e) => handleAlmacenChange(0, 'nombre', e.target.value)} placeholder="Ej. Almacén Central" disabled={loading} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="direccion_almacen1">Dirección Almacén 1</Label>
                <Input id="direccion_almacen1" value={almacenes[0]?.direccion || ''} onChange={(e) => handleAlmacenChange(0, 'direccion', e.target.value)} placeholder="Dirección completa del almacén 1" disabled={loading} />
              </div>
            </div>
            <Separator />
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="almacen2">Nombre Almacén 2 (Opcional)</Label>
                <Input id="almacen2" value={almacenes[1]?.nombre || ''} onChange={(e) => handleAlmacenChange(1, 'nombre', e.target.value)} placeholder="Ej. Bodega Norte" disabled={loading} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="direccion_almacen2">Dirección Almacén 2</Label>
                <Input id="direccion_almacen2" value={almacenes[1]?.direccion || ''} onChange={(e) => handleAlmacenChange(1, 'direccion', e.target.value)} placeholder="Dirección completa del almacén 2" disabled={loading} />
              </div>
            </div>
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
