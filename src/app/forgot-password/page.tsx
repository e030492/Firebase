"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, you would make an API call here to send the reset email.
    // For this prototype, we'll just show a confirmation message.
    setSubmitted(true);
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
          {submitted ? (
            <>
              <CardHeader>
                <CardTitle>Verifique su Correo</CardTitle>
                <CardDescription>
                  Si existe una cuenta con el correo electrónico que ingresó, hemos enviado un enlace para restablecer su contraseña.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                 <Button className="w-full" asChild>
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Inicio de Sesión
                    </Link>
                 </Button>
              </CardFooter>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Recuperar Contraseña</CardTitle>
                <CardDescription>
                  Ingrese su correo electrónico y le enviaremos un enlace para restablecer su contraseña.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="usuario@ejemplo.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full">Enviar Enlace</Button>
                 <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                    Volver a Inicio de Sesión
                 </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </main>
  );
}
