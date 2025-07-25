
"use client";

import { useActionState, useState, useEffect, Suspense, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

import {
  suggestMaintenanceProtocol,
  type SuggestMaintenanceProtocolOutput,
} from '@/ai/flows/suggest-maintenance-protocol';

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
import { Terminal, Loader2, Save, ArrowLeft, Camera, Trash2, Wand2, Search } from 'lucide-react';
import { Protocol, Equipment, Client, System, ProtocolStep } from '@/lib/services';
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
import { CopyProtocolDialog, type ProtocolToCopyInfo } from '@/app/dashboard/protocols/page';


type State = {
  result: SuggestMaintenanceProtocolOutput | null;
  error: string | null;
};

// Server Action
async function generateProtocolAction(prevState: State, formData: FormData): Promise<State> {
  const equipmentName = formData.get('equipmentName') as string;
  const equipmentDescription = formData.get('equipmentDescription') as string;

  if (!equipmentName || !equipmentDescription) {
    return { ...prevState, error: 'Por favor, complete el nombre y la descripción del equipo.', result: null };
  }

  try {
    const result = await suggestMaintenanceProtocol({
      equipmentName,
      equipmentDescription,
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
            <span>Sugerir Pasos</span>
        </>
      )}
    </Button>
  );
}

// Main Page Component
function ProtocolGenerator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { equipments: allEquipments, protocols, loading, createProtocol, updateProtocol } = useData();
  const [state, formAction] = useActionState(generateProtocolAction, { result: null, error: null });

  // Data states
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  
  const [protocolToCopy, setProtocolToCopy] = useState<ProtocolToCopyInfo | null>(null);
  const [showNoSimilarFoundAlert, setShowNoSimilarFoundAlert] = useState(false);

  const [existingSteps, setExistingSteps] = useState<ProtocolStep[]>([]);
  const [stepToDelete, setStepToDelete] = useState<ProtocolStep | null>(null);
  const [showDeleteAllAlert, setShowDeleteAllAlert] = useState(false);

  const [selectedSteps, setSelectedSteps] = useState<SuggestMaintenanceProtocolOutput>([]);
  
  useEffect(() => {
    const equipmentIdFromQuery = searchParams.get('equipmentId');
    if (equipmentIdFromQuery && !loading) {
      const equipment = allEquipments.find(e => e.id === equipmentIdFromQuery);
      if (equipment) {
        setSelectedEquipment(equipment);
        setSelectedEquipmentId(equipment.id);
        const existingProtocol = protocols.find(p => p.equipmentId === equipment.id);
        setExistingSteps(existingProtocol?.steps || []);
      }
    }
  }, [searchParams, allEquipments, protocols, loading]);


  useEffect(() => {
    if (state.result) {
      setSelectedSteps([]);
    }
  }, [state.result]);

  const handleSelectStep = (step: SuggestMaintenanceProtocolOutput[0], checked: boolean) => {
    setSelectedSteps(prev => {
      if (checked) {
        return [...prev, step];
      } else {
        return prev.filter(s => s.step !== step.step);
      }
    });
  };

  const handleSelectAllSteps = (checked: boolean) => {
    if (checked && state.result) {
      setSelectedSteps(state.result);
    } else {
      setSelectedSteps([]);
    }
  };
  
  const isStepSelected = (step: SuggestMaintenanceProtocolOutput[0]) => {
    return selectedSteps.some(s => s.step === step.step);
  };
  
  const handleSaveProtocol = async () => {
    if (!selectedEquipmentId) {
       alert("No hay un equipo seleccionado para guardar el protocolo.");
       return;
    }
    
    if (selectedSteps.length === 0) {
       alert("Por favor, seleccione al menos un paso sugerido para añadir al protocolo.");
       return;
    }

    const existingProtocol = protocols.find(p => p.equipmentId === selectedEquipmentId);
    
    if (existingProtocol) {
      const allSteps = [...existingProtocol.steps];
      const existingStepTexts = new Set(allSteps.map(s => s.step));

      selectedSteps.forEach(newStep => {
        if (!existingStepTexts.has(newStep.step)) {
           const formattedNewStep: ProtocolStep = { ...newStep, completion: 0, notes: '', imageUrl: ''};
           allSteps.push(formattedNewStep);
        }
      });
      
      try {
        await updateProtocol(existingProtocol.id, { steps: allSteps });
        setExistingSteps(allSteps);
      } catch (error) {
        console.error("Failed to update protocol:", error);
        alert("Error al actualizar el protocolo.");
        return;
      }
    } else {
      const newProtocol: Omit<Protocol, 'id'> = {
        equipmentId: selectedEquipmentId,
        steps: selectedSteps.map(s => ({ ...s, imageUrl: '', notes: '', completion: 0 })),
      };
      try {
        const createdProtocol = await createProtocol(newProtocol);
        setExistingSteps(createdProtocol.steps);
      } catch (error) {
        console.error("Failed to create protocol:", error);
        alert("Error al crear el protocolo.");
        return;
      }
    }

    alert('Protocolo guardado con éxito.');
    setState({ result: null, error: null });
    setSelectedSteps([]);
  };
  
  const handleDeleteStep = async () => {
    if (!stepToDelete) return;
    
    const protocolToUpdate = protocols.find(p => p.equipmentId === selectedEquipmentId);
    if (!protocolToUpdate) return;
    
    const newSteps = protocolToUpdate.steps.filter(s => s.step !== stepToDelete.step);

    try {
        await updateProtocol(protocolToUpdate.id, { steps: newSteps });
        setExistingSteps(newSteps); // Update local state to reflect deletion
        setStepToDelete(null); // Close dialog
    } catch (error) {
        console.error("Failed to delete step:", error);
        alert("Error al eliminar el paso.");
    }
  };

  const handleDeleteAllSteps = async () => {
    const protocolToUpdate = protocols.find(p => p.equipmentId === selectedEquipmentId);
    if (!protocolToUpdate) return;
    
    try {
        await updateProtocol(protocolToUpdate.id, { steps: [] });
        setExistingSteps([]);
        setShowDeleteAllAlert(false);
    } catch (error) {
        console.error("Failed to delete all steps:", error);
        alert("Error al eliminar todos los pasos.");
    }
  };

  const handleSearchSimilar = () => {
    if (!selectedEquipment) return;
    
    const similarEquipments = allEquipments.filter(
      (eq) =>
        eq.id !== selectedEquipment.id &&
        eq.name === selectedEquipment.name &&
        eq.type === selectedEquipment.type
    );

    const similarEquipmentWithProtocol = similarEquipments.find(
      (eq) => protocols.some((p) => p.equipmentId === eq.id && p.steps.length > 0)
    );

    if (similarEquipmentWithProtocol) {
      const sourceProtocol = protocols.find(p => p.equipmentId === similarEquipmentWithProtocol.id);
      if (sourceProtocol) {
        setProtocolToCopy({
          sourceProtocol,
          sourceEquipment: similarEquipmentWithProtocol,
          targetEquipment: selectedEquipment,
        });
        return;
      }
    }
    setShowNoSimilarFoundAlert(true);
  };
  
  const handleCopyProtocol = async () => {
    if (!protocolToCopy) return;

    const newProtocolForCurrentEquipment: Omit<Protocol, 'id'> = {
      equipmentId: protocolToCopy.targetEquipment.id,
      steps: protocolToCopy.sourceProtocol.steps.map(s => ({ ...s, imageUrl: '', notes: '', completion: 0 })),
    };
    
    try {
      const newProtocol = await createProtocol(newProtocolForCurrentEquipment);
      setExistingSteps(newProtocol.steps);
      setProtocolToCopy(null);
      alert('Protocolo copiado y guardado con éxito.');
    } catch (error) {
      console.error("Failed to copy protocol:", error);
      alert("Error al copiar el protocolo.");
    }
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

  const areAllStepsSelected = state.result ? selectedSteps.length === state.result.length && state.result.length > 0 : false;

  return (
    <>
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Atrás</span>
        </Button>
        <div className="grid gap-0.5">
            <h1 className="font-headline text-2xl font-bold">Gestión de Protocolo</h1>
            <p className="text-muted-foreground">
                Vea los pasos existentes y use la IA para sugerir pasos adicionales para el equipo.
            </p>
        </div>
      </div>
      
      {!selectedEquipmentId && !loading && (
        <Card className="flex flex-col items-center justify-center p-8 text-center">
            <CardHeader>
                <CardTitle>Equipo no especificado</CardTitle>
                <CardDescription>Por favor, vuelva a la página de protocolos y seleccione un equipo para modificar.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={() => router.push('/dashboard/protocols')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Protocolos
                </Button>
            </CardContent>
        </Card>
      )}

      {selectedEquipment && (
        <>
          <Card>
            <CardHeader>
                <CardTitle>Información del Equipo Seleccionado</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="grid md:grid-cols-2 gap-6 items-start">
                    <div className="grid gap-4">
                        <div className="grid gap-3">
                            <Label>Equipo</Label>
                            <Input value={selectedEquipment.name} readOnly />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="grid gap-3">
                                <Label>Alias</Label>
                                <Input value={selectedEquipment.alias || 'N/A'} readOnly />
                            </div>
                            <div className="grid gap-3">
                                <Label>Modelo</Label>
                                <Input value={selectedEquipment.model} readOnly />
                            </div>
                        </div>
                        <div className="grid gap-3">
                            <Label>No. Serie</Label>
                            <Input value={selectedEquipment.serial} readOnly />
                        </div>
                    </div>
                    <div className="grid gap-3">
                        <Label>Fotografía del Equipo</Label>
                        {selectedEquipment.imageUrl ? (
                            <Image src={selectedEquipment.imageUrl} alt={`Foto de ${selectedEquipment.name}`} width={400} height={300} data-ai-hint="equipment photo" className="rounded-md object-cover aspect-video border" />
                        ) : (
                            <div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center border">
                                <div className="text-center text-muted-foreground">
                                    <Camera className="h-10 w-10 mx-auto" />
                                    <p className="text-sm mt-2">Sin imagen</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
          </Card>
      
          {existingSteps.length > 0 ? (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Pasos del Protocolo Existente</CardTitle>
                        <CardDescription>Estos son los pasos actualmente guardados para este equipo.</CardDescription>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => setShowDeleteAllAlert(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar Todos
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80%]">Paso del Protocolo</TableHead>
                                <TableHead>Prioridad</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {existingSteps.map((step, index) => (
                                <TableRow key={index}>
                                    <TableCell>{step.step}</TableCell>
                                    <TableCell>
                                        <Badge variant={getPriorityBadgeVariant(step.priority)} className="capitalize">
                                            {step.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => setStepToDelete(step)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                            <span className="sr-only">Eliminar paso</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          ) : (
             <Card>
                <CardHeader>
                    <CardTitle>Protocolo Vacío</CardTitle>
                     <CardDescription>
                        Este equipo no tiene pasos en su protocolo. Puede buscar un protocolo de un equipo similar o generar uno nuevo con IA.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleSearchSimilar}>
                        <Search className="mr-2 h-4 w-4" />
                        Buscar Protocolos Similares
                    </Button>
                </CardContent>
             </Card>
          )}

          <Card>
            <form action={formAction}>
            <CardHeader>
                <CardTitle>{existingSteps.length > 0 ? 'Añadir Nuevos Pasos con IA' : 'Generar Protocolo con IA'}</CardTitle>
                <CardDescription>La IA sugerirá pasos basados en la información del equipo.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <Input name="equipmentName" value={selectedEquipment.name} type="hidden" />
                <Input name="equipmentDescription" value={selectedEquipment.description} type="hidden" />
                 <p className="text-sm text-muted-foreground">
                    Se generarán sugerencias para: <span className="font-semibold text-foreground">{selectedEquipment.name}</span>.
                </p>
                {existingSteps.length === 0 && (
                    <Alert>
                        <Wand2 className="h-4 w-4" />
                        <AlertTitle>¿No encontró un protocolo similar?</AlertTitle>
                        <AlertDescription>
                            Haga clic en "Sugerir Pasos" para que la IA genere un protocolo completo desde cero para este equipo.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <SubmitButton />
            </CardFooter>
            </form>
        </Card>

          {state.error && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {state.result && (
            <Card>
              <CardHeader>
                <CardTitle>Protocolo Sugerido por IA</CardTitle>
                <CardDescription>Seleccione los pasos que desea añadir al protocolo del equipo.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          onCheckedChange={handleSelectAllSteps}
                          checked={areAllStepsSelected}
                          aria-label="Seleccionar todos los pasos"
                        />
                      </TableHead>
                      <TableHead className="w-[60%]">Paso</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead className="text-right">% Estimado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.result.map((item, index) => (
                      <TableRow key={index} data-state={isStepSelected(item) ? "selected" : ""}>
                        <TableCell>
                          <Checkbox
                            onCheckedChange={(checked) => handleSelectStep(item, !!checked)}
                            checked={isStepSelected(item)}
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
                <Button onClick={handleSaveProtocol} disabled={!selectedEquipmentId || selectedSteps.length === 0}>
                  <Save className="mr-2 h-4 w-4" />
                  Añadir Pasos Seleccionados
                </Button>
              </CardFooter>
            </Card>
          )}
        </>
      )}
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

    <AlertDialog open={!!stepToDelete} onOpenChange={() => setStepToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Está seguro de eliminar este paso?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. El paso "{stepToDelete?.step}" será eliminado permanentemente del protocolo.
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
                <AlertDialogTitle>¿Eliminar todos los pasos?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminarán permanentemente todos los pasos de este protocolo, pero podrá generar nuevos.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAllSteps} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Sí, eliminar todo</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

export default function NewProtocolPage() {
    return (
        <Suspense fallback={
          <div className="grid auto-rows-max items-start gap-4 md:gap-8">
             <div className="flex items-center gap-4">
                <Skeleton className="h-7 w-7 rounded-md" />
                <div className="grid gap-2">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-80" />
                </div>
            </div>
            <Card>
                <CardHeader>
                  <CardTitle>Detalles del Equipo</CardTitle>
                  <CardDescription>
                    <Skeleton className="h-4 w-full max-w-lg" />
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="grid gap-3">
                    <Skeleton className="h-10 w-full" />
                  </div>
                   <div className="grid gap-3">
                    <Skeleton className="h-32 w-full" />
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Skeleton className="h-10 w-40" />
                </CardFooter>
            </Card>
          </div>
        }>
            <ProtocolGenerator />
        </Suspense>
    )
}
