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
import { mockClients } from '@/lib/mock-data';

const CLIENTS_STORAGE_KEY = 'guardian_shield_clients';
type Client = typeof mockClients[0];
type SortableKey = 'name' | 'responsable' | 'direccion';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });


  useEffect(() => {
    const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (storedClients) {
      setClients(JSON.parse(storedClients));
    } else {
      // Initialize with mock data if not present
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(mockClients));
      setClients(mockClients);
    }
  }, []);

  const sortedClients = useMemo(() => {
    let sortableItems = [...clients];
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
  }, [clients, sortConfig]);

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

  const handleDeleteClient = () => {
    if (clientToDelete) {
      const updatedClients = clients.filter((client) => client.id !== clientToDelete.id)
      setClients(updatedClients);
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updatedClients));
      setClientToDelete(null); // Close the dialog
    }
  };

  return (
    <>
      <div className="grid auto-rows-max items-start gap-4 md:gap-8">
        <div className="flex items-center justify-between">
          <div className="grid gap-2">
            <h1 className="font-headline text-3xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">
              Listado de todos los clientes registrados en el sistema.
            </p>
          </div>
          <Link href="/dashboard/clients/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Cliente
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
                    <Button variant="ghost" onClick={() => requestSort('responsable')}>
                        Contacto Responsable
                        {getSortIcon('responsable')}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <Button variant="ghost" onClick={() => requestSort('direccion')}>
                        Dirección
                        {getSortIcon('direccion')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{client.responsable}</TableCell>
                    <TableCell className="hidden lg:table-cell">{client.direccion}</TableCell>
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
                             <Link href={`/dashboard/clients/${client.id}/edit`}>Editar</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setClientToDelete(client)}
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
      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres eliminar a {clientToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al cliente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClientToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
