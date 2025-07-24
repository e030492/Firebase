
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirectPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/dashboard/dashboard');
    }, [router]);

    return (
        <div className="flex items-center justify-center h-full">
            <p>Redirigiendo...</p>
        </div>
    );
}

    
