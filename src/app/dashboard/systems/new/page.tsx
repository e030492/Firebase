"use client";

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
import { Textarea } from '@/components/ui/textarea';

export default function NewSystemPage() {
  return (
    <form>
      <div className="mx-auto grid max-w-2xl auto-rows-max items-start gap-4 lg:gap-8">
        <div className="grid gap-2">
          <h1 className="font-headline text-3xl font-bold">Crear Sistema de Seguridad</h1>
          <p className="text-muted-foreground">
            Defina un nuevo tipo de sistema de seguridad.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="nombre">Nombre del Sistema</Label>
                <Input id="nombre" placeholder="Ej. Sistema de Control de Acceso" />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describa el propósito y componentes principales del sistema."
                  className="min-h-32"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button>Guardar Sistema</Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}
