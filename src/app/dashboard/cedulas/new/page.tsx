
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ArrowLeft, Camera, ShieldAlert, Trash2 } from 'lucide-react';
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
import { Protocol, Cedula, Client, Equipment, User, System, ProtocolStep } from '@/lib/services';
import { Skeleton } from '@/components/ui/skeleton';
import { CardDescription } from '@/components/ui/card';
import { useData } from '@/hooks/use-data-provider';

type EquipmentWithProtocolStatus = Equipment & { hasProtocol: boolean };

export default function NewCedulaPage() {
  const router = useRouter();
  const { clients, systems: allSystems, equipments: allEquipments, users, protocols, createCedula, loading } = useData();

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
  const [filteredEquipments, setFilteredEquipments] = useState<EquipmentWithProtocolStatus[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  
  const [protocolSteps, setProtocolSteps] = useState<ProtocolStep[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  
  const [showProtocolAlert, setShowProtocolAlert] = useState(false);
  const [equipmentForProtocol, setEquipmentForProtocol] = useState<string | null>(null);

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
            const filtered = allEquipments
                .filter(eq => eq.client === clientName && eq.system === systemName)
                .map(eq => ({
                    ...eq,
                    hasProtocol: protocols.some(p => p.equipmentId === eq.id && p.steps.length > 0)
                }));
            setFilteredEquipments(filtered);
        } else {
            setFilteredEquipments([]);
        }
    } else {
        setFilteredEquipments([]);
    }
    setEquipmentId('');
  }, [clientId, systemId, clients, allSystems, allEquipments, protocols]);
  
  const handleEquipmentChange = (newEquipmentId: string) => {
    const selectedEquipment = filteredEquipments.find(eq => eq.id === newEquipmentId);
    if (!selectedEquipment) return;

    if (!selectedEquipment.hasProtocol) {
        setEquipmentForProtocol(newEquipmentId);
        setShowProtocolAlert(true);
        setEquipmentId('');
        setProtocolSteps([]);
        return;
    }

    setEquipmentId(newEquipmentId);

    const equipmentProtocol = protocols.find(p => p.equipmentId === newEquipmentId);
    if (equipmentProtocol) {
        const initialSteps = equipmentProtocol.steps.map(step => ({ ...step, completion: 0, notes: '', imageUrl: '' }));
        setProtocolSteps(initialSteps);
    } else {
        setProtocolSteps([]);
    }
  };

  const handleStepChange = (index: number, field: keyof ProtocolStep, value: string | number) => {
    setProtocolSteps(prev => {
        const newSteps = [...prev];
        const updatedStep = { ...newSteps[index], [field]: value };
        newSteps[index] = updatedStep;
        return newSteps;
    });
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
        step: step.step,
        priority: step.priority,
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

  return (
    <>
    <form onSubmit={handleSubmit}>
      <div className="mx-auto grid max-w-3xl auto-rows-max items-start gap-4 lg:gap-8">
        <div className="flex items-center gap-4">
           <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()} disabled={isSaving}>
             <ArrowLeft className="h-4 w-4" />
             <span className="sr-only">Atrás</span>
           </Button>
           <div className="grid gap-0.5">
            <h1 className="font-headline text-2xl font-bold">Crear Nueva Cédula</h1>
            <p className="text-muted-foreground">
                Complete los datos para registrar una nueva cédula de mantenimiento.
            </p>
           </div>
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
                            <SelectItem value="no-systems" disabled>No hay sistemas con equipos para este cliente</SelectItem>
                          )}
                        </SelectContent>
                    </Select>
                    </div>
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="equipment">Equipo</Label>
                    <Select value={equipmentId} onValueChange={handleEquipmentChange} required disabled={!systemId || isSaving}>
                        <SelectTrigger>
                        <SelectValue placeholder="Seleccione un equipo" />
                        </SelectTrigger>
                        <SelectContent>
                        {filteredEquipments.map(eq => (
                            <SelectItem key={eq.id} value={eq.id} className={!eq.hasProtocol ? 'text-destructive' : ''}>
                                {eq.name}
                                {eq.alias && ` (${eq.alias})`}
                                {` - Modelo: ${eq.model}, N/S: ${eq.serial}`}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
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

            <div className="flex justify-start">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Guardando..." : "Guardar Cédula"}
                </Button>
            </div>
        </div>
      </div>
    </form>
    
    <AlertDialog open={showProtocolAlert} onOpenChange={setShowProtocolAlert}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <div className='flex items-center gap-2'>
                    <ShieldAlert className="h-6 w-6 text-destructive" />
                    <AlertDialogTitle>Protocolo Requerido</AlertDialogTitle>
                </div>
                <AlertDialogDescription>
                    Este equipo no tiene un protocolo de mantenimiento definido. Es necesario crear uno antes de poder generar una cédula.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setEquipmentForProtocol(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                    if (equipmentForProtocol) {
                        router.push(`/dashboard/protocols/new?equipmentId=${equipmentForProtocol}`);
                    }
                }}>
                    Crear Protocolo
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </>
  );
}
