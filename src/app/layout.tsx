
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { DataProvider } from '@/hooks/use-data-provider';
import { PermissionsProvider } from '@/hooks/use-permissions';


export const metadata: Metadata = {
  title: 'Escuadra Tecnology',
  description: 'Sistema de Control de Mantenimiento de Equipos de Seguridad',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <PermissionsProvider>
          <DataProvider>
            {children}
            <Toaster />
          </DataProvider>
        </PermissionsProvider>
      </body>
    </html>
  );
}
