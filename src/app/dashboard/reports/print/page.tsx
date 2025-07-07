"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ShieldCheck, Printer, X } from 'lucide-react';
import { mockCedulas, mockEquipments, mockClients, mockSystems } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const CEDULAS_STORAGE_KEY = 'guardian_shield_cedulas';
const EQUIPMENTS_STORAGE_KEY = 'guardian_shield_equipments';
const CLIENTS_STORAGE_KEY = 'guardian_shield_clients';
const SYSTEMS_STORAGE_KEY = 'guardian_shield_systems';

type Cedula = typeof mockCedulas[0];
type Equipment = typeof mockEquipments[0];
type Client = typeof mockClients[0];
type System = typeof mockSystems[0];
type EnrichedCedula = Cedula & { equipmentDetails?: Equipment; clientDetails?: Client; systemDetails?: System };

function ReportGenerator() {
  const searchParams = useSearchParams();
  const [reportCedulas, setReportCedulas] = useState<EnrichedCedula[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',') || [];
    if (ids.length > 0) {
      const allCedulas: Cedula[] = JSON.parse(localStorage.getItem(CEDULAS_STORAGE_KEY) || '[]');
      const allEquipments: Equipment[] = JSON.parse(localStorage.getItem(EQUIPMENTS_STORAGE_KEY) || '[]');
      const allClients: Client[] = JSON.parse(localStorage.getItem(CLIENTS_STORAGE_KEY) || '[]');
      const allSystems: System[] = JSON.parse(localStorage.getItem(SYSTEMS_STORAGE_KEY) || '[]');

      const enrichedData = ids.map(id => {
        const cedula = allCedulas.find(c => c.id === id);
        if (!cedula) return null;

        const equipment = allEquipments.find(e => e.name === cedula.equipment && e.client === cedula.client);
        const client = allClients.find(c => c.name === cedula.client);
        const system = equipment ? allSystems.find(s => s.name === equipment.system) : undefined;
        
        return {
            ...cedula,
            equipmentDetails: equipment,
            clientDetails: client,
            systemDetails: system,
        };
      }).filter((c): c is EnrichedCedula => c !== null);
      
      setReportCedulas(enrichedData);
    }
    setLoading(false);
  }, [searchParams]);
  
  const getPriorityBadgeVariant = (priority: string): 'default' | 'secondary' | 'destructive' => {
    switch (priority?.toLowerCase()) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baja': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando datos del reporte...</div>;
  }
  
  if (reportCedulas.length === 0) {
      return <div className="p-8 text-center">No se seleccionaron cédulas para el reporte.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
        <header className="flex items-center justify-between mb-8 print:hidden">
            <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary"/>
                <h1 className="text-xl font-bold">Vista Previa del Reporte</h1>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4"/>
                    Imprimir / Guardar PDF
                </Button>
                <Button variant="outline" onClick={() => window.close()}>
                    <X className="mr-2 h-4 w-4"/>
                    Cerrar
                </Button>
            </div>
        </header>

        <main className="space-y-8">
            {reportCedulas.map((cedula, idx) => (
                <div key={cedula.id} className="bg-white p-6 sm:p-8 shadow-lg print:shadow-none break-after-page">
                    {/* Report Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                        <div className="flex items-center gap-4">
                             <ShieldCheck className="h-12 w-12 text-primary" />
                             <div>
                                <h2 className="text-2xl font-bold text-gray-800">Reporte de Mantenimiento</h2>
                                <p className="text-sm text-gray-500">Guardian Shield - Control de Seguridad</p>
                             </div>
                        </div>
                        <div className="text-left sm:text-right mt-4 sm:mt-0">
                            <p className="font-semibold text-gray-700">Folio: <span className="font-normal">{cedula.folio}</span></p>
                            <p className="font-semibold text-gray-700">Fecha de Reporte: <span className="font-normal">{new Date().toLocaleDateString('es-ES')}</span></p>
                        </div>
                    </div>
                    <Separator className="my-6"/>

                    {/* General Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm mb-6">
                        <div><p className="font-semibold text-gray-700">Cliente:</p><p>{cedula.client}</p></div>
                        <div><p className="font-semibold text-gray-700">Fecha de Cédula:</p><p>{new Date(cedula.creationDate).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</p></div>
                        <div><p className="font-semibold text-gray-700">Técnico:</p><p>{cedula.technician}</p></div>
                        <div><p className="font-semibold text-gray-700">Equipo:</p><p>{cedula.equipment}</p></div>
                        <div><p className="font-semibold text-gray-700">Sistema:</p><p style={{color: cedula.systemDetails?.color}}>{cedula.equipmentDetails?.system || 'N/A'}</p></div>
                        <div><p className="font-semibold text-gray-700">Supervisor:</p><p>{cedula.supervisor}</p></div>
                    </div>
                     <div className="text-sm mb-6">
                        <p className="font-semibold text-gray-700">Ubicación:</p>
                        <p>{cedula.equipmentDetails?.location || 'No especificada'}</p>
                    </div>

                    <div className="text-sm">
                        <p className="font-semibold text-gray-700">Descripción del Trabajo:</p>
                        <p className="mt-1 p-3 border rounded-md bg-gray-50">{cedula.description}</p>
                    </div>
                    
                    {/* Protocol Steps */}
                    {cedula.protocolSteps && cedula.protocolSteps.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Protocolo de Mantenimiento Ejecutado</h3>
                             <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="text-left p-3 font-semibold">Paso del Protocolo y Notas</th>
                                            <th className="text-center p-3 font-semibold w-32">Progreso</th>
                                            <th className="text-center p-3 font-semibold w-28">Prioridad</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {cedula.protocolSteps.map((step, index) => (
                                        <tr key={index}>
                                            <td className="p-3 align-top">
                                                <p className="font-medium">{step.step}</p>
                                                {step.notes && <p className="text-xs text-gray-600 mt-2 pl-2 border-l-2"><strong>Notas:</strong> {step.notes}</p>}
                                                {step.imageUrl && (
                                                    <div className="mt-3">
                                                        <p className="text-xs font-semibold mb-1">Evidencia:</p>
                                                        <Image src={step.imageUrl} alt={`Evidencia para ${step.step}`} width={250} height={180} data-ai-hint="protocol evidence" className="rounded-md object-cover border"/>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3 text-center align-middle">
                                                <Badge variant="secondary">{step.completion}%</Badge>
                                            </td>
                                            <td className="p-3 text-center align-middle">
                                                <Badge variant={getPriorityBadgeVariant(step.priority)} className="capitalize">{step.priority}</Badge>
                                            </td>
                                        </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    {/* Final Evaluation */}
                    <div className="mt-8 pt-6 border-t">
                         <h3 className="text-lg font-bold text-gray-800 mb-4">Evaluación Final del Equipo</h3>
                         {cedula.semaforo ? (
                            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                                 <div className={cn("h-6 w-6 rounded-full", {
                                    'bg-green-500': cedula.semaforo === 'Verde',
                                    'bg-orange-500': cedula.semaforo === 'Naranja',
                                    'bg-red-500': cedula.semaforo === 'Rojo',
                                })} />
                                <p className="font-semibold text-base">{cedula.semaforo}</p>
                            </div>
                         ) : (
                            <p className="text-gray-500">Sin evaluación final registrada.</p>
                         )}
                    </div>
                </div>
            ))}
        </main>
    </div>
  );
}

export default function PrintReportPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Cargando reporte...</div>}>
            <ReportGenerator />
        </Suspense>
    )
}
