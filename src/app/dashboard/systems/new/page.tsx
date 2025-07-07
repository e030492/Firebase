"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { mockSystems } from '@/lib/mock-data';
import { ArrowLeft } from 'lucide-react';

const SYSTEMS_STORAGE_KEY = 'guardian_shield_systems';
type System = typeof mockSystems[0];

export default function NewSystemPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
        alert('Por favor, complete todos los campos.');
        return;
    }

    const storedSystems = localStorage.getItem(SYSTEMS_STORAGE_KEY);
    let systems: System[] = storedSystems ? JSON.parse(storedSystems) : [];
    
    const newSystem: System = {
      id: new Date().getTime().toString(), // Simple unique ID
      name,
      description,
    };

    systems.push(newSystem);
    localStorage.setItem(SYSTEMS_STORAGE_KEY, JSON.stringify(systems));

    alert('Sistema creado con éxito.');
    router.push('/dashboard/systems');
  };


  return (
    <form onSubmit={handleSubmit}>
      <div className="mx-auto grid max-w-2xl auto-rows-max items-start gap-4 lg:gap-8">
        <div className="flex items-center gap-4">
           <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
             <ArrowLeft className="h-4 w-4" />
             <span className="sr-only">Atrás</span>
           </Button>
           <div className="grid gap-0.5">
            <h1 className="font-headline text-2xl font-bold">Crear Sistema de Seguridad</h1>
            <p className="text-muted-foreground">
                Defina un nuevo tipo de sistema de seguridad.
            </p>
           </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="nombre">Nombre del Sistema</Label>
                <Input 
                  id="nombre" 
                  placeholder="Ej. Sistema de Control de Acceso" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describa el propósito y componentes principales del sistema."
                  className="min-h-32"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit">Guardar Sistema</Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}
