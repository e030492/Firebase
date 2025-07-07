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

const allNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/users', label: 'Usuarios', icon: Users },
  { href: '/dashboard/clients', label: 'Clientes', icon: Building },
  { href: '/dashboard/systems', label: 'Sistemas', icon: Shield },
  { href: '/dashboard/equipments', label: 'Equipos', icon: HardHat },
  { href: '/dashboard/protocols', label: 'Protocolos', icon: ClipboardList, ai: true },
  { href: '/dashboard/cedulas', label: 'Cédulas', icon: FileText },
  { href: '/dashboard/reports', label: 'Reportes', icon: LineChart },
];

export function DashboardNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    const basePath = href.split('/').slice(0, 3).join('/');
    return pathname.startsWith(basePath);
  };

  return (
    <>
      {allNavItems.map((item) => (
        <SidebarMenuItem key={item.label}>
          {(item as any).disabled ? (
            <SidebarMenuButton
              isActive={isActive(item.href)}
              disabled={(item as any).disabled}
              tooltip={item.label}
              className={cn((item as any).disabled && 'cursor-not-allowed opacity-50')}
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
              disabled={(item as any).disabled}
              tooltip={item.label}
              className={cn((item as any).disabled && 'cursor-not-allowed opacity-50')}
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
      ))}
    </>
  );
}
