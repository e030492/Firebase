
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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Link from 'next/link';

const mockUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@guardianshield.com',
    role: 'Administrador',
  },
  {
    id: '2',
    name: 'Technician Uno',
    email: 'tech1@guardianshield.com',
    role: 'Técnico',
  },
  {
    id: '3',
    name: 'Technician Dos',
    email: 'tech2@guardianshield.com',
    role: 'Técnico',
  },
    {
    id: '4',
    name: 'Supervisor',
    email: 'supervisor@guardianshield.com',
    role: 'Supervisor',
  },
];

export default function UsersPage() {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="flex items-center justify-between">
        <div className="grid gap-2">
          <h1 className="font-headline text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestión de usuarios del sistema.
          </p>
        </div>
        <Link href="/dashboard/users/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Usuario
          </Button>
        </Link>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Rol</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                  <TableCell className="hidden lg:table-cell">{user.role}</TableCell>
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
