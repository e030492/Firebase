"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LineChart } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="grid gap-2">
        <h1 className="font-headline text-3xl font-bold">Reportes</h1>
        <p className="text-muted-foreground">
          Visualice y genere reportes detallados del sistema.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-6 w-6" />
            Módulo de Reportes
          </CardTitle>
          <CardDescription>
            Esta sección se encuentra en construcción. Próximamente podrá generar reportes personalizados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Contenido de reportes próximamente...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
