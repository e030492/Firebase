
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
import { ArrowLeft } from 'lucide-react';
import { createSystem, System } from '@/lib/services';
import { useData } from '@/hooks/use-data-provider';

export default function NewSystemPage() {
  const router = useRouter();
  const { refreshData } = useData();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
        alert('Por favor, complete todos los campos.');
        return;
    }
    
    setLoading(true);

    try {
        const newSystem: Omit<System, 'id'> = {
          name,
          description,
          color,
        };

        await createSystem(newSystem);
        await refreshData();
        alert('Sistema creado con éxito.');
        router.push('/dashboard/systems');
    } catch (error) {
        console.error("Failed to create system:", error);
        alert("Error al crear el sistema.");
        setLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubmit}>
      <div className="mx-auto grid max-w-2xl auto-rows-max items-start gap-4 lg:gap-8">
        <div className="flex items-center gap-4">
           <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()} disabled={loading}>
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
                  style={{ color: color, fontWeight: 'bold' }}
                  disabled={loading}
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
                  disabled={loading}
                />
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
                        disabled={loading}
                    />
                    <Input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-28"
                        placeholder="#3b82f6"
                        disabled={loading}
                    />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Sistema"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}
