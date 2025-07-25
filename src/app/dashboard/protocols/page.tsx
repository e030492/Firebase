
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
import { PlusCircle, Edit, Trash2, MoreVertical, Wand2, Loader2, Camera, Search, Copy } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';


type EditingStepInfo = {
  protocolId: string;
  originalStepText: string;
  currentData: ProtocolStep;
};
type DeletingStepInfo = {
    protocolId: string;
    stepToDelete: ProtocolStep;
};
type ProtocolToCopyInfo = {
    sourceProtocol: Protocol;
    sourceEquipmentName: string;
    targetEquipment: Equipment;
}

export default function ProtocolsPage() {
  const router = useRouter();
  const { 
      equipments: allEquipments, 
      protocols, 
      clients, 
      systems, 
      loading,
      createProtocol,
  } = useData();
  
  const [protocolToDelete, setProtocolToDelete] = useState<Protocol | null>(null);
  const [protocolToCopy, setProtocolToCopy] = useState<ProtocolToCopyInfo | null>(null);
  const [showNoSimilarFoundAlert, setShowNoSimilarFoundAlert] = useState<Equipment | null>(null);

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [clientWarehouses, setClientWarehouses] = useState<string[]>([]);
  
  const [selectedEquipmentForModification, setSelectedEquipmentForModification] = useState<string>('');

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

  const handleSearchSimilar = (targetEquipment: Equipment) => {
    const similarEquipmentWithProtocol = allEquipments.find(
      eq =>
        eq.id !== targetEquipment.id &&
        eq.name === targetEquipment.name &&
        eq.type === targetEquipment.type &&
        protocols.some(p => p.equipmentId === eq.id)
    );

    if (similarEquipmentWithProtocol) {
      const sourceProtocol = protocols.find(p => p.equipmentId === similarEquipmentWithProtocol.id);
      if (sourceProtocol) {
        setProtocolToCopy({ 
            sourceProtocol, 
            sourceEquipmentName: similarEquipmentWithProtocol.name,
            targetEquipment 
        });
        return;
      }
    }
    
    setShowNoSimilarFoundAlert(targetEquipment);
  };
  
  const handleCopyProtocol = async () => {
    if (!protocolToCopy) return;

    const newProtocolForCurrentEquipment: Omit<Protocol, 'id'> = {
        equipmentId: protocolToCopy.targetEquipment.id,
        steps: protocolToCopy.sourceProtocol.steps.map(s => ({ ...s, imageUrl: '', notes: '', completion: 0 })),
    };
    
    try {
        await createProtocol(newProtocolForCurrentEquipment);
        setProtocolToCopy(null);
        alert('Protocolo copiado y guardado con éxito.');
    } catch (error) {
        console.error("Failed to copy protocol:", error);
        alert("Error al copiar el protocolo.");
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
           <Link href={selectedEquipmentForModification ? `/dashboard/protocols/new?equipmentId=${selectedEquipmentForModification}` : "/dashboard/protocols/new"}>
                <Button disabled={!selectedEquipmentForModification}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {selectedEquipmentForModification ? 'Modificar Protocolo Seleccionado' : 'Crear/Modificar Protocolo'}
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
            
            <RadioGroup value={selectedEquipmentForModification} onValueChange={setSelectedEquipmentForModification}>
                <Accordion type="single" collapsible className="w-full">
                {filteredEquipments.length > 0 ? (
                    filteredEquipments.map(equipment => {
                    const equipmentProtocol = getProtocolForEquipment(equipment.id);
                    const equipmentProtocolSteps = equipmentProtocol?.steps || [];
                    const isSelected = selectedEquipmentForModification === equipment.id;

                    return (
                        <AccordionItem value={equipment.id} key={equipment.id} className={cn(isSelected && "bg-primary/5 border-primary/20 rounded-md")}>
                            <div className="flex items-center w-full px-4">
                                <RadioGroupItem value={equipment.id} id={`radio-${equipment.id}`} className="mr-4" />
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
                                            <>
                                            <DropdownMenuItem onSelect={() => handleSearchSimilar(equipment)}>
                                                <Search className="mr-2 h-4 w-4" />
                                                <span>Buscar Similares</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/protocols/new?equipmentId=${equipment.id}`}>
                                                    <Wand2 className="mr-2 h-4 w-4" />
                                                    <span>Generar con IA</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            </>
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
                                    <TableHead className="w-[50%]">Paso del Protocolo</TableHead>
                                    <TableHead>Prioridad</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {equipmentProtocolSteps.map((protocolStep, index) => (
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
                              <div className="text-muted-foreground px-4 py-8 flex flex-col items-center justify-center text-center gap-2">
                                <p>No hay un protocolo de mantenimiento definido para este equipo.</p>
                                <p className="text-sm">Usa el menú de acciones para buscar uno similar o generar uno con IA.</p>
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
            </RadioGroup>

          </CardContent>
        </Card>
      </div>
      
    <AlertDialog open={!!protocolToCopy} onOpenChange={() => setProtocolToCopy(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <div className="flex items-center gap-2">
                    <Copy className="h-6 w-6 text-primary" />
                    <AlertDialogTitle>Protocolo Similar Encontrado</AlertDialogTitle>
                </div>
                <AlertDialogDescription>
                    Se encontró un protocolo para un equipo similar ("{protocolToCopy?.sourceEquipmentName}"). ¿Desea copiar sus pasos a "{protocolToCopy?.targetEquipment.name}"?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setProtocolToCopy(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleCopyProtocol}>
                    Sí, Copiar Protocolo
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={!!showNoSimilarFoundAlert} onOpenChange={() => setShowNoSimilarFoundAlert(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <div className="flex items-center gap-2">
                    <Search className="h-6 w-6 text-muted-foreground" />
                    <AlertDialogTitle>Búsqueda Completada</AlertDialogTitle>
                </div>
                <AlertDialogDescription>
                    No se encontró un protocolo para un equipo similar. Puede generar uno nuevo utilizando la IA.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogAction onClick={() => {
                    const equipmentId = showNoSimilarFoundAlert?.id;
                    setShowNoSimilarFoundAlert(null);
                    if (equipmentId) {
                       router.push(`/dashboard/protocols/new?equipmentId=${equipmentId}`);
                    }
                }}>
                    Generar con IA
                </AlertDialogAction>
                 <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
