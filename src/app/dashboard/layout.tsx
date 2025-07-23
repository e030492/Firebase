
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ShieldCheck } from 'lucide-react';
import { DashboardNav } from '@/components/dashboard-nav';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import type { User } from '@/lib/services';
import { ACTIVE_USER_STORAGE_KEY } from '@/lib/mock-data';
import { PermissionsProvider } from '@/hooks/use-permissions';
import { DataProvider } from '@/hooks/use-data-provider';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [activeUser, setActiveUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (storedUser) {
      try {
        setActiveUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse active user from localStorage", error);
        setActiveUser(null);
        router.push('/');
      }
    } else {
        router.push('/');
    }
  }, [router]);
  
  const handleLogout = () => {
      localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      router.push('/');
  };

  const getInitials = (name: string) => {
    if (!name) return 'ET';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <PermissionsProvider>
      <DataProvider>
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <Link
                href="/dashboard/dashboard"
                className="group flex h-9 items-center gap-3 rounded-lg px-2 text-lg font-semibold text-primary"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-all group-hover:bg-primary/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <span className="font-headline text-foreground group-data-[collapsible=icon]:hidden">
                  Escuadra Tecnology
                </span>
              </Link>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <DashboardNav />
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
              <SidebarTrigger />

              <div className="flex items-center gap-3">
                {activeUser && <span className="hidden text-sm font-medium text-foreground sm:inline-block">{activeUser.name}</span>}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
                      <Avatar>
                        <AvatarImage
                          src="https://placehold.co/32x32.png"
                          alt="User avatar"
                          data-ai-hint="user avatar"
                        />
                        <AvatarFallback>{getInitials(activeUser?.name || '')}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Configuración</DropdownMenuItem>
                    <DropdownMenuItem>Soporte</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleLogout}>
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </DataProvider>
    </PermissionsProvider>
  );
}
