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

const allNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/users', label: 'Usuarios', icon: Users },
  { href: '/dashboard/clients', label: 'Clientes', icon: Building },
  { href: '/dashboard/systems', label: 'Sistemas', icon: Shield },
  { href: '/dashboard/equipments', label: 'Equipos', icon: HardHat, disabled: true },
  { href: '/dashboard/protocols/new', label: 'Protocolos', icon: ClipboardList, ai: true },
  { href: '/dashboard/cedulas', label: 'Cédulas', icon: FileText, disabled: true },
  { href: '/dashboard/reports', label: 'Reportes', icon: LineChart, disabled: true },
];

export function DashboardNav({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    const basePath = href.split('/').slice(0, 3).join('/');
    return pathname.startsWith(basePath);
  };

  const navLinkClasses = (href: string, disabled?: boolean) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
      isActive(href) && 'bg-primary/10 text-primary',
      disabled && 'cursor-not-allowed opacity-50 hover:text-muted-foreground',
      isMobile && 'text-lg'
    );

  return (
    <>
      {allNavItems.map((item) => (
        <Link key={item.label} href={item.disabled ? '#' : item.href} className={navLinkClasses(item.href, item.disabled)}>
          <item.icon className="h-5 w-5" />
          {item.label}
          {item.ai && <Badge variant="outline" className="ml-auto bg-accent/20 text-accent-foreground border-accent">AI</Badge>}
        </Link>
      ))}
    </>
  );
}
