
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
import { MoreHorizontal, PlusCircle, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { deleteSystem, System } from '@/lib/services';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/hooks/use-data-provider';

type SortableKey = 'name' | 'description';


export default function SystemsPage() {
  const { systems, loading, refreshData } = useData();
  const [systemToDelete, setSystemToDelete] = useState<System | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });

  const sortedSystems = useMemo(() => {
    let sortableItems = [...systems];
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
  }, [systems, sortConfig]);

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

  const handleDeleteSystem = async () => {
    if (systemToDelete) {
      try {
        await deleteSystem(systemToDelete.id);
        await refreshData();
      } catch (error) {
        console.error("Failed to delete system:", error);
        alert("Error al eliminar el sistema.");
      } finally {
        setSystemToDelete(null);
      }
    }
  };
  
  if (loading) {
      return (
          <div className="grid auto-rows-max items-start gap-4 md:gap-8">
              <div className="flex items-center justify-between">
                  <div className="grid gap-2">
                      <Skeleton className="h-9 w-64" />
                      <Skeleton className="h-5 w-96" />
                  </div>
                  <Skeleton className="h-10 w-36" />
              </div>
              <Card>
                  <CardContent className="pt-6">
                      <div className="space-y-4">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                      </div>
                  </CardContent>
              </Card>
          </div>
      );
  }

  return (
    <>
      <div className="grid auto-rows-max items-start gap-4 md:gap-8">
        <div className="flex items-center justify-between">
          <div className="grid gap-2">
            <h1 className="font-headline text-3xl font-bold">Sistemas de Seguridad</h1>
            <p className="text-muted-foreground">
              Listado de todos los sistemas de seguridad definidos.
            </p>
          </div>
          <Link href="/dashboard/systems/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Sistema
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('name')}>
                        Nombre
                        {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button variant="ghost" onClick={() => requestSort('description')}>
                        Descripción
                        {getSortIcon('description')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSystems.map((system) => (
                  <TableRow key={system.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: system.color }} />
                        <span style={{ color: system.color }}>{system.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{system.description}</TableCell>
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
                             <Link href={`/dashboard/systems/${system.id}/edit`}>Editar</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setSystemToDelete(system)}
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
      <AlertDialog open={!!systemToDelete} onOpenChange={(open) => !open && setSystemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres eliminar este sistema?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSystemToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSystem} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
