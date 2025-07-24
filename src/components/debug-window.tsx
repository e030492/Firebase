
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/hooks/use-data-provider";
import { Badge } from "./ui/badge";
import { GripVertical } from 'lucide-react';

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

    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const windowRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
        // Disable text selection while dragging
        document.body.style.userSelect = 'none';
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        // Re-enable text selection
        document.body.style.userSelect = '';
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging && windowRef.current) {
            const newX = e.clientX - dragStartPos.current.x;
            const newY = e.clientY - dragStartPos.current.y;
            setPosition({ x: newX, y: newY });
        }
    };
    
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = '';
        };
    }, [isDragging]);


    const getStatusVariant = () => {
        if (error) return 'destructive';
        if (loading) return 'secondary';
        return 'default';
    }

    return (
        <div
            ref={windowRef}
            className="fixed z-50 shadow-2xl"
            style={{ top: `${position.y}px`, left: `${position.x}px` }}
        >
            <Card className="w-96 border-4 border-primary/20">
                <CardHeader 
                    className="p-3 bg-primary/10 cursor-move flex-row items-center justify-between"
                    onMouseDown={handleMouseDown}
                >
                    <div className="flex items-center gap-2">
                         <GripVertical className="h-5 w-5 text-primary/50"/>
                         <CardTitle className="text-lg">Debug Window</CardTitle>
                    </div>
                    <Badge variant={getStatusVariant()}>
                        {error ? 'ERROR' : loading ? 'LOADING' : 'IDLE'}
                    </Badge>
                </CardHeader>
                <CardContent className="p-4 pt-2 text-sm">
                    <div className="bg-muted p-3 rounded-md h-64 overflow-y-auto text-xs font-mono space-y-2">
                        <p className="font-bold border-b pb-1 mb-1 text-base">Status Message:</p>
                        <p className={error ? "text-destructive font-bold text-sm" : "text-sm"}>{debugMessage}</p>
                        
                        <p className="font-bold border-b pb-1 mt-4 text-base">Record Counts:</p>
                        <p>Users: <span className="font-bold">{users.length}</span></p>
                        <p>Clients: <span className="font-bold">{clients.length}</span></p>
                        <p>Systems: <span className="font-bold">{systems.length}</span></p>
                        <p>Equipments: <span className="font-bold">{equipments.length}</span></p>
                        <p>Protocols: <span className="font-bold">{protocols.length}</span></p>
                        <p>Cédulas: <span className="font-bold">{cedulas.length}</span></p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
