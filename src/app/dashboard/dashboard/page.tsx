
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Activity, Building, HardHat, Server, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getClients, getEquipments, getCedulas } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
  const [counts, setCounts] = useState({ clients: 0, equipments: 0, cedulas: 0, pendingCedulas: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
        setLoading(true);
        setError(null);
        try {
            const [clientsData, equipmentsData, cedulasData] = await Promise.all([
                getClients(),
                getEquipments(),
                getCedulas(),
            ]);

            const pendingCount = cedulasData.filter((c: any) => c.status === 'Pendiente' || c.status === 'En Progreso').length;
            
            setCounts({
                clients: clientsData.length,
                equipments: equipmentsData.length,
                cedulas: cedulasData.length,
                pendingCedulas: pendingCount
            });
        } catch (err) {
            console.error("Failed to load dashboard data:", err);
            const errorMessage = err instanceof Error ? err.message : "Error desconocido";
            setError(`No se pudieron cargar los datos del dashboard. ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }
    loadDashboardData();
  }, []);

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
              <div className="text-2xl font-bold">{counts.clients}</div>
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
                <div className="text-2xl font-bold">{counts.equipments}</div>
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
                <div className="text-2xl font-bold">{counts.pendingCedulas}</div>
                <p className="text-xs text-muted-foreground">Cédulas en progreso o pendientes</p>
            </CardContent>
            </Card>
        </Link>
      </div>
        <Card className="shadow-lg bg-muted/30">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    <span>Estado del Sistema</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
                <div className="flex items-start gap-3">
                    {error ? <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" /> : <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
                    <div>
                        <p className="font-semibold">Mensaje:</p>
                        <p className="text-muted-foreground break-words">{error || 'Todos los sistemas están operativos. Los datos del dashboard se han cargado correctamente.'}</p>
                    </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between items-center">
                      <p className="font-semibold">Clientes:</p>
                      <p className="font-mono text-lg">{counts.clients}</p>
                  </div>
                   <div className="flex justify-between items-center">
                      <p className="font-semibold">Equipos:</p>
                      <p className="font-mono text-lg">{counts.equipments}</p>
                  </div>
                   <div className="flex justify-between items-center">
                      <p className="font-semibold">Cédulas:</p>
                      <p className="font-mono text-lg">{counts.cedulas}</p>
                  </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
