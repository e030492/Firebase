
"use client";

import { useState, useEffect, useMemo, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { MoreHorizontal, PlusCircle, ArrowUp, ArrowDown, ArrowUpDown, HardHat, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Equipment } from '@/lib/services';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/hooks/use-data-provider';

type SortableKey = keyof Equipment;

export default function EquipmentsPage() {
  const { equipments, deleteEquipment, loading } = useData();
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });
  const [expandedEquipmentId, setExpandedEquipmentId] = useState<string | null>(null);


  const sortedEquipments = useMemo(() => {
    let sortableItems = [...equipments];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [equipments, sortConfig]);

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

  const handleDeleteEquipment = async () => {
    if (equipmentToDelete) {
      try {
        await deleteEquipment(equipmentToDelete.id);
      } catch (error) {
        console.error("Failed to delete equipment:", error);
        alert("Error al eliminar el equipo y su protocolo asociado.");
      } finally {
        setEquipmentToDelete(null);
      }
    }
  };
  
  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'Activo':
        return 'default';
      case 'Inactivo':
        return 'destructive';
      case 'En Mantenimiento':
        return 'secondary';
      default:
        return 'secondary';
    }
  };
  
  const handleToggleDetails = (equipmentId: string) => {
    setExpandedEquipmentId(prevId => prevId === equipmentId ? null : prevId);
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
                          <Skeleton className="h-16 w-full" />
                          <Skeleton className="h-16 w-full" />
                          <Skeleton className="h-16 w-full" />
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
            <h1 className="font-headline text-3xl font-bold">Equipos</h1>
            <p className="text-muted-foreground">
              Listado de todos los equipos registrados en el sistema.
            </p>
          </div>
          <Link href="/dashboard/equipments/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Equipo
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">Imagen</TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('name')}>
                      Nombre
                      {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                     <Button variant="ghost" onClick={() => requestSort('client')}>
                        Cliente
                        {getSortIcon('client')}
                     </Button>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <Button variant="ghost" onClick={() => requestSort('system')}>
                      Sistema
                      {getSortIcon('system')}
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
                {sortedEquipments.map((equipment) => (
                  <Fragment key={equipment.id}>
                    <TableRow>
                        <TableCell className="hidden sm:table-cell">
                            {equipment.imageUrl ? (
                                <Image src={equipment.imageUrl} alt={equipment.name} width={64} height={64} data-ai-hint="equipment photo" className="rounded-md object-cover aspect-square" />
                            ) : (
                                <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center">
                                    <HardHat className="h-8 w-8 text-muted-foreground" />
                                </div>
                            )}
                        </TableCell>
                        <TableCell className="font-medium">{equipment.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{equipment.client}</TableCell>
                        <TableCell className="hidden lg:table-cell">{equipment.system}</TableCell>
                        <TableCell>
                        <Badge variant={getStatusBadgeVariant(equipment.status)}>{equipment.status}</Badge>
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
                                <Link href={`/dashboard/equipments/${equipment.id}/edit`}>Editar</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={() => setEquipmentToDelete(equipment)}
                            >
                                Eliminar
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                        <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleToggleDetails(equipment.id)}>
                                <ChevronDown className={cn("h-4 w-4 transition-transform", expandedEquipmentId === equipment.id && "rotate-180")} />
                                <span className="sr-only">Ver detalles</span>
                            </Button>
                        </TableCell>
                    </TableRow>
                     {expandedEquipmentId === equipment.id && (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={7} className="p-0">
                                <div className="p-4">
                                <Card className="shadow-inner">
                                    <CardHeader>
                                        <CardTitle>Detalles del Equipo: {equipment.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label className="font-semibold">Descripción</Label>
                                            <p className="text-sm text-muted-foreground mt-1">{equipment.description || 'Sin descripción.'}</p>
                                        </div>
                                        <Separator/>
                                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div><Label className="font-semibold">Marca</Label><p className="text-sm text-muted-foreground">{equipment.brand}</p></div>
                                            <div><Label className="font-semibold">Modelo</Label><p className="text-sm text-muted-foreground">{equipment.model}</p></div>
                                            <div><Label className="font-semibold">Tipo</Label><p className="text-sm text-muted-foreground">{equipment.type}</p></div>
                                            <div><Label className="font-semibold">N/S</Label><p className="text-sm text-muted-foreground">{equipment.serial}</p></div>
                                        </div>
                                        <Separator/>
                                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div><Label className="font-semibold">Ubicación</Label><p className="text-sm text-muted-foreground">{equipment.location}</p></div>
                                            <div>
                                                <Label className="font-semibold">Inicio Mantenimiento</Label>
                                                <p className="text-sm text-muted-foreground">{equipment.maintenanceStartDate ? new Date(equipment.maintenanceStartDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric'}) : 'No especificado'}</p>
                                            </div>
                                            <div>
                                                <Label className="font-semibold">Periodicidad</Label>
                                                <p className="text-sm text-muted-foreground">{equipment.maintenancePeriodicity}</p>
                                            </div>
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
      <AlertDialog open={!!equipmentToDelete} onOpenChange={(open) => !open && setEquipmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres eliminar este equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el equipo y su protocolo de mantenimiento asociado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEquipmentToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEquipment} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
    
