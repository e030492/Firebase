
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";


export default function DashboardPage() {
    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <Card className="text-center">
                <CardHeader>
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <ShieldCheck className="h-10 w-10" />
                        </div>
                        <CardTitle className="text-3xl font-bold">¡Bienvenido a Escuadra Tecnology!</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-muted-foreground">
                        Este es su panel de control central.
                    </p>
                    <p className="mt-2 text-muted-foreground">
                        Utilice el menú de la izquierda para navegar por las diferentes secciones del sistema.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
