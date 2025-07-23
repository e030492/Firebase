
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ArrowLeft, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { mockCedulas, mockClients, mockEquipments, mockUsers, mockSystems, mockProtocols } from '@/lib/mock-data';
import { Separator } from '@/components/ui/separator';

const CEDULAS_STORAGE_KEY = 'guardian_shield_cedulas';
const CLIENTS_STORAGE_KEY = 'guardian_shield_clients';
const EQUIPMENTS_STORAGE_KEY = 'guardian_shield_equipments';
const USERS_STORAGE_KEY = 'guardian_shield_users';
const SYSTEMS_STORAGE_KEY = 'guardian_shield_systems';
const PROTOCOLS_STORAGE_KEY = 'guardian_shield_protocols';

type Cedula = typeof mockCedulas[0];
type Client = typeof mockClients[0];
type Equipment = typeof mockEquipments[0];
type User = typeof mockUsers[0];
type System = typeof mockSystems[0];
type ProtocolStep = { step: string; priority: 'baja' | 'media' | 'alta'; percentage: number; imageUrl?: string; notes?: string };
type Protocol = { equipmentId: string; steps: ProtocolStep[] };

export default function NewCedulaPage() {
  const router = useRouter();
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

  const [clients, setClients] = useState<Client[]>([]);
  const [allSystems, setAllSystems] = useState<System[]>([]);
  const [allEquipments, setAllEquipments] = useState<Equipment[]>([]);
  const [filteredSystems, setFilteredSystems] = useState<System[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  
  const [serialNumber, setSerialNumber] = useState('');

  const [protocolSteps, setProtocolSteps] = useState<ProtocolStep[]>([]);
  const [completionPercentages, setCompletionPercentages] = useState<{ [step: string]: string }>({});
  const [imageUrls, setImageUrls] = useState<{ [step: string]: string }>({});
  const [notes, setNotes] = useState<{ [step: string]: string }>({});

  useEffect(() => {
    const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
    setClients(storedClients ? JSON.parse(storedClients) : mockClients);

    const storedSystems = localStorage.getItem(SYSTEMS_STORAGE_KEY);
    setAllSystems(storedSystems ? JSON.parse(storedSystems) : mockSystems);
    
    const storedEquipments = localStorage.getItem(EQUIPMENTS_STORAGE_KEY);
    setAllEquipments(storedEquipments ? JSON.parse(storedEquipments) : mockEquipments);

    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const allUsers: User[] = storedUsers ? JSON.parse(storedUsers) : mockUsers;
    setTechnicians(allUsers.filter(user => user.role === 'Técnico'));
    setSupervisors(allUsers.filter(user => user.role === 'Supervisor'));
  }, []);

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
  }, [clientId, systemId, clients, allSystems, allEquipments]);
  
  useEffect(() => {
    setSerialNumber(''); // Reset serial number when equipment changes
    if (equipmentId) {
        const storedProtocols = localStorage.getItem(PROTOCOLS_STORAGE_KEY);
        const protocols: Protocol[] = storedProtocols ? JSON.parse(storedProtocols) : mockProtocols;
        const equipmentProtocol = protocols.find(p => p.equipmentId === equipmentId);
        
        const selectedEquipment = allEquipments.find(eq => eq.id === equipmentId);
        if (selectedEquipment) {
            setSerialNumber(selectedEquipment.serial);
        }

        if (equipmentProtocol) {
            setProtocolSteps(equipmentProtocol.steps);
            const initialPercentages = equipmentProtocol.steps.reduce((acc, step) => {
                acc[step.step] = '0';
                return acc;
            }, {} as { [step: string]: string });
            const initialNotes = equipmentProtocol.steps.reduce((acc, step) => {
                acc[step.step] = '';
                return acc;
            }, {} as { [step: string]: string });
            setCompletionPercentages(initialPercentages);
            setImageUrls({});
            setNotes(initialNotes);
        } else {
            setProtocolSteps([]);
            setCompletionPercentages({});
            setImageUrls({});
            setNotes({});
        }
    } else {
        setProtocolSteps([]);
        setCompletionPercentages({});
        setImageUrls({});
        setNotes({});
    }
  }, [equipmentId, allEquipments]);


  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    setSystemId('');
    setEquipmentId('');
    setFilteredSystems([]);
    setFilteredEquipments([]);
  };

  const handleSystemChange = (newSystemId: string) => {
    setSystemId(newSystemId);
    setEquipmentId('');
  };
  
  const handleEquipmentChange = (newEquipmentId: string) => {
    setEquipmentId(newEquipmentId);
  }

  const handlePercentageChange = (step: string, value: string) => {
    setCompletionPercentages(prev => ({ ...prev, [step]: value }));
  };

  const handleImageChange = (step: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrls(prev => ({ ...prev, [step]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNotesChange = (step: string, value: string) => {
    setNotes(prev => ({ ...prev, [step]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folio || !clientId || !equipmentId || !technicianId || !supervisorId || !creationDate || !description) {
        alert('Por favor, complete todos los campos.');
        return;
    }

    const storedCedulas = localStorage.getItem(CEDULAS_STORAGE_KEY);
    let cedulas: Cedula[] = storedCedulas ? JSON.parse(storedCedulas) : [];
    
    const clientName = clients.find(c => c.id === clientId)?.name || '';
    const equipmentName = allEquipments.find(eq => eq.id === equipmentId)?.name || '';
    const technicianName = technicians.find(t => t.id === technicianId)?.name || '';
    const supervisorName = supervisors.find(s => s.id === supervisorId)?.name || '';

    const finalDate = new Date(creationDate);
    const [hours, minutes] = creationTime.split(':');
    finalDate.setHours(parseInt(hours, 10));
    finalDate.setMinutes(parseInt(minutes, 10));

    const newCedula: Cedula = {
      id: new Date().getTime().toString(),
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
        completion: Number(completionPercentages[step.step]) || 0,
        imageUrl: imageUrls[step.step] || '',
        notes: notes[step.step] || '',
      })),
    };

    cedulas.push(newCedula);
    localStorage.setItem(CEDULAS_STORAGE_KEY, JSON.stringify(cedulas));

    alert('Cédula creada con éxito.');
    router.push('/dashboard/cedulas');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mx-auto grid max-w-3xl auto-rows-max items-start gap-4 lg:gap-8">
        <div className="flex items-center gap-4">
           <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
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
                    <Input id="folio" value={folio} onChange={e => setFolio(e.target.value)} required />
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
                            />
                        </div>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                    <Label htmlFor="client">Cliente</Label>
                    <Select onValueChange={handleClientChange} required>
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
                    <Select value={systemId} onValueChange={handleSystemChange} required disabled={!clientId}>
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
                    <Select value={equipmentId} onValueChange={handleEquipmentChange} required disabled={!systemId}>
                        <SelectTrigger>
                        <SelectValue placeholder="Seleccione un equipo" />
                        </SelectTrigger>
                        <SelectContent>
                        {filteredEquipments.map(eq => (
                            <SelectItem key={eq.id} value={eq.id}>
                                {eq.name} ({eq.serial})
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="serial">Número de Serie</Label>
                    <Input id="serial" value={serialNumber} readOnly disabled />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                    <Label htmlFor="technician">Técnico Asignado</Label>
                    <Select onValueChange={setTechnicianId} required>
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
                    <Select onValueChange={setSupervisorId} required>
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
                    <Select value={status} onValueChange={setStatus} required>
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
                        <Select value={semaforo} onValueChange={setSemaforo}>
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
                    <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describa el trabajo a realizar" required className="min-h-32" />
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
                        <div className="grid gap-4 p-4 border rounded-lg">
                            <p className="font-medium">{step.step}</p>
                            <div className="grid md:grid-cols-2 gap-6 items-end">
                                <div className="grid gap-3">
                                    <Label>Evidencia Fotográfica</Label>
                                    {imageUrls[step.step] ? (
                                        <Image src={imageUrls[step.step]} alt={`Evidencia para ${step.step}`} width={400} height={300} data-ai-hint="protocol evidence" className="rounded-md object-cover aspect-video" />
                                    ) : (
                                        <div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center">
                                            <Camera className="h-10 w-10 text-muted-foreground" />
                                        </div>
                                    )}
                                    <Button type="button" variant="outline" onClick={() => document.getElementById(`image-upload-${index}`)?.click()}>
                                        <Camera className="mr-2 h-4 w-4" />
                                        {imageUrls[step.step] ? 'Cambiar Foto' : 'Subir Foto'}
                                    </Button>
                                    <Input
                                        id={`image-upload-${index}`}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={(e) => handleImageChange(step.step, e)}
                                        className="hidden"
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor={`step-percentage-${index}`}>% Ejecutado</Label>
                                    <Select
                                        value={completionPercentages[step.step] || '0'}
                                        onValueChange={(value) => handlePercentageChange(step.step, value)}
                                    >
                                        <SelectTrigger id={`step-percentage-${index}`} className="w-auto">
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
                             <div className="grid gap-3 mt-4">
                                <Label htmlFor={`step-notes-${index}`}>Notas</Label>
                                <Textarea
                                    id={`step-notes-${index}`}
                                    placeholder="Añadir notas sobre el procedimiento..."
                                    value={notes[step.step] || ''}
                                    onChange={(e) => handleNotesChange(step.step, e.target.value)}
                                    className="min-h-24"
                                />
                            </div>
                        </div>
                        {index < protocolSteps.length - 1 && <Separator className="mt-6" />}
                       </div>
                    ))}
                </CardContent>
            </Card>
            )}
            
            <div className="flex justify-start">
                <Button type="submit">Guardar Cédula</Button>
            </div>
        </div>
      </div>
    </form>
  );
}

    

    