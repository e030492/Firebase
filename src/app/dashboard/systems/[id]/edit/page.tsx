"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { mockSystems } from '@/lib/mock-data';

const SYSTEMS_STORAGE_KEY = 'guardian_shield_systems';
type System = typeof mockSystems[0];

export default function EditSystemPage() {
  const params = useParams();
  const router = useRouter();
  const systemId = params.id as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (systemId) {
      const storedSystems = localStorage.getItem(SYSTEMS_STORAGE_KEY);
      const systems: System[] = storedSystems ? JSON.parse(storedSystems) : [];
      const foundSystem = systems.find(s => s.id === systemId);

      if (foundSystem) {
        setName(foundSystem.name);
        setDescription(foundSystem.description);
        setColor(foundSystem.color || '#3b82f6');
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }
  }, [systemId]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedSystems = localStorage.getItem(SYSTEMS_STORAGE_KEY);
    let systems: System[] = storedSystems ? JSON.parse(storedSystems) : [];

    const updatedSystems = systems.map(s => {
      if (s.id === systemId) {
        return {
          ...s,
          name,
          description,
          color,
        };
      }
      return s;
    });

    localStorage.setItem(SYSTEMS_STORAGE_KEY, JSON.stringify(updatedSystems));
    alert('Sistema actualizado con éxito.');
    router.push('/dashboard/systems');
  }

  if (loading) {
    return (
       <div className="mx-auto grid max-w-2xl auto-rows-max items-start gap-4 lg:gap-8">
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
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label>Nombre del Sistema</Label>
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid gap-3">
                <Label>Descripción</Label>
                <Skeleton className="h-32 w-full" />
              </div>
              <div className="grid gap-3">
                <Label>Color del Sistema</Label>
                <Skeleton className="h-10 w-32" />
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
         <h1 className="text-2xl font-bold">Sistema no encontrado</h1>
         <p className="text-muted-foreground">No se pudo encontrar el sistema que buscas.</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mx-auto grid max-w-2xl auto-rows-max items-start gap-4 lg:gap-8">
        <div className="flex items-center gap-4">
           <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
             <ArrowLeft className="h-4 w-4" />
             <span className="sr-only">Atrás</span>
           </Button>
           <div className="grid gap-0.5">
             <h1 className="font-headline text-2xl font-bold">Editar Sistema</h1>
             <p className="text-muted-foreground">Modifique los datos del sistema de seguridad.</p>
           </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="nombre">Nombre del Sistema</Label>
                <Input id="nombre" value={name} onChange={(e) => setName(e.target.value)} required style={{ color: color, fontWeight: 'bold' }} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required className="min-h-32" />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="color">Color del Sistema</Label>
                <div className="flex items-center gap-2">
                    <Input
                        id="color"
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="h-10 w-14 cursor-pointer p-1"
                    />
                    <Input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-28"
                        placeholder="#3b82f6"
                    />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit">Guardar Cambios</Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}
