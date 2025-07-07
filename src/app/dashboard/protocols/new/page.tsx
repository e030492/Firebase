"use client";

import { useActionState, useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';

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
import { Terminal, Loader2, Save } from 'lucide-react';
import { mockEquipments } from '@/lib/mock-data';

const EQUIPMENTS_STORAGE_KEY = 'guardian_shield_equipments';
const PROTOCOLS_STORAGE_KEY = 'guardian_shield_protocols';

type Equipment = typeof mockEquipments[0];
type Protocol = {
  equipmentId: string;
  steps: SuggestMaintenanceProtocolOutput;
};

type State = {
  result: SuggestMaintenanceProtocolOutput | null;
  error: string | null;
};

async function generateProtocolAction(prevState: State, formData: FormData): Promise<State> {
  const equipmentName = formData.get('equipmentName') as string;
  const equipmentDescription = formData.get('equipmentDescription') as string;

  if (!equipmentName || !equipmentDescription) {
    return { ...prevState, error: 'Por favor, complete todos los campos.', result: null };
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Generar Protocolo
    </Button>
  );
}

export default function NewProtocolPage() {
  const router = useRouter();
  const [state, formAction] = useActionState(generateProtocolAction, { result: null, error: null });

  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentDescription, setEquipmentDescription] = useState('');
  
  useEffect(() => {
    const storedEquipments = localStorage.getItem(EQUIPMENTS_STORAGE_KEY);
    setEquipments(storedEquipments ? JSON.parse(storedEquipments) : []);
  }, []);

  const handleEquipmentChange = (equipmentId: string) => {
    setSelectedEquipmentId(equipmentId);
    const selected = equipments.find(e => e.id === equipmentId);
    if (selected) {
      setEquipmentName(selected.name);
      setEquipmentDescription(selected.description);
    } else {
      setEquipmentName('');
      setEquipmentDescription('');
    }
  };

  const handleSaveProtocol = () => {
    if (!selectedEquipmentId || !state.result) {
      alert("Por favor, seleccione un equipo y genere un protocolo antes de guardar.");
      return;
    }
    
    const storedProtocols = localStorage.getItem(PROTOCOLS_STORAGE_KEY);
    let protocols: Protocol[] = storedProtocols ? JSON.parse(storedProtocols) : [];

    const newProtocol: Protocol = {
      equipmentId: selectedEquipmentId,
      steps: state.result,
    };
    
    const existingProtocolIndex = protocols.findIndex(p => p.equipmentId === selectedEquipmentId);
    if (existingProtocolIndex > -1) {
      protocols[existingProtocolIndex] = newProtocol;
    } else {
      protocols.push(newProtocol);
    }

    localStorage.setItem(PROTOCOLS_STORAGE_KEY, JSON.stringify(protocols));
    alert('Protocolo guardado con éxito.');
    router.push('/dashboard/protocols');
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

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="grid gap-2">
        <h1 className="font-headline text-3xl font-bold">Generador de Protocolos (IA)</h1>
        <p className="text-muted-foreground">
          Seleccione un equipo o descríbalo para que la IA sugiera un protocolo de mantenimiento.
        </p>
      </div>

      <Card>
        <form action={formAction}>
          <CardHeader>
            <CardTitle>Detalles del Equipo</CardTitle>
            <CardDescription>Seleccione un equipo existente para autocompletar o ingrese los datos manualmente.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="equipment">Seleccionar Equipo Existente (Opcional)</Label>
              <Select onValueChange={handleEquipmentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un equipo..." />
                </SelectTrigger>
                <SelectContent>
                  {equipments.map(eq => (
                    <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="equipmentName">Nombre del Equipo</Label>
              <Input
                id="equipmentName"
                name="equipmentName"
                value={equipmentName}
                onChange={e => setEquipmentName(e.target.value)}
                placeholder="Ej. Cámara IP Domo PTZ"
                required
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
              />
            </div>
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
            <CardTitle>Protocolo Sugerido</CardTitle>
            <CardDescription>Este es el protocolo sugerido por la IA. Puede guardarlo para el equipo seleccionado.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">Paso</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead className="text-right">% Estimado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.result.map((item, index) => (
                  <TableRow key={index}>
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
             <Button onClick={handleSaveProtocol} disabled={!selectedEquipmentId}>
               <Save className="mr-2 h-4 w-4" />
               Guardar Protocolo para Equipo Seleccionado
             </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
