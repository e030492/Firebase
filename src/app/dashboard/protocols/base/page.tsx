
"use client";

import { useActionState, useState, useEffect, Suspense, useRef, useTransition, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

import {
  suggestMaintenanceProtocol,
  type SuggestMaintenanceProtocolOutput,
} from '@/ai/flows/suggest-maintenance-protocol';
import { generateProtocolStepImage } from '@/ai/flows/generate-protocol-step-image';

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
import { Terminal, Loader2, Save, ArrowLeft, Camera, Trash2, Wand2, Edit, ListChecks, HardHat } from 'lucide-react';
import { Protocol, Equipment, ProtocolStep } from '@/lib/services';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';


type State = {
  result: SuggestMaintenanceProtocolOutput | null;
  error: string | null;
};

// Server Action
async function generateProtocolAction(prevState: State, formData: FormData): Promise<State> {
  const isSubmit = formData.get('isSubmit') === 'true';
  const type = formData.get('type') as string;
  const brand = formData.get('brand') as string;
  const model = formData.get('model') as string;

  if (!isSubmit) {
      return { result: null, error: null };
  }
  
  if (!type || !brand || !model) {
    return { ...prevState, error: 'Por favor, complete el tipo, marca y modelo del equipo.', result: null };
  }

  try {
    const result = await suggestMaintenanceProtocol({
      name: `${type} ${brand}`, // Generic name for suggestion
      description: `Un equipo de tipo '${type}', marca '${brand}' y modelo '${model}'.`,
      brand,
      model,
      type,
    });
    return { result, error: null };
  } catch (e: any) {
    console.error(e);
    return {
      ...prevState,
      error: e.message || 'Ocurrió un error al generar el protocolo.',
      result: null,
    };
  }
}

// Submit Button Component
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Generando...</span>
        </>
      ) : (
        <>
            <Wand2 className="mr-2 h-4 w-4" />
            <span>Sugerir Pasos con IA</span>
        </>
      )}
    </Button>
  );
}


// Main Page Component
function BaseProtocolManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { protocols, loading, createProtocol, updateProtocol, deleteProtocol, equipments } = useData();
  const [aiState, formAction] = useActionState(generateProtocolAction, { result: null, error: null });
  const [isTransitioning, startTransition] = useTransition();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [equipmentData, setEquipmentData] = useState({ type: '', brand: '', model: '' });
  const [selectedEquipmentIdentifier, setSelectedEquipmentIdentifier] = useState('');


  const [existingProtocol, setExistingProtocol] = useState<Protocol | null>(null);
  const [steps, setSteps] = useState<ProtocolStep[]>([]);
  
  const [stepToEdit, setStepToEdit] = useState<ProtocolStep & { index: number } | null>(null);
  const [editedStepText, setEditedStepText] = useState('');
  const [editedStepPriority, setEditedStepPriority] = useState<'baja' | 'media' | 'alta'>('baja');
  
  const [stepToDeleteIndex, setStepToDeleteIndex] = useState<number | null>(null);
  const [protocolToDelete, setProtocolToDelete] = useState<Protocol | null>(null);
  const [showDeleteAllAlert, setShowDeleteAllAlert] = useState(false);
  
  const [generatingImageIndex, setGeneratingImageIndex] = useState<number | null>(null);

  const [selectedSteps, setSelectedSteps] = useState<SuggestMaintenanceProtocolOutput>([]);
  
  const { equipmentsWithProtocol, equipmentsWithoutProtocol } = useMemo(() => {
    const withProtocol: Equipment[] = [];
    const withoutProtocol: (Equipment & { count: number })[] = [];
    
    const equipmentCounts = new Map<string, number>();
    equipments.forEach(eq => {
        if (eq.type && eq.brand && eq.model) {
            const identifier = `${eq.type}|${eq.brand}|${eq.model}`;
            equipmentCounts.set(identifier, (equipmentCounts.get(identifier) || 0) + 1);
        }
    });

    const uniqueEquipmentTypes = new Map<string, Equipment>();
    equipments.forEach(eq => {
      if (eq.type && eq.brand && eq.model) {
        const identifier = `${eq.type}|${eq.brand}|${eq.model}`;
        if (!uniqueEquipmentTypes.has(identifier)) {
          uniqueEquipmentTypes.set(identifier, eq);
        }
      }
    });

    uniqueEquipmentTypes.forEach((eq, identifier) => {
      const hasProtocol = protocols.some(p => p.type === eq.type && p.brand === eq.brand && p.model === eq.model);
      if (hasProtocol) {
        withProtocol.push(eq);
      } else {
        withoutProtocol.push({ ...eq, count: equipmentCounts.get(identifier) || 0 });
      }
    });

    withoutProtocol.sort((a, b) => a.name.localeCompare(b.name));

    return { 
        equipmentsWithProtocol: withProtocol, 
        equipmentsWithoutProtocol: withoutProtocol 
    };
  }, [equipments, protocols]);

  useEffect(() => {
    if (!loading) {
      const typeParam = searchParams.get('type');
      const brandParam = searchParams.get('brand');
      const modelParam = searchParams.get('model');
      if (typeParam && brandParam && modelParam) {
        const identifier = `${typeParam}|${brandParam}|${modelParam}`;
        setSelectedEquipmentIdentifier(identifier);
        setEquipmentData({ type: typeParam, brand: brandParam, model: modelParam });
      }
    }
  }, [searchParams, loading]);

  useEffect(() => {
    const { type, brand, model } = equipmentData;
    if (type && brand && model) {
      const found = protocols.find(p => p.type === type && p.brand === brand && p.model === model);
      setExistingProtocol(found || null);
      setSteps(found?.steps || []);
    } else {
      setExistingProtocol(null);
      setSteps([]);
    }
  }, [equipmentData, protocols]);
  
  const handleEquipmentTypeChange = (identifier: string) => {
    setSelectedEquipmentIdentifier(identifier);
    if (identifier) {
        const [typeVal, brandVal, modelVal] = identifier.split('|');
        setEquipmentData({ type: typeVal, brand: brandVal, model: modelVal });
    } else {
        setEquipmentData({ type: '', brand: '', model: '' });
    }
    // Clear AI results if equipment selection changes
    startTransition(() => {
        const formData = new FormData();
        formData.set('isSubmit', 'false');
        formAction(formData);
    });
  };

  const handleAddSelectedSteps = () => {
    if (selectedSteps.length === 0) {
       toast({ title: "Sin selección", description: "Por favor, seleccione al menos un paso sugerido para añadir.", variant: "destructive" });
       return;
    }

    const newSteps = selectedSteps.map(s => ({ 
      step: s.step || '',
      priority: s.priority || 'baja',
      percentage: s.percentage || 0,
      completion: 0, 
      notes: '', 
      imageUrl: '',
    }));
    
    const allSteps = [...steps, ...newSteps];
    
    const uniqueSteps = allSteps.filter((step, index, self) => 
        index === self.findIndex((s) => s.step === step.step)
    );
    
    setSteps(uniqueSteps);
    setSelectedSteps([]);
    startTransition(() => {
        const formData = new FormData();
        formData.set('isSubmit', 'false');
        formAction(formData);
    });
    toast({ title: "Pasos Añadidos", description: "Los pasos seleccionados se han añadido a la lista. No olvide guardar los cambios." });
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
      const { type, brand, model } = equipmentData;
      try {
          if (!type || !brand || !model) {
              throw new Error("Datos del equipo incompletos para generar la imagen.");
          }
          const result = await generateProtocolStepImage({
              name: `${type} ${brand}`,
              brand: brand,
              model: model,
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

  const handleSaveProtocol = async () => {
    const { type, brand, model } = equipmentData;
    if (!type || !brand || !model) {
      toast({ title: "Información Incompleta", description: "Debe especificar Tipo, Marca y Modelo.", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    
    try {
        const protocolId = existingProtocol?.id || `${type}-${brand}-${model}`.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

        const sanitizedSteps = steps.map(step => ({
          step: step.step || '',
          priority: step.priority || 'baja',
          percentage: Number(step.percentage) || 0,
          completion: Number(step.completion) || 0,
          notes: step.notes || '',
          imageUrl: step.imageUrl || '',
        }));

        const protocolData = { type, brand, model, steps: sanitizedSteps };

        if (existingProtocol) {
            await updateProtocol(protocolId, protocolData);
            toast({ title: "Protocolo Actualizado", description: "Los cambios al protocolo base han sido guardados."});
        } else {
            await createProtocol({ type, brand, model, steps: sanitizedSteps }, protocolId);
            toast({ title: "Protocolo Creado", description: "El nuevo protocolo base ha sido guardado."});
        }
    } catch (error) {
        console.error("Error saving protocol:", error);
        toast({ title: "Error al Guardar", description: `No se pudo guardar el protocolo: ${error instanceof Error ? error.message : 'Error desconocido'}`, variant: "destructive"});
    } finally {
        setIsSaving(false);
    }
  }
  
  const handleDeleteProtocol = async () => {
    if (protocolToDelete) {
        try {
            await deleteProtocol(protocolToDelete.id);
            toast({ title: "Protocolo Eliminado", description: "El protocolo base ha sido eliminado."});
            if (protocolToDelete.id === existingProtocol?.id) {
                handleEquipmentTypeChange('');
            }
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar el protocolo.", variant: "destructive"});
        }
    }
    setProtocolToDelete(null);
  }

  const getPriorityBadgeVariant = (priority: string): 'default' | 'secondary' | 'destructive' => {
    switch (priority?.toLowerCase()) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baja': return 'secondary';
      default: return 'secondary';
    }
  };

  const isAllSelected = aiState.result ? selectedSteps.length === aiState.result.length && aiState.result.length > 0 : false;
  const { type, brand, model } = equipmentData;
  const isFormDisabled = !type || !brand || !model;

  return (
    <div className="flex flex-col h-full p-4 md:p-6">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2 -mt-4 -mx-6 px-6 border-b">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Atrás</span>
                  </Button>
                  <div className="grid gap-0.5">
                      <h1 className="font-headline text-2xl font-bold">Gestión de Protocolos Base</h1>
                      <p className="text-muted-foreground">
                          Cree, edite o genere protocolos para un tipo de equipo específico.
                      </p>
                  </div>
              </div>
              <div className="flex gap-2">
                  <Button onClick={handleSaveProtocol} disabled={isFormDisabled || steps.length === 0 || isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
              </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto pt-4 -mx-6 px-6">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Equipos con Protocolo</CardTitle>
                                <CardDescription>Seleccione para editar un protocolo existente.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-48">
                                    <div className="space-y-2 pr-4">
                                        {equipmentsWithProtocol.map(eq => {
                                            const identifier = `${eq.type}|${eq.brand}|${eq.model}`;
                                            return (
                                                <Button 
                                                    key={identifier} 
                                                    variant={selectedEquipmentIdentifier === identifier ? "secondary" : "outline"}
                                                    className="w-full h-auto justify-start"
                                                    onClick={() => handleEquipmentTypeChange(identifier)}
                                                >
                                                    <div className="flex items-center gap-3 py-1 text-left">
                                                        <Image
                                                            src={eq.imageUrl || 'https://placehold.co/40x40.png'}
                                                            alt={eq.name}
                                                            width={40}
                                                            height={40}
                                                            data-ai-hint="equipment photo"
                                                            className="rounded-md object-cover"
                                                        />
                                                        <div>
                                                            <p className="font-semibold">{eq.type}</p>
                                                            <p className="text-xs text-muted-foreground">{eq.brand} - {eq.model}</p>
                                                        </div>
                                                    </div>
                                                </Button>
                                            )
                                        })}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Equipos sin Protocolo</CardTitle>
                                <CardDescription>Seleccione un equipo para crear un nuevo protocolo base.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-2">
                                    <Label>Seleccionar un tipo de equipo</Label>
                                    <Select 
                                      value={selectedEquipmentIdentifier} 
                                      onValueChange={handleEquipmentTypeChange}
                                      disabled={equipmentsWithoutProtocol.length === 0}
                                    >
                                        <SelectTrigger className="h-auto">
                                            <SelectValue placeholder="Seleccione un equipo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {equipmentsWithoutProtocol.map((eq, index) => {
                                                const identifier = `${eq.type}|${eq.brand}|${eq.model}`;
                                                return (
                                                <SelectItem key={identifier} value={identifier}>
                                                    <div className="flex items-center justify-between w-full">
                                                        <div className="flex items-center gap-3">
                                                            {eq.imageUrl ? (
                                                                <Image src={eq.imageUrl} alt={eq.name} width={40} height={40} data-ai-hint="equipment photo" className="rounded-md object-cover" />
                                                            ) : (
                                                                <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center shrink-0">
                                                                    <HardHat className="h-5 w-5 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                            <div className="flex flex-col text-left">
                                                                <p className="font-semibold">{index + 1}. {eq.type}</p>
                                                                <p className="text-xs text-muted-foreground">Marca: {eq.brand} | Modelo: {eq.model}</p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline">x{eq.count} Equipos</Badge>
                                                    </div>
                                                </SelectItem>
                                                )
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    <div className="lg:col-span-2">
                        {loading && <p>Cargando...</p>}

                        {!selectedEquipmentIdentifier ? (
                             <Card className="flex flex-col items-center justify-center h-full min-h-96">
                                <CardContent className="text-center">
                                    <ListChecks className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
                                    <h3 className="text-lg font-semibold">Seleccione un Equipo</h3>
                                    <p className="text-muted-foreground">Elija un equipo de las listas para empezar a gestionar su protocolo.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-8">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Detalles del Equipo Seleccionado</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid md:grid-cols-3 gap-4 border rounded-lg p-4">
                                            <div className="grid gap-1">
                                                <Label className="text-muted-foreground">Tipo de Equipo</Label>
                                                <p className="font-semibold">{type}</p>
                                            </div>
                                            <div className="grid gap-1">
                                                <Label className="text-muted-foreground">Marca</Label>
                                                <p className="font-semibold">{brand}</p>
                                            </div>
                                            <div className="grid gap-1">
                                                <Label className="text-muted-foreground">Modelo</Label>
                                                <p className="font-semibold">{model}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle>Pasos del Protocolo Base</CardTitle>
                                            <CardDescription>
                                                {steps.length > 0 ? "Estos son los pasos actuales para esta combinación de equipo." : "Este protocolo está vacío. Añada pasos manualmente o con IA."}
                                            </CardDescription>
                                        </div>
                                        {steps.length > 0 && (
                                            <Button variant="destructive" size="sm" onClick={() => setShowDeleteAllAlert(true)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                {existingProtocol ? "Eliminar Protocolo" : "Limpiar Pasos"}
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {steps.map((step, index) => (
                                            <div key={index}>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 border rounded-lg">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="space-y-1">
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
                                                        <Label>Evidencia Fotográfica del Paso</Label>
                                                        <div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center border">
                                                            {generatingImageIndex === index ? (
                                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                                    <Loader2 className="h-10 w-10 animate-spin" />
                                                                    <p>Generando imagen...</p>
                                                                </div>
                                                            ) : step.imageUrl ? (
                                                                <Image src={step.imageUrl} alt={`Evidencia para ${step.step}`} width={400} height={300} data-ai-hint="protocol evidence" className="rounded-md object-cover aspect-video" />
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
                                                                {step.imageUrl ? 'Cambiar Foto' : 'Subir Foto'}
                                                            </Button>
                                                            <Button type="button" size="sm" onClick={() => handleGenerateStepImage(step, index)} disabled={generatingImageIndex !== null}>
                                                                {generatingImageIndex === index ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                                                Generar con IA
                                                            </Button>
                                                            {step.imageUrl && (
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
                                                {index < steps.length - 1 && <Separator className="mt-6" />}
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <form action={formAction}>
                                        <CardHeader>
                                            <CardTitle>Sugerir Pasos con IA</CardTitle>
                                            <CardDescription>La IA sugerirá pasos basados en el tipo, marca y modelo del equipo.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <input name="isSubmit" value="true" type="hidden" />
                                            <Input name="type" value={type} type="hidden" />
                                            <Input name="brand" value={brand} type="hidden" />
                                            <Input name="model" value={model} type="hidden" />
                                            <p className="text-sm text-muted-foreground">
                                                Haga clic en el botón para generar un protocolo sugerido para esta combinación de equipo.
                                            </p>
                                        </CardContent>
                                        <CardFooter className="border-t px-6 py-4">
                                            <SubmitButton />
                                        </CardFooter>
                                    </form>
                                </Card>

                                {aiState.error && (
                                    <Alert variant="destructive">
                                    <Terminal className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{aiState.error}</AlertDescription>
                                    </Alert>
                                )}

                                {aiState.result && (
                                    <Card>
                                    <CardHeader>
                                        <CardTitle>Protocolo Sugerido por IA</CardTitle>
                                        <CardDescription>Seleccione los pasos que desea añadir al protocolo base.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                        <TableHeader>
                                            <TableRow>
                                            <TableHead className="w-10">
                                                <Checkbox
                                                onCheckedChange={(checked) => setSelectedSteps(checked && aiState.result ? aiState.result : [])}
                                                checked={isAllSelected}
                                                aria-label="Seleccionar todos los pasos"
                                                />
                                            </TableHead>
                                            <TableHead className="w-[60%]">Paso</TableHead>
                                            <TableHead>Prioridad</TableHead>
                                            <TableHead className="text-right">% Estimado</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {aiState.result.map((item, index) => (
                                            <TableRow key={index} data-state={selectedSteps.some(s => s.step === item.step) ? "selected" : ""}>
                                                <TableCell>
                                                <Checkbox
                                                    onCheckedChange={(checked) => setSelectedSteps(prev => checked ? [...prev, item] : prev.filter(s => s.step !== item.step))}
                                                    checked={selectedSteps.some(s => s.step === item.step)}
                                                    aria-label={`Seleccionar paso: ${item.step}`}
                                                />
                                                </TableCell>
                                                <TableCell className="font-medium">{item.step}</TableCell>
                                                <TableCell>
                                                <Badge variant={getPriorityBadgeVariant(item.priority)} className="capitalize">
                                                    {item.priority}
                                                </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">{item.percentage}%</TableCell>
                                            </TableRow>
                                            ))}
                                        </TableBody>
                                        </Table>
                                    </CardContent>
                                    <CardFooter className="border-t px-6 py-4">
                                        <Button onClick={handleAddSelectedSteps} disabled={selectedSteps.length === 0}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Añadir Pasos Seleccionados a la Lista
                                        </Button>
                                    </CardFooter>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Listado de Protocolos Base</CardTitle>
                        <CardDescription>
                            Aquí puede ver y gestionar todos los protocolos base existentes en el sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">#</TableHead>
                                    <TableHead>Protocolo (Tipo, Marca, Modelo)</TableHead>
                                    <TableHead>Nº de Pasos</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {protocols.map((protocol, index) => {
                                    const identifier = `${protocol.type}|${protocol.brand}|${protocol.model}`;
                                    return (
                                        <TableRow key={protocol.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell className="font-medium">{`${protocol.type} - ${protocol.brand} (${protocol.model})`}</TableCell>
                                            <TableCell>{protocol.steps.length}</TableCell>
                                            <TableCell className="space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEquipmentTypeChange(identifier)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Editar
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => setProtocolToDelete(protocol)}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Eliminar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
        <Dialog open={!!stepToEdit} onOpenChange={() => setStepToEdit(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Paso del Protocolo</DialogTitle>
                    <DialogDescription>
                        Modifique la descripción y la prioridad de este paso.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="step-text">Descripción del Paso</Label>
                        <Textarea 
                            id="step-text"
                            value={editedStepText}
                            onChange={(e) => setEditedStepText(e.target.value)}
                            className="min-h-32"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="step-priority">Prioridad</Label>
                        <Select value={editedStepPriority} onValueChange={(v) => setEditedStepPriority(v as any)}>
                            <SelectTrigger id="step-priority">
                                <SelectValue placeholder="Seleccione una prioridad" />
                            </SelectTrigger>
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
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. El paso será eliminado de la lista actual.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteStep} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        
        <AlertDialog open={showDeleteAllAlert} onOpenChange={setShowDeleteAllAlert}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {existingProtocol ? '¿Eliminar este Protocolo Base?' : '¿Limpiar todos los pasos?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                    {existingProtocol 
                        ? 'Esta acción eliminará permanentemente este protocolo base. Los equipos que lo usaban ya no tendrán un protocolo asignado y deberá crear uno nuevo para ellos. Esta acción no se puede deshacer.'
                        : 'Esto eliminará todos los pasos que ha añadido o modificado en esta sesión. No se guardará ningún cambio.'
                    }
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                        const protocolToHandle = existingProtocol;
                        if (protocolToHandle) {
                            setProtocolToDelete(protocolToHandle);
                        } else {
                            setSteps([]);
                        }
                        setShowDeleteAllAlert(false);
                    }} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        {existingProtocol ? 'Sí, eliminar Protocolo' : 'Sí, limpiar todo'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!protocolToDelete} onOpenChange={() => setProtocolToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Está seguro de eliminar este protocolo?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción eliminará permanentemente este protocolo base.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setProtocolToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProtocol} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Sí, eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

export default function BaseProtocolPageWrapper() {
    return (
        <Suspense fallback={
          <div className="grid auto-rows-max items-start gap-4 md:gap-8 p-6">
             <div className="flex items-center gap-4">
                <Skeleton className="h-7 w-7 rounded-md" />
                <div className="grid gap-2">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-80" />
                </div>
            </div>
            <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
          </div>
        }>
            <BaseProtocolManager />
        </Suspense>
    )
}
