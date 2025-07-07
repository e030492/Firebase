import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Link from 'next/link';

const mockSystems = [
  {
    id: '1',
    name: 'Sistema de Control de Acceso',
    description: 'Gestiona entradas y salidas mediante tarjetas RFID y biométricos.',
  },
  {
    id: '2',
    name: 'Circuito Cerrado de Televisión (CCTV)',
    description: 'Sistema de videovigilancia con cámaras IP de alta definición.',
  },
  {
    id: '3',
    name: 'Sistema de Detección de Incendios',
    description: 'Detectores de humo y calor conectados a una central de alarmas.',
  },
  {
    id: '4',
    name: 'Alarma de Intrusión Perimetral',
    description: 'Sensores de movimiento y barreras infrarrojas para proteger el perímetro.',
  },
];

export default function SystemsPage() {
  return (
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
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Descripción</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSystems.map((system) => (
                <TableRow key={system.id}>
                  <TableCell className="font-medium">{system.name}</TableCell>
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
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive">Eliminar</DropdownMenuItem>
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
  );
}
