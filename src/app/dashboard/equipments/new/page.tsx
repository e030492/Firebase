"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Camera, ArrowLeft } from 'lucide-react';
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
import { mockEquipments, mockClients, mockSystems } from '@/lib/mock-data';

const EQUIPMENTS_STORAGE_KEY = 'guardian_shield_equipments';
const CLIENTS_STORAGE_KEY = 'guardian_shield_clients';
const SYSTEMS_STORAGE_KEY = 'guardian_shield_systems';

type Equipment = typeof mockEquipments[0];
type Client = typeof mockClients[0];
type System = typeof mockSystems[0];


export default function NewEquipmentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [systemId, setSystemId] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('Activo');
  const [maintenanceStartDate, setMaintenanceStartDate] = useState<Date>();
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState<Date>();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [clientWarehouses, setClientWarehouses] = useState<Client['almacenes']>([]);

  useEffect(() => {
    const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
    setClients(storedClients ? JSON.parse(storedClients) : []);
    
    const storedSystems = localStorage.getItem(SYSTEMS_STORAGE_KEY);
    setSystems(storedSystems ? JSON.parse(storedSystems) : []);
  }, []);

  useEffect(() => {
    if (clientId) {
      const selectedClient = clients.find(c => c.id === clientId);
      setClientWarehouses(selectedClient?.almacenes || []);
    } else {
      setClientWarehouses([]);
    }
  }, [clientId, clients]);
  
  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    setLocation('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !clientId || !systemId || !location || !status) {
        alert('Por favor, complete todos los campos.');
        return;
    }

    const storedEquipments = localStorage.getItem(EQUIPMENTS_STORAGE_KEY);
    let equipments: Equipment[] = storedEquipments ? JSON.parse(storedEquipments) : [];
    
    const clientName = clients.find(c => c.id === clientId)?.name || '';
    const systemName = systems.find(s => s.id === systemId)?.name || '';

    const newEquipment: Equipment = {
      id: new Date().getTime().toString(),
      name,
      description,
      client: clientName,
      system: systemName,
      location,
      status: status as Equipment['status'],
      maintenanceStartDate: maintenanceStartDate ? format(maintenanceStartDate, 'yyyy-MM-dd') : '',
      nextMaintenanceDate: nextMaintenanceDate ? format(nextMaintenanceDate, 'yyyy-MM-dd') : '',
      imageUrl: imageUrl || '',
    };

    equipments.push(newEquipment);
    localStorage.setItem(EQUIPMENTS_STORAGE_KEY, JSON.stringify(equipments));

    alert('Equipo creado con éxito.');
    router.push('/dashboard/equipments');
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
            <h1 className="font-headline text-2xl font-bold">Registrar Nuevo Equipo</h1>
            <p className="text-muted-foreground">
                Complete los datos para agregar un nuevo equipo al sistema.
            </p>
           </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Información del Equipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="name">Nombre del Equipo</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Cámara IP" required />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describa el equipo" required className="min-h-32" />
              </div>
              <div className="grid gap-3">
                <Label>Imagen del Equipo</Label>
                {imageUrl && <Image src={imageUrl} alt="Vista previa del equipo" width={400} height={300} data-ai-hint="equipment photo" className="rounded-md object-cover aspect-video" />}
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="mr-2 h-4 w-4" />
                    {imageUrl ? 'Cambiar Imagen' : 'Tomar o Subir Foto'}
                </Button>
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
                  <Label htmlFor="location">Almacén / Ubicación</Label>
                  <Select value={location} onValueChange={setLocation} required disabled={!clientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un almacén" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientWarehouses.length > 0 ? (
                        clientWarehouses.map(almacen => (
                          <SelectItem key={almacen.nombre} value={almacen.nombre}>{almacen.nombre}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-warehouses" disabled>No hay almacenes para este cliente</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
               <div className="grid md:grid-cols-2 gap-4">
                 <div className="grid gap-3">
                  <Label htmlFor="system">Sistema Asociado</Label>
                  <Select onValueChange={setSystemId} required>
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
                   <Label htmlFor="status">Estado</Label>
                   <Select value={status} onValueChange={setStatus} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                      <SelectItem value="En Mantenimiento">En Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                 </div>
               </div>
               <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-3">
                    <Label htmlFor="maintenanceStartDate">Fecha de Inicio de Mantenimiento</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !maintenanceStartDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {maintenanceStartDate ? format(maintenanceStartDate, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={maintenanceStartDate}
                                onSelect={setMaintenanceStartDate}
                                initialFocus
                                locale={es}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="nextMaintenanceDate">Siguiente Mantenimiento</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !nextMaintenanceDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {nextMaintenanceDate ? format(nextMaintenanceDate, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={nextMaintenanceDate}
                                onSelect={setNextMaintenanceDate}
                                initialFocus
                                locale={es}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit">Guardar Equipo</Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}
