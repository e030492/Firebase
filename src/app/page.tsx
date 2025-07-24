
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Loader2 } from 'lucide-react';
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
import { useData } from '@/hooks/use-data-provider';

export default function LoginPage() {
  const router = useRouter();
  const { loginUser, loading: dataLoading } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await loginUser(email, password);

      if (user) {
        router.push('/dashboard/dashboard');
      } else {
        setError('Usuario o contraseña incorrectos.');
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Login failed:", err);
      setError(`Error crítico durante el login: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormDisabled = isLoading || dataLoading;

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
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
                  Ingrese sus credenciales para acceder.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="admin@escuadra.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={isFormDisabled} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isFormDisabled} placeholder="admin"/>
                </div>
                {error && <p className="text-sm font-medium text-destructive pt-2">{error}</p>}
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isFormDisabled}>
                  {dataLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Cargando datos...</span>
                    </>
                  ) : isLoading ? (
                     <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Accediendo...</span>
                    </>
                  ) : 'Acceder'}
                </Button>
                 <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary">
                  ¿Olvidó su contraseña?
                 </Link>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </>
  );
}
