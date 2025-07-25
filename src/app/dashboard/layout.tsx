
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
import { ShieldCheck, User as UserIcon } from 'lucide-react';
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
import { PermissionsProvider, usePermissions } from '@/hooks/use-permissions';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, setUser } = usePermissions();

  useEffect(() => {
    const storedUser = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (!user || user.id !== parsedUser.id) {
            setUser(parsedUser);
        }
      } catch (error) {
        console.error("Failed to parse active user from localStorage", error);
        setUser(null);
        router.push('/');
      }
    } else {
        router.push('/');
    }
  }, [router, setUser, user]);
  
  const handleLogout = () => {
      localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      setUser(null);
      router.push('/');
  };

  const getInitials = (name: string) => {
    if (!name) return <UserIcon className="h-5 w-5" />;
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  return (
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
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6 print:hidden">
            <SidebarTrigger />

            <div className="flex items-center gap-3">
              {user && <span className="hidden text-sm font-medium text-foreground sm:inline-block">{user.name}</span>}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
                    <Avatar>
                      <AvatarImage
                        src={user?.photoUrl || ''}
                        alt="User avatar"
                        data-ai-hint="user avatar"
                      />
                      <AvatarFallback>{getInitials(user?.name || '')}</AvatarFallback>
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
          <main className="flex-1 p-4 md:p-6">
            <div className="mx-auto w-full max-w-7xl">
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
  )
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionsProvider>
      <DashboardContent>
        {children}
      </DashboardContent>
    </PermissionsProvider>
  );
}
