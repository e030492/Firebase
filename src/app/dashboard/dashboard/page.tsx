
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Building, HardHat, FileCheck, Users, ShieldCheck } from "lucide-react";
import { useData } from '@/hooks/use-data-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-permissions';

export default function DashboardPage() {
    const { clients, equipments, cedulas, loading } = useData();
    const { user } = usePermissions();

    const stats = useMemo(() => {
        const totalClients = clients.length;
        const maintenanceEquipments = equipments.filter(e => e.status === 'En Mantenimiento').length;
        const completedCedulas = cedulas.filter(c => c.status === 'Completada').length;

        return {
            totalClients,
            maintenanceEquipments,
            completedCedulas,
        };
    }, [clients, equipments, cedulas]);

    const chartData = [
        { name: 'Clientes', value: stats.totalClients, fill: 'hsl(var(--chart-1))' },
        { name: 'En Mantenimiento', value: stats.maintenanceEquipments, fill: 'hsl(var(--chart-2))' },
        { name: 'Cédulas Completas', value: stats.completedCedulas, fill: 'hsl(var(--chart-3))' },
    ];
    
    if (loading) {
        return (
          <div className="grid gap-4 auto-rows-max md:gap-8">
            <Card className="w-full">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-full"/>
                        <div>
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-5 w-80 mt-2" />
                        </div>
                    </div>
                </CardHeader>
            </Card>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card><CardHeader className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-8 w-16" /><Skeleton className="h-4 w-48" /></CardHeader></Card>
              <Card><CardHeader className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-8 w-16" /><Skeleton className="h-4 w-48" /></CardHeader></Card>
              <Card><CardHeader className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-8 w-16" /><Skeleton className="h-4 w-48" /></CardHeader></Card>
            </div>
            <Card className="col-span-1 lg:col-span-3">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="pl-2">
                <Skeleton className="h-80 w-full" />
              </CardContent>
            </Card>
          </div>
        )
    }

    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <Card className="w-full bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/20 rounded-full">
                            <ShieldCheck className="w-8 h-8 text-primary"/>
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-bold">Bienvenido, {user?.name || 'Usuario'}</CardTitle>
                            <CardDescription className="text-base text-muted-foreground mt-1">
                                Este es su panel de control para la gestión de seguridad y mantenimiento.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Clientes Totales
                        </CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalClients}</div>
                        <p className="text-xs text-muted-foreground">
                            Número de clientes activos registrados.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Equipos en Mantenimiento
                        </CardTitle>
                        <HardHat className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.maintenanceEquipments}</div>
                        <p className="text-xs text-muted-foreground">
                            Equipos con estado "En Mantenimiento".
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Cédulas Completadas
                        </CardTitle>
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completedCedulas}</div>
                        <p className="text-xs text-muted-foreground">
                           Cédulas de trabajo finalizadas exitosamente.
                        </p>
                    </CardContent>
                </Card>
            </div>

             <Card className="col-span-1 lg:col-span-3">
                <CardHeader>
                    <CardTitle>Resumen General</CardTitle>
                    <CardDescription>
                        Una vista general de los indicadores clave del sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ChartContainer config={{}} className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: 'hsla(var(--muted), 0.5)' }}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}
