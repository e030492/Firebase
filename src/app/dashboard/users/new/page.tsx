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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { mockUsers } from '@/lib/mock-data';

const USERS_STORAGE_KEY = 'guardian_shield_users';
type User = typeof mockUsers[0];

const valueToRoleMap: { [key: string]: string } = {
  'admin': 'Administrador',
  'tecnico': 'Técnico',
  'supervisor': 'Supervisor',
};

export default function NewUserPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !role) {
      alert('Por favor, complete todos los campos.');
      return;
    }

    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    let users: User[] = storedUsers ? JSON.parse(storedUsers) : [];

    const newUser: User = {
      id: new Date().getTime().toString(),
      name,
      email,
      role: valueToRoleMap[role],
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    alert('Usuario creado con éxito.');
    router.push('/dashboard/users');
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
            <h1 className="font-headline text-2xl font-bold">Crear Nuevo Usuario</h1>
            <p className="text-muted-foreground">
                Complete los datos para agregar un nuevo usuario al sistema.
            </p>
           </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input id="nombre" placeholder="Ej. Juan Pérez" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="ejemplo@correo.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="rol">Rol</Label>
                 <Select onValueChange={setRole} value={role} required>
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
            <Button type="submit">Guardar Usuario</Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}
