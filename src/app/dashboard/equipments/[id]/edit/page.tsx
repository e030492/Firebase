"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ArrowLeft, Camera } from 'lucide-react';
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
import { mockEquipments, mockClients, mockSystems } from '@/lib/mock-data';

const EQUIPMENTS_STORAGE_KEY = 'guardian_shield_equipments';
const CLIENTS_STORAGE_KEY = 'guardian_shield_clients';
const SYSTEMS_STORAGE_KEY = 'guardian_shield_systems';

type Equipment = typeof mockEquipments[0];
type Client = typeof mockClients[0];
type System = typeof mockSystems[0];


export default function EditEquipmentPage() {
  const params = useParams();
  const router = useRouter();
  const equipmentId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [systemId, setSystemId] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  const [maintenanceStartDate, setMaintenanceStartDate] = useState<Date>();
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState<Date>();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
    const allClients: Client[] = storedClients ? JSON.parse(storedClients) : [];
    setClients(allClients);
    
    const storedSystems = localStorage.getItem(SYSTEMS_STORAGE_KEY);
    const allSystems: System[] = storedSystems ? JSON.parse(storedSystems) : [];
    setSystems(allSystems);

    if (equipmentId && allClients.length > 0 && allSystems.length > 0) {
      const storedEquipments = localStorage.getItem(EQUIPMENTS_STORAGE_KEY);
      const equipments: Equipment[] = storedEquipments ? JSON.parse(storedEquipments) : [];
      const foundEquipment = equipments.find(e => e.id === equipmentId);

      if (foundEquipment) {
        setName(foundEquipment.name);
        setDescription(foundEquipment.description);
        setLocation(foundEquipment.location);
        setStatus(foundEquipment.status);
        setImageUrl(foundEquipment.imageUrl || null);
        
        if (foundEquipment.maintenanceStartDate) {
          setMaintenanceStartDate(new Date(foundEquipment.maintenanceStartDate + 'T00:00:00'));
        }
        if (foundEquipment.nextMaintenanceDate) {
          setNextMaintenanceDate(new Date(foundEquipment.nextMaintenanceDate + 'T00:00:00'));
        }
        
        const foundClient = allClients.find(c => c.name === foundEquipment.client);
        if (foundClient) setClientId(foundClient.id);

        const foundSystem = allSystems.find(s => s.name === foundEquipment.system);
        if (foundSystem) setSystemId(foundSystem.id);

      } else {
        setNotFound(true);
      }
      setLoading(false);
    } else if (equipmentId) {
        setLoading(true);
    }

  }, [equipmentId, clients.length, systems.length]);

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
    const storedEquipments = localStorage.getItem(EQUIPMENTS_STORAGE_KEY);
    let equipments: Equipment[] = storedEquipments ? JSON.parse(storedEquipments) : [];

    const clientName = clients.find(c => c.id === clientId)?.name || '';
    const systemName = systems.find(s => s.id === systemId)?.name || '';

    const updatedEquipments = equipments.map(eq => {
      if (eq.id === equipmentId) {
        return {
          ...eq,
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
      }
      return eq;
    });

    localStorage.setItem(EQUIPMENTS_STORAGE_KEY, JSON.stringify(updatedEquipments));
    alert('Equipo actualizado con éxito.');
    router.push('/dashboard/equipments');
  }

  if (loading) {
    return (
       <div className="mx-auto grid max-w-3xl auto-rows-max items-start gap-4 lg:gap-8">
        <div className="flex items-center gap-4">
           <Link href="/dashboard/equipments">
             <Button variant="outline" size="icon" className="h-7 w-7" disabled>
               <ArrowLeft className="h-4 w-4" />
               <span className="sr-only">Atrás</span>
             </Button>
           </Link>
          <div className="grid gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Información del Equipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label>Nombre del Equipo</Label>
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid gap-3">
                <Label>Descripción</Label>
                <Skeleton className="h-32 w-full" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label>Cliente</Label>
                  <Skeleton className="h-10 w-full" />
                </div>
                 <div className="grid gap-3">
                  <Label>Sistema Asociado</Label>
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
               <div className="grid md:grid-cols-2 gap-4">
                 <div className="grid gap-3">
                   <Label>Ubicación</Label>
                   <Skeleton className="h-10 w-full" />
                 </div>
                 <div className="grid gap-3">
                   <Label>Estado</Label>
                   <Skeleton className="h-10 w-full" />
                 </div>
               </div>
               <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label>Fecha de Inicio de Mantenimiento</Label>
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="grid gap-3">
                    <Label>Siguiente Mantenimiento</Label>
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
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
         <h1 className="text-2xl font-bold">Equipo no encontrado</h1>
         <p className="text-muted-foreground">No se pudo encontrar el equipo que buscas.</p>
         <Link href="/dashboard/equipments">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Equipos
            </Button>
         </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mx-auto grid max-w-3xl auto-rows-max items-start gap-4 lg:gap-8">
        <div className="flex items-center gap-4">
           <Link href="/dashboard/equipments">
             <Button variant="outline" size="icon" className="h-7 w-7">
               <ArrowLeft className="h-4 w-4" />
               <span className="sr-only">Atrás</span>
             </Button>
           </Link>
           <div className="grid gap-0.5">
             <h1 className="font-headline text-2xl font-bold">Editar Equipo</h1>
             <p className="text-muted-foreground">Modifique los datos del equipo.</p>
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
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required className="min-h-32" />
              </div>
              <div className="grid gap-3">
                <Label>Imagen del Equipo</Label>
                {imageUrl ? (
                    <Image src={imageUrl} alt="Vista previa del equipo" width={400} height={300} data-ai-hint="equipment photo" className="rounded-md object-cover aspect-video" />
                ) : (
                    <div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center">
                        <Camera className="h-10 w-10 text-muted-foreground" />
                    </div>
                )}
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
                  <Select value={clientId} onValueChange={setClientId} required>
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
                  <Label htmlFor="system">Sistema Asociado</Label>
                  <Select value={systemId} onValueChange={setSystemId} required>
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
              </div>
               <div className="grid md:grid-cols-2 gap-4">
                 <div className="grid gap-3">
                   <Label htmlFor="location">Ubicación</Label>
                   <Input id="location" value={location} onChange={e => setLocation(e.target.value)} required />
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
            <Button type="submit">Guardar Cambios</Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}
