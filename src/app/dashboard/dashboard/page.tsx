
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Activity, Building, HardHat } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/hooks/use-data-provider';
import type { Equipment } from '@/lib/services';

export default function DashboardPage() {
  const { clients, allEquipments, cedulas, loading } = useData();

  const [clientCount, setClientCount] = useState(0);
  const [equipmentCount, setEquipmentCount] = useState(0);
  const [pendingCedulasCount, setPendingCedulasCount] = useState(0);
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    try {
        setClientCount(clients.length);
        setEquipmentCount(allEquipments.length);
        
        const pendingCount = cedulas.filter((c: any) => c.status === 'Pendiente' || c.status === 'En Progreso').length;
        setPendingCedulasCount(pendingCount);

        const nextDates = allEquipments
          .map((e: Equipment) => {
            if (!e.maintenanceStartDate || !e.maintenancePeriodicity) {
                return null;
            }

            // Ensure the date is parsed correctly, even without timezone info
            const start = new Date(e.maintenanceStartDate.includes('T') ? e.maintenanceStartDate : e.maintenanceStartDate + 'T00:00:00');
            if (isNaN(start.getTime())) return null;

            const periods: { [key: string]: number } = {
                'Mensual': 1,
                'Trimestral': 3,
                'Semestral': 6,
                'Anual': 12
            };

            const monthsToAdd = periods[e.maintenancePeriodicity as keyof typeof periods];
            if (!monthsToAdd) return null;

            let nextDate = new Date(start);
            const now = new Date();
            
            while (nextDate <= now) {
                nextDate.setMonth(nextDate.getMonth() + monthsToAdd);
            }
            return nextDate;
          })
          .filter((d): d is Date => d !== null && !isNaN(d.getTime()))
          .sort((a, b) => a.getTime() - b.getTime());

        if (nextDates.length > 0) {
          setNextMaintenanceDate(nextDates[0].toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }));
        } else {
            setNextMaintenanceDate('Sin mantenimientos programados');
        }

    } catch (error) {
        console.error("Failed to process dashboard data:", error);
        setError("No se pudieron cargar los datos del dashboard.");
    }
  }, [loading, clients, allEquipments, cedulas]);

  if (loading) {
      return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <div className="grid gap-2">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-5 w-80" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-12 mb-2" />
                        <Skeleton className="h-4 w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Equipos Monitoreados</CardTitle>
                        <HardHat className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-16 mb-2" />
                        <Skeleton className="h-4 w-4/5" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Mantenimientos Pendientes</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-10 mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                </Card>
            </div>
             <p className="text-sm text-muted-foreground">Cargando datos del dashboard. Si esto tarda demasiado, verifique su conexión a internet.</p>
        </div>
      )
  }

    if (error) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 text-center h-full mt-10">
            <h1 className="text-2xl font-bold text-destructive">Error al Cargar</h1>
            <p className="text-muted-foreground max-w-md">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
                Reintentar
            </Button>
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
              <div className="text-2xl font-bold">{clientCount}</div>
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
                <div className="text-2xl font-bold">{equipmentCount}</div>
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
