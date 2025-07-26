
"use client";

import { useState, useEffect, useMemo, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, MoreVertical, Wand2, Loader2, Camera, Search, Copy, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { suggestMaintenanceProtocol } from '@/ai/flows/suggest-maintenance-protocol';
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
import { Separator } from '@/components/ui/separator';
import { Protocol, Equipment, Client, System } from '@/lib/services';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/hooks/use-data-provider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';


export type ProtocolToCopyInfo = {
    sourceOptions: { protocol: Protocol; equipment: Equipment }[];
    targetEquipment: Equipment;
};

export function CopyProtocolDialog({ protocolToCopy, onOpenChange, onConfirm }: { protocolToCopy: ProtocolToCopyInfo | null, onOpenChange: (open: boolean) => void, onConfirm: (selectedSource: { protocol: Protocol; equipment: Equipment }) => void }) {
    const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

    useEffect(() => {
        if (protocolToCopy && protocolToCopy.sourceOptions.length > 0) {
            setSelectedSourceId(protocolToCopy.sourceOptions[0].equipment.id);
        } else {
            setSelectedSourceId(null);
        }
    }, [protocolToCopy]);
    
    if (!protocolToCopy) return null;

    const handleConfirm = () => {
        const selected = protocolToCopy.sourceOptions.find(opt => opt.equipment.id === selectedSourceId);
        if (selected) {
            onConfirm(selected);
        }
    };
    
    return (
        <AlertDialog open={!!protocolToCopy} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-4xl">
                <AlertDialogHeader>
                    <div className="flex items-center gap-2">
                        <Copy className="h-6 w-6 text-primary" />
                        <AlertDialogTitle>Protocolo Similar Encontrado</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription asChild>
                        <div className="space-y-4 pt-4 text-sm">
                            <p>Se encontraron protocolos para equipos similares. Seleccione uno para copiar sus pasos al equipo destino.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                                <div className="bg-muted p-3 rounded-md space-y-2 border">
                                    <h4 className="font-semibold mb-1 text-foreground">Equipo Destino (actual)</h4>
                                     {protocolToCopy.targetEquipment.imageUrl ? (
                                        <Image src={protocolToCopy.targetEquipment.imageUrl} alt={protocolToCopy.targetEquipment.name} width={200} height={150} data-ai-hint="equipment photo" className="rounded-md object-cover aspect-video w-full" />
                                    ) : (
                                        <div className="w-full aspect-video bg-background/50 rounded-md flex items-center justify-center border"><Camera className="h-8 w-8 text-muted-foreground" /></div>
                                    )}
                                    <p className="font-semibold text-foreground">{protocolToCopy.targetEquipment.name}</p>
                                    <div className="text-muted-foreground space-y-1">
                                       <p><b>Alias:</b> {protocolToCopy.targetEquipment.alias || 'N/A'}</p>
                                       <p><b>Tipo:</b> {protocolToCopy.targetEquipment.type}</p>
                                       <p><b>Modelo:</b> {protocolToCopy.targetEquipment.model}</p>
                                       <p><b>N/S:</b> {protocolToCopy.targetEquipment.serial}</p>
                                       <p><b>Cliente:</b> {protocolToCopy.targetEquipment.client}</p>
                                    </div>
                                </div>
                                <div>
                                    <RadioGroup value={selectedSourceId || ''} onValueChange={setSelectedSourceId}>
                                        <div className="space-y-2">
                                            {protocolToCopy.sourceOptions.map(option => (
                                                <Label key={option.equipment.id} htmlFor={option.equipment.id} className={cn("flex items-start gap-4 rounded-md border p-3 cursor-pointer hover:bg-accent hover:text-accent-foreground", selectedSourceId === option.equipment.id && "bg-accent/50 border-primary")}>
                                                    <RadioGroupItem value={option.equipment.id} id={option.equipment.id} className="mt-1" />
                                                    <div className="grid grid-cols-3 gap-4 w-full">
                                                        <div className="col-span-1">
                                                            {option.equipment.imageUrl ? (
                                                                <Image src={option.equipment.imageUrl} alt={option.equipment.name} width={150} height={112} data-ai-hint="equipment photo" className="rounded-md object-cover aspect-video w-full" />
                                                            ) : (
                                                                <div className="w-full aspect-video bg-background/50 rounded-md flex items-center justify-center border"><Camera className="h-8 w-8 text-muted-foreground" /></div>
                                                            )}
                                                        </div>
                                                        <div className="col-span-2 text-muted-foreground text-xs space-y-0.5">
                                                            <p className="font-semibold text-foreground text-sm">{option.equipment.name}</p>
                                                            <p><b>Alias:</b> {option.equipment.alias || 'N/A'}</p>
                                                            <p><b>Tipo:</b> {option.equipment.type}</p>
                                                            <p><b>Modelo:</b> {option.equipment.model}</p>
                                                            <p><b>N/S:</b> {option.equipment.serial}</p>
                                                            <p><b>Cliente:</b> {option.equipment.client}</p>
                                                            <Badge variant="outline" className="mt-1">{option.protocol.steps.length} pasos</Badge>
                                                        </div>
                                                    </div>
                                                </Label>
                                            ))}
                                        </div>
                                    </RadioGroup>
                                </div>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm} disabled={!selectedSourceId}>
                        Sí, Copiar Protocolo
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const levenshtein = (s1: string, s2: string): number => {
  if (!s1) return s2.length;
  if (!s2) return s1.length;
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= s2.length; j += 1) {
    track[j][0] = j;
  }
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // Deletion
        track[j - 1][i] + 1, // Insertion
        track[j - 1][i - 1] + indicator, // Substitution
      );
    }
  }
  return track[s2.length][s1.length];
};

type SortableKey = 'name' | 'client' | 'system';

export default function ProtocolsPage() {
  const router = useRouter();
  const { 
      equipments: allEquipments, 
      protocols, 
      clients, 
      systems, 
      loading,
      createProtocol,
      deleteProtocol,
  } = useData();
  
  const [protocolToDelete, setProtocolToDelete] = useState<Protocol | null>(null);
  const [protocolToCopy, setProtocolToCopy] = useState<ProtocolToCopyInfo | null>(null);
  const [showNoSimilarFoundAlert, setShowNoSimilarFoundAlert] = useState(false);
  const [expandedEquipmentId, setExpandedEquipmentId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [clientWarehouses, setClientWarehouses] = useState<string[]>([]);
  
  const [selectedEquipmentForModification, setSelectedEquipmentForModification] = useState<string>('');

   useEffect(() => {
    if (selectedClientId) {
        const client = clients.find(c => c.id === selectedClientId);
        setClientWarehouses(client?.almacenes.map(a => a.nombre) || []);
        setSelectedWarehouse('');
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
    
     if (sortConfig !== null) {
      equipments.sort((a, b) => {
        const key = sortConfig.key as keyof typeof a;
        if (a[key] < b[key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[key] > b[key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return equipments;
  }, [selectedClientId, selectedSystemId, selectedWarehouse, allEquipments, clients, systems, sortConfig]);

   const requestSort = (key: SortableKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortableKey) => {
    if (sortConfig?.key !== key) {
        return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    if (sortConfig.direction === 'ascending') {
        return <ArrowUp className="ml-2 h-4 w-4 text-foreground" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4 text-foreground" />;
  };

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
    const similarEquipmentsWithProtocols = allEquipments
      .filter(eq => {
          if (eq.id === targetEquipment.id) return false;
          
          const nameDistance = levenshtein(eq.name, targetEquipment.name);
          const typeDistance = levenshtein(eq.type, targetEquipment.type);
          
          return nameDistance <= 4 && typeDistance <= 4;
      })
      .map(eq => {
          const protocol = protocols.find(p => p.equipmentId === eq.id && p.steps.length > 0);
          return protocol ? { equipment: eq, protocol } : null;
      })
      .filter((item): item is { equipment: Equipment; protocol: Protocol } => item !== null);
      
    if (similarEquipmentsWithProtocols.length > 0) {
        setProtocolToCopy({
            sourceOptions: similarEquipmentsWithProtocols,
            targetEquipment,
        });
    } else {
        setShowNoSimilarFoundAlert(true);
    }
  };

  
  const handleCopyProtocol = async (selectedSource: { protocol: Protocol; equipment: Equipment }) => {
    if (!protocolToCopy) return;

    const existingProtocol = protocols.find(p => p.equipmentId === protocolToCopy.targetEquipment.id);
    
    if (existingProtocol) {
      alert("Este equipo ya tiene un protocolo. Por favor, elimínelo primero si desea copiar uno nuevo.");
      setProtocolToCopy(null);
      return;
    }

    const newProtocolForCurrentEquipment: Omit<Protocol, 'id'> = {
        equipmentId: protocolToCopy.targetEquipment.id,
        steps: selectedSource.protocol.steps.map(s => ({ ...s, imageUrl: '', notes: '', completion: 0 })),
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

   const handleToggleDetails = (equipmentId: string) => {
    setExpandedEquipmentId(prevId => prevId === equipmentId ? null : equipmentId);
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => requestSort('name')}>
                            Equipo
                            {getSortIcon('name')}
                        </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                        <Button variant="ghost" onClick={() => requestSort('client')}>
                            Cliente
                            {getSortIcon('client')}
                        </Button>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                        <Button variant="ghost" onClick={() => requestSort('system')}>
                            Sistema
                            {getSortIcon('system')}
                        </Button>
                    </TableHead>
                    <TableHead className="text-right">Pasos</TableHead>
                    <TableHead className="text-right w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipments.length > 0 ? (
                    filteredEquipments.map(equipment => {
                      const equipmentProtocol = getProtocolForEquipment(equipment.id);
                      const equipmentProtocolSteps = equipmentProtocol?.steps || [];
                      return (
                        <Fragment key={equipment.id}>
                          <TableRow onClick={() => handleToggleDetails(equipment.id)} className="cursor-pointer">
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <RadioGroupItem value={equipment.id} id={`radio-${equipment.id}`} />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                <span className={cn(equipmentProtocolSteps.length === 0 && "text-destructive")}>{equipment.name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {equipment.alias && `Alias: ${equipment.alias} • `}
                                Modelo: {equipment.model} • N/S: {equipment.serial}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{equipment.client}</TableCell>
                            <TableCell className="hidden lg:table-cell">{equipment.system}</TableCell>
                            <TableCell className="text-right">
                                <Badge variant="outline">{equipmentProtocolSteps.length} {equipmentProtocolSteps.length === 1 ? 'paso' : 'pasos'}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => e.stopPropagation()}>
                                      <MoreVertical className="h-4 w-4" />
                                      <span className="sr-only">Más acciones</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {equipmentProtocol && equipmentProtocol.steps.length > 0 ? (
                                      <>
                                        <DropdownMenuItem asChild>
                                          <Link href={`/dashboard/protocols/new?equipmentId=${equipment.id}`}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            <span>Modificar Protocolo</span>
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
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled={equipmentProtocolSteps.length === 0}>
                                  <ChevronDown className={cn("h-4 w-4 transition-transform", expandedEquipmentId === equipment.id && "rotate-180")} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {expandedEquipmentId === equipment.id && equipmentProtocolSteps.length > 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="p-0">
                                    <div className="p-4 bg-muted/50">
                                        <h4 className="font-semibold px-4 pb-2">Pasos del Protocolo</h4>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[60%]">Paso</TableHead>
                                                    <TableHead>Prioridad</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {equipmentProtocolSteps.map((step, index) => (
                                                    <TableRow key={index} className="bg-muted/50">
                                                        <TableCell>{step.step}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={getPriorityBadgeVariant(step.priority)} className="capitalize">
                                                                {step.priority}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No se encontraron equipos que coincidan con los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </RadioGroup>

          </CardContent>
        </Card>
      </div>
      
    <CopyProtocolDialog 
        protocolToCopy={protocolToCopy} 
        onOpenChange={() => setProtocolToCopy(null)}
        onConfirm={handleCopyProtocol}
    />

    <AlertDialog open={showNoSimilarFoundAlert} onOpenChange={setShowNoSimilarFoundAlert}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <div className="flex items-center gap-2">
                    <Search className="h-6 w-6 text-muted-foreground" />
                    <AlertDialogTitle>Búsqueda Completada</AlertDialogTitle>
                </div>
                <AlertDialogDescription>
                    No se encontró un protocolo para un equipo con el mismo nombre y tipo. Puede generar uno nuevo utilizando la IA.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                 <AlertDialogAction>Entendido</AlertDialogAction>
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
