"use client";

import { useActionState, useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';

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
import { Terminal, Loader2, Save } from 'lucide-react';
import { mockEquipments, mockClients, mockSystems } from '@/lib/mock-data';

// Keys for localStorage
const EQUIPMENTS_STORAGE_KEY = 'guardian_shield_equipments';
const PROTOCOLS_STORAGE_KEY = 'guardian_shield_protocols';
const CLIENTS_STORAGE_KEY = 'guardian_shield_clients';
const SYSTEMS_STORAGE_KEY = 'guardian_shield_systems';

// Types
type Equipment = typeof mockEquipments[0];
type Client = typeof mockClients[0];
type System = typeof mockSystems[0];
type Protocol = {
  equipmentId: string;
  steps: SuggestMaintenanceProtocolOutput;
};
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
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Generar Protocolo
    </Button>
  );
}

// Main Page Component
export default function NewProtocolPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction] = useActionState(generateProtocolAction, { result: null, error: null });

  // Data states
  const [clients, setClients] = useState<Client[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [allEquipments, setAllEquipments] = useState<Equipment[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);

  // Selection states
  const [clientId, setClientId] = useState('');
  const [systemId, setSystemId] = useState('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentDescription, setEquipmentDescription] = useState('');
  const [selectedSteps, setSelectedSteps] = useState<SuggestMaintenanceProtocolOutput>([]);
  const [isModificationMode, setIsModificationMode] = useState(false);
  
  // Load initial data from localStorage
  useEffect(() => {
    setClients(JSON.parse(localStorage.getItem(CLIENTS_STORAGE_KEY) || '[]'));
    setSystems(JSON.parse(localStorage.getItem(SYSTEMS_STORAGE_KEY) || '[]'));
    setAllEquipments(JSON.parse(localStorage.getItem(EQUIPMENTS_STORAGE_KEY) || '[]'));
  }, []);

  // Pre-fill form if equipmentId is in query params
  useEffect(() => {
    const equipmentIdParam = searchParams.get('equipmentId');
    if (equipmentIdParam && allEquipments.length && clients.length && systems.length) {
        const equipment = allEquipments.find(e => e.id === equipmentIdParam);
        if (equipment) {
            setIsModificationMode(true);
            const client = clients.find(c => c.name === equipment.client);
            const system = systems.find(s => s.name === equipment.system);

            if (client) {
                setClientId(client.id);
            }
            if (system) {
                setSystemId(system.id);
            }
            setSelectedEquipmentId(equipment.id);
            setEquipmentName(equipment.name);
            setEquipmentDescription(equipment.description);
        }
    }
  }, [searchParams, allEquipments, clients, systems]);


  // Filter equipments when client or system changes
  useEffect(() => {
    if (clientId && systemId) {
      const clientName = clients.find(c => c.id === clientId)?.name;
      const systemName = systems.find(s => s.id === systemId)?.name;
      if (clientName && systemName) {
        setFilteredEquipments(allEquipments.filter(eq => eq.client === clientName && eq.system === systemName));
      }
    } else {
      setFilteredEquipments([]);
    }
  }, [clientId, systemId, clients, systems, allEquipments]);

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
    setSelectedEquipmentId(equipmentId);
    const selected = allEquipments.find(e => e.id === equipmentId);
    if (selected) {
      setEquipmentName(selected.name);
      setEquipmentDescription(selected.description);
    } else {
      setEquipmentName('');
      setEquipmentDescription('');
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
  const handleSaveProtocol = () => {
    if (!selectedEquipmentId || selectedSteps.length === 0) {
      alert("Por favor, seleccione un equipo y al menos un paso del protocolo antes de guardar.");
      return;
    }
    
    const storedProtocols = localStorage.getItem(PROTOCOLS_STORAGE_KEY);
    let protocols: Protocol[] = storedProtocols ? JSON.parse(storedProtocols) : [];

    const newProtocol: Protocol = {
      equipmentId: selectedEquipmentId,
      steps: selectedSteps,
    };
    
    const existingProtocolIndex = protocols.findIndex(p => p.equipmentId === selectedEquipmentId);
    if (existingProtocolIndex > -1) {
      protocols[existingProtocolIndex].steps.push(...selectedSteps);
      const uniqueSteps = Array.from(new Map(protocols[existingProtocolIndex].steps.map(item => [item.step, item])).values());
      protocols[existingProtocolIndex].steps = uniqueSteps;

    } else {
      protocols.push(newProtocol);
    }

    localStorage.setItem(PROTOCOLS_STORAGE_KEY, JSON.stringify(protocols));
    alert('Protocolo guardado con éxito.');
    router.push('/dashboard/protocols');
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
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      {/* Page Header */}
      <div className="grid gap-2">
        <h1 className="font-headline text-3xl font-bold">{isModificationMode ? 'Modificar Protocolo (IA)' : 'Generador de Protocolos (IA)'}</h1>
        <p className="text-muted-foreground">
          {isModificationMode 
            ? 'La IA sugerirá pasos adicionales para el equipo seleccionado. Puede agregarlos al protocolo existente.' 
            : 'Filtre por equipo o descríbalo para que la IA sugiera un protocolo de mantenimiento.'
          }
        </p>
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
                       <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
            </div>
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
                readOnly={isModificationMode}
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
                readOnly={isModificationMode}
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
  );
}
