"use client";

import { useState, useEffect } from 'react';
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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { mockEquipments } from '@/lib/mock-data';

const EQUIPMENTS_STORAGE_KEY = 'guardian_shield_equipments';
type Equipment = typeof mockEquipments[0];

export default function EquipmentsPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);

  useEffect(() => {
    const storedEquipments = localStorage.getItem(EQUIPMENTS_STORAGE_KEY);
    if (storedEquipments) {
      setEquipments(JSON.parse(storedEquipments));
    } else {
      localStorage.setItem(EQUIPMENTS_STORAGE_KEY, JSON.stringify(mockEquipments));
      setEquipments(mockEquipments);
    }
  }, []);

  const handleDeleteEquipment = () => {
    if (equipmentToDelete) {
      const updatedEquipments = equipments.filter((eq) => eq.id !== equipmentToDelete.id)
      setEquipments(updatedEquipments);
      localStorage.setItem(EQUIPMENTS_STORAGE_KEY, JSON.stringify(updatedEquipments));
      setEquipmentToDelete(null);
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
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead className="hidden lg:table-cell">Sistema</TableHead>
                  <TableHead className="hidden lg:table-cell">Estado</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipments.map((equipment) => (
                  <TableRow key={equipment.id}>
                    <TableCell className="font-medium">{equipment.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{equipment.client}</TableCell>
                    <TableCell className="hidden lg:table-cell">{equipment.system}</TableCell>
                    <TableCell className="hidden lg:table-cell">
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
                  </TableRow>
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente el equipo.
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
