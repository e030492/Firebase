
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
import { PlusCircle, Edit, Trash2, MoreVertical, Wand2, Loader2, Camera } from 'lucide-react';
import { suggestMaintenanceProtocol } from '@/ai/flows/suggest-maintenance-protocol';
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Protocol, Equipment, Client, System, ProtocolStep } from '@/lib/services';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/hooks/use-data-provider';

type EditingStepInfo = {
  protocolId: string;
  originalStepText: string;
  currentData: ProtocolStep;
};
type DeletingStepInfo = {
    protocolId: string;
    stepToDelete: ProtocolStep;
};

export default function ProtocolsPage() {
  const router = useRouter();
  const { 
      equipments: allEquipments, 
      protocols, 
      clients, 
      systems, 
      loading,
      createProtocol,
      updateProtocol,
      deleteProtocol,
  } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editingStep, setEditingStep] = useState<EditingStepInfo | null>(null);
  const [deletingStep, setDeletingStep] = useState<DeletingStepInfo | null>(null);
  const [protocolToDelete, setProtocolToDelete] = useState<Protocol | null>(null);

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [clientWarehouses, setClientWarehouses] = useState<string[]>([]);
  
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
   useEffect(() => {
    if (selectedClientId) {
        const client = clients.find(c => c.id === selectedClientId);
        setClientWarehouses(client?.almacenes.map(a => a.nombre) || []);
        setSelectedWarehouse(''); // Reset warehouse selection
    } else {
        setClientWarehouses([]);
        setSelectedWarehouse('');
    }
  }, [selectedClientId, clients]);

  const filteredEquipments = useMemo(() => {
    let equipments = [...allEquipments];
    
    if (selectedClientId && selectedClientId !== 'all') {
      const clientName = clients.find(c => c.id === selectedClientId)?.name;
      if (clientName) {
        equipments = equipments.filter(eq => eq.client === clientName);
      }
    }
    
    if (selectedSystemId && selectedSystemId !== 'all') {
      const systemName = systems.find(s => s.id === selectedSystemId)?.name;
      if (systemName) {
        equipments = equipments.filter(eq => eq.system === systemName);
      }
    }

    if (selectedWarehouse && selectedWarehouse !== 'all') {
        equipments = equipments.filter(eq => eq.location === selectedWarehouse);
    }
    
    return equipments;
  }, [selectedClientId, selectedSystemId, selectedWarehouse, allEquipments, clients, systems]);


  const getProtocolForEquipment = (equipmentId: string): Protocol | undefined => {
    return protocols.find(p => p.equipmentId === equipmentId);
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

  const handleImageChangeInDialog = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingStep) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingStep({
            ...editingStep,
            currentData: {
                ...editingStep.currentData,
                imageUrl: reader.result as string,
            },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingStep) return;
    
    const protocolToUpdate = protocols.find(p => p.id === editingStep.protocolId);
    if (!protocolToUpdate) return;

    const newSteps = protocolToUpdate.steps.map(s => 
        s.step === editingStep.originalStepText ? { ...editingStep.currentData, percentage: Number(editingStep.currentData.percentage || 0)} : s
    );

    try {
        await updateProtocol(editingStep.protocolId, { steps: newSteps });
        setEditingStep(null);
    } catch (error) {
        console.error("Failed to save step edit:", error);
        alert("Error al guardar los cambios.");
    }
  };

  const handleDeleteStep = async () => {
      if (!deletingStep) return;
      
      const protocolToUpdate = protocols.find(p => p.id === deletingStep.protocolId);
      if (!protocolToUpdate) return;
      
      const newSteps = protocolToUpdate.steps.filter(s => s.step !== deletingStep.stepToDelete.step);

      try {
        await updateProtocol(deletingStep.protocolId, { steps: newSteps });
        setDeletingStep(null);
      } catch (error) {
        console.error("Failed to delete step:", error);
        alert("Error al eliminar el paso.");
      }
  };

  const handleDeleteProtocol = async () => {
    if (!protocolToDelete) return;

    try {
        await deleteProtocol(protocolToDelete.id);
        setProtocolToDelete(null);
    } catch (error) {
        console.error("Failed to delete protocol:", error);
        alert("Error al eliminar el protocolo completo.");
    }
  };

  const handleGenerateProtocol = async (equipment: Equipment) => {
    setIsGenerating(equipment.id);
    setGenerationError(null);

    try {
      const result = await suggestMaintenanceProtocol({
        equipmentName: equipment.name,
        equipmentDescription: equipment.description,
      });

      if (result && result.length > 0) {
        const newProtocolData: Omit<Protocol, 'id'> = {
          equipmentId: equipment.id,
          steps: result.map(step => ({ ...step, imageUrl: '', notes: '', completion: 0 })),
        };
        
        await createProtocol(newProtocolData);
      } else {
        alert("La IA no pudo generar un protocolo para este equipo.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setGenerationError(`Error al generar el protocolo: ${errorMessage}`);
      alert(`Error al generar el protocolo. Por favor, inténtelo de nuevo.`);
      console.error("Error generating protocol:", error);
    } finally {
      setIsGenerating(null);
    }
  };
  
  if(loading) {
    return (
       <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <div className="flex items-center justify-between">
                <div className="grid gap-2">
                    <Skeleton className="h-9 w-80" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <Skeleton className="h-10 w-44" />
            </div>
            <Card>
                <CardContent className="pt-6">
                    <Skeleton className="h-24 w-full mb-6" />
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <>
      <div className="grid auto-rows-max items-start gap-4 md:gap-8">
        <div className="flex items-center justify-between">
          <div className="grid gap-2">
            <h1 className="font-headline text-3xl font-bold">Protocolos de Mantenimiento</h1>
            <p className="text-muted-foreground">
              Filtre y visualice los protocolos de mantenimiento por equipo.
            </p>
          </div>
          <Link href="/dashboard/protocols/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear/Modificar Protocolo
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                 <div className="grid gap-2">
                   <Label htmlFor="client">Filtrar por Cliente</Label>
                   <Select onValueChange={(value) => setSelectedClientId(value === 'all' ? '' : value)} value={selectedClientId || 'all'}>
                     <SelectTrigger id="client">
                       <SelectValue placeholder="Todos los clientes" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">Todos los clientes</SelectItem>
                       {clients.map(client => (
                         <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                  <div className="grid gap-2">
                   <Label htmlFor="warehouse">Filtrar por Almacén</Label>
                   <Select 
                      onValueChange={(value) => setSelectedWarehouse(value === 'all' ? '' : value)} 
                      value={selectedWarehouse || 'all'}
                      disabled={!selectedClientId}
                    >
                     <SelectTrigger id="warehouse">
                       <SelectValue placeholder="Todos los almacenes" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">Todos los almacenes</SelectItem>
                       {clientWarehouses.map(warehouse => (
                         <SelectItem key={warehouse} value={warehouse}>{warehouse}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="grid gap-2">
                   <Label htmlFor="system">Filtrar por Sistema</Label>
                   <Select onValueChange={(value) => setSelectedSystemId(value === 'all' ? '' : value)} value={selectedSystemId || 'all'}>
                     <SelectTrigger id="system">
                       <SelectValue placeholder="Todos los sistemas" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">Todos los sistemas</SelectItem>
                       {systems.map(system => (
                         <SelectItem key={system.id} value={system.id}>{system.name}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
            </div>
            <Separator className="mb-6"/>
            {generationError && <p className="text-destructive text-sm text-center mb-4">{generationError}</p>}
            <Accordion type="single" collapsible className="w-full">
              {filteredEquipments.length > 0 ? (
                filteredEquipments.map(equipment => {
                  const equipmentProtocol = getProtocolForEquipment(equipment.id);
                  const equipmentProtocolSteps = equipmentProtocol?.steps || [];

                  return (
                    <AccordionItem value={equipment.id} key={equipment.id}>
                        <div className="flex items-center w-full">
                           <AccordionTrigger className="flex-1 text-lg font-medium hover:no-underline py-4">
                              <div className="flex flex-col items-start text-left">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">{equipment.name}</span>
                                  <span className="text-sm text-muted-foreground font-normal">({equipment.client})</span>
                                </div>
                                <div className="text-xs text-muted-foreground font-normal flex items-center gap-x-2">
                                  {equipment.alias && <span>Alias: {equipment.alias}</span>}
                                  {equipment.alias && <span>&bull;</span>}
                                  <span>Modelo: {equipment.model}</span>
                                  <span>&bull;</span>
                                  <span>N/S: {equipment.serial}</span>
                                </div>
                              </div>
                           </AccordionTrigger>
                           <div className="px-4 flex items-center gap-2">
                             <Badge variant="outline">{equipmentProtocolSteps.length} {equipmentProtocolSteps.length === 1 ? 'paso' : 'pasos'}</Badge>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">Más acciones</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {equipmentProtocol ? (
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/protocols/new?equipmentId=${equipment.id}`}>
                                                    <Wand2 className="mr-2 h-4 w-4" />
                                                    <span>Modificar con IA</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onSelect={() => setProtocolToDelete(equipmentProtocol)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Eliminar protocolo</span>
                                            </DropdownMenuItem>
                                        </>
                                    ) : (
                                        <DropdownMenuItem 
                                            onSelect={() => handleGenerateProtocol(equipment)} 
                                            disabled={!!isGenerating}
                                        >
                                            {isGenerating === equipment.id ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Wand2 className="mr-2 h-4 w-4" />
                                            )}
                                            <span>{isGenerating === equipment.id ? 'Generando...' : 'Generar con IA'}</span>
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                           </div>
                        </div>
                      <AccordionContent>
                        {equipmentProtocolSteps.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-16 hidden sm:table-cell">Imagen</TableHead>
                                <TableHead className="w-[50%]">Paso del Protocolo</TableHead>
                                <TableHead>Prioridad</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {equipmentProtocolSteps.map((protocolStep, index) => (
                                <TableRow key={index}>
                                  <TableCell className="hidden sm:table-cell">
                                    {protocolStep.imageUrl ? (
                                        <Image src={protocolStep.imageUrl} alt={protocolStep.step} width={48} height={48} data-ai-hint="protocol step photo" className="rounded-md object-cover aspect-square" />
                                    ) : (
                                        <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                                            <Camera className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    )}
                                  </TableCell>
                                  <TableCell>{protocolStep.step}</TableCell>
                                  <TableCell>
                                    <Badge variant={getPriorityBadgeVariant(protocolStep.priority)} className="capitalize">
                                      {protocolStep.priority}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="icon" variant="ghost">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => setEditingStep({ protocolId: equipmentProtocol!.id, originalStepText: protocolStep.step, currentData: { ...protocolStep }})}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                <span>Editar</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeletingStep({ protocolId: equipmentProtocol!.id, stepToDelete: protocolStep })}>
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
                          <div className="text-muted-foreground px-4 py-8 flex flex-col items-center justify-center text-center gap-2">
                            <p>No hay un protocolo de mantenimiento definido para este equipo.</p>
                            <p className="text-sm">Usa el menú de acciones para generar uno con IA.</p>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  )
                })
              ) : (
                 <p className="text-center text-muted-foreground py-4">No se encontraron equipos que coincidan con los filtros seleccionados.</p>
              )}
            </Accordion>
          </CardContent>
        </Card>
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={!!editingStep} onOpenChange={(open) => !open && setEditingStep(null)}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Editar Paso del Protocolo</DialogTitle>
                <DialogDescription>Modifique los detalles de este paso del mantenimiento.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                    <Label>Imagen del Paso</Label>
                    {editingStep?.currentData.imageUrl ? (
                        <Image src={editingStep.currentData.imageUrl} alt="Vista previa del paso" width={400} height={300} data-ai-hint="protocol step photo" className="rounded-md object-cover aspect-video" />
                    ) : (
                        <div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center">
                            <Camera className="h-10 w-10 text-muted-foreground" />
                        </div>
                    )}
                    <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChangeInDialog}
                        className="hidden"
                    />
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Camera className="mr-2 h-4 w-4" />
                        {editingStep?.currentData.imageUrl ? 'Cambiar Imagen' : 'Subir Imagen'}
                    </Button>
                </div>

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
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingStep(null)}>Cancelar</Button>
                <Button type="button" onClick={handleSaveEdit}>Guardar Cambios</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    
    {/* Delete Step Confirmation Dialog */}
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

     {/* Delete Protocol Confirmation Dialog */}
    <AlertDialog open={!!protocolToDelete} onOpenChange={(open) => !open && setProtocolToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Está seguro de eliminar todo el protocolo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminarán todos los pasos de mantenimiento para este equipo.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setProtocolToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProtocol} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    Sí, eliminar todo
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

    
