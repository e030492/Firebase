
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building,
  ClipboardList,
  FileText,
  HardHat,
  LayoutDashboard,
  LineChart,
  Shield,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { usePermissions } from '@/hooks/use-permissions';

const allNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' as const },
  { href: '/dashboard/users', label: 'Usuarios', icon: Users, module: 'users' as const },
  { href: '/dashboard/clients', label: 'Clientes', icon: Building, module: 'clients' as const },
  { href: '/dashboard/systems', label: 'Sistemas', icon: Shield, module: 'systems' as const },
  { href: '/dashboard/equipments', label: 'Equipos', icon: HardHat, module: 'equipments' as const },
  { href: '/dashboard/protocols', label: 'Protocolos', icon: ClipboardList, ai: true, module: 'protocols' as const },
  { href: '/dashboard/cedulas', label: 'Cédulas', icon: FileText, module: 'cedulas' as const },
  { href: '/dashboard/reports', label: 'Reportes', icon: LineChart, module: 'reports' as const },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { can } = usePermissions();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    const basePath = href.split('/').slice(0, 3).join('/');
    return pathname.startsWith(basePath);
  };
  
  // A simple check: if a module is not 'dashboard' or 'reports', the user must have at least 'update' permission to see it.
  // This is a basic approach. A more granular approach would be to check for 'read' permission if it existed.
  const hasAccess = (module: typeof allNavItems[0]['module']) => {
    if (module === 'dashboard' || module === 'reports') return true;
    return can('update', module);
  }

  return (
    <>
      {allNavItems.map((item) => {
        const disabled = !hasAccess(item.module);
        return (
          <SidebarMenuItem key={item.label}>
            {disabled ? (
              <SidebarMenuButton
                isActive={false}
                disabled={true}
                tooltip={item.label}
                className={cn(disabled && 'cursor-not-allowed opacity-50')}
              >
                <item.icon />
                <span>{item.label}</span>
                {item.ai && (
                  <Badge
                    variant="outline"
                    className="ml-auto bg-accent/20 text-accent-foreground border-accent"
                  >
                    AI
                  </Badge>
                )}
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                  {item.ai && (
                    <Badge
                      variant="outline"
                      className="ml-auto bg-accent/20 text-accent-foreground border-accent"
                    >
                      AI
                    </Badge>
                  )}
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        )
      })}
    </>
  );
}
