
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
    ACTIVE_USER_STORAGE_KEY
} from '@/lib/mock-data';
import { useData } from '@/hooks/use-data-provider';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loading: dataLoading, users, seedDatabase } = useData();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Clear any previous active user from local storage on login page load
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    try {
        // If the database is empty (checked by the provider), and the user is admin, seed the database.
        if (users.length === 0 && email.toLowerCase() === 'admin@escuadra.com' && password === 'admin') {
            setError("Base de datos no inicializada. Sembrando datos...");
            await seedDatabase(); // This now comes from the context
            setError("Base de datos sembrada. Por favor, inicie sesión de nuevo.");
            setIsLoggingIn(false);
            // We don't log in immediately to ensure the user sees the message and the data is re-fetched.
            return;
        }

        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (user && user.password === password) {
            localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(user));
            router.push('/dashboard');
        } else {
            setError('Email o contraseña incorrectos.');
        }
    } catch (err) {
        console.error("Login error:", err);
        setError("No se pudo verificar el usuario. Verifique su conexión e inténtelo de nuevo.");
    } finally {
        setIsLoggingIn(false);
    }
  };

  const isLoading = dataLoading || isLoggingIn;

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
              <CardDescription>
                {dataLoading 
                    ? "Conectando a la base de datos..." 
                    : "Ingrese sus credenciales para acceder al sistema."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="usuario@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading}/>
              </div>
              {error && <p className="text-sm font-medium text-destructive pt-2">{error}</p>}
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Verificando...' : 'Acceder'}
              </Button>
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
