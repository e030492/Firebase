
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
} from '@/lib/mock-data';
import { getUsers, User, seedDatabase } from '@/lib/services';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

type Status = "loading" | "error" | "success";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [users, setUsers] = useState<User[]>([]);
  const [loginError, setLoginError] = useState('');

  // Debug states
  const [systemStatus, setSystemStatus] = useState<Status>("loading");
  const [statusMessage, setStatusMessage] = useState('Cargando datos iniciales...');
  const [userCount, setUserCount] = useState(0);
  const [isSeeding, setIsSeeding] = useState(false);

  async function loadInitialData() {
    try {
      setSystemStatus("loading");
      setStatusMessage("Obteniendo usuarios desde la base de datos...");
      const usersData = await getUsers();
      setUsers(usersData);
      setUserCount(usersData.length);
      
      if (usersData.length === 0) {
          setSystemStatus("error");
          setStatusMessage("Error: La colección de usuarios está vacía. La base de datos puede no estar inicializada.");
      } else {
          setSystemStatus("success");
          setStatusMessage("Datos cargados correctamente.");
      }
    } catch (e: any) {
      console.error("Failed to load users", e);
      setSystemStatus("error");
      setStatusMessage(`Error de conexión: ${e.message}`);
    }
  }

  useEffect(() => {
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    loadInitialData();
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

  const handleSeedDatabase = async () => {
      setIsSeeding(true);
      setStatusMessage("Iniciando sembrado de base de datos... Esto puede tardar unos segundos.");
      try {
          await seedDatabase();
          setStatusMessage("¡Base de datos sembrada con éxito! Recargando datos...");
          await loadInitialData(); // Recarga los datos para actualizar el estado de la UI
      } catch(e: any) {
          setSystemStatus("error");
          setStatusMessage(`Error en el sembrado: ${e.message}`);
      } finally {
          setIsSeeding(false);
      }
  }

  const isLoading = systemStatus === "loading" || isSeeding;

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
                {isLoading 
                  ? "Verificando estado del sistema..." 
                  : "Ingrese sus credenciales para acceder."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemStatus === 'loading' && !isSeeding ? (
                  <div className="space-y-4">
                      <div className="space-y-2"><Label>Email</Label><Skeleton className="h-10 w-full"/></div>
                      <div className="space-y-2"><Label>Contraseña</Label><Skeleton className="h-10 w-full"/></div>
                  </div>
              ) : (
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
              )}
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
                    <p className="font-semibold">Usuarios encontrados:</p>
                    <p className="font-mono text-lg">{userCount}</p>
                </div>
                 {userCount === 0 && systemStatus === 'error' && (
                    <>
                        <Separator />
                        <div className="pt-2">
                            <p className="text-muted-foreground mb-3 text-center">Si esta es la primera vez que ejecuta la aplicación, la base de datos necesita ser inicializada.</p>
                            <Button onClick={handleSeedDatabase} className="w-full" variant="destructive" disabled={isSeeding}>
                                {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSeeding ? 'Sembrando...' : 'Inicializar Base de Datos'}
                            </Button>
                        </div>
                    </>
                 )}
            </CardContent>
        </Card>

      </div>
    </main>
  );
}
