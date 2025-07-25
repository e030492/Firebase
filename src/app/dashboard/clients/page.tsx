
"use client";

import { useState, useMemo, useEffect, Fragment } from 'react';
import Link from 'next/link';
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
import { MoreHorizontal, PlusCircle, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown, FileText } from 'lucide-react';
import { Client } from '@/lib/services';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/hooks/use-data-provider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type SortableKey = 'name' | 'responsable' | 'direccion';

export default function ClientsPage() {
  const { clients, loading, deleteClient: deleteClientFromProvider } = useData();
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

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

  const handleDeleteClient = async () => {
    if (clientToDelete) {
      try {
        await deleteClientFromProvider(clientToDelete.id);
      } catch (error) {
        console.error("Failed to delete client:", error);
        alert("Error al eliminar el cliente.");
      } finally {
        setClientToDelete(null);
      }
    }
  };

  const handleToggleDetails = (clientId: string) => {
    setExpandedClientId(prevId => (prevId === clientId ? null : clientId));
  };
  
  if (loading) {
    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <div className="flex items-center justify-between">
                <div className="grid gap-2">
                    <Skeleton className="h-9 w-40" />
                    <Skeleton className="h-5 w-80" />
                </div>
                <Skeleton className="h-10 w-32" />
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
                        Dirección
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
                {sortedClients.map((client) => (
                  <Fragment key={client.id}>
                    <TableRow onClick={() => handleToggleDetails(client.id)} className="cursor-pointer">
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{client.responsable}</TableCell>
                        <TableCell className="hidden lg:table-cell">{client.direccion}</TableCell>
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
                        <TableCell onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" onClick={() => handleToggleDetails(client.id)}>
                                <ChevronDown className={cn("h-4 w-4 transition-transform", expandedClientId === client.id && "rotate-180")} />
                                <span className="sr-only">Ver detalles</span>
                            </Button>
                        </TableCell>
                    </TableRow>
                     {expandedClientId === client.id && (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={5} className="p-0">
                                <div className="p-4">
                                <Card className="shadow-inner">
                                    <CardHeader>
                                        <CardTitle>Detalles del Cliente: {client.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label className="font-semibold">Dirección Principal</Label>
                                            <p className="text-sm text-muted-foreground mt-1">{client.direccion}</p>
                                        </div>
                                        <Separator/>
                                        <div>
                                            <Label className="font-semibold">Almacenes Registrados</Label>
                                            {client.almacenes && client.almacenes.length > 0 ? (
                                                <div className="space-y-3 mt-2">
                                                    {client.almacenes.map((almacen, index) => (
                                                        <div key={index} className="text-sm p-3 border rounded-md bg-background/50">
                                                            <p className="font-medium">{almacen.nombre}</p>
                                                            <p className="text-muted-foreground">{almacen.direccion}</p>
                                                            {almacen.planosUrl && almacen.planosUrl.length > 0 && (
                                                                <div className="mt-2">
                                                                    <p className="text-xs font-semibold text-muted-foreground">Planos:</p>
                                                                    <div className="flex flex-wrap gap-4 mt-1">
                                                                        {almacen.planosUrl.map((planoUrl, planoIndex) => (
                                                                            <a
                                                                                key={planoIndex}
                                                                                href={planoUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="flex flex-col items-center justify-center gap-2 text-sm text-center text-primary hover:underline p-2 border rounded-md w-24"
                                                                            >
                                                                                <FileText className="h-8 w-8" />
                                                                                <span className="truncate w-full">Plano {planoIndex + 1}</span>
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground mt-1">Este cliente no tiene almacenes registrados.</p>
                                            )}
                                        </div>
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
    
