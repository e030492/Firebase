
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
import { useData, LoadingStatus } from '@/hooks/use-data-provider';

export default function LoginPage() {
  const router = useRouter();
  const { loginUser, loadingStatus, companySettings, seedAdminUser } = useData(); 
  const [email, setEmail] = useState('admin@escuadramx.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(true);

  useEffect(() => {
    async function performSeeding() {
        try {
            await seedAdminUser();
        } catch (err) {
            console.error("Seeding failed", err);
            setError("Error al configurar la cuenta de administrador.");
        } finally {
            setSeeding(false);
        }
    }
    performSeeding();
  }, [seedAdminUser]);


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
        console.error("Login failed:", err);
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
            setError('Usuario o contraseña incorrectos.');
        } else {
            setError(`Error: ${err.message || 'Ocurrió un error inesperado.'}`);
        }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormDisabled = isLoading || loadingStatus !== 'ready' || seeding;

  const getButtonText = () => {
    if (seeding) return "Verificando cuenta de administrador...";
    if (isLoading) return "Accediendo...";
    switch(loadingStatus) {
        case 'authenticating': return "Autenticando...";
        case 'loading_data': return "Cargando datos...";
        case 'error': return "Error. Intente de nuevo.";
        default: return "Acceder";
    }
  }

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-start bg-background p-4 pt-12">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex items-center justify-center h-72 w-72">
              <Image 
                src={companySettings?.logoUrl || "https://placehold.co/200x200.png"} 
                alt="Escuadra Technology Logo" 
                width={200} 
                height={200} 
                data-ai-hint="logo" 
                className="object-contain w-full h-full" 
                priority 
              />
            </div>
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
                  <Input id="email" type="email" placeholder="admin@escuadramx.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={isFormDisabled} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isFormDisabled} placeholder="admin123"/>
                </div>
                {error && <p className="text-sm font-medium text-destructive pt-2">{error}</p>}
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isFormDisabled}>
                  {(isFormDisabled) && (
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <span>{getButtonText()}</span>
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
