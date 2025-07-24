
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/hooks/use-data-provider";
import { Badge } from "./ui/badge";

export function DebugWindow() {
    const { 
        loading, 
        debugMessage, 
        users,
        clients,
        systems,
        equipments,
        protocols,
        cedulas,
        error 
    } = useData();

    const getStatusVariant = () => {
        if (error) return 'destructive';
        if (loading) return 'secondary';
        return 'default';
    }

    return (
        <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-2xl">
            <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Debug Window</CardTitle>
                    <Badge variant={getStatusVariant()}>
                        {error ? 'ERROR' : loading ? 'LOADING' : 'IDLE'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-sm">
                <div className="bg-muted p-2 rounded-md h-48 overflow-y-auto text-xs font-mono space-y-2">
                    <p className="font-bold border-b pb-1 mb-1">Status Message:</p>
                    <p className={error ? "text-destructive" : ""}>{debugMessage}</p>
                    
                    <p className="font-bold border-b pb-1 mt-2">Record Counts:</p>
                    <p>Users: {users.length}</p>
                    <p>Clients: {clients.length}</p>
                    <p>Systems: {systems.length}</p>
                    <p>Equipments: {equipments.length}</p>
                    <p>Protocols: {protocols.length}</p>
                    <p>Cédulas: {cedulas.length}</p>
                </div>
            </CardContent>
        </Card>
    );
}
