
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/hooks/use-data-provider";
import { Badge } from "./ui/badge";
import { GripVertical } from 'lucide-react';
import { firebaseConfig } from '@/lib/firebase';

export function DebugWindow() {
    const { 
        loading, 
        debugLog, 
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
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [debugLog]);


    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
        document.body.style.userSelect = 'none';
    };

    const handleMouseUp = () => {
        setIsDragging(false);
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
    
    const finalLog = error ? [...debugLog, `ERROR: ${error}`] : debugLog;

    return (
        <div
            ref={windowRef}
            className="fixed z-50 shadow-2xl"
            style={{ top: `${position.y}px`, left: `${position.x}px` }}
        >
            <Card className="w-[450px] border-4 border-primary/20">
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
                    <div 
                        ref={contentRef}
                        className="bg-muted p-3 rounded-md h-64 overflow-y-auto text-xs font-mono space-y-1"
                    >
                        <p className="font-bold border-b pb-1 mb-2 text-base">Connection Status:</p>
                        {finalLog.map((msg, i) => (
                           <p key={i} className={msg.startsWith('FATAL') || msg.startsWith('ERROR') ? 'text-destructive font-bold' : ''}>
                             {`> ${msg}`}
                           </p>
                        ))}
                    </div>
                     <div className="bg-muted p-3 rounded-md h-40 overflow-y-auto text-xs font-mono space-y-2 mt-2">
                        <p className="font-bold border-b pb-1 mb-2 text-base">Firebase Config:</p>
                        <pre className="whitespace-pre-wrap">
                            {JSON.stringify(firebaseConfig, null, 2)}
                        </pre>
                    </div>
                    <div className="bg-muted p-3 rounded-md text-xs font-mono space-y-1 mt-2">
                        <p className="font-bold border-b pb-1 mb-2 text-base">Live Record Counts:</p>
                        <div className="grid grid-cols-2 gap-x-4">
                            <p>Users: <span className="font-bold">{users.length}</span></p>
                            <p>Clients: <span className="font-bold">{clients.length}</span></p>
                            <p>Systems: <span className="font-bold">{systems.length}</span></p>
                            <p>Equipments: <span className="font-bold">{equipments.length}</span></p>
                            <p>Protocols: <span className="font-bold">{protocols.length}</span></p>
                            <p>Cédulas: <span className="font-bold">{cedulas.length}</span></p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

    