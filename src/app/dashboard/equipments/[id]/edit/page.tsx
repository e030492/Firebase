
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { format, addMonths, addYears } from 'date-fns';
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
import { Equipment, Client, System } from '@/lib/services';
import { useData } from '@/hooks/use-data-provider';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

export default function EditEquipmentPage() {
  const params = useParams();
  const router = useRouter();
  const equipmentId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { clients, systems, equipments, updateEquipment, loading: dataLoading } = useData();

  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [systemId, setSystemId] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  const [maintenanceStartDate, setMaintenanceStartDate] = useState<Date>();
  const [maintenancePeriodicity, setMaintenancePeriodicity] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('');
  const [serial, setSerial] = useState('');

  const [ipAddress, setIpAddress] = useState('');
  const [configUser, setConfigUser] = useState('');
  const [configPassword, setConfigPassword] = useState('');

  const [clientWarehouses, setClientWarehouses] = useState<Client['almacenes']>([]);
  
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // --- Autocomplete States ---
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const [aliasSuggestions, setAliasSuggestions] = useState<string[]>([]);
  const [showAliasSuggestions, setShowAliasSuggestions] = useState(false);
  const aliasInputRef = useRef<HTMLInputElement>(null);

  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const brandInputRef = useRef<HTMLInputElement>(null);

  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const modelInputRef = useRef<HTMLInputElement>(null);

  const [typeSuggestions, setTypeSuggestions] = useState<string[]>([]);
  const [showTypeSuggestions, setShowTypeSuggestions] = useState(false);
  const typeInputRef = useRef<HTMLInputElement>(null);
  
  const [ipAddressSuggestions, setIpAddressSuggestions] = useState<string[]>([]);
  const [showIpAddressSuggestions, setShowIpAddressSuggestions] = useState(false);
  const ipAddressInputRef = useRef<HTMLInputElement>(null);

  const [configUserSuggestions, setConfigUserSuggestions] = useState<string[]>([]);
  const [showConfigUserSuggestions, setShowConfigUserSuggestions] = useState(false);
  const configUserInputRef = useRef<HTMLInputElement>(null);

  const [configPasswordSuggestions, setConfigPasswordSuggestions] = useState<string[]>([]);
  const [showConfigPasswordSuggestions, setShowConfigPasswordSuggestions] = useState(false);
  const configPasswordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dataLoading && equipmentId) {
        const equipmentData = equipments.find(e => e.id === equipmentId);
        
        if (equipmentData) {
            setName(equipmentData.name);
            setAlias(equipmentData.alias || '');
            setDescription(equipmentData.description);
            setBrand(equipmentData.brand || '');
            setModel(equipmentData.model || '');
            setType(equipmentData.type || '');
            setSerial(equipmentData.serial || '');
            setLocation(equipmentData.location);
            setStatus(equipmentData.status);
            setImageUrl(equipmentData.imageUrl || null);
            setIpAddress(equipmentData.ipAddress || '');
            setConfigUser(equipmentData.configUser || '');
            setConfigPassword(equipmentData.configPassword || '');
            
            if (equipmentData.maintenanceStartDate) {
                setMaintenanceStartDate(new Date(equipmentData.maintenanceStartDate + 'T00:00:00'));
            }
            setMaintenancePeriodicity(equipmentData.maintenancePeriodicity || '');
            
            const foundClient = clients.find(c => c.name === equipmentData.client);
            if (foundClient) {
                setClientId(foundClient.id);
                setClientWarehouses(foundClient.almacenes || []);
            }

            const foundSystem = systems.find(s => s.name === equipmentData.system);
            if (foundSystem) {
                setSystemId(foundSystem.id);
            }
            setLoading(false);
        } else {
            setNotFound(true);
            setLoading(false);
        }
    }
  }, [equipmentId, equipments, clients, systems, dataLoading]);
  
  
    // --- Autocomplete Logic ---
  const createAutocompleteLogic = (value: string, setter: (suggestions: string[]) => void, sourceKey: keyof Equipment) => {
    const uniqueValues = Array.from(new Set(equipments.map(eq => eq[sourceKey]).filter(Boolean)));
    if (value) {
      const filtered = uniqueValues.filter(v => v.toLowerCase().includes(value.toLowerCase()));
      setter(filtered as string[]);
    } else {
      setter([]);
    }
  };

  useEffect(() => createAutocompleteLogic(name, setNameSuggestions, 'name'), [name, equipments]);
  useEffect(() => createAutocompleteLogic(alias, setAliasSuggestions, 'alias'), [alias, equipments]);
  useEffect(() => createAutocompleteLogic(brand, setBrandSuggestions, 'brand'), [brand, equipments]);
  useEffect(() => createAutocompleteLogic(model, setModelSuggestions, 'model'), [model, equipments]);
  useEffect(() => createAutocompleteLogic(type, setTypeSuggestions, 'type'), [type, equipments]);
  useEffect(() => createAutocompleteLogic(ipAddress, setIpAddressSuggestions, 'ipAddress'), [ipAddress, equipments]);
  useEffect(() => createAutocompleteLogic(configUser, setConfigUserSuggestions, 'configUser'), [configUser, equipments]);
  useEffect(() => createAutocompleteLogic(configPassword, setConfigPasswordSuggestions, 'configPassword'), [configPassword, equipments]);


  const createClickOutsideHandler = (setter: (show: boolean) => void, ref: React.RefObject<HTMLInputElement>) => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  };
  
  useEffect(() => createClickOutsideHandler(setShowNameSuggestions, nameInputRef), []);
  useEffect(() => createClickOutsideHandler(setShowAliasSuggestions, aliasInputRef), []);
  useEffect(() => createClickOutsideHandler(setShowBrandSuggestions, brandInputRef), []);
  useEffect(() => createClickOutsideHandler(setShowModelSuggestions, modelInputRef), []);
  useEffect(() => createClickOutsideHandler(setShowTypeSuggestions, typeInputRef), []);
  useEffect(() => createClickOutsideHandler(setShowIpAddressSuggestions, ipAddressInputRef), []);
  useEffect(() => createClickOutsideHandler(setShowConfigUserSuggestions, configUserInputRef), []);
  useEffect(() => createClickOutsideHandler(setShowConfigPasswordSuggestions, configPasswordInputRef), []);


  const nextMaintenanceDate = useMemo(() => {
    if (!maintenanceStartDate || !maintenancePeriodicity) return null;

    try {
        let nextDate;
        const startDate = new Date(maintenanceStartDate);
        switch (maintenancePeriodicity) {
            case 'Mensual':
                nextDate = addMonths(startDate, 1);
                break;
            case 'Trimestral':
                nextDate = addMonths(startDate, 3);
                break;
            case 'Semestral':
                nextDate = addMonths(startDate, 6);
                break;
            case 'Anual':
                nextDate = addYears(startDate, 1);
                break;
            default:
                return null;
        }
        return format(nextDate, "PPP", { locale: es });
    } catch (error) {
        console.error("Error calculating next maintenance date:", error);
        return null;
    }
  }, [maintenanceStartDate, maintenancePeriodicity]);

  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    const selectedClient = clients.find(c => c.id === newClientId);
    setClientWarehouses(selectedClient?.almacenes || []);
    setLocation(''); // Reset location when client changes
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !clientId || !systemId || !location || !status || !brand || !model || !type) {
        alert('Por favor, complete todos los campos obligatorios.');
        return;
    }
    setIsSaving(true);
    setUploadProgress(0);

    const clientName = clients.find(c => c.id === clientId)?.name || '';
    const systemName = systems.find(s => s.id === systemId)?.name || '';

    try {
        const updatedData: Partial<Equipment> = {
          name,
          alias,
          description,
          brand,
          model,
          type,
          serial,
          client: clientName,
          system: systemName,
          location,
          status: status as Equipment['status'],
          maintenanceStartDate: maintenanceStartDate ? format(maintenanceStartDate, 'yyyy-MM-dd') : '',
          maintenancePeriodicity: maintenancePeriodicity,
          imageUrl: imageUrl,
          ipAddress,
          configUser,
          configPassword,
        };
        
        await updateEquipment(equipmentId, updatedData, setUploadProgress);
        alert('Equipo actualizado con éxito.');
        router.push('/dashboard/equipments');
    } catch (error) {
        console.error("Failed to update equipment:", error);
        alert("Error al actualizar el equipo.");
    } finally {
        setIsSaving(false);
        setUploadProgress(null);
    }
  }

  if (loading || dataLoading) {
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
                  <Label>Marca</Label>
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid gap-3">
                  <Label>Modelo</Label>
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label>Tipo</Label>
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid gap-3">
                  <Label>Número de Serie</Label>
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label>Cliente</Label>
                  <Skeleton className="h-10 w-full" />
                </div>
                 <div className="grid gap-3">
                  <Label>Almacén / Ubicación</Label>
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
               <div className="grid md:grid-cols-2 gap-4">
                 <div className="grid gap-3">
                    <Label>Sistema Asociado</Label>
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
                    <Label>Mantenimiento Recomendado</Label>
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
           <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()} disabled={isSaving}>
             <ArrowLeft className="h-4 w-4" />
             <span className="sr-only">Atrás</span>
           </Button>
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
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                    <Label htmlFor="client">Cliente</Label>
                    <Select value={clientId} onValueChange={handleClientChange} required disabled={isSaving}>
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
                    <Select value={location} onValueChange={setLocation} required disabled={!clientId || isSaving}>
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
                   <Select value={systemId} onValueChange={setSystemId} required disabled={isSaving}>
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
                   <Select value={status} onValueChange={setStatus} required disabled={isSaving}>
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
              <Separator/>
              <div className="relative" ref={nameInputRef}>
                <Label htmlFor="name">Nombre del Equipo</Label>
                <Input 
                  id="name"
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  onFocus={() => setShowNameSuggestions(true)}
                  required 
                  disabled={isSaving}
                  autoComplete="off"
                />
                {showNameSuggestions && nameSuggestions.length > 0 && (
                  <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto">
                    <CardContent className="p-2">
                      {nameSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-2 hover:bg-muted rounded-md cursor-pointer"
                          onClick={() => {
                            setName(suggestion);
                            setShowNameSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
               <div className="grid md:grid-cols-2 gap-4">
                 <div className="relative" ref={brandInputRef}>
                    <Label htmlFor="brand">Marca</Label>
                    <Input id="brand" value={brand} onChange={e => setBrand(e.target.value)} required disabled={isSaving} onFocus={() => setShowBrandSuggestions(true)} autoComplete="off" />
                     {showBrandSuggestions && brandSuggestions.length > 0 && (
                        <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto"><CardContent className="p-2">
                            {brandSuggestions.map((suggestion, index) => (
                            <div key={index} className="p-2 hover:bg-muted rounded-md cursor-pointer" onClick={() => { setBrand(suggestion); setShowBrandSuggestions(false); }}>{suggestion}</div>
                            ))}
                        </CardContent></Card>
                    )}
                 </div>
                 <div className="relative" ref={modelInputRef}>
                    <Label htmlFor="model">Modelo</Label>
                    <Input id="model" value={model} onChange={e => setModel(e.target.value)} required disabled={isSaving} onFocus={() => setShowModelSuggestions(true)} autoComplete="off" />
                    {showModelSuggestions && modelSuggestions.length > 0 && (
                        <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto"><CardContent className="p-2">
                            {modelSuggestions.map((suggestion, index) => (
                            <div key={index} className="p-2 hover:bg-muted rounded-md cursor-pointer" onClick={() => { setModel(suggestion); setShowModelSuggestions(false); }}>{suggestion}</div>
                            ))}
                        </CardContent></Card>
                    )}
                 </div>
               </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative" ref={typeInputRef}>
                    <Label htmlFor="type">Tipo</Label>
                    <Input id="type" value={type} onChange={e => setType(e.target.value)} required disabled={isSaving} onFocus={() => setShowTypeSuggestions(true)} autoComplete="off" />
                    {showTypeSuggestions && typeSuggestions.length > 0 && (
                        <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto"><CardContent className="p-2">
                            {typeSuggestions.map((suggestion, index) => (
                            <div key={index} className="p-2 hover:bg-muted rounded-md cursor-pointer" onClick={() => { setType(suggestion); setShowTypeSuggestions(false); }}>{suggestion}</div>
                            ))}
                        </CardContent></Card>
                    )}
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="serial">Número de Serie (Opcional)</Label>
                  <Input id="serial" value={serial} onChange={e => setSerial(e.target.value)} placeholder="Ej. SN-12345-ABC" disabled={isSaving}/>
                </div>
              </div>
              <div className="relative" ref={aliasInputRef}>
                <Label htmlFor="alias">Alias del equipo o Ubicacion en el Plano (Opcional)</Label>
                <Input id="alias" value={alias} onChange={e => setAlias(e.target.value)} disabled={isSaving} onFocus={() => setShowAliasSuggestions(true)} autoComplete="off" />
                {showAliasSuggestions && aliasSuggestions.length > 0 && (
                    <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto"><CardContent className="p-2">
                        {aliasSuggestions.map((suggestion, index) => (
                        <div key={index} className="p-2 hover:bg-muted rounded-md cursor-pointer" onClick={() => { setAlias(suggestion); setShowAliasSuggestions(false); }}>{suggestion}</div>
                        ))}
                    </CardContent></Card>
                )}
              </div>
              <div className="grid gap-3">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required className="min-h-32" disabled={isSaving}/>
              </div>
              
              <Separator />
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium">Configuración de Red</h3>
                        <p className="text-sm text-muted-foreground">
                            Información para el acceso y configuración remota del equipo.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="relative" ref={ipAddressInputRef}>
                            <Label htmlFor="ipAddress">Dirección IP de Configuración</Label>
                            <Input id="ipAddress" value={ipAddress} onChange={e => setIpAddress(e.target.value)} disabled={isSaving} onFocus={() => setShowIpAddressSuggestions(true)} autoComplete="off" />
                             {showIpAddressSuggestions && ipAddressSuggestions.length > 0 && (
                                <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto"><CardContent className="p-2">
                                    {ipAddressSuggestions.map((suggestion, index) => (
                                    <div key={index} className="p-2 hover:bg-muted rounded-md cursor-pointer" onClick={() => { setIpAddress(suggestion); setShowIpAddressSuggestions(false); }}>{suggestion}</div>
                                    ))}
                                </CardContent></Card>
                            )}
                        </div>
                        <div className="relative" ref={configUserInputRef}>
                            <Label htmlFor="configUser">Usuario de Configuración</Label>
                            <Input id="configUser" value={configUser} onChange={e => setConfigUser(e.target.value)} disabled={isSaving} onFocus={() => setShowConfigUserSuggestions(true)} autoComplete="off" />
                             {showConfigUserSuggestions && configUserSuggestions.length > 0 && (
                                <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto"><CardContent className="p-2">
                                    {configUserSuggestions.map((suggestion, index) => (
                                    <div key={index} className="p-2 hover:bg-muted rounded-md cursor-pointer" onClick={() => { setConfigUser(suggestion); setShowConfigUserSuggestions(false); }}>{suggestion}</div>
                                    ))}
                                </CardContent></Card>
                            )}
                        </div>
                        <div className="relative" ref={configPasswordInputRef}>
                            <Label htmlFor="configPassword">Contraseña</Label>
                            <Input id="configPassword" value={configPassword} onChange={e => setConfigPassword(e.target.value)} disabled={isSaving} onFocus={() => setShowConfigPasswordSuggestions(true)} autoComplete="off" />
                            {showConfigPasswordSuggestions && configPasswordSuggestions.length > 0 && (
                                <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto"><CardContent className="p-2">
                                    {configPasswordSuggestions.map((suggestion, index) => (
                                    <div key={index} className="p-2 hover:bg-muted rounded-md cursor-pointer" onClick={() => { setConfigPassword(suggestion); setShowConfigPasswordSuggestions(false); }}>{suggestion}</div>
                                    ))}
                                </CardContent></Card>
                            )}
                        </div>
                    </div>
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
                    disabled={isSaving}
                />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
                    <Camera className="mr-2 h-4 w-4" />
                    {imageUrl ? 'Cambiar Imagen' : 'Tomar o Subir Foto'}
                </Button>
                {uploadProgress !== null && <Progress value={uploadProgress} className="w-full mt-2" />}
              </div>
               <Separator />
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
                                  disabled={isSaving}
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
                      <Label htmlFor="maintenancePeriodicity">Periodicidad de Mantenimiento</Label>
                      <Select value={maintenancePeriodicity} onValueChange={setMaintenancePeriodicity} disabled={isSaving}>
                          <SelectTrigger id="maintenancePeriodicity">
                              <SelectValue placeholder="Seleccione una periodicidad" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Mensual">Mensual</SelectItem>
                              <SelectItem value="Trimestral">Trimestral</SelectItem>
                              <SelectItem value="Semestral">Semestral</SelectItem>
                              <SelectItem value="Anual">Anual</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                </div>
                {nextMaintenanceDate && (
                    <div className="grid gap-3">
                        <Label>Próximo Mantenimiento Recomendado</Label>
                        <Input value={nextMaintenanceDate} readOnly disabled />
                    </div>
                )}
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}
