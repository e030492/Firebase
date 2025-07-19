import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reporte de Mantenimiento - Escuadra',
  description: 'Documento para impresión de cédulas de mantenimiento.',
};

export default function PrintLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This layout is nested within the main dashboard layout.
  // It must not contain <html>, <head>, or <body> tags.
  // Print-specific styles are handled in globals.css
  return <>{children}</>;
}

    