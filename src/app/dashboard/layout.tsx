
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
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
import { ShieldCheck, User as UserIcon, Settings, Upload, Save } from 'lucide-react';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { useData } from '@/hooks/use-data-provider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';


function CompanySettingsPanel({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const { companySettings, updateCompanySettings, loading } = useData();
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    useEffect(() => {
        if (companySettings) {
            setLogoUrl(companySettings.logoUrl);
        }
    }, [companySettings]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setUploadProgress(0); // Start progress at 0
        try {
            await updateCompanySettings({ logoUrl: logoUrl || '' }, setUploadProgress);
            alert('Configuración guardada con éxito.');
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to save settings', error);
            alert('Error al guardar la configuración.');
        } finally {
            setIsSaving(false);
            setUploadProgress(null);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Configuración General</SheetTitle>
                    <SheetDescription>
                        Ajustes globales de la aplicación, como el logo de la empresa.
                    </SheetDescription>
                </SheetHeader>
                <div className="grid gap-6 py-6">
                    <div className="space-y-2">
                        <Label htmlFor="logo-upload">Logo de la Empresa</Label>
                        <div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center p-2 border">
                            {logoUrl ? (
                                <Image src={logoUrl} alt="Logo de la empresa" width={200} height={200} data-ai-hint="company logo preview" className="object-contain max-h-full" />
                            ) : (
                                <p className="text-sm text-muted-foreground">Sin logo</p>
                            )}
                        </div>
                        <Input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            ref={logoInputRef}
                            onChange={handleLogoChange}
                            className="hidden"
                        />
                        <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            Subir Logo
                        </Button>
                        {uploadProgress !== null && logoUrl?.startsWith('data:') && <Progress value={uploadProgress} className="w-full mt-2" />}
                    </div>
                </div>
                <SheetFooter>
                    <Button onClick={handleSave} disabled={isSaving || loading}>
                        {isSaving ? 'Guardando...' : <><Save className="mr-2 h-4 w-4" /> Guardar Cambios</>}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}


function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, setUser, can } = usePermissions();
  const { companySettings } = useData();

  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);

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
              className="group flex h-auto items-center justify-center gap-3 rounded-lg px-2 text-lg font-semibold"
            >
              <div className="flex h-36 w-36 shrink-0 items-center justify-center transition-all p-2">
                <Image src={companySettings?.logoUrl || "https://placehold.co/200x200.png"} alt="Escuadra Technology Logo" width={360} height={360} data-ai-hint="logo" className="object-contain" />
              </div>
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
                        src={user?.photoUrl || undefined}
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
                  {can('update', 'users') && (
                     <DropdownMenuItem onSelect={() => setSettingsPanelOpen(true)}>
                        <Settings className="mr-2 h-4 w-4"/>
                        Cambiar Logo
                    </DropdownMenuItem>
                  )}
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
        <CompanySettingsPanel open={settingsPanelOpen} onOpenChange={setSettingsPanelOpen} />
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
