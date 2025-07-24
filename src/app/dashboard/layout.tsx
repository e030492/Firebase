
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
import { ShieldCheck, Bug } from 'lucide-react';
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
import { useData } from '@/hooks/use-data-provider';
import { DebugWindow } from '@/components/debug-window';
import { cn } from '@/lib/utils';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const { isDebugWindowVisible, toggleDebugWindow } = useData();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


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
        
        {isClient && isDebugWindowVisible && <DebugWindow />}

        {isClient && (
          <Button
            onClick={toggleDebugWindow}
            variant={isDebugWindowVisible ? "destructive" : "outline"}
            size="icon"
            className={cn(
              "fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-2xl z-50 transition-all duration-300 print:hidden",
              !isDebugWindowVisible && "bg-primary/80 text-primary-foreground hover:bg-primary"
            )}
          >
            <Bug className="h-6 w-6" />
            <span className="sr-only">Toggle Debug Window</span>
          </Button>
        )}
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
