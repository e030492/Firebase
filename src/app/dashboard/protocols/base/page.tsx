
"use client";

import { useActionState, useState, useEffect, Suspense, useRef, useTransition, useMemo, Fragment } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

import {
  suggestMaintenanceProtocol,
  type SuggestMaintenanceProtocolOutput,
} from '@/ai/flows/suggest-maintenance-protocol';
import { generateProtocolStepImage } from '@/ai/flows/generate-protocol-step-image';
import { suggestBaseProtocol } from '@/ai/flows/suggest-base-protocol';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from "@/components/ui/checkbox";
import { Terminal, Loader2, Save, ArrowLeft, Camera, Trash2, Wand2, Edit, ListChecks, HardHat, ChevronDown, Search, PlusCircle, CheckCircle, List, MoreHorizontal, Link2Off } from 'lucide-react';
import { Protocol, Equipment, ProtocolStep, Client, System } from '@/lib/services';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/hooks/use-data-provider';
import { Separator } from '@/components/ui/separator';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    return url.startsWith('http') || url.startsWith('data:image');
};

type ProtocolGroup = Protocol & {
  equipments: Equipment[];
};

type EquipmentWithProtocol = Equipment & { protocol: Protocol | undefined };

// Main Page Component
function BaseProtocolManager() {
  const { protocols, loading, createProtocol, updateProtocol, deleteProtocol, equipments: allEquipments, clients, systems, updateEquipment } = useData();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Page State
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [similarEquipments, setSimilarEquipments] = useState<Equipment[]>([]);
  const [confirmedEquipments, setConfirmedEquipments] = useState<Equipment[]>([]);
  const [steps, setSteps] = useState<ProtocolStep[]>([]);
  
  // UI State
  const [isFindingSimilar, setIsFindingSimilar] = useState(false);
  const [isGeneratingProtocol, setIsGeneratingProtocol] = useState(false);
  const [generatingImageIndex, setGeneratingImageIndex] = useState<number | null>(null);
  const [stepToEdit, setStepToEdit] = useState<ProtocolStep & { index: number } | null>(null);
  const [editedStepText, setEditedStepText] = useState('');
  const [editedStepPriority, setEditedStepPriority] = useState<'baja' | 'media' | 'alta'>('baja');
  const [stepToDeleteIndex, setStepToDeleteIndex] = useState<number | null>(null);
  const [isAddEquipmentDialogOpen, setIsAddEquipmentDialogOpen] = useState(false);
  const [manualSelectionIds, setManualSelectionIds] = useState<string[]>([]);
  const [equipmentToUnlink, setEquipmentToUnlink] = useState<EquipmentWithProtocol | null>(null);
  const [equipmentToEdit, setEquipmentToEdit] = useState<EquipmentWithProtocol | null>(null);
  const [editedProtocolSteps, setEditedProtocolSteps] = useState<ProtocolStep[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [generatingEditImageIndex, setGeneratingEditImageIndex] = useState<number | null>(null);

  // Filters
  const [clientFilter, setClientFilter] = useState('');
  const [systemFilter, setSystemFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [clientWarehouses, setClientWarehouses] = useState<string[]>([]);
  
   useEffect(() => {
    if (clientFilter) {
      const client = clients.find(c => c.id === clientFilter);
      setClientWarehouses(client?.almacenes.map(a => a.nombre) || []);
      setWarehouseFilter('');
    } else {
      setClientWarehouses([]);
      setWarehouseFilter('');
    }
  }, [clientFilter, clients]);

  const { equipmentsWithoutProtocol, equipmentsWithProtocol } = useMemo(() => {
    const protocolKeys = new Set(protocols.map(p => `${p.type}-${p.brand}-${p.model}`));
    
    const withoutProtocol: Equipment[] = [];
    const withProtocol: EquipmentWithProtocol[] = [];

    allEquipments.forEach(eq => {
        const key = `${eq.type}-${eq.brand}-${eq.model}`;
        if (protocolKeys.has(key)) {
            const foundProtocol = protocols.find(p => `${p.type}-${p.brand}-${p.model}` === key);
            if (foundProtocol) {
                withProtocol.push({ ...eq, protocol: foundProtocol });
            } else {
                withoutProtocol.push(eq);
            }
        } else {
            withoutProtocol.push(eq);
        }
    });

    const filterFn = (eq: Equipment) => {
        const clientName = clients.find(c => c.id === clientFilter)?.name;
        const systemName = systems.find(s => s.id === systemFilter)?.name;

        const clientMatch = !clientFilter || eq.client === clientName;
        const systemMatch = !systemFilter || eq.system === systemName;
        const warehouseMatch = !warehouseFilter || eq.location === warehouseFilter;

        return clientMatch && systemMatch && warehouseMatch;
    };
    
    return {
        equipmentsWithoutProtocol: withoutProtocol.filter(filterFn),
        equipmentsWithProtocol: withProtocol.filter(filterFn)
    };
  }, [allEquipments, protocols, clientFilter, systemFilter, warehouseFilter, clients, systems]);


  const handleEquipmentSelect = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    // Reset subsequent steps
    setSimilarEquipments([]);
    setConfirmedEquipments([]);
    setSteps([]);
  };

  const findSimilarEquipments = async () => {
    if (!selectedEquipment) return;
    setIsFindingSimilar(true);
    try {
        const simplifiedEquipment = {
            id: selectedEquipment.id,
            name: selectedEquipment.name,
            description: selectedEquipment.description,
            brand: selectedEquipment.brand,
            model: selectedEquipment.model,
            type: selectedEquipment.type,
        };
        const simplifiedAllEquipments = allEquipments.map(eq => ({
             id: eq.id,
             name: eq.name,
             description: eq.description,
             brand: eq.brand,
             model: eq.model,
             type: eq.type,
        }));
        
        const result = await suggestBaseProtocol({ 
            equipment: simplifiedEquipment, 
            allEquipments: simplifiedAllEquipments.filter(e => e.id !== selectedEquipment.id)
        });
        
        const fullResultEquipments = result.map(simplifiedEq => 
            allEquipments.find(fullEq => fullEq.id === simplifiedEq.id)
        ).filter((eq): eq is Equipment => !!eq);

        setSimilarEquipments(fullResultEquipments);
        setConfirmedEquipments(fullResultEquipments);
    } catch (error) {
        console.error("Error finding similar equipments:", error);
        toast({ title: "Error de IA", description: "No se pudieron encontrar equipos similares.", variant: "destructive" });
    } finally {
        setIsFindingSimilar(false);
    }
  };
  
  const handleConfirmedEquipmentToggle = (equipmentId: string, checked: boolean) => {
    if (checked) {
        const equipmentToAdd = similarEquipments.find(e => e.id === equipmentId);
        if (equipmentToAdd) {
            setConfirmedEquipments(prev => [...prev, equipmentToAdd]);
        }
    } else {
        setConfirmedEquipments(prev => prev.filter(e => e.id !== equipmentId));
    }
  };

    const handleManualAddConfirm = () => {
        const equipmentsToAdd = allEquipments.filter(eq => manualSelectionIds.includes(eq.id));
        
        const newConfirmed = [...confirmedEquipments];
        equipmentsToAdd.forEach(eq => {
            if (!newConfirmed.some(c => c.id === eq.id)) {
                newConfirmed.push(eq);
            }
        });
        setConfirmedEquipments(newConfirmed);

        const newSimilar = [...similarEquipments];
        equipmentsToAdd.forEach(eq => {
            if (!newSimilar.some(s => s.id === eq.id)) {
                newSimilar.push(eq);
            }
        });
        setSimilarEquipments(newSimilar);
        
        setManualSelectionIds([]);
        setIsAddEquipmentDialogOpen(false);
    };

    const handleManualSelectionToggle = (equipmentId: string, checked: boolean) => {
        setManualSelectionIds(prev => {
            if (checked) {
                return [...prev, equipmentId];
            } else {
                return prev.filter(id => id !== equipmentId);
            }
        });
    };
  
  const generateProtocolForGroup = async () => {
    if (confirmedEquipments.length === 0) {
        toast({ title: "Sin Selección", description: "Debe confirmar al menos un equipo.", variant: "destructive" });
        return;
    }
    setIsGeneratingProtocol(true);
    
    const referenceEquipment = confirmedEquipments[0];
    
    try {
        const result = await suggestMaintenanceProtocol({
            name: referenceEquipment.name,
            description: referenceEquipment.description,
            brand: referenceEquipment.brand,
            model: referenceEquipment.model,
            type: referenceEquipment.type,
        });
        setSteps(result.map(step => ({...step, imageUrl: '', notes: ''})));
    } catch (error) {
        console.error("Error generating protocol steps:", error);
        toast({ title: "Error de IA", description: "No se pudieron generar los pasos del protocolo.", variant: "destructive" });
    } finally {
        setIsGeneratingProtocol(false);
    }
  };


  const handleSaveProtocol = async () => {
    if (steps.length === 0 || confirmedEquipments.length === 0) {
        toast({ title: "Información Incompleta", description: "Faltan pasos o equipos para crear el protocolo.", variant: "destructive" });
        return;
    }
    
    setIsSaving(true);
    
    const representativeEquipment = confirmedEquipments[0];
    const { type, brand, model } = representativeEquipment;
    const protocolId = `${type}-${brand}-${model}`.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    try {
        const sanitizedSteps = steps.map(step => ({
          step: step.step || '',
          priority: step.priority || 'baja',
          percentage: Number(step.percentage) || 0,
          completion: Number(step.completion) || 0,
          notes: step.notes || '',
          imageUrl: step.imageUrl || '',
        }));

        const protocolData = { type, brand, model, steps: sanitizedSteps };

        const existingProtocol = protocols.find(p => p.id === protocolId);
        
        if (existingProtocol) {
            await updateProtocol(protocolId, protocolData);
        } else {
            await createProtocol({ type, brand, model, steps: sanitizedSteps }, protocolId);
        }

        toast({ title: "Protocolo Guardado", description: "El protocolo base ha sido guardado y asociado a los equipos."});

        setSelectedEquipment(null);
        setSimilarEquipments([]);
        setConfirmedEquipments([]);
        setSteps([]);

    } catch (error) {
        console.error("Error saving protocol:", error);
        toast({ title: "Error al Guardar", description: `No se pudo guardar el protocolo: ${error instanceof Error ? error.message : 'Error desconocido'}`, variant: "destructive"});
    } finally {
        setIsSaving(false);
    }
  };

  const openEditDialog = (step: ProtocolStep, index: number) => {
    setStepToEdit({ ...step, index });
    setEditedStepText(step.step);
    setEditedStepPriority(step.priority);
  };
  
  const handleSaveEditedStep = () => {
    if (stepToEdit === null) return;
    const newSteps = [...steps];
    newSteps[stepToEdit.index] = {
        ...newSteps[stepToEdit.index],
        step: editedStepText,
        priority: editedStepPriority,
    };
    setSteps(newSteps);
    setStepToEdit(null);
  };

  const handleDeleteStep = () => {
    if (stepToDeleteIndex === null) return;
    const newSteps = steps.filter((_, index) => index !== stepToDeleteIndex);
    setSteps(newSteps);
    setStepToDeleteIndex(null);
  };

  const handleUnlinkEquipment = async () => {
    if (!equipmentToUnlink) return;
    try {
        await updateEquipment(equipmentToUnlink.id, { type: `UNLINKED_${equipmentToUnlink.type}` });
        toast({ title: "Equipo Desvinculado", description: `El equipo ${equipmentToUnlink.name} ya no usa el protocolo base.` });
    } catch (e) {
        console.error("Error unlinking equipment:", e);
        toast({ title: "Error", description: "No se pudo desvincular el equipo.", variant: "destructive" });
    } finally {
        setEquipmentToUnlink(null);
    }
  };

  const handleEditProtocolForEquipment = (equipment: EquipmentWithProtocol) => {
    setEquipmentToEdit(equipment);
    setEditedProtocolSteps(equipment.protocol?.steps.map(s => ({...s})) || []);
  };
  
  const handleSaveEditedProtocol = async () => {
    if (!equipmentToEdit || !equipmentToEdit.protocol) return;
    setIsSavingEdit(true);
    try {
        const protocolId = equipmentToEdit.protocol.id;
        await updateProtocol(protocolId, { steps: editedProtocolSteps });
        toast({ title: "Protocolo Actualizado", description: "Los cambios se han guardado en el protocolo base." });
        setEquipmentToEdit(null);
    } catch(e) {
        console.error("Error updating protocol:", e);
        toast({ title: "Error", description: "No se pudo actualizar el protocolo.", variant: "destructive" });
    } finally {
        setIsSavingEdit(false);
    }
  };

  const handleEditedStepChange = (index: number, field: keyof ProtocolStep, value: string | number) => {
    const newSteps = [...editedProtocolSteps];
    const stepToUpdate = { ...newSteps[index], [field]: value };
    newSteps[index] = stepToUpdate;
    setEditedProtocolSteps(newSteps);
  };
  
  const handleGenerateEditedStepImage = async (step: ProtocolStep, index: number) => {
      if (!equipmentToEdit) return;
      setGeneratingEditImageIndex(index);
      try {
          const result = await generateProtocolStepImage({
              name: equipmentToEdit.name, brand: equipmentToEdit.brand, model: equipmentToEdit.model, step: step.step,
          });
          const newSteps = [...editedProtocolSteps];
          if (result?.imageUrl) newSteps[index].imageUrl = result.imageUrl;
          setEditedProtocolSteps(newSteps);
      } catch (error) {
          console.error("Error generating step image:", error);
          toast({ title: "Error de IA", description: "No se pudo generar la imagen para el paso.", variant: "destructive"});
      } finally {
          setGeneratingEditImageIndex(null);
      }
  };

  const handleEditedImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newSteps = [...editedProtocolSteps];
        newSteps[index].imageUrl = reader.result as string;
        setEditedProtocolSteps(newSteps);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleStepImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newSteps = [...steps];
        newSteps[index].imageUrl = reader.result as string;
        setSteps(newSteps);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleGenerateStepImage = async (step: ProtocolStep, index: number) => {
      setGeneratingImageIndex(index);
      if (!selectedEquipment) {
          toast({ title: "Error", description: "No hay un equipo seleccionado como referencia.", variant: "destructive" });
          setGeneratingImageIndex(null);
          return;
      }
      try {
          const result = await generateProtocolStepImage({
              name: selectedEquipment.name,
              brand: selectedEquipment.brand,
              model: selectedEquipment.model,
              step: step.step,
          });
          const newSteps = [...steps];
          if (result && result.imageUrl) {
            newSteps[index].imageUrl = result.imageUrl;
          }
          setSteps(newSteps);
      } catch (error) {
          console.error("Error generating step image:", error);
          toast({ title: "Error de IA", description: "No se pudo generar la imagen para el paso.", variant: "destructive"});
      } finally {
          setGeneratingImageIndex(null);
      }
  };
  
  const handleStepImageDelete = (index: number) => {
    const newSteps = [...steps];
    newSteps[index].imageUrl = '';
    setSteps(newSteps);
  };
  
  const getPriorityBadgeVariant = (priority: string): 'default' | 'secondary' | 'destructive' => {
    switch (priority?.toLowerCase()) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baja': return 'secondary';
      default: return 'secondary';
    }
  };


  return (
    <div className="flex flex-col h-full p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
            <div className="grid gap-2">
                <h1 className="font-headline text-3xl font-bold">Gestión de Protocolos Base</h1>
                <p className="text-muted-foreground">Seleccione un equipo para crear o asignar un protocolo base.</p>
            </div>
            {steps.length > 0 && (
                <Button onClick={handleSaveProtocol} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
                    {isSaving ? 'Guardando...' : 'Guardar Protocolo Base'}
                </Button>
            )}
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Equipos Sin Protocolo Base</CardTitle>
                        <CardDescription>Filtre y seleccione un equipo para comenzar.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Select onValueChange={(value) => setClientFilter(value === 'all' ? '' : value)} value={clientFilter || 'all'}>
                                <SelectTrigger><SelectValue placeholder="Filtrar por Cliente..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los Clientes</SelectItem>
                                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                             <Select onValueChange={(value) => setSystemFilter(value === 'all' ? '' : value)} value={systemFilter || 'all'}>
                                <SelectTrigger><SelectValue placeholder="Filtrar por Sistema..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los Sistemas</SelectItem>
                                    {systems.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Select onValueChange={(value) => setWarehouseFilter(value === 'all' ? '' : value)} value={warehouseFilter || 'all'} disabled={!clientFilter}>
                            <SelectTrigger><SelectValue placeholder="Filtrar por Almacén..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Almacenes</SelectItem>
                                {clientWarehouses.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Separator />
                        <ScrollArea className="h-72">
                            <div className="space-y-2 pr-4">
                            {loading ? (
                                <Skeleton className="h-40 w-full" />
                            ) : equipmentsWithoutProtocol.length > 0 ? (
                                equipmentsWithoutProtocol.map(eq => (
                                    <button 
                                        key={eq.id} 
                                        onClick={() => handleEquipmentSelect(eq)}
                                        className={cn(
                                            "w-full text-left p-2 border rounded-md flex items-center gap-3 transition-colors",
                                            selectedEquipment?.id === eq.id ? "bg-accent text-accent-foreground ring-2 ring-primary" : "hover:bg-muted/50"
                                        )}
                                    >
                                        <Image src={isValidImageUrl(eq.imageUrl) ? eq.imageUrl! : 'https://placehold.co/40x40.png'} alt={eq.name} width={40} height={40} data-ai-hint="equipment photo" className="rounded-md object-cover"/>
                                        <div className="flex-1">
                                            <p className="font-semibold">{eq.name}</p>
                                            <p className="text-xs text-muted-foreground">{eq.type} / {eq.brand} / {eq.model}</p>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center p-4">No se encontraron equipos sin protocolo con los filtros aplicados.</p>
                            )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-2 space-y-8">
                {!selectedEquipment ? (
                    <Card className="flex flex-col items-center justify-center text-center min-h-[30rem]">
                        <CardHeader>
                            <HardHat className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
                            <CardTitle>Seleccione un Equipo</CardTitle>
                            <CardDescription>Elija un equipo de la lista de la izquierda para empezar a crear un protocolo base.</CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Equipo de Referencia Seleccionado</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-start gap-6">
                            <Image src={isValidImageUrl(selectedEquipment.imageUrl) ? selectedEquipment.imageUrl! : 'https://placehold.co/150x150.png'} alt={selectedEquipment.name} width={150} height={150} data-ai-hint="equipment photo" className="rounded-lg object-cover aspect-square"/>
                            <div className="space-y-2 flex-1">
                                <h3 className="text-lg font-bold">{selectedEquipment.name}</h3>
                                <p className="text-sm text-muted-foreground">{selectedEquipment.description}</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm pt-2">
                                    <div><span className="font-semibold">Tipo:</span> {selectedEquipment.type}</div>
                                    <div><span className="font-semibold">Marca:</span> {selectedEquipment.brand}</div>
                                    <div><span className="font-semibold">Modelo:</span> {selectedEquipment.model}</div>
                                    <div><span className="font-semibold">N/S:</span> {selectedEquipment.serial || 'N/A'}</div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={findSimilarEquipments} disabled={isFindingSimilar}>
                                {isFindingSimilar ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
                                {isFindingSimilar ? "Buscando..." : "IA: Encontrar Equipos Similares"}
                            </Button>
                        </CardFooter>
                    </Card>

                    {similarEquipments.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Equipos Similares Encontrados ({confirmedEquipments.length})</CardTitle>
                                <CardDescription>La IA sugiere estos equipos para compartir protocolo. Desmarque los que no desee incluir.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {similarEquipments.map(eq => (
                                        <div key={eq.id} className="flex items-center gap-4 p-2 border rounded-md">
                                            <Checkbox 
                                                id={`eq-${eq.id}`}
                                                checked={confirmedEquipments.some(c => c.id === eq.id)}
                                                onCheckedChange={(checked) => handleConfirmedEquipmentToggle(eq.id, !!checked)}
                                            />
                                            <Label htmlFor={`eq-${eq.id}`} className="flex items-center gap-3 cursor-pointer flex-1">
                                                <Image src={isValidImageUrl(eq.imageUrl) ? eq.imageUrl! : 'https://placehold.co/40x40.png'} alt={eq.name} width={40} height={40} data-ai-hint="equipment photo" className="rounded-md object-cover"/>
                                                <div>
                                                    <p className="font-semibold">{eq.name}</p>
                                                    <p className="text-xs text-muted-foreground">{eq.type} / {eq.brand} / {eq.model}</p>
                                                </div>
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsAddEquipmentDialogOpen(true)}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Añadir Equipo Manualmente
                                </Button>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={generateProtocolForGroup} disabled={confirmedEquipments.length === 0 || isGeneratingProtocol}>
                                    {isGeneratingProtocol ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                    {isGeneratingProtocol ? "Generando..." : `IA: Generar Protocolo para ${confirmedEquipments.length} Equipos`}
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                    
                    {steps.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Protocolo Sugerido por IA</CardTitle>
                                <CardDescription>Edite, elimine o genere imágenes para los pasos del protocolo antes de guardarlo.</CardDescription>
                            </CardHeader>
                             <CardContent className="space-y-6">
                                {steps.map((step, index) => (
                                    <div key={index}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 border rounded-lg">
                                            <div className="space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1 pr-4">
                                                        <Label className="text-base font-semibold">Paso del Protocolo</Label>
                                                        <p className="text-muted-foreground">{step.step}</p>
                                                    </div>
                                                    <Badge variant={getPriorityBadgeVariant(step.priority)} className="capitalize h-fit">{step.priority}</Badge>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => openEditDialog(step, index)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </Button>
                                                    <Button variant="destructive" size="sm" onClick={() => setStepToDeleteIndex(index)}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="grid gap-3">
                                                <Label>Evidencia Fotográfica Sugerida</Label>
                                                <div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center border">
                                                    {generatingImageIndex === index ? (
                                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                            <Loader2 className="h-10 w-10 animate-spin" />
                                                            <p>Generando imagen...</p>
                                                        </div>
                                                    ) : isValidImageUrl(step.imageUrl) ? (
                                                        <Image src={step.imageUrl!} alt={`Evidencia para ${step.step}`} width={400} height={300} data-ai-hint="protocol evidence" className="rounded-md object-cover aspect-video" />
                                                    ) : (
                                                        <div className="text-center text-muted-foreground">
                                                            <Camera className="h-10 w-10 mx-auto" />
                                                            <p className="text-sm mt-2">Sin imagen</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRefs.current[index]?.click()}>
                                                        <Camera className="mr-2 h-4 w-4" />
                                                        {isValidImageUrl(step.imageUrl) ? 'Cambiar Foto' : 'Subir Foto'}
                                                    </Button>
                                                    <Button type="button" size="sm" onClick={() => handleGenerateStepImage(step, index)} disabled={generatingImageIndex !== null}>
                                                        {generatingImageIndex === index ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                                        Generar con IA
                                                    </Button>
                                                    {isValidImageUrl(step.imageUrl) && (
                                                        <Button type="button" variant="destructive" size="icon" onClick={() => handleStepImageDelete(index)}>
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Eliminar Foto</span>
                                                        </Button>
                                                    )}
                                                </div>
                                                <Input
                                                    id={`image-upload-${index}`}
                                                    ref={el => fileInputRefs.current[index] = el}
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    onChange={(e) => handleStepImageChange(e, index)}
                                                    className="hidden"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                             <CardFooter>
                                <Button onClick={handleSaveProtocol} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
                                    {isSaving ? 'Guardando...' : 'Guardar Protocolo y Asociar'}
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </>
                )}
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Equipos con Protocolo Asignado</CardTitle>
                <CardDescription>Visualice y gestione los equipos que ya tienen un protocolo base.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Equipo</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Protocolo Base</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {equipmentsWithProtocol.length > 0 ? equipmentsWithProtocol.map(equipment => (
                           <Fragment key={equipment.id}>
                            <TableRow>
                                <TableCell className="font-medium">{equipment.name}<span className="block text-xs text-muted-foreground">{equipment.serial}</span></TableCell>
                                <TableCell>{equipment.client}</TableCell>
                                <TableCell className="text-muted-foreground">{equipment.protocol ? `${equipment.protocol.type} / ${equipment.protocol.brand}` : 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                     <div className="flex items-center justify-end gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => handleEditProtocolForEquipment(equipment)}>
                                                    <Edit className="mr-2 h-4 w-4"/> Editar Protocolo
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={() => setEquipmentToUnlink(equipment)} className="text-destructive">
                                                    <Link2Off className="mr-2 h-4 w-4"/> Desvincular Protocolo
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                           </Fragment>
                        )) : (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center">No hay equipos con protocolo que coincidan con los filtros.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        
        <Dialog open={!!stepToEdit} onOpenChange={() => setStepToEdit(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Paso del Protocolo</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="step-text">Descripción del Paso</Label>
                        <Textarea id="step-text" value={editedStepText} onChange={(e) => setEditedStepText(e.target.value)} className="min-h-32"/>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="step-priority">Prioridad</Label>
                        <Select value={editedStepPriority} onValueChange={(v) => setEditedStepPriority(v as any)}>
                            <SelectTrigger id="step-priority"><SelectValue placeholder="Seleccione una prioridad" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="baja">Baja</SelectItem>
                                <SelectItem value="media">Media</SelectItem>
                                <SelectItem value="alta">Alta</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setStepToEdit(null)}>Cancelar</Button>
                    <Button onClick={handleSaveEditedStep}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        <AlertDialog open={stepToDeleteIndex !== null} onOpenChange={() => setStepToDeleteIndex(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Está seguro de eliminar este paso?</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteStep} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!equipmentToUnlink} onOpenChange={() => setEquipmentToUnlink(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Desvincular Equipo?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción quitará el protocolo base de "{equipmentToUnlink?.name}". El protocolo no se eliminará y seguirá disponible para otros equipos.
                        El equipo volverá a la lista de "Equipos Sin Protocolo".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleUnlinkEquipment} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Sí, desvincular</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        
        <Dialog open={!!equipmentToEdit} onOpenChange={() => setEquipmentToEdit(null)}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Editar Protocolo para: {equipmentToEdit?.protocol?.type}</DialogTitle>
                    <DialogDescription>
                       Los cambios realizados aquí afectarán a todos los equipos que utilicen este protocolo base.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] -mx-6 px-6">
                    <div className="space-y-6 py-4">
                        {editedProtocolSteps.map((step, index) => (
                           <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 border rounded-lg">
                               <div className="space-y-4">
                                   <div className="grid gap-2">
                                       <Label htmlFor={`edit-step-text-${index}`}>Paso del Protocolo</Label>
                                       <Textarea id={`edit-step-text-${index}`} value={step.step} onChange={e => handleEditedStepChange(index, 'step', e.target.value)} className="min-h-24"/>
                                   </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor={`edit-step-priority-${index}`}>Prioridad</Label>
                                        <Select value={step.priority} onValueChange={(v) => handleEditedStepChange(index, 'priority', v as any)}>
                                            <SelectTrigger id={`edit-step-priority-${index}`}><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="baja">Baja</SelectItem>
                                                <SelectItem value="media">Media</SelectItem>
                                                <SelectItem value="alta">Alta</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                               </div>
                               <div className="grid gap-3">
                                   <Label>Evidencia Fotográfica Sugerida</Label>
                                   <div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center border">
                                       {generatingEditImageIndex === index ? (
                                           <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                                       ) : isValidImageUrl(step.imageUrl) ? (
                                           <Image src={step.imageUrl!} alt={`Evidencia para ${step.step}`} width={400} height={300} data-ai-hint="protocol evidence" className="rounded-md object-cover aspect-video" />
                                       ) : (
                                           <Camera className="h-10 w-10 text-muted-foreground" />
                                       )}
                                   </div>
                                   <div className="flex items-center gap-2">
                                       <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(`edit-image-upload-${index}`)?.click()}>
                                           <Camera className="mr-2 h-4 w-4" /> Subir
                                       </Button>
                                       <Button type="button" size="sm" onClick={() => handleGenerateEditedStepImage(step, index)} disabled={generatingEditImageIndex !== null}>
                                           <Wand2 className="mr-2 h-4 w-4" /> IA
                                       </Button>
                                       {isValidImageUrl(step.imageUrl) && (
                                           <Button type="button" variant="destructive" size="icon" onClick={() => handleEditedStepChange(index, 'imageUrl', '')}>
                                               <Trash2 className="h-4 w-4" />
                                           </Button>
                                       )}
                                   </div>
                                    <Input id={`edit-image-upload-${index}`} type="file" accept="image/*" onChange={(e) => handleEditedImageChange(e, index)} className="hidden" />
                               </div>
                           </div>
                        ))}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEquipmentToEdit(null)}>Cancelar</Button>
                    <Button onClick={handleSaveEditedProtocol} disabled={isSavingEdit}>
                        {isSavingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                        Guardar Cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isAddEquipmentDialogOpen} onOpenChange={setIsAddEquipmentDialogOpen}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Añadir Equipos Manualmente al Grupo</DialogTitle>
                    <DialogDescription>
                        Seleccione los equipos del inventario que no fueron sugeridos por la IA para añadirlos al grupo.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-96 mt-4">
                    <div className="space-y-2 pr-4">
                        {allEquipments
                            .filter(eq => !similarEquipments.some(similar => similar.id === eq.id))
                            .map(eq => (
                                <div key={eq.id} className="flex items-center gap-3 p-2 border rounded-md">
                                    <Checkbox
                                        id={`manual-add-${eq.id}`}
                                        checked={manualSelectionIds.includes(eq.id)}
                                        onCheckedChange={(checked) => handleManualSelectionToggle(eq.id, !!checked)}
                                    />
                                    <Label htmlFor={`manual-add-${eq.id}`} className="flex items-center gap-3 cursor-pointer flex-1">
                                        <Image src={isValidImageUrl(eq.imageUrl) ? eq.imageUrl! : 'https://placehold.co/40x40.png'} alt={eq.name} width={40} height={40} data-ai-hint="equipment photo" className="rounded-md object-cover"/>
                                        <div className="flex-1">
                                            <p className="font-semibold">{eq.name}</p>
                                            <p className="text-xs text-muted-foreground">{eq.type} / {eq.brand} / {eq.model}</p>
                                        </div>
                                    </Label>
                                </div>
                            ))
                        }
                    </div>
                </ScrollArea>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddEquipmentDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleManualAddConfirm} disabled={manualSelectionIds.length === 0}>
                       Añadir Seleccionados ({manualSelectionIds.length})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
}

export default function BaseProtocolPageWrapper() {
    return (
        <Suspense fallback={<p>Cargando...</p>}>
            <BaseProtocolManager />
        </Suspense>
    )
}
