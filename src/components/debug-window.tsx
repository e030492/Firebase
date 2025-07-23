
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useData } from "@/hooks/use-data-provider";
import { Server, CheckCircle, AlertTriangle, Loader2, X } from "lucide-react";
import { useState } from "react";

export function DebugWindow() {
  const { loading, error, users, clients, systems, equipments, protocols, cedulas } = useData();
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
        <Button 
            className="fixed bottom-4 right-4 z-50 rounded-full h-12 w-12"
            onClick={() => setIsOpen(true)}
            aria-label="Open Debug Window"
        >
            <Server className="h-6 w-6" />
        </Button>
    )
  }

  const status = loading ? 'LOADING' : (error ? 'ERROR' : 'SUCCESS');

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-2xl bg-background/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between p-3 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
                {status === 'LOADING' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                {status === 'SUCCESS' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {status === 'ERROR' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                <span>Estado del Sistema</span>
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
            </Button>
        </CardHeader>
        <CardContent className="text-xs p-3 pt-0">
             <Separator className="mb-3"/>
             {error && <p className="text-destructive mb-2 break-words">Error: {error}</p>}
             <div className="space-y-1">
                <div className="flex justify-between"><span>Usuarios:</span> <span className="font-mono">{users.length}</span></div>
                <div className="flex justify-between"><span>Clientes:</span> <span className="font-mono">{clients.length}</span></div>
                <div className="flex justify-between"><span>Sistemas:</span> <span className="font-mono">{systems.length}</span></div>
                <div className="flex justify-between"><span>Equipos:</span> <span className="font-mono">{equipments.length}</span></div>
                <div className="flex justify-between"><span>Protocolos:</span> <span className="font-mono">{protocols.length}</span></div>
                <div className="flex justify-between"><span>Cédulas:</span> <span className="font-mono">{cedulas.length}</span></div>
             </div>
        </CardContent>
    </Card>
  )
}
