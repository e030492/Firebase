
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { useData } from '@/hooks/use-data-provider';
import { seedMockUsers } from '@/lib/services';

export default function LoginPage() {
  const router = useRouter();
  const { loginUser, loading: dataLoading, companySettings, isAuthReady } = useData(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // This effect runs once on mount to ensure mock users are in Firebase Auth & Firestore
    const seedData = async () => {
        setIsSeeding(true);
        try {
            await seedMockUsers();
            console.log("Mock users seeded successfully.");
        } catch (error) {
            console.error("Could not seed mock users:", error);
            setError("Error al sincronizar usuarios de prueba.");
        } finally {
            setIsSeeding(false);
        }
    };
    
    if (isAuthReady) {
      seedData();
    }
  }, [isAuthReady]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!isAuthReady) {
      console.warn("Attempted login before Firebase Auth was ready.");
      setIsLoading(false);
      setError("El servicio de autenticación no está listo. Intente de nuevo.");
      return;
    }

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
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(`Error: ${errorMessage}`);
        }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormDisabled = isLoading || dataLoading || !isAuthReady || isSeeding;

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
                  <Input id="email" type="email" placeholder="erick@escuadramx.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={isFormDisabled} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isFormDisabled} placeholder="admin123"/>
                </div>
                {error && <p className="text-sm font-medium text-destructive pt-2">{error}</p>}
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isFormDisabled}>
                  {isSeeding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Sincronizando usuarios...</span>
                    </>
                  ) : dataLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Cargando datos...</span>
                    </>
                  ) : isLoading ? (
                     <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Accediendo...</span>
                    </>
                  ) : !isAuthReady ? (
                     <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Inicializando...</span>
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

    