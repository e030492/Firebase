
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/dashboard');
    }, [router]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Redirigiendo al dashboard...</p>
        </div>
    );
}
