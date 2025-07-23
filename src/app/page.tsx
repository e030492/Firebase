
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Server, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
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
    ACTIVE_USER_STORAGE_KEY,
    mockUsers,
} from '@/lib/mock-data';
import { User, seedDatabase } from '@/lib/services';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

type Status = "loading" | "error" | "success";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Start with mockUsers directly
  const [users, setUsers] = useState<User[]>(mockUsers as User[]);
  const [loginError, setLoginError] = useState('');

  // Debug states
  const [systemStatus, setSystemStatus] = useState<Status>("success");
  const [statusMessage, setStatusMessage] = useState('Datos de demostración precargados. Listo para iniciar sesión.');
  const [userCount, setUserCount] = useState(mockUsers.length);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    // On mount, we can ensure the database is seeded without blocking the UI
    seedDatabase().catch(err => {
        console.error("Initial seeding failed:", err);
        setSystemStatus("error");
        setStatusMessage("Error al conectar con la base de datos en segundo plano.");
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (user) {
        if (user.password === password) {
            localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(user));
            router.push('/dashboard/dashboard');
        } else {
            setLoginError('Contraseña incorrecta.');
        }
    } else {
        setLoginError('Usuario no encontrado.');
    }
  };

  const isLoading = isSeeding;

  return (
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
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="usuario@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading}/>
                  </div>
                </>
              {loginError && <p className="text-sm font-medium text-destructive pt-2">{loginError}</p>}
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Cargando...</span>
                  </>
                ) : 'Acceder'}
              </Button>
               <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary">
                ¿Olvidó su contraseña?
               </Link>
            </CardFooter>
          </form>
        </Card>
        
        {/* Debug Window */}
        <Card className="shadow-lg bg-muted/30">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    <span>Estado del Sistema</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
                <div className="flex items-start gap-3">
                    {systemStatus === 'loading' && <Loader2 className="h-5 w-5 text-muted-foreground animate-spin mt-0.5" />}
                    {systemStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
                    {systemStatus === 'error' && <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />}
                    <div>
                        <p className="font-semibold">Mensaje:</p>
                        <p className="text-muted-foreground break-words">{statusMessage}</p>
                    </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                    <p className="font-semibold">Usuarios precargados:</p>
                    <p className="font-mono text-lg">{userCount}</p>
                </div>
            </CardContent>
        </Card>

      </div>
    </main>
  );
}
