
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
import { getUsers, User, seedDatabase, ACTIVE_USER_STORAGE_KEY } from '@/lib/services';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugMessages, setDebugMessages] = useState<string[]>([]);

  const addDebugMessage = (message: string) => {
    setDebugMessages(prev => [...prev, message]);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDebugMessages([]);
    setIsLoading(true);

    try {
      addDebugMessage("1. Iniciando proceso de login...");
      addDebugMessage("2. Consultando base de datos para obtener usuarios...");
      let users = await getUsers();
      
      if (users.length === 0) {
        addDebugMessage("WARN: La colección de usuarios está vacía. Sembrando datos iniciales...");
        await seedDatabase();
        addDebugMessage("INFO: Base de datos sembrada. Volviendo a consultar usuarios...");
        users = await getUsers();
        if (users.length === 0) {
          throw new Error("No se pudieron cargar los usuarios después de la inicialización.");
        }
        addDebugMessage(`INFO: ${users.length} usuarios encontrados después de sembrar.`);
      }

      addDebugMessage(`3. ${users.length} usuarios encontrados. Verificando credenciales...`);
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (user) {
        addDebugMessage(`INFO: Usuario ${user.email} encontrado.`);
        if (user.password === password) {
          addDebugMessage("4. Login exitoso. Redirigiendo...");
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(user));
          router.push('/dashboard/users');
        } else {
          addDebugMessage("ERROR: Contraseña incorrecta.");
          setError('Contraseña incorrecta.');
        }
      } else {
        addDebugMessage("ERROR: Usuario no encontrado.");
        setError('Usuario no encontrado.');
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addDebugMessage(`FATAL: ${errorMessage}`);
      console.error("Login failed:", err);
      setError("Error al conectar con la base de datos. Verifique la consola.");
    } finally {
      setIsLoading(false);
      addDebugMessage("5. Proceso de login finalizado.");
    }
  };

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
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="admin@escuadra.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} placeholder="admin"/>
              </div>
              {error && <p className="text-sm font-medium text-destructive pt-2">{error}</p>}
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
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

        {/* Ventana de Depuración */}
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-base">Ventana de Depuración</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="bg-muted p-2 rounded-md h-40 overflow-y-auto text-xs font-mono">
                    {debugMessages.map((msg, index) => (
                        <p key={index} className={msg.startsWith('ERROR') || msg.startsWith('FATAL') ? 'text-destructive' : ''}>{msg}</p>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>
    </main>
  );
}

    