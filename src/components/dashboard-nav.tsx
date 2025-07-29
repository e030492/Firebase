
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
  FlaskConical,
} from 'lucide-react';

import { Badge } from './ui/badge';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

const allNavItems = [
  { href: '/dashboard/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/clients', label: 'Clientes', icon: Building },
  { href: '/dashboard/systems', label: 'Sistemas', icon: Shield },
  { href: '/dashboard/equipments', label: 'Equipos', icon: HardHat },
  { href: '/dashboard/protocols/base', label: 'Protocolos', icon: ClipboardList, ai: true },
  { href: '/dashboard/cedulas', label: 'Cédulas', icon: FileText },
  { href: '/dashboard/reports', label: 'Reportes', icon: LineChart },
  { href: '/dashboard/pruebas', label: 'Pruebas', icon: FlaskConical },
];

export function DashboardNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard/dashboard') {
        return pathname === href;
    }
    const basePath = href.split('/').slice(0, 3).join('/');
    return pathname.startsWith(basePath);
  };

  return (
    <>
      {allNavItems.map((item) => (
          <SidebarMenuItem key={item.label}>
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
          </SidebarMenuItem>
      ))}
    </>
  );
}
