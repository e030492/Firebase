"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from 'lucide-react';
import { mockEquipments, mockProtocols } from '@/lib/mock-data';

const EQUIPMENTS_STORAGE_KEY = 'guardian_shield_equipments';
const PROTOCOLS_STORAGE_KEY = 'guardian_shield_protocols';

type Equipment = typeof mockEquipments[0];
type Protocol = {
  equipmentId: string;
  steps: Array<{ step: string; priority: 'baja' | 'media' | 'alta'; percentage: number }>;
};

export default function ProtocolsPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);

  useEffect(() => {
    const storedEquipmentsData = localStorage.getItem(EQUIPMENTS_STORAGE_KEY);
    const equipmentsData: Equipment[] = storedEquipmentsData ? JSON.parse(storedEquipmentsData) : mockEquipments;
    setEquipments(equipmentsData);
    
    const storedProtocols = localStorage.getItem(PROTOCOLS_STORAGE_KEY);
    if (storedProtocols) {
      setProtocols(JSON.parse(storedProtocols));
    } else {
      localStorage.setItem(PROTOCOLS_STORAGE_KEY, JSON.stringify(mockProtocols));
      setProtocols(mockProtocols);
    }
  }, []);

  const getProtocolsForEquipment = (equipmentId: string) => {
    return protocols.find(p => p.equipmentId === equipmentId)?.steps || [];
  };

  const getPriorityBadgeVariant = (priority: string): 'default' | 'secondary' | 'destructive' => {
    switch (priority?.toLowerCase()) {
      case 'alta':
        return 'destructive';
      case 'media':
        return 'default';
      case 'baja':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="flex items-center justify-between">
        <div className="grid gap-2">
          <h1 className="font-headline text-3xl font-bold">Protocolos de Mantenimiento</h1>
          <p className="text-muted-foreground">
            Listado de protocolos de mantenimiento por equipo.
          </p>
        </div>
        <Link href="/dashboard/protocols/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Generar Protocolo con IA
          </Button>
        </Link>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Accordion type="single" collapsible className="w-full">
            {equipments.map(equipment => {
              const equipmentProtocols = getProtocolsForEquipment(equipment.id);
              return (
                <AccordionItem value={equipment.id} key={equipment.id}>
                  <AccordionTrigger className="text-lg font-medium hover:no-underline">
                    {equipment.name}
                    <Badge variant="outline" className="ml-4">{equipmentProtocols.length} pasos</Badge>
                  </AccordionTrigger>
                  <AccordionContent>
                    {equipmentProtocols.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[70%]">Paso del Protocolo</TableHead>
                            <TableHead>Prioridad</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {equipmentProtocols.map((protocolStep, index) => (
                            <TableRow key={index}>
                              <TableCell>{protocolStep.step}</TableCell>
                              <TableCell>
                                <Badge variant={getPriorityBadgeVariant(protocolStep.priority)} className="capitalize">
                                  {protocolStep.priority}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground px-4 py-2">No hay un protocolo de mantenimiento definido para este equipo.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
