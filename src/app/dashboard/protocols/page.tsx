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
import { PlusCircle, Edit, Trash2, MoreVertical } from 'lucide-react';
import { mockEquipments, mockProtocols } from '@/lib/mock-data';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const EQUIPMENTS_STORAGE_KEY = 'guardian_shield_equipments';
const PROTOCOLS_STORAGE_KEY = 'guardian_shield_protocols';

type ProtocolStep = { step: string; priority: 'baja' | 'media' | 'alta'; percentage: number };
type Protocol = { equipmentId: string; steps: ProtocolStep[] };
type Equipment = typeof mockEquipments[0];
type EditingStepInfo = {
  equipmentId: string;
  originalStepText: string;
  currentData: ProtocolStep;
};
type DeletingStepInfo = {
    equipmentId: string;
    stepToDelete: ProtocolStep;
};

export default function ProtocolsPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [editingStep, setEditingStep] = useState<EditingStepInfo | null>(null);
  const [deletingStep, setDeletingStep] = useState<DeletingStepInfo | null>(null);

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

  const handleEditChange = (field: keyof ProtocolStep, value: string | number) => {
    if (!editingStep) return;
    setEditingStep({
      ...editingStep,
      currentData: {
        ...editingStep.currentData,
        [field]: value,
      },
    });
  };

  const handleSaveEdit = () => {
    if (!editingStep) return;
    const updatedProtocols = protocols.map(p => {
      if (p.equipmentId === editingStep.equipmentId) {
        const newSteps = p.steps.map(s => {
          if (s.step === editingStep.originalStepText) {
            return {
                ...editingStep.currentData,
                percentage: Number(editingStep.currentData.percentage) || 0,
            };
          }
          return s;
        });
        return { ...p, steps: newSteps };
      }
      return p;
    });

    setProtocols(updatedProtocols);
    localStorage.setItem(PROTOCOLS_STORAGE_KEY, JSON.stringify(updatedProtocols));
    setEditingStep(null);
  };

  const handleDeleteStep = () => {
      if (!deletingStep) return;
      const updatedProtocols = protocols.map(p => {
          if (p.equipmentId === deletingStep.equipmentId) {
              const newSteps = p.steps.filter(s => s.step !== deletingStep.stepToDelete.step);
              return { ...p, steps: newSteps };
          }
          return p;
      });

      setProtocols(updatedProtocols);
      localStorage.setItem(PROTOCOLS_STORAGE_KEY, JSON.stringify(updatedProtocols));
      setDeletingStep(null);
  };

  return (
    <>
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
                        <div className="flex items-center gap-4">
                            <span>{equipment.name}</span>
                            <Badge variant="outline">{equipmentProtocols.length} pasos</Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {equipmentProtocols.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50%]">Paso del Protocolo</TableHead>
                              <TableHead>Prioridad</TableHead>
                              <TableHead>% Estimado</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
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
                                <TableCell>{protocolStep.percentage}%</TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                          <Button size="icon" variant="ghost">
                                              <MoreVertical className="h-4 w-4" />
                                          </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                          <DropdownMenuItem onSelect={() => setEditingStep({ equipmentId: equipment.id, originalStepText: protocolStep.step, currentData: { ...protocolStep }})}>
                                              <Edit className="mr-2 h-4 w-4" />
                                              <span>Editar</span>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeletingStep({ equipmentId: equipment.id, stepToDelete: protocolStep })}>
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              <span>Eliminar</span>
                                          </DropdownMenuItem>
                                      </DropdownMenuContent>
                                  </DropdownMenu>
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
      
      {/* Edit Dialog */}
      <Dialog open={!!editingStep} onOpenChange={(open) => !open && setEditingStep(null)}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Editar Paso del Protocolo</DialogTitle>
                <DialogDescription>Modifique los detalles de este paso del mantenimiento.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="step-text">Descripción del Paso</Label>
                    <Textarea id="step-text" value={editingStep?.currentData.step || ''} onChange={(e) => handleEditChange('step', e.target.value)} className="min-h-32" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="step-priority">Prioridad</Label>
                        <Select value={editingStep?.currentData.priority} onValueChange={(value) => handleEditChange('priority', value as ProtocolStep['priority'])}>
                            <SelectTrigger id="step-priority">
                                <SelectValue placeholder="Seleccione prioridad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="baja">Baja</SelectItem>
                                <SelectItem value="media">Media</SelectItem>
                                <SelectItem value="alta">Alta</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="step-percentage">Porcentaje (%)</Label>
                        <Input id="step-percentage" type="number" min="0" max="100" value={editingStep?.currentData.percentage || 0} onChange={(e) => handleEditChange('percentage', e.target.value)} />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingStep(null)}>Cancelar</Button>
                <Button type="button" onClick={handleSaveEdit}>Guardar Cambios</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    
    {/* Delete Confirmation Dialog */}
    <AlertDialog open={!!deletingStep} onOpenChange={(open) => !open && setDeletingStep(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente el paso del protocolo.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteStep} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
