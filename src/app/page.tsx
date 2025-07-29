
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useData } from '@/hooks/use-data-provider';

export default function RootPage() {
    const router = useRouter();
    const { loading, error } = useData();

    useEffect(() => {
        if (!loading) {
            router.replace('/dashboard/dashboard');
        }
    }, [loading, router]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            {error ? (
                <div className="text-center text-destructive">
                    <h2 className="text-xl font-bold">Error al Cargar Datos</h2>
                    <p className="mt-2">No se pudo conectar con la base de datos.</p>
                    <p className="mt-1 text-xs">Por favor, verifique las reglas de seguridad de Firestore y su conexión a internet.</p>
                    <p className="mt-4 text-xs font-mono bg-muted p-2 rounded-md">{error}</p>
                </div>
            ) : (
                <>
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Cargando datos de la aplicación...</p>
                </>
            )}
        </div>
    );
}
