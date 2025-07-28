
"use client";

import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
    const router = useRouter();
    router.replace('/dashboard/dashboard');
    return null;
}
