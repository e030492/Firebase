
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ArrowLeft, Camera, Trash2, HardHat, Wand2, Loader2, ListChecks, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Protocol, Cedula, Client, Equipment, User, System, ProtocolStep } from '@/lib/services';
import { Skeleton } from '@/components/ui/skeleton';
import { CardDescription } from '@/components/ui/card';
import { useData } from '@/hooks/use-data-provider';
import { suggestBaseProtocol, SuggestBaseProtocolOutput } from '@/ai/flows/suggest-base-protocol';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';


export default function NewCedulaPage() {
  const router = useRouter();
  const { clients, systems: allSystems, equipments: allEquipments, users, protocols, createCedula, loading } = useData();
  const { toast } = useToast();

  const [folio, setFolio] = useState(`C-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
  const [clientId, setClientId] = useState('');
  const [systemId, setSystemId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [creationDate, setCreationDate] = useState<Date | undefined>(new Date());
  const [creationTime, setCreationTime] = useState<string>(format(new Date(), 'HH:mm'));
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Pendiente');
  const [semaforo, setSemaforo] = useState('');

  const [filteredSystems, setFilteredSystems] = useState<System[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  
  const [protocolSteps, setProtocolSteps] = useState<ProtocolStep[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  
  const [isSuggestingProtocol, setIsSuggestingProtocol] = useState(false);
  const [suggestedProtocol, setSuggestedProtocol] = useState<SuggestBaseProtocolOutput | null>(null);

  useEffect(() => {
    setTechnicians(users.filter(user => user.role === 'Técnico'));
    setSupervisors(users.filter(user => user.role === 'Supervisor'));
  }, [users]);

  useEffect(() => {
    if (clientId) {
      const clientName = clients.find(c => c.id === clientId)?.name;
      if (clientName) {
        const equipmentsForClient = allEquipments.filter(eq => eq.client === clientName);
        const systemNamesForClient = [...new Set(equipmentsForClient.map(eq => eq.system))];
        const systemsForClient = allSystems.filter(sys => systemNamesForClient.includes(sys.name));
        setFilteredSystems(systemsForClient);
      } else {
        setFilteredSystems([]);
      }
    } else {
      setFilteredSystems([]);
    }
    setSystemId('');
    setEquipmentId('');
    setFilteredEquipments([]);
  }, [clientId, clients, allEquipments, allSystems]);

  useEffect(() => {
    if (clientId && systemId) {
        const clientName = clients.find(c => c.id === clientId)?.name;
        const systemName = allSystems.find(s => s.id === systemId)?.name;
        if (clientName && systemName) {
            const filtered = allEquipments.filter(eq => eq.client === clientName && eq.system === systemName);
            setFilteredEquipments(filtered);
        } else {
            setFilteredEquipments([]);
        }
    } else {
        setFilteredEquipments([]);
    }
    setEquipmentId('');
  }, [clientId, systemId, clients, allSystems, allEquipments]);
  
  const handleEquipmentChange = async (newEquipmentId: string) => {
    setEquipmentId(newEquipmentId);
    setProtocolSteps([]);

    const selectedEquipment = allEquipments.find(eq => eq.id === newEquipmentId);
    if (!selectedEquipment || protocols.length === 0) {
      setSuggestedProtocol({
        protocol: null,
        reason: protocols.length === 0 ? "No hay protocolos base en el sistema." : "No se encontró el equipo seleccionado."
      });
      return;
    }

    setIsSuggestingProtocol(true);
    try {
      const suggestion = await suggestBaseProtocol({
        equipment: {
          name: selectedEquipment.name,
          type: selectedEquipment.type,
          brand: selectedEquipment.brand,
          model: selectedEquipment.model,
        },
        existingProtocols: protocols,
      });
      setSuggestedProtocol(suggestion);
    } catch (error) {
      console.error("Error suggesting protocol:", error);
      toast({
        title: "Error de IA",
        description: "No se pudo obtener una sugerencia de protocolo.",
        variant: "destructive"
      });
    } finally {
      setIsSuggestingProtocol(false);
    }
  };

  const handleConfirmProtocol = () => {
    if (suggestedProtocol?.protocol?.steps) {
      const initialSteps = suggestedProtocol.protocol.steps.map(step => ({ 
        step: step.step || '',
        priority: step.priority || 'baja',
        percentage: step.percentage || 0,
        completion: 0, 
        notes: '', 
        imageUrl: step.imageUrl || '',
      }));
      setProtocolSteps(initialSteps);
      toast({
        title: "Protocolo Asignado",
        description: "Se han cargado los pasos del protocolo sugerido."
      })
    }
    setSuggestedProtocol(null);
  };

  const handleStepChange = (index: number, field: keyof ProtocolStep, value: string | number) => {
    const newSteps = [...protocolSteps];
    const stepToUpdate = { ...newSteps[index], [field]: value };
    newSteps[index] = stepToUpdate;
    setProtocolSteps(newSteps);
  };

  const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleStepChange(index, 'imageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleImageDelete = (index: number) => {
    handleStepChange(index, 'imageUrl', '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folio || !clientId || !equipmentId || !technicianId || !supervisorId || !creationDate || !description) {
        alert('Por favor, complete todos los campos.');
        return;
    }
    setIsSaving(true);
    
    const clientName = clients.find(c => c.id === clientId)?.name || '';
    const equipmentName = allEquipments.find(eq => eq.id === equipmentId)?.name || '';
    const technicianName = technicians.find(t => t.id === technicianId)?.name || '';
    const supervisorName = supervisors.find(s => s.id === supervisorId)?.name || '';

    const finalDate = new Date(creationDate);
    const [hours, minutes] = creationTime.split(':');
    finalDate.setHours(parseInt(hours, 10));
    finalDate.setMinutes(parseInt(minutes, 10));

    const newCedulaData: Omit<Cedula, 'id'> = {
      folio,
      client: clientName,
      equipment: equipmentName,
      technician: technicianName,
      supervisor: supervisorName,
      creationDate: finalDate.toISOString(),
      status: status as Cedula['status'],
      description,
      semaforo: semaforo as Cedula['semaforo'],
      protocolSteps: protocolSteps.map(step => ({
        step: step.step || '',
        priority: step.priority || 'baja',
        completion: Number(step.completion) || 0,
        imageUrl: step.imageUrl || '',
        notes: step.notes || '',
        percentage: step.percentage || 0,
      })),
    };

    try {
        await createCedula(newCedulaData);
        alert('Cédula creada con éxito.');
        router.push('/dashboard/cedulas');
    } catch (error) {
        console.error("Failed to create cedula:", error);
        alert("Error al crear la cédula.");
    } finally {
        setIsSaving(false);
    }
  };

  const getSemaforoInfo = (semaforo: string) => {
    switch (semaforo) {
        case 'Verde':
            return { color: 'bg-green-500 text-white', text: 'Verde (Óptimo)' };
        case 'Naranja':
            return { color: 'bg-orange-500 text-white', text: 'Naranja (Con Observaciones)' };
        case 'Rojo':
            return { color: 'bg-red-500 text-white', text: 'Rojo (Crítico)' };
        default:
            return null;
    }
  }
  const semaforoInfo = getSemaforoInfo(semaforo);


  if (loading) {
      return (
          <div className="mx-auto grid max-w-3xl auto-rows-max items-start gap-4 lg:gap-8">
              <div className="flex items-center gap-4">
                  <Skeleton className="h-7 w-7" />
                  <div className="grid gap-2">
                      <Skeleton className="h-6 w-60" />
                      <Skeleton className="h-4 w-80" />
                  </div>
              </div>
              <Card>
                  <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                  <CardContent><Skeleton className="h-96 w-full" /></CardContent>
              </Card>
          </div>
      );
  }

  const getPriorityBadgeVariant = (priority: string): 'default' | 'secondary' | 'destructive' => {
    switch (priority?.toLowerCase()) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baja': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit}>
      <div className="mx-auto grid max-w-3xl auto-rows-max items-start gap-4 lg:gap-8">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-background/95 py-3 backdrop-blur-sm -mx-6 px-6">
           <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()} disabled={isSaving}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Atrás</span>
              </Button>
              <div className="grid gap-0.5">
                <h1 className="font-headline text-2xl font-bold">Crear Nueva Cédula</h1>
                <p className="text-muted-foreground hidden md:block">
                    Complete los datos para registrar una nueva cédula de mantenimiento.
                </p>
              </div>
           </div>
           <Button type="submit" disabled={isSaving || isSuggestingProtocol}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
              {isSaving ? "Guardando..." : "Guardar Cédula"}
           </Button>
        </div>
        <div className='grid gap-4'>
            <Card>
            <CardHeader>
                <CardTitle>Información de la Cédula</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                    <Label htmlFor="folio">Folio</Label>
                    <Input id="folio" value={folio} onChange={e => setFolio(e.target.value)} required disabled={isSaving}/>
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="creationDate">Fecha y Hora de Creación</Label>
                        <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !creationDate && "text-muted-foreground"
                                        )}
                                        disabled={isSaving}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {creationDate ? format(creationDate, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={creationDate}
                                        onSelect={setCreationDate}
                                        initialFocus
                                        locale={es}
                                    />
                                </PopoverContent>
                            </Popover>
                            <Input
                                type="time"
                                className="w-auto"
                                value={creationTime}
                                onChange={e => setCreationTime(e.target.value)}
                                disabled={isSaving}
                            />
                        </div>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                    <Label htmlFor="client">Cliente</Label>
                    <Select onValueChange={setClientId} required disabled={isSaving}>
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
                    <Select value={systemId} onValueChange={setSystemId} required disabled={!clientId || isSaving}>
                        <SelectTrigger>
                        <SelectValue placeholder="Seleccione un sistema" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredSystems.length > 0 ? (
                            filteredSystems.map(system => (
                                <SelectItem key={system.id} value={system.id}>{system.name}</SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-systems" disabled>No hay sistemas para este cliente</SelectItem>
                          )}
                        </SelectContent>
                    </Select>
                    </div>
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="equipment">Equipo</Label>
                    <Select value={equipmentId} onValueChange={handleEquipmentChange} required disabled={!systemId || isSaving || isSuggestingProtocol}>
                      <SelectTrigger className="h-auto">
                        <SelectValue placeholder="Seleccione un equipo">
                          {equipmentId && (() => {
                            const eq = filteredEquipments.find(e => e.id === equipmentId);
                            if (!eq) return "Seleccione un equipo";
                            return (
                                <div className="flex items-center gap-3 py-1">
                                    {eq.imageUrl ? (
                                        <Image src={eq.imageUrl} alt={eq.name} width={40} height={40} data-ai-hint="equipment photo" className="rounded-md object-cover" />
                                    ) : (
                                        <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center">
                                            <HardHat className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-semibold">{eq.name}</div>
                                        <div className="text-xs text-muted-foreground">{eq.type} - {eq.model}</div>
                                    </div>
                                </div>
                            )
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {filteredEquipments.map(eq => (
                          <SelectItem key={eq.id} value={eq.id} className="h-auto">
                            <div className="flex items-center gap-3 py-2">
                               {eq.imageUrl ? (
                                    <Image src={eq.imageUrl} alt={eq.name} width={48} height={48} data-ai-hint="equipment photo" className="rounded-md object-cover" />
                                ) : (
                                    <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center shrink-0">
                                        <HardHat className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="font-semibold">{eq.name} {eq.alias && `(${eq.alias})`}</span>
                                    <span className="text-xs text-muted-foreground">Tipo: <span className="text-foreground">{eq.type}</span></span>
                                    <span className="text-xs text-muted-foreground">Modelo: {eq.model}, N/S: {eq.serial}</span>
                                </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isSuggestingProtocol && (
                        <div className="flex items-center text-sm text-muted-foreground gap-2 mt-2">
                            <Loader2 className="h-4 w-4 animate-spin"/>
                            Buscando protocolo sugerido con IA...
                        </div>
                    )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                    <Label htmlFor="technician">Técnico Asignado</Label>
                    <Select onValueChange={setTechnicianId} required disabled={isSaving}>
                        <SelectTrigger>
                        <SelectValue placeholder="Seleccione un técnico" />
                        </SelectTrigger>
                        <SelectContent>
                        {technicians.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    </div>
                    <div className="grid gap-3">
                    <Label htmlFor="supervisor">Supervisor</Label>
                    <Select onValueChange={setSupervisorId} required disabled={isSaving}>
                        <SelectTrigger>
                        <SelectValue placeholder="Seleccione un supervisor" />
                        </SelectTrigger>
                        <SelectContent>
                        {supervisors.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                    <Label htmlFor="status">Estado</Label>
                    <Select value={status} onValueChange={setStatus} required disabled={isSaving}>
                        <SelectTrigger>
                        <SelectValue placeholder="Seleccione un estado" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="En Progreso">En Progreso</SelectItem>
                        <SelectItem value="Completada">Completada</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                     <div className="grid gap-3">
                        <Label htmlFor="semaforo">Semáforo de Cumplimiento</Label>
                        <Select value={semaforo} onValueChange={setSemaforo} disabled={isSaving}>
                            <SelectTrigger id="semaforo" className="w-full">
                                <SelectValue placeholder="Seleccione un estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Verde">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-green-500" />
                                        <span>Verde (Óptimo)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="Naranja">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-orange-500" />
                                        <span>Naranja (Con Observaciones)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="Rojo">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-red-500" />
                                        <span>Rojo (Crítico)</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                    <div className="grid gap-3">
                    <Label htmlFor="description">Descripción del Trabajo</Label>
                    <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describa el trabajo a realizar" required className="min-h-32" disabled={isSaving} />
                </div>
                </div>
            </CardContent>
            </Card>

            {protocolSteps.length > 0 && (
            <Card>
                <CardHeader>
                <CardTitle>Protocolo de Mantenimiento</CardTitle>
                <CardDescription>Registre el porcentaje de ejecución y suba evidencia fotográfica para cada paso.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    {protocolSteps.map((step, index) => (
                       <div key={index}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 border rounded-lg">
                           <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-base font-semibold">Paso del Protocolo</Label>
                                    <p className="text-muted-foreground">{step.step}</p>
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor={`step-notes-${index}`}>Notas</Label>
                                    <Textarea
                                        id={`step-notes-${index}`}
                                        placeholder="Añadir notas sobre el procedimiento..."
                                        value={step.notes || ''}
                                        onChange={(e) => handleStepChange(index, 'notes', e.target.value)}
                                        className="min-h-24"
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor={`step-percentage-${index}`}>% Ejecutado</Label>
                                    <Select
                                        value={String(step.completion || '0')}
                                        onValueChange={(value) => handleStepChange(index, 'completion', Number(value))}
                                        disabled={isSaving}
                                    >
                                        <SelectTrigger id={`step-percentage-${index}`} className="w-48">
                                            <SelectValue placeholder="% Ejecutado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">0%</SelectItem>
                                            <SelectItem value="20">20%</SelectItem>
                                            <SelectItem value="40">40%</SelectItem>
                                            <SelectItem value="60">60%</SelectItem>
                                            <SelectItem value="80">80%</SelectItem>
                                            <SelectItem value="100">100%</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                           </div>
                           <div className="grid gap-3">
                                <Label>Evidencia Fotográfica</Label>
                                {step.imageUrl ? (
                                    <Image src={step.imageUrl} alt={`Evidencia para ${step.step}`} width={400} height={300} data-ai-hint="protocol evidence" className="rounded-md object-cover aspect-video" />
                                ) : (
                                    <div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center">
                                        <Camera className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById(`image-upload-${index}`)?.click()} disabled={isSaving}>
                                        <Camera className="mr-2 h-4 w-4" />
                                        {step.imageUrl ? 'Cambiar Foto' : 'Tomar o Subir Foto'}
                                    </Button>
                                    {step.imageUrl && (
                                        <Button type="button" variant="destructive" size="icon" onClick={() => handleImageDelete(index)} disabled={isSaving}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Eliminar Foto</span>
                                        </Button>
                                    )}
                                </div>
                                <Input
                                    id={`image-upload-${index}`}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) => handleImageChange(index, e)}
                                    className="hidden"
                                    disabled={isSaving}
                                />
                            </div>
                        </div>
                        {index < protocolSteps.length - 1 && <Separator className="mt-6" />}
                       </div>
                    ))}
                </CardContent>
            </Card>
            )}
            
            {semaforoInfo && (
                <div className={cn("p-4 text-center text-xl font-bold rounded-lg", semaforoInfo.color)}>
                    {semaforoInfo.text}
                </div>
            )}
        </div>
      </div>
    </form>
    
    <Dialog open={!!suggestedProtocol} onOpenChange={(open) => !open && setSuggestedProtocol(null)}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                 <div className='flex items-center gap-2 mb-2'>
                    <Wand2 className="h-6 w-6 text-primary" />
                    <DialogTitle>Protocolo Base Sugerido por IA</DialogTitle>
                </div>
                <DialogDescription>
                    {suggestedProtocol?.reason}
                </DialogDescription>
            </DialogHeader>
            {suggestedProtocol?.protocol ? (
                <div className="mt-4 space-y-4">
                    <div className="grid md:grid-cols-3 gap-4 border rounded-lg p-4 bg-muted/50">
                        <div className="grid gap-1">
                            <Label className="text-muted-foreground">Tipo de Equipo</Label>
                            <p className="font-semibold">{suggestedProtocol.protocol.type}</p>
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-muted-foreground">Marca</Label>
                            <p className="font-semibold">{suggestedProtocol.protocol.brand}</p>
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-muted-foreground">Modelo</Label>
                            <p className="font-semibold">{suggestedProtocol.protocol.model}</p>
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2">Pasos del Protocolo:</h4>
                        <div className="border rounded-md max-h-60 overflow-y-auto">
                            {suggestedProtocol.protocol.steps.map((step, index) => (
                                <div key={index} className={cn("p-3", index < suggestedProtocol.protocol!.steps.length - 1 && "border-b")}>
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm text-foreground pr-4">{step.step}</p>
                                        <Badge variant={getPriorityBadgeVariant(step.priority)} className="capitalize h-fit">{step.priority}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 border-dashed border-2 rounded-lg">
                    <ListChecks className="h-12 w-12 text-muted-foreground mb-4"/>
                    <h3 className="font-semibold">No se encontraron protocolos</h3>
                    <p className="text-sm text-muted-foreground">
                        No hay protocolos base en el sistema o no se encontró una coincidencia adecuada.
                    </p>
                </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={() => setSuggestedProtocol(null)}>Cancelar</Button>
                <Button onClick={handleConfirmProtocol} disabled={!suggestedProtocol?.protocol}>
                    Confirmar y Usar Protocolo
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    </>
  );
}
