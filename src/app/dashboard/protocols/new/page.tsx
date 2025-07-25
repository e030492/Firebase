
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
import { Terminal, Loader2, Save, ArrowLeft, Camera, Copy } from 'lucide-react';
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


type State = {
  result: SuggestMaintenanceProtocolOutput | null;
  error: string | null;
};

type EquipmentWithProtocolStatus = Equipment & { hasProtocol: boolean };

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
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Generar Protocolo
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

  const [selectedSteps, setSelectedSteps] = useState<SuggestMaintenanceProtocolOutput>([]);
  const [isModificationMode, setIsModificationMode] = useState(false);
  
  const [protocolToCopy, setProtocolToCopy] = useState<Protocol | null>(null);
  
  // Pre-fill form if equipmentId is in query params
  useEffect(() => {
    const equipmentIdFromQuery = searchParams.get('equipmentId');

    if (equipmentIdFromQuery && !loading) {
      const equipment = allEquipments.find(e => e.id === equipmentIdFromQuery);
      
      if (equipment) {
        const client = clients.find(c => c.name === equipment.client);
        const system = systems.find(s => s.name === equipment.system);
        
        if (client) setClientId(client.id);
        if (system) setSystemId(system.id);
        
        setSelectedEquipmentId(equipment.id);
        setEquipmentName(equipment.name);
        setEquipmentDescription(equipment.description);
        setEquipmentAlias(equipment.alias || '');
        setEquipmentModel(equipment.model);
        setEquipmentSerial(equipment.serial);
        setEquipmentImageUrl(equipment.imageUrl || '');
        
        setIsModificationMode(true);
      } else {
         setIsModificationMode(false);
      }
    } else {
        setIsModificationMode(false);
    }
  }, [searchParams, allEquipments, clients, systems, loading]);


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
      setEquipmentName('');
      setEquipmentDescription('');
      setEquipmentAlias('');
      setEquipmentModel('');
      setEquipmentSerial('');
      setEquipmentImageUrl('');
      setSelectedEquipmentId('');
      return;
    }
    
    setSelectedEquipmentId(equipmentId);
    setEquipmentName(selected.name);
    setEquipmentDescription(selected.description);
    setEquipmentAlias(selected.alias || '');
    setEquipmentModel(selected.model);
    setEquipmentSerial(selected.serial);
    setEquipmentImageUrl(selected.imageUrl || '');
    
    // Check if an identical equipment already has a protocol
    const existingProtocol = protocols.find(p => p.equipmentId === equipmentId);
    if (existingProtocol) return; // Don't offer to copy if it already has one

    const similarEquipment = allEquipments.find(
      eq => eq.id !== selected.id && eq.name === selected.name && eq.type === selected.type
    );
    
    if (similarEquipment) {
        const protocolOfSimilar = protocols.find(p => p.equipmentId === similarEquipment.id);
        if (protocolOfSimilar) {
            setProtocolToCopy(protocolOfSimilar);
        }
    }
  };

  // Handlers for step selection
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
  
  // Save protocol logic
  const handleSaveProtocol = async () => {
    if (!selectedEquipmentId || selectedSteps.length === 0) {
      alert("Por favor, seleccione un equipo y al menos un paso del protocolo antes de guardar.");
      return;
    }
    
    const existingProtocol = protocols.find(p => p.equipmentId === selectedEquipmentId);
    
    if (existingProtocol) {
      // Merge new steps with existing ones, avoiding duplicates
      const stepMap = new Map(existingProtocol.steps.map(item => [item.step, item]));
      selectedSteps.forEach(newStep => {
          const formattedNewStep: ProtocolStep = {
              ...newStep,
              completion: 0,
              notes: '',
              imageUrl: '',
          };
          stepMap.set(newStep.step, formattedNewStep);
      });
      
      try {
        await updateProtocol(existingProtocol.id, { steps: Array.from(stepMap.values()) });
      } catch (error) {
        console.error("Failed to update protocol:", error);
        alert("Error al actualizar el protocolo.");
        return;
      }
    } else {
      // Create new protocol
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
    router.push('/dashboard/protocols');
  };
  
  const handleCopyProtocol = async () => {
    if (!protocolToCopy || !selectedEquipmentId) return;

    const newProtocolForCurrentEquipment: Omit<Protocol, 'id'> = {
        equipmentId: selectedEquipmentId,
        steps: protocolToCopy.steps.map(s => ({ ...s, imageUrl: '', notes: '', completion: 0 })),
    };
    
    try {
        await createProtocol(newProtocolForCurrentEquipment);
        alert('Protocolo copiado y guardado con éxito.');
        setProtocolToCopy(null); // Close the dialog
        router.push('/dashboard/protocols');
    } catch (error) {
        console.error("Failed to copy protocol:", error);
        alert("Error al copiar el protocolo.");
    }
  };

  // Badge variant for priority
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

  // JSX
  return (
    <>
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Atrás</span>
        </Button>
        <div className="grid gap-0.5">
            <h1 className="font-headline text-2xl font-bold">{isModificationMode ? 'Modificar Protocolo (IA)' : 'Generador de Protocolos (IA)'}</h1>
            <p className="text-muted-foreground">
            {isModificationMode 
                ? 'La IA sugerirá pasos adicionales para el equipo seleccionado. Puede agregarlos al protocolo existente.' 
                : 'Filtre por equipo o descríbalo para que la IA sugiera un protocolo de mantenimiento.'
            }
            </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <form action={formAction}>
          <CardHeader>
            <CardTitle>Detalles del Equipo</CardTitle>
            <CardDescription>{isModificationMode ? 'Los detalles del equipo no se pueden cambiar en modo de modificación.' : 'Seleccione un equipo existente para autocompletar o ingrese los datos manualmente.'}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {/* Filters */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
               <div className="grid gap-3">
                 <Label htmlFor="client">Cliente</Label>
                 <Select onValueChange={handleClientChange} value={clientId} disabled={isModificationMode}>
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
                 <Select onValueChange={handleSystemChange} value={systemId} disabled={!clientId || isModificationMode}>
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
                 <Label htmlFor="equipment">Seleccionar Equipo (Opcional)</Label>
                 <Select onValueChange={handleEquipmentChange} value={selectedEquipmentId} disabled={!systemId || isModificationMode}>
                   <SelectTrigger>
                     <SelectValue placeholder="Seleccione un equipo..." />
                   </SelectTrigger>
                   <SelectContent>
                     {filteredEquipments.map(eq => (
                        <SelectItem key={eq.id} value={eq.id} className={!eq.hasProtocol ? 'text-destructive' : ''}>
                          {eq.name}
                          {eq.alias && ` (${eq.alias})`}
                          {` - N/S: ${eq.serial}`}
                        </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
            </div>
            {isModificationMode && (
                <>
                <Separator/>
                <div className="grid md:grid-cols-2 gap-6 items-start">
                    <div className="grid gap-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="grid gap-3">
                                <Label>Alias</Label>
                                <Input value={equipmentAlias} readOnly />
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
                </>
            )}
            {/* Manual input */}
            <div className="grid gap-3">
              <Label htmlFor="equipmentName">Nombre del Equipo</Label>
              <Input
                id="equipmentName"
                name="equipmentName"
                value={equipmentName}
                onChange={e => setEquipmentName(e.target.value)}
                placeholder="Ej. Cámara IP Domo PTZ"
                required
                readOnly={isModificationMode || !!selectedEquipmentId}
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
                readOnly={isModificationMode || !!selectedEquipmentId}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>

      {/* Error Alert */}
      {state.error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Results Card */}
      {state.result && (
        <Card>
          <CardHeader>
            <CardTitle>Protocolo Sugerido</CardTitle>
            <CardDescription>Seleccione los pasos que desea guardar para el equipo.</CardDescription>
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
               Guardar Pasos Seleccionados
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
                    <AlertDialogTitle>Protocolo Encontrado</AlertDialogTitle>
                </div>
                <AlertDialogDescription>
                    Hemos encontrado un protocolo existente para un equipo con el mismo nombre y tipo.
                    ¿Desea copiar este protocolo al equipo actual? Esto le ahorrará tiempo.
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


    