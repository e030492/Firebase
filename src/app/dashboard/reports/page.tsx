
"use client";

import { useState, useEffect, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Printer, ChevronDown, Camera } from 'lucide-react';
import { mockCedulas, mockClients, mockEquipments, mockSystems } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const CEDULAS_STORAGE_KEY = 'escuadra_cedulas';
const CLIENTS_STORAGE_KEY = 'escuadra_clients';
const EQUIPMENTS_STORAGE_KEY = 'escuadra_equipments';
const SYSTEMS_STORAGE_KEY = 'escuadra_systems';
const REPORT_DATA_KEY = 'escuadra_report_data';

type Cedula = typeof mockCedulas[0];
type Client = typeof mockClients[0];
type Equipment = typeof mockEquipments[0];
type System = typeof mockSystems[0];
type EnrichedCedula = Cedula & { equipmentDetails?: Equipment; clientDetails?: Client; systemDetails?: System };


export default function ReportsPage() {
  const router = useRouter();

  const [cedulas, setCedulas] = useState<Cedula[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [allEquipments, setAllEquipments] = useState<Equipment[]>([]);
  const [systems, setSystems] = useState<System[]>([]);

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [clientWarehouses, setClientWarehouses] = useState<string[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [selectedCedulaIds, setSelectedCedulaIds] = useState<string[]>([]);
  const [expandedCedulaId, setExpandedCedulaId] = useState<string | null>(null);

  useEffect(() => {
    // Load data from localStorage
    setCedulas(JSON.parse(localStorage.getItem(CEDULAS_STORAGE_KEY) || JSON.stringify(mockCedulas)));
    const allClientsData = JSON.parse(localStorage.getItem(CLIENTS_STORAGE_KEY) || JSON.stringify(mockClients));
    setClients(allClientsData);
    setAllEquipments(JSON.parse(localStorage.getItem(EQUIPMENTS_STORAGE_KEY) || JSON.stringify(mockEquipments)));
    setSystems(JSON.parse(localStorage.getItem(SYSTEMS_STORAGE_KEY) || JSON.stringify(mockSystems)));
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      setClientWarehouses(client?.almacenes.map(a => a.nombre) || []);
      setSelectedWarehouse('');
    } else {
      setClientWarehouses([]);
      setSelectedWarehouse('');
    }
  }, [selectedClientId, clients]);

  const filteredCedulas = useMemo(() => {
    let filtered = cedulas.map(cedula => {
      const equipment = allEquipments.find(eq => eq.name === cedula.equipment && eq.client === cedula.client);
      const systemName = equipment?.system || '';
      const systemInfo = systems.find(s => s.name === systemName);
      return { 
        ...cedula, 
        system: systemName, 
        warehouse: equipment?.location || '',
        systemColor: systemInfo?.color,
       };
    });

    if (selectedClientId) {
      const clientName = clients.find(c => c.id === selectedClientId)?.name;
      if (clientName) {
        filtered = filtered.filter(c => c.client === clientName);
      }
    }
    if (selectedWarehouse) {
      filtered = filtered.filter(c => c.warehouse === selectedWarehouse);
    }
    if (selectedSystemId) {
      const systemName = systems.find(s => s.id === selectedSystemId)?.name;
      if (systemName) {
        filtered = filtered.filter(c => c.system === systemName);
      }
    }
    return filtered.sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
  }, [cedulas, allEquipments, clients, systems, selectedClientId, selectedWarehouse, selectedSystemId]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedCedulaIds(filteredCedulas.map(c => c.id));
    } else {
      setSelectedCedulaIds([]);
    }
  };
  
  const handleSelectCedula = (cedulaId: string, checked: boolean) => {
    if (checked) {
      setSelectedCedulaIds(prev => [...prev, cedulaId]);
    } else {
      setSelectedCedulaIds(prev => prev.filter(id => id !== cedulaId));
    }
  };
  
  const handleGenerateReport = () => {
    const reportData = selectedCedulaIds.map(id => {
      const cedula = cedulas.find(c => c.id === id);
      if (!cedula) return null;
      
      const equipment = allEquipments.find(e => e.name === cedula.equipment && e.client === cedula.client);
      const client = clients.find(c => c.name === cedula.client);
      const system = equipment ? systems.find(s => s.name === equipment.system) : undefined;
      
      return {
        ...cedula,
        equipmentDetails: equipment,
        clientDetails: client,
        systemDetails: system,
      };
    }).filter(Boolean);

    try {
        sessionStorage.setItem(REPORT_DATA_KEY, JSON.stringify(reportData));
        const url = `/dashboard/reports/print`;
        window.open(url, '_blank');
    } catch (error) {
        console.error("Error saving to sessionStorage:", error);
        alert("No se pudo generar el reporte. El almacenamiento de la sesión podría estar lleno o deshabilitado.");
    }
  };


  const isAllSelected = filteredCedulas.length > 0 && selectedCedulaIds.length === filteredCedulas.length;
  const isSomeSelected = selectedCedulaIds.length > 0 && selectedCedulaIds.length < filteredCedulas.length;
  const selectionState = isAllSelected ? true : (isSomeSelected ? 'indeterminate' : false);

  const handleToggleDetails = (cedulaId: string) => {
    setExpandedCedulaId(prevId => (prevId === cedulaId ? null : cedulaId));
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
        <h1 className="font-headline text-3xl font-bold">Generador de Reportes</h1>
        <p className="text-muted-foreground">
          Filtre y seleccione las cédulas para generar un reporte imprimible.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Use los filtros para encontrar las cédulas que necesita.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="client">Cliente</Label>
              <Select onValueChange={value => setSelectedClientId(value === 'all' ? '' : value)} value={selectedClientId || 'all'}>
                <SelectTrigger id="client"><SelectValue placeholder="Todos los clientes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {clients.map(client => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="warehouse">Almacén</Label>
              <Select onValueChange={value => setSelectedWarehouse(value === 'all' ? '' : value)} value={selectedWarehouse || 'all'} disabled={!selectedClientId}>
                <SelectTrigger id="warehouse"><SelectValue placeholder="Todos los almacenes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los almacenes</SelectItem>
                  {clientWarehouses.map(warehouse => <SelectItem key={warehouse} value={warehouse}>{warehouse}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="system">Sistema</Label>
              <Select onValueChange={value => setSelectedSystemId(value === 'all' ? '' : value)} value={selectedSystemId || 'all'}>
                <SelectTrigger id="system"><SelectValue placeholder="Todos los sistemas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los sistemas</SelectItem>
                  {systems.map(system => <SelectItem key={system.id} value={system.id}>{system.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Cédulas</CardTitle>
          <CardDescription>
            Se encontraron {filteredCedulas.length} cédulas. Seleccione las que desea incluir en el reporte.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox onClick={(e) => e.stopPropagation()} onCheckedChange={handleSelectAll} checked={selectionState} aria-label="Seleccionar todo" />
                            </TableHead>
                            <TableHead>Folio</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Sistema</TableHead>
                            <TableHead>Equipo</TableHead>
                            <TableHead className="hidden md:table-cell">Fecha</TableHead>
                            <TableHead className="w-[50px]"><span className="sr-only">Detalles</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCedulas.length > 0 ? (
                            filteredCedulas.map(cedula => (
                                <Fragment key={cedula.id}>
                                <TableRow
                                  data-state={selectedCedulaIds.includes(cedula.id) ? "selected" : ""}
                                  onClick={() => handleToggleDetails(cedula.id)}
                                  className="cursor-pointer"
                                >
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <Checkbox 
                                            onCheckedChange={checked => handleSelectCedula(cedula.id, !!checked)}
                                            checked={selectedCedulaIds.includes(cedula.id)}
                                            aria-label={`Seleccionar cédula ${cedula.folio}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{cedula.folio}</TableCell>
                                    <TableCell>{cedula.client}</TableCell>
                                    <TableCell>
                                        <span className="font-medium" style={{ color: cedula.systemColor }}>
                                            {cedula.system}
                                        </span>
                                    </TableCell>
                                    <TableCell>{cedula.equipment}</TableCell>
                                    <TableCell className="hidden md:table-cell">{new Date(cedula.creationDate).toLocaleDateString('es-ES')}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleDetails(cedula.id);
                                            }}
                                        >
                                            <ChevronDown className={cn("h-4 w-4 transition-transform", expandedCedulaId === cedula.id && "rotate-180")} />
                                            <span className="sr-only">Ver detalles</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                {expandedCedulaId === cedula.id && (
                                     <TableRow className="bg-muted/30 hover:bg-muted/30">
                                        <TableCell colSpan={7} className="p-0">
                                            <div className="p-4">
                                            <Card className="shadow-inner">
                                                <CardHeader>
                                                    <CardTitle>Detalles de la Cédula: {cedula.folio}</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-6">
                                                    <div className="flex items-center gap-6">
                                                    <div>
                                                        <Label className="text-base">Evaluación Final</Label>
                                                        {cedula.semaforo ? (
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <div className={cn("h-2.5 w-2.5 rounded-full", {
                                                                    'bg-green-500': cedula.semaforo === 'Verde',
                                                                    'bg-orange-500': cedula.semaforo === 'Naranja',
                                                                    'bg-red-500': cedula.semaforo === 'Rojo',
                                                                })} />
                                                                <span className="text-sm text-muted-foreground">{cedula.semaforo}</span>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground mt-1">Sin evaluación.</p>
                                                        )}
                                                    </div>
                                                    </div>
                                                    <Separator />
                                                    <div>
                                                        <Label className="text-base">Descripción del Trabajo</Label>
                                                        <p className="text-sm text-muted-foreground mt-1">{cedula.description || 'Sin descripción.'}</p>
                                                    </div>
                                                    {cedula.protocolSteps && cedula.protocolSteps.length > 0 && (
                                                        <div>
                                                            <Label className="text-base">Protocolo de Mantenimiento Ejecutado</Label>
                                                            <div className="border rounded-md mt-2 divide-y">
                                                                {cedula.protocolSteps.map((step, index) => (
                                                                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 p-4">
                                                                        <div className="md:col-span-2 space-y-3">
                                                                            <div>
                                                                                <Label className="font-semibold">Paso del Protocolo</Label>
                                                                                <p className="text-sm text-muted-foreground">{step.step}</p>
                                                                            </div>
                                                                            <div>
                                                                                <Label className="font-semibold">Notas del Técnico</Label>
                                                                                <p className="text-sm text-muted-foreground">{step.notes || 'Sin notas.'}</p>
                                                                            </div>
                                                                            <div className="flex items-center gap-4">
                                                                                <div>
                                                                                    <Label className="font-semibold">Progreso</Label>
                                                                                    <div>
                                                                                        <Badge variant="secondary">{step.completion}%</Badge>
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <Label className="font-semibold">Prioridad</Label>
                                                                                    <div>
                                                                                        <Badge variant={getPriorityBadgeVariant(step.priority)} className="capitalize">{step.priority}</Badge>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label className="font-semibold">Evidencia Fotográfica</Label>
                                                                            {step.imageUrl ? (
                                                                                <Image src={step.imageUrl} alt={`Evidencia para ${step.step}`} width={400} height={300} data-ai-hint="protocol evidence" className="rounded-md object-cover aspect-video border" />
                                                                            ) : (
                                                                                <div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center border">
                                                                                    <div className="text-center text-muted-foreground">
                                                                                        <Camera className="h-10 w-10 mx-auto" />
                                                                                        <p className="text-sm mt-2">Sin evidencia</p>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                                </Fragment>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">No se encontraron cédulas con los filtros aplicados.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleGenerateReport} disabled={selectedCedulaIds.length === 0}>
             <Printer className="mr-2 h-4 w-4" />
             Generar Reporte ({selectedCedulaIds.length})
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

    