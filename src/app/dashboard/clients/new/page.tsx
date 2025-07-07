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
import { Separator } from '@/components/ui/separator';

export default function NewClientPage() {
  return (
    <form>
      <div className="mx-auto grid max-w-4xl auto-rows-max items-start gap-4 lg:gap-8">
        <div className="grid gap-2">
          <h1 className="font-headline text-3xl font-bold">Registrar Nuevo Cliente</h1>
          <p className="text-muted-foreground">
            Complete los datos para agregar un nuevo cliente al sistema.
          </p>
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
                  <Input id="nombre" placeholder="Ej. Acme Corp" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="responsable">Contacto Responsable</Label>
                  <Input id="responsable" placeholder="Ej. Juan Pérez" />
                </div>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="direccion">Dirección Principal</Label>
                <Input id="direccion" placeholder="Ej. Av. Siempre Viva 123, Springfield" />
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
                <Input id="almacen1" placeholder="Ej. Almacén Central" />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="direccion_almacen1">Dirección Almacén 1</Label>
                <Input id="direccion_almacen1" placeholder="Dirección completa del almacén 1" />
              </div>
            </div>
            <Separator />
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="almacen2">Nombre Almacén 2 (Opcional)</Label>
                <Input id="almacen2" placeholder="Ej. Bodega Norte" />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="direccion_almacen2">Dirección Almacén 2</Label>
                <Input id="direccion_almacen2" placeholder="Dirección completa del almacén 2" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button>Guardar Cliente</Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}
