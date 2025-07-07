"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
import { Skeleton } from '@/components/ui/skeleton';
import { mockCedulas, mockClients, mockEquipments, mockUsers, mockSystems } from '@/lib/mock-data';
import Link from 'next/link';

const CEDULAS_STORAGE_KEY = 'guardian_shield_cedulas';
const CLIENTS_STORAGE_KEY = 'guardian_shield_clients';
const EQUIPMENTS_STORAGE_KEY = 'guardian_shield_equipments';
const USERS_STORAGE_KEY = 'guardian_shield_users';
const SYSTEMS_STORAGE_KEY = 'guardian_shield_systems';

type Cedula = typeof mockCedulas[0];
type Client = typeof mockClients[0];
type Equipment = typeof mockEquipments[0];
type User = typeof mockUsers[0];
type System = typeof mockSystems[0];


export default function EditCedulaPage() {
  const params = useParams();
  const router = useRouter();
  const cedulaId = params.id as string;

  const [folio, setFolio] = useState('');
  const [clientId, setClientId] = useState('');
  const [systemId, setSystemId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [creationDate, setCreationDate] = useState<Date>();
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');

  const [clients, setClients] = useState<Client[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [allEquipments, setAllEquipments] = useState<Equipment[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Load all data from localStorage or mock data
    const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
    const allClientsData: Client[] = storedClients ? JSON.parse(storedClients) : mockClients;
    setClients(allClientsData);
    
    const storedEquipments = localStorage.getItem(EQUIPMENTS_STORAGE_KEY);
    const allEquipmentsData: Equipment[] = storedEquipments ? JSON.parse(storedEquipments) : mockEquipments;
    setAllEquipments(allEquipmentsData);

    const storedSystems = localStorage.getItem(SYSTEMS_STORAGE_KEY);
    const allSystemsData: System[] = storedSystems ? JSON.parse(storedSystems) : mockSystems;
    setSystems(allSystemsData);

    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const allUsersData: User[] = storedUsers ? JSON.parse(storedUsers) : mockUsers;
    setTechnicians(allUsersData.filter(u => u.role === 'Técnico'));
    setSupervisors(allUsersData.filter(u => u.role === 'Supervisor'));

    if (cedulaId) {
      const storedCedulas = localStorage.getItem(CEDULAS_STORAGE_KEY);
      const cedulas: Cedula[] = storedCedulas ? JSON.parse(storedCedulas) : [];
      const foundCedula = cedulas.find(c => c.id === cedulaId);

      if (foundCedula) {
        setFolio(foundCedula.folio);
        setDescription(foundCedula.description);
        setStatus(foundCedula.status);
        if(foundCedula.creationDate) setCreationDate(new Date(foundCedula.creationDate + 'T00:00:00'));

        const foundClient = allClientsData.find(c => c.name === foundCedula.client);
        if (foundClient) setClientId(foundClient.id);
        
        const foundEquipment = allEquipmentsData.find(e => e.name === foundCedula.equipment);
        if (foundEquipment) {
            setEquipmentId(foundEquipment.id);
            const foundSystem = allSystemsData.find(s => s.name === foundEquipment.system);
            if (foundSystem) setSystemId(foundSystem.id);
        }

        const foundTechnician = allUsersData.find(u => u.name === foundCedula.technician);
        if (foundTechnician) setTechnicianId(foundTechnician.id);

        const foundSupervisor = allUsersData.find(u => u.name === foundCedula.supervisor);
        if (foundSupervisor) setSupervisorId(foundSupervisor.id);
        
        setLoading(false);
      } else {
        setNotFound(true);
        setLoading(false);
      }
    }
  }, [cedulaId]);

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
  }, [clientId, systemId, allEquipments, clients, systems]);
  
  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    setSystemId('');
    setEquipmentId('');
    setFilteredEquipments([]);
  };

  const handleSystemChange = (newSystemId: string) => {
    setSystemId(newSystemId);
    setEquipmentId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedCedulas = localStorage.getItem(CEDULAS_STORAGE_KEY);
    let cedulas: Cedula[] = storedCedulas ? JSON.parse(storedCedulas) : [];

    const clientName = clients.find(c => c.id === clientId)?.name || '';
    const equipmentName = allEquipments.find(e => e.id === equipmentId)?.name || '';
    const technicianName = technicians.find(t => t.id === technicianId)?.name || '';
    const supervisorName = supervisors.find(s => s.id === supervisorId)?.name || '';

    const updatedCedulas = cedulas.map(c => {
      if (c.id === cedulaId) {
        return {
          ...c,
          folio,
          client: clientName,
          equipment: equipmentName,
          technician: technicianName,
          supervisor: supervisorName,
          creationDate: creationDate ? format(creationDate, 'yyyy-MM-dd') : '',
          status: status as Cedula['status'],
          description,
        };
      }
      return c;
    });

    localStorage.setItem(CEDULAS_STORAGE_KEY, JSON.stringify(updatedCedulas));
    alert('Cédula actualizada con éxito.');
    router.push('/dashboard/cedulas');
  }

  if (loading) {
    return (
       <div className="mx-auto grid max-w-3xl auto-rows-max items-start gap-4 lg:gap-8">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-7 w-7" disabled>
               <ArrowLeft className="h-4 w-4" />
               <span className="sr-only">Atrás</span>
            </Button>
          <div className="grid gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Información de la Cédula</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
           <CardFooter className="border-t px-6 py-4">
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center h-full mt-10">
         <h1 className="text-2xl font-bold">Cédula no encontrada</h1>
         <p className="text-muted-foreground">No se pudo encontrar la cédula que buscas.</p>
         <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
         </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mx-auto grid max-w-3xl auto-rows-max items-start gap-4 lg:gap-8">
        <div className="flex items-center gap-4">
           <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
             <ArrowLeft className="h-4 w-4" />
             <span className="sr-only">Atrás</span>
           </Button>
           <div className="grid gap-0.5">
             <h1 className="font-headline text-2xl font-bold">Editar Cédula</h1>
             <p className="text-muted-foreground">Modifique los datos de la cédula de mantenimiento.</p>
           </div>
        </div>
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
                    <Label htmlFor="creationDate">Fecha de Creación</Label>
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
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="client">Cliente</Label>
                  <Select value={clientId} onValueChange={handleClientChange} required>
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
                   <Label htmlFor="technician">Técnico Asignado</Label>
                   <Select value={technicianId} onValueChange={setTechnicianId} required>
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
              </div>
               <div className="grid md:grid-cols-2 gap-4">
                 <div className="grid gap-3">
                   <Label htmlFor="system">Sistema</Label>
                   <Select value={systemId} onValueChange={handleSystemChange} required disabled={!clientId}>
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
                  <Label htmlFor="equipment">Equipo</Label>
                  <Select value={equipmentId} onValueChange={setEquipmentId} required disabled={!systemId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un equipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredEquipments.map(eq => (
                        <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
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
                   <Label htmlFor="supervisor">Supervisor</Label>
                   <Select value={supervisorId} onValueChange={setSupervisorId} required>
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
                <div className="grid gap-3">
                <Label htmlFor="description">Descripción del Trabajo</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describa el trabajo a realizar" required className="min-h-32" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit">Guardar Cambios</Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}
