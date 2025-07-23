"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
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
import { 
    mockUsers, 
    mockClients, 
    mockSystems, 
    mockEquipments, 
    mockProtocols, 
    mockCedulas,
    USERS_STORAGE_KEY,
    CLIENTS_STORAGE_KEY,
    SYSTEMS_STORAGE_KEY,
    EQUIPMENTS_STORAGE_KEY,
    PROTOCOLS_STORAGE_KEY,
    CEDULAS_STORAGE_KEY,
    ACTIVE_USER_STORAGE_KEY
} from '@/lib/mock-data';

type User = typeof mockUsers[0];


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // This effect runs on the client and ensures that all necessary
    // data stores are initialized in localStorage if they don't exist.
    // This prevents data loss when a new session is started.
    const initializeDataStore = (key: string, data: any) => {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify(data));
        }
    };

    initializeDataStore(USERS_STORAGE_KEY, mockUsers);
    initializeDataStore(CLIENTS_STORAGE_KEY, mockClients);
    initializeDataStore(SYSTEMS_STORAGE_KEY, mockSystems);
    initializeDataStore(EQUIPMENTS_STORAGE_KEY, mockEquipments);
    initializeDataStore(PROTOCOLS_STORAGE_KEY, mockProtocols);
    initializeDataStore(CEDULAS_STORAGE_KEY, mockCedulas);

    // Clear any previous active user on login page load
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const users: User[] = storedUsers ? JSON.parse(storedUsers) : mockUsers;

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (user && user.password === password) {
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(user));
      router.push('/dashboard');
    } else {
      setError('Email o contraseña incorrectos.');
    }
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">
            Escuadra Tecnology
          </h1>
          <p className="text-muted-foreground">Control de Mantenimiento de Seguridad</p>
        </div>
        <Card className="shadow-lg">
          <form onSubmit={handleLogin}>
            <CardHeader>
              <CardTitle>Iniciar Sesión</CardTitle>
              <CardDescription>Ingrese sus credenciales para acceder al sistema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="usuario@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-sm font-medium text-destructive pt-2">{error}</p>}
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button type="submit" className="w-full">Acceder</Button>
               <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary">
                ¿Olvidó su contraseña?
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
