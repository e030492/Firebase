"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
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
import { mockCedulas, mockClients, mockEquipments, mockUsers } from '@/lib/mock-data';

const CEDULAS_STORAGE_KEY = 'guardian_shield_cedulas';
const CLIENTS_STORAGE_KEY = 'guardian_shield_clients';
const EQUIPMENTS_STORAGE_KEY = 'guardian_shield_equipments';
const USERS_STORAGE_KEY = 'guardian_shield_users';

type Cedula = typeof mockCedulas[0];
type Client = typeof mockClients[0];
type Equipment = typeof mockEquipments[0];
type User = typeof mockUsers[0];

export default function NewCedulaPage() {
  const router = useRouter();
  const [folio, setFolio] = useState(`C-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
  const [clientId, setClientId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [creationDate, setCreationDate] = useState<Date>(new Date());
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Pendiente');

  const [clients, setClients] = useState<Client[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);

  useEffect(() => {
    const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
    setClients(storedClients ? JSON.parse(storedClients) : []);
    
    const storedEquipments = localStorage.getItem(EQUIPMENTS_STORAGE_KEY);
    setEquipments(storedEquipments ? JSON.parse(storedEquipments) : []);

    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const allUsers: User[] = storedUsers ? JSON.parse(storedUsers) : [];
    setTechnicians(allUsers.filter(user => user.role === 'Técnico'));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folio || !clientId || !equipmentId || !technicianId || !creationDate || !description) {
        alert('Por favor, complete todos los campos.');
        return;
    }

    const storedCedulas = localStorage.getItem(CEDULAS_STORAGE_KEY);
    let cedulas: Cedula[] = storedCedulas ? JSON.parse(storedCedulas) : [];
    
    const clientName = clients.find(c => c.id === clientId)?.name || '';
    const equipmentName = equipments.find(eq => eq.id === equipmentId)?.name || '';
    const technicianName = technicians.find(t => t.id === technicianId)?.name || '';

    const newCedula: Cedula = {
      id: new Date().getTime().toString(),
      folio,
      client: clientName,
      equipment: equipmentName,
      technician: technicianName,
      creationDate: format(creationDate, 'yyyy-MM-dd'),
      status: status as Cedula['status'],
      description,
    };

    cedulas.push(newCedula);
    localStorage.setItem(CEDULAS_STORAGE_KEY, JSON.stringify(cedulas));

    alert('Cédula creada con éxito.');
    router.push('/dashboard/cedulas');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mx-auto grid max-w-3xl auto-rows-max items-start gap-4 lg:gap-8">
        <div className="grid gap-2">
          <h1 className="font-headline text-3xl font-bold">Crear Nueva Cédula</h1>
          <p className="text-muted-foreground">
            Complete los datos para registrar una nueva cédula de mantenimiento.
          </p>
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
                  <Select onValueChange={setClientId} required>
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
                  <Label htmlFor="equipment">Equipo</Label>
                  <Select onValueChange={setEquipmentId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un equipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipments.map(eq => (
                        <SelectItem key={eq.id} value={eq.id}>{eq.name} ({eq.client})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
               </div>
                <div className="grid gap-3">
                <Label htmlFor="description">Descripción del Trabajo</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describa el trabajo a realizar" required className="min-h-32" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit">Guardar Cédula</Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}
