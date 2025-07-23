
"use client";

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Activity, Building, HardHat, Server, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useData } from '@/hooks/use-data-provider';

export default function DashboardPage() {
    const { cedulas, clients, equipments, loading, error } = useData();

    const pendingCedulasCount = cedulas.filter(c => c.status === 'Pendiente' || c.status === 'En Progreso').length;

    if (loading) {
      return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <div className="grid gap-2">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-5 w-80" />
            </div>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 text-lg font-bold">
                        <Loader2 className="h-6 w-6 animate-spin text-primary"/>
                        <p>Sincronizando con la base de datos...</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Cargando datos iniciales del sistema. Esto puede tardar unos segundos.
                    </p>
                </CardContent>
            </Card>
        </div>
      )
    }

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="grid gap-2">
        <h1 className="font-headline text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Vista general del sistema de mantenimiento.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/clients" className="hover:shadow-lg transition-shadow rounded-lg">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
              <p className="text-xs text-muted-foreground">
                Total de clientes registrados en el sistema.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/equipments" className="hover:shadow-lg transition-shadow rounded-lg">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Equipos Monitoreados</CardTitle>
                <HardHat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{equipments.length}</div>
                <p className="text-xs text-muted-foreground">Total de equipos registrados</p>
            </CardContent>
            </Card>
        </Link>
        <Link href="/dashboard/cedulas" className="hover:shadow-lg transition-shadow rounded-lg">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mantenimientos Pendientes</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{pendingCedulasCount}</div>
                <p className="text-xs text-muted-foreground">Cédulas en progreso o pendientes</p>
            </CardContent>
            </Card>
        </Link>
      </div>
    </div>
  );
}
