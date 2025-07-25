
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from "@/components/ui/checkbox";
import { Terminal, Loader2, Save, ArrowLeft, Camera, Copy, Trash2, MoreVertical, Wand2, Search } from 'lucide-react';
import { Protocol, Equipment, Client, System, ProtocolStep } from '@/lib/services';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/hooks/use-data-provider';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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


type State = {
  result: SuggestMaintenanceProtocolOutput | null;
  error: string | null;
};

type EquipmentWithProtocolStatus = Equipment & { hasProtocol: boolean };

type ProtocolToCopyInfo = {
    protocol: Protocol;
    sourceEquipmentName: string;
}

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
            <span>Sugerir Pasos Adicionales</span>
        </>
      )}
    </Button>
  );
}

// Main Page Component
function ProtocolGenerator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clients, systems, equipments: allEquipments, protocols, loading, createProtocol, updateProtocol } = useData();
  const [state, formAction] = useActionState(generateProtocolAction, { result: null, error: null });

  // Data states
  const [filteredEquipments, setFilteredEquipments] = useState<EquipmentWithProtocolStatus[]>([]);
  
  // Selection states
  const [clientId, setClientId] = useState('');
  const [systemId, setSystemId] = useState('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentDescription, setEquipmentDescription] = useState('');
  const [equipmentAlias, setEquipmentAlias] = useState('');
  const [equipmentModel, setEquipmentModel] = useState('');
  const [equipmentSerial, setEquipmentSerial] = useState('');
  const [equipmentImageUrl, setEquipmentImageUrl] = useState('');

  const [existingSteps, setExistingSteps] = useState<ProtocolStep[]>([]);
  const [stepToDelete, setStepToDelete] = useState<ProtocolStep | null>(null);
  const [showDeleteAllAlert, setShowDeleteAllAlert] = useState(false);

  const [selectedSteps, setSelectedSteps] = useState<SuggestMaintenanceProtocolOutput>([]);
  const [isModificationMode, setIsModificationMode] = useState(false);
  
  const [protocolToCopy, setProtocolToCopy] = useState<ProtocolToCopyInfo | null>(null);
  const [showNotFoundAlert, setShowNotFoundAlert] = useState(false);
  

  const loadEquipmentData = (equipment: Equipment | undefined) => {
    if (!equipment) return;

    setSelectedEquipmentId(equipment.id);
    setEquipmentName(equipment.name);
    setEquipmentDescription(equipment.description);
    setEquipmentAlias(equipment.alias || '');
    setEquipmentModel(equipment.model);
    setEquipmentSerial(equipment.serial);
    setEquipmentImageUrl(equipment.imageUrl || '');

    const existingProtocol = protocols.find(p => p.equipmentId === equipment.id);
    setExistingSteps(existingProtocol?.steps || []);

    // Intelligent Search Logic
    if (!existingProtocol) {
      const similarEquipmentWithProtocol = allEquipments.find(
        eq => eq.id !== equipment.id && eq.type === equipment.type && protocols.some(p => p.equipmentId === eq.id)
      );

      if (similarEquipmentWithProtocol) {
          const protocolOfSimilar = protocols.find(p => p.equipmentId === similarEquipmentWithProtocol.id);
          if (protocolOfSimilar) {
              setProtocolToCopy({ protocol: protocolOfSimilar, sourceEquipmentName: similarEquipmentWithProtocol.name });
              return;
          }
      }
      // Only show not found alert if no protocol and no similar one was found
      setShowNotFoundAlert(true);
    }
  };


  // Pre-fill form if equipmentId is in query params
  useEffect(() => {
    const equipmentIdFromQuery = searchParams.get('equipmentId');
    if (equipmentIdFromQuery && allEquipments.length > 0 && protocols) {
      setIsModificationMode(true);
      const equipment = allEquipments.find(e => e.id === equipmentIdFromQuery);
      if (equipment) {
        loadEquipmentData(equipment);
      }
    }
  }, [searchParams, allEquipments, protocols]);


  // Filter equipments when client or system changes
  useEffect(() => {
    if (clientId && systemId) {
      const clientName = clients.find(c => c.id === clientId)?.name;
      const systemName = systems.find(s => s.id === systemId)?.name;
      if (clientName && systemName) {
        const filtered = allEquipments
          .filter(eq => eq.client === clientName && eq.system === systemName)
          .map(eq => ({
              ...eq,
              hasProtocol: protocols.some(p => p.equipmentId === eq.id && p.steps.length > 0)
          }));
        setFilteredEquipments(filtered);
      }
    } else {
      setFilteredEquipments([]);
    }
  }, [clientId, systemId, clients, systems, allEquipments, protocols]);

  // Reset selections when AI result changes
  useEffect(() => {
    if (state.result) {
      setSelectedSteps([]);
    }
  }, [state.result]);

  // Handlers for dropdowns
  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    setSystemId('');
    setSelectedEquipmentId('');
    setEquipmentName('');
    setEquipmentDescription('');
    setFilteredEquipments([]);
  };

  const handleSystemChange = (newSystemId: string) => {
    setSystemId(newSystemId);
    setSelectedEquipmentId('');
    setEquipmentName('');
    setEquipmentDescription('');
  };

  const handleEquipmentChange = (equipmentId: string) => {
    const selected = allEquipments.find(e => e.id === equipmentId);
    if (!selected) {
        setSelectedEquipmentId('');
        setEquipmentName('');
        setEquipmentDescription('');
        setEquipmentAlias('');
        setEquipmentModel('');
        setEquipmentSerial('');
        setEquipmentImageUrl('');
        return;
    }

    const existingProtocol = protocols.find(p => p.equipmentId === equipmentId);
    if (existingProtocol) {
      router.push(`/dashboard/protocols/new?equipmentId=${equipmentId}`);
    } else {
      loadEquipmentData(selected);
    }
  };

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
       alert("Por favor, seleccione un equipo antes de guardar.");
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
        await createProtocol(newProtocol);
      } catch (error) {
        console.error("Failed to create protocol:", error);
        alert("Error al crear el protocolo.");
        return;
      }
    }

    alert('Protocolo guardado con éxito.');
    if(isModificationMode) {
       setState({ result: null, error: null });
       setSelectedSteps([]);
    } else {
       router.push('/dashboard/protocols');
    }
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

  const handleCopyProtocol = async () => {
    if (!protocolToCopy || !selectedEquipmentId) return;

    const newProtocolForCurrentEquipment: Omit<Protocol, 'id'> = {
        equipmentId: selectedEquipmentId,
        steps: protocolToCopy.protocol.steps.map(s => ({ ...s, imageUrl: '', notes: '', completion: 0 })),
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
            <h1 className="font-headline text-2xl font-bold">{isModificationMode ? 'Modificar Protocolo' : 'Generador de Protocolos (IA)'}</h1>
            <p className="text-muted-foreground">
            {isModificationMode 
                ? 'Vea los pasos existentes y use la IA para sugerir pasos adicionales para el equipo.' 
                : 'Filtre por equipo o descríbalo para que la IA sugiera un protocolo de mantenimiento.'
            }
            </p>
        </div>
      </div>

      {!isModificationMode && (
          <Card>
             <CardHeader>
                <CardTitle>Seleccionar Equipo</CardTitle>
                <CardDescription>Busque un equipo para crear o modificar su protocolo. La IA puede buscar protocolos de equipos similares para acelerar el proceso.</CardDescription>
             </CardHeader>
             <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="client">Cliente</Label>
                        <Select onValueChange={handleClientChange} value={clientId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un cliente" />
                        </SelectTrigger>
                        <SelectContent>
                            {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="system">Sistema</Label>
                        <Select onValueChange={handleSystemChange} value={systemId} disabled={!clientId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un sistema" />
                        </SelectTrigger>
                        <SelectContent>
                            {systems.map(system => (
                            <SelectItem key={system.id} value={system.id}>{system.name}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="equipment">Seleccionar Equipo</Label>
                        <Select onValueChange={handleEquipmentChange} value={selectedEquipmentId} disabled={!systemId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un equipo..." />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredEquipments.map(eq => (
                                <SelectItem key={eq.id} value={eq.id} className={eq.hasProtocol ? '' : 'text-primary'}>
                                {eq.name}
                                {eq.alias && ` (${eq.alias})`}
                                {` - N/S: ${eq.serial}`}
                                {eq.hasProtocol ? '' : ' (Sin Protocolo)'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                </div>
             </CardContent>
          </Card>
      )}

      {(isModificationMode || selectedEquipmentId) && (
          <Card>
            <CardHeader>
                <CardTitle>Información del Equipo Seleccionado</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="grid md:grid-cols-2 gap-6 items-start">
                    <div className="grid gap-4">
                        <div className="grid gap-3">
                            <Label>Equipo</Label>
                            <Input value={equipmentName} readOnly />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="grid gap-3">
                                <Label>Alias</Label>
                                <Input value={equipmentAlias || 'N/A'} readOnly />
                            </div>
                            <div className="grid gap-3">
                                <Label>Modelo</Label>
                                <Input value={equipmentModel} readOnly />
                            </div>
                        </div>
                        <div className="grid gap-3">
                            <Label>No. Serie</Label>
                            <Input value={equipmentSerial} readOnly />
                        </div>
                    </div>
                    <div className="grid gap-3">
                        <Label>Fotografía del Equipo</Label>
                        {equipmentImageUrl ? (
                            <Image src={equipmentImageUrl} alt={`Foto de ${equipmentName}`} width={400} height={300} data-ai-hint="equipment photo" className="rounded-md object-cover aspect-video border" />
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
      )}
      
      {(isModificationMode || selectedEquipmentId) && existingSteps.length > 0 && (
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
      )}

      {(isModificationMode || selectedEquipmentId) && (
        <Card>
            <form action={formAction}>
            <CardHeader>
                <CardTitle>{existingSteps.length > 0 ? 'Añadir Nuevos Pasos con IA' : 'Generar Protocolo con IA'}</CardTitle>
                <CardDescription>La IA sugerirá pasos basados en la información del equipo.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid gap-3">
                <Label htmlFor="equipmentName">Nombre del Equipo</Label>
                <Input
                    id="equipmentName"
                    name="equipmentName"
                    value={equipmentName}
                    onChange={e => setEquipmentName(e.target.value)}
                    placeholder="Ej. Cámara IP Domo PTZ"
                    required
                    readOnly
                  />
                </div>
                <div className="grid gap-3">
                <Label htmlFor="equipmentDescription">Descripción del Equipo</Label>
                <Textarea
                    id="equipmentDescription"
                    name="equipmentDescription"
                    value={equipmentDescription}
                    onChange={e => setEquipmentDescription(e.target.value)}
                    placeholder="Ej. Cámara de vigilancia con movimiento horizontal, vertical y zoom, resolución 4K, para exteriores."
                    required
                    className="min-h-32"
                    readOnly
                  />
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <SubmitButton />
            </CardFooter>
            </form>
        </Card>
      )}

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
    </div>

    <AlertDialog open={!!protocolToCopy} onOpenChange={() => setProtocolToCopy(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <div className="flex items-center gap-2">
                    <Copy className="h-6 w-6 text-primary" />
                    <AlertDialogTitle>Protocolo Similar Encontrado</AlertDialogTitle>
                </div>
                <AlertDialogDescription>
                    Se encontró un protocolo para un equipo similar ("{protocolToCopy?.sourceEquipmentName}"). ¿Desea copiar sus pasos a este equipo?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setProtocolToCopy(null); setShowNotFoundAlert(true); }}>No, generar uno nuevo</AlertDialogCancel>
                <AlertDialogAction onClick={handleCopyProtocol}>
                    Sí, Copiar Protocolo
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={showNotFoundAlert} onOpenChange={setShowNotFoundAlert}>
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
                <AlertDialogAction onClick={() => setShowNotFoundAlert(false)}>Aceptar</AlertDialogAction>
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
