"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
import { MoreHorizontal, PlusCircle, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { mockCedulas } from '@/lib/mock-data';

const CEDULAS_STORAGE_KEY = 'guardian_shield_cedulas';
type Cedula = typeof mockCedulas[0];
type SortableKey = keyof Omit<Cedula, 'id' | 'description'>;

export default function CedulasPage() {
  const [cedulas, setCedulas] = useState<Cedula[]>([]);
  const [cedulaToDelete, setCedulaToDelete] = useState<Cedula | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'ascending' | 'descending' } | null>({ key: 'folio', direction: 'ascending' });

  useEffect(() => {
    const storedCedulas = localStorage.getItem(CEDULAS_STORAGE_KEY);
    if (storedCedulas) {
      setCedulas(JSON.parse(storedCedulas));
    } else {
      localStorage.setItem(CEDULAS_STORAGE_KEY, JSON.stringify(mockCedulas));
      setCedulas(mockCedulas);
    }
  }, []);

  const sortedCedulas = useMemo(() => {
    let sortableItems = [...cedulas];
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
  }, [cedulas, sortConfig]);

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
                   <TableHead className="hidden md:table-cell">
                    <Button variant="ghost" onClick={() => requestSort('creationDate')}>
                      Fecha
                      {getSortIcon('creationDate')}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCedulas.map((cedula) => (
                  <TableRow key={cedula.id}>
                    <TableCell className="font-medium">{cedula.folio}</TableCell>
                    <TableCell>{cedula.client}</TableCell>
                    <TableCell className="hidden md:table-cell">{cedula.equipment}</TableCell>
                    <TableCell className="hidden lg:table-cell">{cedula.technician}</TableCell>
                     <TableCell className="hidden md:table-cell">
                      {new Date(cedula.creationDate + 'T00:00:00').toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(cedula.status)}>{cedula.status}</Badge>
                    </TableCell>
                    <TableCell>
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
                  </TableRow>
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
