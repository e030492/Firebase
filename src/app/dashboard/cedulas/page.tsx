
"use client";

import { useState, useEffect, useMemo, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown, Camera } from 'lucide-react';
import { mockCedulas, mockClients, mockEquipments } from '@/lib/mock-data';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const CEDULAS_STORAGE_KEY = 'guardian_shield_cedulas';
const CLIENTS_STORAGE_KEY = 'guardian_shield_clients';
const EQUIPMENTS_STORAGE_KEY = 'guardian_shield_equipments';

type Cedula = typeof mockCedulas[0];
type Client = typeof mockClients[0];
type Equipment = typeof mockEquipments[0];
type SortableKey = keyof Omit<Cedula, 'id' | 'description' | 'protocolSteps'> | 'semaforo';

export default function CedulasPage() {
  const [cedulas, setCedulas] = useState<Cedula[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [allEquipments, setAllEquipments] = useState<Equipment[]>([]);

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [clientWarehouses, setClientWarehouses] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSemaforo, setSelectedSemaforo] = useState<string>('');

  const [cedulaToDelete, setCedulaToDelete] = useState<Cedula | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'ascending' | 'descending' } | null>({ key: 'folio', direction: 'ascending' });

  const [expandedCedulaId, setExpandedCedulaId] = useState<string | null>(null);

  useEffect(() => {
    const storedCedulas = localStorage.getItem(CEDULAS_STORAGE_KEY);
    if (storedCedulas) {
      setCedulas(JSON.parse(storedCedulas));
    } else {
      localStorage.setItem(CEDULAS_STORAGE_KEY, JSON.stringify(mockCedulas));
      setCedulas(mockCedulas);
    }
    
    const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
    setClients(storedClients ? JSON.parse(storedClients) : mockClients);
    
    const storedEquipments = localStorage.getItem(EQUIPMENTS_STORAGE_KEY);
    setAllEquipments(storedEquipments ? JSON.parse(storedEquipments) : mockEquipments);
  }, []);

  useEffect(() => {
    if (selectedClientId) {
        const client = clients.find(c => c.id === selectedClientId);
        setClientWarehouses(client?.almacenes.map(a => a.nombre) || []);
        setSelectedWarehouse(''); // Reset warehouse selection
    } else {
        setClientWarehouses([]);
        setSelectedWarehouse('');
    }
  }, [selectedClientId, clients]);

  const filteredAndSortedCedulas = useMemo(() => {
    let filteredCedulas = [...cedulas];

    if (selectedClientId) {
      const clientName = clients.find(c => c.id === selectedClientId)?.name;
      if (clientName) {
        filteredCedulas = filteredCedulas.filter(c => c.client === clientName);

        if (selectedWarehouse) {
          filteredCedulas = filteredCedulas.filter(cedula => {
            const equipment = allEquipments.find(eq => eq.name === cedula.equipment && eq.client === clientName);
            return equipment?.location === selectedWarehouse;
          });
        }
      }
    }
    
    if (selectedStatus) {
        filteredCedulas = filteredCedulas.filter(c => c.status === selectedStatus);
    }
    
    if (selectedSemaforo) {
        filteredCedulas = filteredCedulas.filter(c => c.semaforo === selectedSemaforo);
    }

    let sortableItems = filteredCedulas;
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [cedulas, sortConfig, selectedClientId, selectedWarehouse, selectedStatus, selectedSemaforo, clients, allEquipments]);

  const requestSort = (key: SortableKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortableKey) => {
    if (sortConfig?.key !== key) {
        return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    if (sortConfig.direction === 'ascending') {
        return <ArrowUp className="ml-2 h-4 w-4 text-foreground" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4 text-foreground" />;
  };

  const handleDeleteCedula = () => {
    if (cedulaToDelete) {
      const updatedCedulas = cedulas.filter((c) => c.id !== cedulaToDelete.id)
      setCedulas(updatedCedulas);
      localStorage.setItem(CEDULAS_STORAGE_KEY, JSON.stringify(updatedCedulas));
      setCedulaToDelete(null);
    }
  };
  
  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'outline' => {
    switch (status) {
      case 'Pendiente':
        return 'secondary';
      case 'En Progreso':
        return 'default';
      case 'Completada':
        return 'outline';
      default:
        return 'secondary';
    }
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

  const handleToggleDetails = (cedulaId: string) => {
    setExpandedCedulaId(prevId => prevId === cedulaId ? null : cedulaId);
  };


  return (
    <>
      <div className="grid auto-rows-max items-start gap-4 md:gap-8">
        <div className="flex items-center justify-between">
          <div className="grid gap-2">
            <h1 className="font-headline text-3xl font-bold">Cédulas de Mantenimiento</h1>
            <p className="text-muted-foreground">
              Listado de todas las cédulas de trabajo registradas.
            </p>
          </div>
          <Link href="/dashboard/cedulas/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Cédula
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
               <div className="grid gap-2">
                 <Label htmlFor="client">Filtrar por Cliente</Label>
                 <Select onValueChange={(value) => setSelectedClientId(value === 'all' ? '' : value)} value={selectedClientId || 'all'}>
                   <SelectTrigger id="client">
                     <SelectValue placeholder="Todos los clientes" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Todos los clientes</SelectItem>
                     {clients.map(client => (
                       <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="warehouse">Filtrar por Almacén</Label>
                 <Select 
                    onValueChange={(value) => setSelectedWarehouse(value === 'all' ? '' : value)} 
                    value={selectedWarehouse || 'all'}
                    disabled={!selectedClientId}
                  >
                   <SelectTrigger id="warehouse">
                     <SelectValue placeholder="Todos los almacenes" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Todos los almacenes</SelectItem>
                     {clientWarehouses.map(warehouse => (
                       <SelectItem key={warehouse} value={warehouse}>{warehouse}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="status">Filtrar por Estado</Label>
                 <Select onValueChange={(value) => setSelectedStatus(value === 'all' ? '' : value)} value={selectedStatus || 'all'}>
                   <SelectTrigger id="status">
                     <SelectValue placeholder="Todos los estados" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Todos los estados</SelectItem>
                     <SelectItem value="Pendiente">Pendiente</SelectItem>
                     <SelectItem value="En Progreso">En Progreso</SelectItem>
                     <SelectItem value="Completada">Completada</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
                <div className="grid gap-2">
                 <Label htmlFor="semaforo">Filtrar por Semáforo</Label>
                 <Select onValueChange={(value) => setSelectedSemaforo(value === 'all' ? '' : value)} value={selectedSemaforo || 'all'}>
                   <SelectTrigger id="semaforo">
                     <SelectValue placeholder="Todos" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Todos</SelectItem>
                     <SelectItem value="Verde">Verde</SelectItem>
                     <SelectItem value="Naranja">Naranja</SelectItem>
                     <SelectItem value="Rojo">Rojo</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
            </div>
            <Separator className="mb-6"/>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('folio')}>
                      Folio
                      {getSortIcon('folio')}
                    </Button>
                  </TableHead>
                  <TableHead>
                     <Button variant="ghost" onClick={() => requestSort('client')}>
                        Cliente
                        {getSortIcon('client')}
                     </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button variant="ghost" onClick={() => requestSort('equipment')}>
                      Equipo
                      {getSortIcon('equipment')}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <Button variant="ghost" onClick={() => requestSort('technician')}>
                      Técnico
                      {getSortIcon('technician')}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <Button variant="ghost" onClick={() => requestSort('supervisor' as SortableKey)}>
                      Supervisor
                      {getSortIcon('supervisor' as SortableKey)}
                    </Button>
                  </TableHead>
                   <TableHead className="hidden md:table-cell">
                    <Button variant="ghost" onClick={() => requestSort('creationDate')}>
                      Fecha
                      {getSortIcon('creationDate')}
                    </Button>
                  </TableHead>
                   <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('semaforo')}>
                      Semáforo
                      {getSortIcon('semaforo')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('status')}>
                      Estado
                      {getSortIcon('status')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Detalles</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedCedulas.map((cedula) => (
                  <Fragment key={cedula.id}>
                    <TableRow onClick={() => handleToggleDetails(cedula.id)} className="cursor-pointer">
                      <TableCell className="font-medium">{cedula.folio}</TableCell>
                      <TableCell>{cedula.client}</TableCell>
                      <TableCell className="hidden md:table-cell">{cedula.equipment}</TableCell>
                      <TableCell className="hidden lg:table-cell">{cedula.technician}</TableCell>
                      <TableCell className="hidden lg:table-cell">{cedula.supervisor}</TableCell>
                       <TableCell className="hidden md:table-cell">
                        {new Date(cedula.creationDate).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                      </TableCell>
                       <TableCell>
                          {cedula.semaforo ? (
                              <div className="flex items-center gap-2">
                                  <div className={cn("h-2.5 w-2.5 rounded-full", {
                                      'bg-green-500': cedula.semaforo === 'Verde',
                                      'bg-orange-500': cedula.semaforo === 'Naranja',
                                      'bg-red-500': cedula.semaforo === 'Rojo',
                                  })} />
                                  <span className="hidden xl:inline">{cedula.semaforo}</span>
                              </div>
                          ) : (
                              <span className="text-muted-foreground text-xs">N/A</span>
                          )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(cedula.status)}>{cedula.status}</Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                               <Link href={`/dashboard/cedulas/${cedula.id}/edit`}>Editar</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() => setCedulaToDelete(cedula)}
                            >
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => handleToggleDetails(cedula.id)}>
                            <ChevronDown className={cn("h-4 w-4 transition-transform", expandedCedulaId === cedula.id && "rotate-180")} />
                            <span className="sr-only">Ver detalles</span>
                          </Button>
                      </TableCell>
                    </TableRow>
                    {expandedCedulaId === cedula.id && (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={10} className="p-0">
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
                                                                        <div><Badge variant="secondary">{step.completion}%</Badge></div>
                                                                    </div>
                                                                    <div>
                                                                        <Label className="font-semibold">Prioridad</Label>
                                                                        <div><Badge variant={getPriorityBadgeVariant(step.priority)} className="capitalize">{step.priority}</Badge></div>
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={!!cedulaToDelete} onOpenChange={(open) => !open && setCedulaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres eliminar esta cédula?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la cédula con folio {cedulaToDelete?.folio}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCedulaToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCedula} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    
