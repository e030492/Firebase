"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Printer, FileText } from 'lucide-react';
import { mockCedulas, mockClients, mockEquipments, mockSystems } from '@/lib/mock-data';

const CEDULAS_STORAGE_KEY = 'guardian_shield_cedulas';
const CLIENTS_STORAGE_KEY = 'guardian_shield_clients';
const EQUIPMENTS_STORAGE_KEY = 'guardian_shield_equipments';
const SYSTEMS_STORAGE_KEY = 'guardian_shield_systems';

type Cedula = typeof mockCedulas[0];
type Client = typeof mockClients[0];
type Equipment = typeof mockEquipments[0];
type System = typeof mockSystems[0];

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
  const [selectedCedulas, setSelectedCedulas] = useState<string[]>([]);

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
      return { ...cedula, system: equipment?.system || '', warehouse: equipment?.location || '' };
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
    return filtered;
  }, [cedulas, allEquipments, clients, systems, selectedClientId, selectedWarehouse, selectedSystemId]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedCedulas(filteredCedulas.map(c => c.id));
    } else {
      setSelectedCedulas([]);
    }
  };
  
  const handleSelectCedula = (cedulaId: string, checked: boolean) => {
    if (checked) {
      setSelectedCedulas(prev => [...prev, cedulaId]);
    } else {
      setSelectedCedulas(prev => prev.filter(id => id !== cedulaId));
    }
  };

  const isAllSelected = filteredCedulas.length > 0 && selectedCedulas.length === filteredCedulas.length;
  const isSomeSelected = selectedCedulas.length > 0 && selectedCedulas.length < filteredCedulas.length;
  const selectionState = isAllSelected ? true : (isSomeSelected ? 'indeterminate' : false);

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
                                <Checkbox onCheckedChange={handleSelectAll} checked={selectionState} aria-label="Seleccionar todo" />
                            </TableHead>
                            <TableHead>Folio</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Equipo</TableHead>
                            <TableHead className="hidden md:table-cell">Fecha</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCedulas.length > 0 ? (
                            filteredCedulas.map(cedula => (
                                <TableRow key={cedula.id} data-state={selectedCedulas.includes(cedula.id) ? "selected" : ""}>
                                    <TableCell>
                                        <Checkbox 
                                            onCheckedChange={checked => handleSelectCedula(cedula.id, !!checked)}
                                            checked={selectedCedulas.includes(cedula.id)}
                                            aria-label={`Seleccionar cédula ${cedula.folio}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{cedula.folio}</TableCell>
                                    <TableCell>{cedula.client}</TableCell>
                                    <TableCell>{cedula.equipment}</TableCell>
                                    <TableCell className="hidden md:table-cell">{new Date(cedula.creationDate).toLocaleDateString('es-ES')}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">No se encontraron cédulas con los filtros aplicados.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button asChild disabled={selectedCedulas.length === 0}>
             <Link href={`/dashboard/reports/print?ids=${selectedCedulas.join(',')}`} target="_blank">
                <Printer className="mr-2 h-4 w-4" />
                Generar Reporte ({selectedCedulas.length})
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
