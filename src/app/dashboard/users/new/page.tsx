"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function NewUserPage() {
  return (
    <form>
      <div className="mx-auto grid max-w-2xl auto-rows-max items-start gap-4 lg:gap-8">
        <div className="grid gap-2">
          <h1 className="font-headline text-3xl font-bold">Crear Nuevo Usuario</h1>
          <p className="text-muted-foreground">
            Complete los datos para agregar un nuevo usuario al sistema.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input id="nombre" placeholder="Ej. Juan Pérez" />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="ejemplo@correo.com" />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="rol">Rol</Label>
                 <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button>Guardar Usuario</Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}
