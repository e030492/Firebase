
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

const mockClients = [
  {
    id: '1',
    name: 'Acme Corp',
    responsable: 'Juan Pérez',
    direccion: 'Av. Siempre Viva 123, Springfield',
  },
  {
    id: '2',
    name: 'Soluciones Tech',
    responsable: 'María García',
    direccion: 'Calle Falsa 456, Capital City',
  },
  {
    id: '3',
    name: 'Innovate Co.',
    responsable: 'Carlos Rodriguez',
    direccion: 'Blvd. de los Sueños 789, Metropolis',
  },
  {
    id: '4',
    name: 'Guardianes Nocturnos Ltda.',
    responsable: 'Ana Martinez',
    direccion: 'Paseo de la Reforma 101, CDMX',
  },
];

export default function ClientsPage() {
  return (
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
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Contacto Responsable</TableHead>
                <TableHead className="hidden lg:table-cell">Dirección</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockClients.map((client) => (
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
