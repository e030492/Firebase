
"use client";

import { useState, useEffect, useMemo, Fragment } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Printer, ChevronDown, Camera, ArrowLeft, ShieldCheck, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Cedula, Client, Equipment, System } from '@/lib/services';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/hooks/use-data-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addMonths, addYears, differenceInDays, parseISO } from 'date-fns';


type EnrichedCedula = Cedula & { 
  equipmentDetails?: Equipment; 
  clientDetails?: Client; 
  systemDetails?: System;
  system: string;
  warehouse?: string;
  systemColor?: string;
  serial: string;
};
type SortableCedulaKey = 'folio' | 'client' | 'warehouse' | 'system' | 'equipment' | 'creationDate';
type SortableEquipmentKey = 'name' | 'client' | 'system' | 'location' | 'nextMaintenanceDate';


function ReportView({ data, onBack, logoUrl }: { data: EnrichedCedula[], onBack: () => void, logoUrl: string | null }) {

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
    
    const mainSemaforoInfo = data.length > 0 ? getSemaforoInfo(data[0].semaforo) : null;
    const firstCedula = data[0];
    const systemColor = firstCedula.systemDetails?.color || '#6b7280';

    return (
        <div className="report-container">
            <header className="flex items-center justify-between mb-8 print:hidden">
                <div className="flex items-center gap-2">
                    <Image src={logoUrl || "https://placehold.co/24x24.png"} alt="Escuadra Technology Logo" width={24} height={24} data-ai-hint="logo"/>
                    <h1 className="text-xl font-bold">Vista Previa del Reporte</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4"/>
                        Imprimir / Guardar PDF
                    </Button>
                    <Button variant="outline" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Volver a la selección
                    </Button>
                </div>
            </header>
            
            <div className="report-header print:block hidden">
                <div style={{ backgroundColor: systemColor }} className="text-white p-4 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Image src={logoUrl || "https://placehold.co/80x80.png"} alt="Escuadra Technology Logo" width={80} height={80} data-ai-hint="logo" />
                    </div>
                </div>
            </div>

            {mainSemaforoInfo && (
                <div className={cn("report-footer-block print:block hidden", mainSemaforoInfo.color)}>
                    {mainSemaforoInfo.text}
                </div>
            )}
            <div className="page-number print:block hidden"></div>

            <main className="bg-white p-6 sm:p-8 shadow-lg print:shadow-none print:p-0">
                {data.map((cedula, cedulaIndex) => {
                    return (
                        <div key={cedula.id} className={cn("break-after-page", { 'no-break-after': cedulaIndex === data.length - 1 })}>
                             <header className="border-b-2 border-gray-900 overflow-hidden print:hidden">
                                <div style={{ backgroundColor: systemColor }} className="text-white p-4 flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <Image src={logoUrl || "https://placehold.co/80x80.png"} alt="Escuadra Technology Logo" width={80} height={80} data-ai-hint="logo" />
                                    </div>
                                </div>
                                <div className="bg-white p-4 flex items-start justify-between">
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-500 text-xs uppercase">Cliente</p>
                                        <p className="font-bold text-lg">{cedula.client}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-500 text-xs uppercase">Folio</p>
                                        <p className="font-bold text-lg text-gray-700">{cedula.folio}</p>
                                        <p className="text-sm text-gray-500">{new Date(cedula.creationDate).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</p>
                                    </div>
                                </div>
                            </header>
                            
                            <section className="mt-6">
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <tbody>
                                            <tr className="bg-gray-50"><td className="px-4 py-2 font-semibold text-gray-600 w-1/4">Dirección</td><td className="px-4 py-2 text-gray-800">{cedula.equipmentDetails?.location || 'No especificada'}</td></tr>
                                            <tr><td className="px-4 py-2 font-semibold text-gray-600">Equipo</td><td className="px-4 py-2 text-gray-800">{`${cedula.equipment} (Modelo: ${cedula.equipmentDetails?.model || 'N/A'}, N/S: ${cedula.serial})`}</td></tr>
                                            <tr className="bg-gray-50"><td className="px-4 py-2 font-semibold text-gray-600">Técnico</td><td className="px-4 py-2 text-gray-800">{cedula.technician}</td></tr>
                                            <tr><td className="px-4 py-2 font-semibold text-gray-600">Supervisor</td><td className="px-4 py-2 text-gray-800">{cedula.supervisor}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-4 border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-sm text-gray-600">Descripción del Trabajo</h4>
                                    <p className="text-sm text-gray-800 mt-1">{cedula.description}</p>
                                </div>
                            </section>

                            {cedula.protocolSteps && cedula.protocolSteps.length > 0 && (
                                <section className="mt-6 break-inside-avoid">
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Protocolo de Mantenimiento</h3>
                                    <div className="border rounded-md">
                                        {cedula.protocolSteps.map((step, index) => (
                                            <div key={index} className="p-4 break-inside-avoid border-b last:border-b-0">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                                    <div className="md:col-span-2">
                                                        <table className="w-full text-sm">
                                                            <tbody>
                                                                <tr>
                                                                    <td className="pr-4 py-1 font-semibold align-top w-1/5">Paso</td>
                                                                    <td className="py-1">{step.step}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="pr-4 py-1 font-semibold align-top">Notas</td>
                                                                    <td className="py-1 text-muted-foreground">{step.notes || 'Sin notas.'}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="pr-4 py-1 font-semibold">Estado</td>
                                                                    <td className="py-1">
                                                                        <div className="flex items-center gap-4">
                                                                            <Badge variant="secondary">Progreso: {step.completion}%</Badge>
                                                                            <Badge variant={getPriorityBadgeVariant(step.priority)} className="capitalize">Prioridad: {step.priority}</Badge>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    {step.imageUrl && (
                                                         <div className="md:col-span-1">
                                                            <p className="font-semibold text-sm mb-2">Evidencia</p>
                                                            <Image src={step.imageUrl} alt={`Evidencia para ${step.step}`} width={200} height={150} data-ai-hint="protocol evidence" className="rounded-md object-cover border w-full max-w-[33%] h-auto"/>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                            
                            {cedulaIndex < data.length - 1 && <div className="print:hidden my-8"><Separator /></div>}
                        </div>
                    );
                })}
            </main>
        </div>
    );
}

function CedulasReportGenerator() {
  const { cedulas, clients, equipments: allEquipments, systems, loading, companySettings } = useData();
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [clientWarehouses, setClientWarehouses] = useState<string[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [selectedCedulaIds, setSelectedCedulaIds] = useState<string[]>([]);
  const [expandedCedulaId, setExpandedCedulaId] = useState<string | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: SortableCedulaKey; direction: 'ascending' | 'descending' } | null>({ key: 'creationDate', direction: 'descending' });

  const [reportData, setReportData] = useState<EnrichedCedula[] | null>(null);

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

  const filteredAndSortedCedulas = useMemo((): EnrichedCedula[] => {
    let filtered: EnrichedCedula[] = cedulas.map(cedula => {
      const equipment = allEquipments.find(eq => eq.name === cedula.equipment && eq.client === cedula.client);
      const systemName = equipment?.system || '';
      const systemInfo = systems.find(s => s.name === systemName);
      return { 
        ...cedula, 
        system: systemName, 
        warehouse: equipment?.location || '',
        systemColor: systemInfo?.color,
        serial: equipment?.serial || 'N/A',
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

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const key = sortConfig.key as keyof typeof a;
        if (a[key] < b[key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[key] > b[key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return filtered;
  }, [cedulas, allEquipments, clients, systems, selectedClientId, selectedWarehouse, selectedSystemId, sortConfig]);

  const requestSort = (key: SortableCedulaKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: SortableCedulaKey) => {
    if (sortConfig?.key !== key) {
        return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    if (sortConfig.direction === 'ascending') {
        return <ArrowUp className="ml-2 h-4 w-4 text-foreground" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4 text-foreground" />;
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedCedulaIds(filteredAndSortedCedulas.map(c => c.id));
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
    const dataForReport = selectedCedulaIds.map(id => {
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
        serial: equipment?.serial || 'N/A',
      } as EnrichedCedula;
    }).filter((item): item is EnrichedCedula => item !== null);

    if (dataForReport.length > 0) {
        setReportData(dataForReport);
    } else {
        alert("Por favor, seleccione al menos una cédula para generar el reporte.");
    }
  };

  const isAllSelected = filteredAndSortedCedulas.length > 0 && selectedCedulaIds.length === filteredAndSortedCedulas.length;
  const isSomeSelected = selectedCedulaIds.length > 0 && selectedCedulaIds.length < filteredAndSortedCedulas.length;
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
  
  if (loading) {
      return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-32" /><Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
      );
  }

  if (reportData) {
    return <ReportView data={reportData} onBack={() => setReportData(null)} logoUrl={companySettings?.logoUrl || null} />;
  }

  return (
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Cédulas</CardTitle>
          <CardDescription>
            Use los filtros para encontrar las cédulas que necesita incluir en el reporte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <div className="grid gap-2">
              <Label htmlFor="client-cedula">Cliente</Label>
              <Select onValueChange={value => setSelectedClientId(value === 'all' ? '' : value)} value={selectedClientId || 'all'}>
                <SelectTrigger id="client-cedula"><SelectValue placeholder="Todos los clientes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {clients.map(client => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="warehouse-cedula">Almacén</Label>
              <Select onValueChange={value => setSelectedWarehouse(value === 'all' ? '' : value)} value={selectedWarehouse || 'all'} disabled={!selectedClientId}>
                <SelectTrigger id="warehouse-cedula"><SelectValue placeholder="Todos los almacenes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los almacenes</SelectItem>
                  {clientWarehouses.map(warehouse => <SelectItem key={warehouse} value={warehouse}>{warehouse}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="system-cedula">Sistema</Label>
              <Select onValueChange={value => setSelectedSystemId(value === 'all' ? '' : value)} value={selectedSystemId || 'all'}>
                <SelectTrigger id="system-cedula"><SelectValue placeholder="Todos los sistemas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los sistemas</SelectItem>
                  {systems.map(system => <SelectItem key={system.id} value={system.id}>{system.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
            <div className="border rounded-md mt-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox onClick={(e) => e.stopPropagation()} onCheckedChange={handleSelectAll} checked={selectionState} aria-label="Seleccionar todo" />
                            </TableHead>
                            <TableHead><Button variant="ghost" onClick={() => requestSort('folio')}>Folio{getSortIcon('folio')}</Button></TableHead>
                            <TableHead><Button variant="ghost" onClick={() => requestSort('client')}>Cliente{getSortIcon('client')}</Button></TableHead>
                            <TableHead><Button variant="ghost" onClick={() => requestSort('warehouse' as SortableCedulaKey)}>Almacén{getSortIcon('warehouse' as SortableCedulaKey)}</Button></TableHead>
                            <TableHead><Button variant="ghost" onClick={() => requestSort('system')}>Sistema{getSortIcon('system')}</Button></TableHead>
                            <TableHead><Button variant="ghost" onClick={() => requestSort('equipment')}>Equipo{getSortIcon('equipment')}</Button></TableHead>
                            <TableHead className="hidden md:table-cell"><Button variant="ghost" onClick={() => requestSort('creationDate')}>Fecha{getSortIcon('creationDate')}</Button></TableHead>
                            <TableHead className="w-[50px]"><span className="sr-only">Detalles</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedCedulas.length > 0 ? (
                            filteredAndSortedCedulas.map(cedula => (
                                <Fragment key={cedula.id}>
                                <TableRow data-state={selectedCedulaIds.includes(cedula.id) ? "selected" : ""} className="cursor-pointer">
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <Checkbox onCheckedChange={checked => handleSelectCedula(cedula.id, !!checked)} checked={selectedCedulaIds.includes(cedula.id)} aria-label={`Seleccionar cédula ${cedula.folio}`} />
                                    </TableCell>
                                    <TableCell className="font-medium" onClick={() => handleToggleDetails(cedula.id)}>{cedula.folio}</TableCell>
                                    <TableCell onClick={() => handleToggleDetails(cedula.id)}>{cedula.client}</TableCell>
                                    <TableCell onClick={() => handleToggleDetails(cedula.id)}>{cedula.warehouse}</TableCell>
                                    <TableCell onClick={() => handleToggleDetails(cedula.id)}><span className="font-medium" style={{ color: cedula.systemColor }}>{cedula.system}</span></TableCell>
                                    <TableCell onClick={() => handleToggleDetails(cedula.id)}>{cedula.equipment}<span className="block text-xs text-muted-foreground">(N/S: {cedula.serial})</span></TableCell>
                                    <TableCell className="hidden md:table-cell" onClick={() => handleToggleDetails(cedula.id)}>{new Date(cedula.creationDate).toLocaleDateString('es-ES')}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleToggleDetails(cedula.id); }}>
                                            <ChevronDown className={cn("h-4 w-4 transition-transform", expandedCedulaId === cedula.id && "rotate-180")} />
                                            <span className="sr-only">Ver detalles</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                {expandedCedulaId === cedula.id && (
                                     <TableRow className="bg-muted/30 hover:bg-muted/30">
                                        <TableCell colSpan={8} className="p-0">
                                            <div className="p-4">
                                            <Card className="shadow-inner">
                                                <CardHeader><CardTitle>Detalles de la Cédula: {cedula.folio}</CardTitle></CardHeader>
                                                <CardContent className="space-y-6">
                                                    <div className="flex items-center gap-6">
                                                    <div>
                                                        <Label className="text-base">Evaluación Final</Label>
                                                        {cedula.semaforo ? (
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <div className={cn("h-2.5 w-2.5 rounded-full", {'bg-green-500': cedula.semaforo === 'Verde', 'bg-orange-500': cedula.semaforo === 'Naranja', 'bg-red-500': cedula.semaforo === 'Rojo'})} />
                                                                <span className="text-sm text-muted-foreground">{cedula.semaforo}</span>
                                                            </div>
                                                        ) : (<p className="text-sm text-muted-foreground mt-1">Sin evaluación.</p>)}
                                                    </div>
                                                    </div>
                                                    <Separator />
                                                    <div><Label className="text-base">Descripción del Trabajo</Label><p className="text-sm text-muted-foreground mt-1">{cedula.description || 'Sin descripción.'}</p></div>
                                                    {cedula.protocolSteps && cedula.protocolSteps.length > 0 && (
                                                        <div>
                                                            <Label className="text-base">Protocolo de Mantenimiento Ejecutado</Label>
                                                            <div className="border rounded-md mt-2 divide-y">
                                                                {cedula.protocolSteps.map((step, index) => (
                                                                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 p-4">
                                                                        <div className="md:col-span-2 space-y-3">
                                                                            <div><Label className="font-semibold">Paso del Protocolo</Label><p className="text-sm text-muted-foreground">{step.step}</p></div>
                                                                            <div><Label className="font-semibold">Notas del Técnico</Label><p className="text-sm text-muted-foreground">{step.notes || 'Sin notas.'}</p></div>
                                                                            <div className="flex items-center gap-4">
                                                                                <div><Label className="font-semibold">Progreso</Label><div><Badge variant="secondary">{step.completion}%</Badge></div></div>
                                                                                <div><Label className="font-semibold">Prioridad</Label><div><Badge variant={getPriorityBadgeVariant(step.priority)} className="capitalize">{step.priority}</Badge></div></div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label className="font-semibold">Evidencia Fotográfica</Label>
                                                                            {step.imageUrl ? (<Image src={step.imageUrl} alt={`Evidencia para ${step.step}`} width={400} height={300} data-ai-hint="protocol evidence" className="rounded-md object-cover aspect-video border w-full" />) : (<div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center border"><div className="text-center text-muted-foreground"><Camera className="h-10 w-10 mx-auto" /><p className="text-sm mt-2">Sin evidencia</p></div></div>)}
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
                            <TableRow><TableCell colSpan={8} className="h-24 text-center">No se encontraron cédulas con los filtros aplicados.</TableCell></TableRow>
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
  );
}


function UpcomingMaintenanceReport() {
    const { equipments, clients, systems, loading } = useData();
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
    const [clientWarehouses, setClientWarehouses] = useState<string[]>([]);
    const [selectedSystemId, setSelectedSystemId] = useState<string>('');
    const [sortConfig, setSortConfig] = useState<{ key: SortableEquipmentKey; direction: 'ascending' | 'descending' } | null>({ key: 'nextMaintenanceDate', direction: 'ascending' });

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
    
    const getNextMaintenanceDate = (equipment: Equipment): Date | null => {
        if (!equipment.maintenanceStartDate || !equipment.maintenancePeriodicity) return null;
        try {
            const startDate = parseISO(`${equipment.maintenanceStartDate}T00:00:00`);
            switch (equipment.maintenancePeriodicity) {
                case 'Mensual': return addMonths(startDate, 1);
                case 'Trimestral': return addMonths(startDate, 3);
                case 'Semestral': return addMonths(startDate, 6);
                case 'Anual': return addYears(startDate, 1);
                default: return null;
            }
        } catch {
            return null;
        }
    };
    
    const filteredAndSortedEquipments = useMemo(() => {
        let filtered = equipments.map(eq => ({ ...eq, nextMaintenanceDate: getNextMaintenanceDate(eq) })).filter(eq => eq.nextMaintenanceDate);

        if (selectedClientId) {
            const clientName = clients.find(c => c.id === selectedClientId)?.name;
            if (clientName) filtered = filtered.filter(eq => eq.client === clientName);
        }
        if (selectedWarehouse) {
            filtered = filtered.filter(eq => eq.location === selectedWarehouse);
        }
        if (selectedSystemId) {
            const systemName = systems.find(s => s.id === selectedSystemId)?.name;
            if (systemName) filtered = filtered.filter(eq => eq.system === systemName);
        }
        
        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                const valA = sortConfig.key === 'nextMaintenanceDate' ? a.nextMaintenanceDate?.getTime() || 0 : a[sortConfig.key];
                const valB = sortConfig.key === 'nextMaintenanceDate' ? b.nextMaintenanceDate?.getTime() || 0 : b[sortConfig.key];
        
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        return filtered;

    }, [equipments, clients, systems, selectedClientId, selectedWarehouse, selectedSystemId, sortConfig]);

    const requestSort = (key: SortableEquipmentKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortableEquipmentKey) => {
        if (sortConfig?.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4" />;
        if (sortConfig.direction === 'ascending') return <ArrowUp className="ml-2 h-4 w-4 text-foreground" />;
        return <ArrowDown className="ml-2 h-4 w-4 text-foreground" />;
    };
    
    const getUrgencyIndicator = (date: Date | null) => {
        if (!date) return { color: 'bg-gray-400', label: 'Sin fecha' };
        const daysUntil = differenceInDays(date, new Date());
        if (daysUntil <= 30) return { color: 'bg-red-500', label: 'Urgente' };
        if (daysUntil <= 90) return { color: 'bg-orange-500', label: 'Próximo' };
        return { color: 'bg-green-500', label: 'A tiempo' };
    };

    if (loading) {
      return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-32" /><Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
      );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Equipos por Mantenimiento Próximo</CardTitle>
                <CardDescription>
                    Filtre para ver los equipos que requieren atención y planifique los mantenimientos.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                    <div className="grid gap-2">
                    <Label htmlFor="client-maint">Cliente</Label>
                    <Select onValueChange={value => setSelectedClientId(value === 'all' ? '' : value)} value={selectedClientId || 'all'}>
                        <SelectTrigger id="client-maint"><SelectValue placeholder="Todos los clientes" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">Todos los clientes</SelectItem>
                        {clients.map(client => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    </div>
                    <div className="grid gap-2">
                    <Label htmlFor="warehouse-maint">Almacén</Label>
                    <Select onValueChange={value => setSelectedWarehouse(value === 'all' ? '' : value)} value={selectedWarehouse || 'all'} disabled={!selectedClientId}>
                        <SelectTrigger id="warehouse-maint"><SelectValue placeholder="Todos los almacenes" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">Todos los almacenes</SelectItem>
                        {clientWarehouses.map(warehouse => <SelectItem key={warehouse} value={warehouse}>{warehouse}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    </div>
                    <div className="grid gap-2">
                    <Label htmlFor="system-maint">Sistema</Label>
                    <Select onValueChange={value => setSelectedSystemId(value === 'all' ? '' : value)} value={selectedSystemId || 'all'}>
                        <SelectTrigger id="system-maint"><SelectValue placeholder="Todos los sistemas" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">Todos los sistemas</SelectItem>
                        {systems.map(system => <SelectItem key={system.id} value={system.id}>{system.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    </div>
                </div>
                <Separator />
                <div className="border rounded-md mt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-24">Estado</TableHead>
                                <TableHead><Button variant="ghost" onClick={() => requestSort('name')}>Equipo{getSortIcon('name')}</Button></TableHead>
                                <TableHead><Button variant="ghost" onClick={() => requestSort('client')}>Cliente{getSortIcon('client')}</Button></TableHead>
                                <TableHead><Button variant="ghost" onClick={() => requestSort('location')}>Almacén{getSortIcon('location')}</Button></TableHead>
                                <TableHead><Button variant="ghost" onClick={() => requestSort('nextMaintenanceDate')}>Próximo Mantenimiento{getSortIcon('nextMaintenanceDate')}</Button></TableHead>
                                <TableHead>Periodicidad</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedEquipments.length > 0 ? (
                                filteredAndSortedEquipments.map(eq => {
                                    const urgency = getUrgencyIndicator(eq.nextMaintenanceDate);
                                    return (
                                        <TableRow key={eq.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("h-2.5 w-2.5 rounded-full", urgency.color)} />
                                                    <span className="text-xs">{urgency.label}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{eq.name}<span className="block text-xs text-muted-foreground">{eq.serial}</span></TableCell>
                                            <TableCell>{eq.client}</TableCell>
                                            <TableCell>{eq.location}</TableCell>
                                            <TableCell>{eq.nextMaintenanceDate ? eq.nextMaintenanceDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric'}) : 'N/A'}</TableCell>
                                            <TableCell><Badge variant="outline">{eq.maintenancePeriodicity}</Badge></TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center">No se encontraron equipos con los filtros aplicados.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <Button onClick={() => window.print()} disabled={filteredAndSortedEquipments.length === 0}>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir Reporte
                </Button>
            </CardFooter>
        </Card>
    );
}


export default function ReportsPage() {
    const { loading } = useData();

    if (loading) {
      return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
          <Skeleton className="h-9 w-80 mb-2" />
          <Skeleton className="h-5 w-96" />
          <Card>
            <CardHeader><Skeleton className="h-20 w-full" /></CardHeader>
            <CardContent><Skeleton className="h-40 w-full" /></CardContent>
          </Card>
        </div>
      );
    }
  
    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <div className="grid gap-2">
                <h1 className="font-headline text-3xl font-bold">Generador de Reportes</h1>
                <p className="text-muted-foreground">
                Seleccione un tipo de reporte para generar y visualizar la información.
                </p>
            </div>
            <Tabs defaultValue="cedulas" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="cedulas">Reporte de Cédulas</TabsTrigger>
                    <TabsTrigger value="maintenance">Reporte de Mantenimientos</TabsTrigger>
                </TabsList>
                <TabsContent value="cedulas">
                    <CedulasReportGenerator />
                </TabsContent>
                <TabsContent value="maintenance">
                    <UpcomingMaintenanceReport />
                </TabsContent>
            </Tabs>
        </div>
    );
}
