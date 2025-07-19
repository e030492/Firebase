
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ShieldCheck, Printer, X, Camera } from 'lucide-react';
import { useLocalStorageSync } from '@/hooks/use-local-storage-sync';
import type { mockCedulas, mockEquipments, mockClients, mockSystems } from '@/lib/mock-data';
import {
  CEDULAS_STORAGE_KEY,
  EQUIPMENTS_STORAGE_KEY,
  CLIENTS_STORAGE_KEY,
  SYSTEMS_STORAGE_KEY,
} from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type Cedula = typeof mockCedulas[0];
type Equipment = typeof mockEquipments[0];
type Client = typeof mockClients[0];
type System = typeof mockSystems[0];
type EnrichedCedula = Cedula & { equipmentDetails?: Equipment; clientDetails?: Client; systemDetails?: System };

function ReportContent() {
  const searchParams = useSearchParams();
  const [reportCedulas, setReportCedulas] = useState<EnrichedCedula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState('');
  
  const [allCedulas] = useLocalStorageSync<Cedula[]>(CEDULAS_STORAGE_KEY, []);
  const [allEquipments] = useLocalStorageSync<Equipment[]>(EQUIPMENTS_STORAGE_KEY, []);
  const [allClients] = useLocalStorageSync<Client[]>(CLIENTS_STORAGE_KEY, []);
  const [allSystems] = useLocalStorageSync<System[]>(SYSTEMS_STORAGE_KEY, []);
  
  useEffect(() => {
    setReportDate(new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }));

    const idsParam = searchParams.get('ids');
    if (!idsParam) {
      setError('No se seleccionaron cédulas para el reporte.');
      setLoading(false);
      return;
    }

    const ids = idsParam ? idsParam.split(',').filter(id => id) : [];
    if (ids.length === 0) {
        setError('No se seleccionaron cédulas válidas para el reporte.');
        setLoading(false);
        return;
    }
    
    // Wait until all data from local storage is loaded
    if (allCedulas.length === 0 && allEquipments.length === 0) {
        return; // Data is still loading from the hook
    }

    try {
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
      
        if (enrichedData.length === 0) {
            setError('Las cédulas seleccionadas no pudieron ser encontradas en la base de datos actual.');
        }

        setReportCedulas(enrichedData);
    } catch (e) {
        console.error("Error processing report data:", e);
        setError('Ocurrió un error al procesar los datos del reporte.');
    } finally {
        setLoading(false);
    }
  }, [searchParams, allCedulas, allEquipments, allClients, allSystems]);
  
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
  
  if (error) {
    return <div className="p-8 text-center text-destructive">{error}</div>;
  }

  if (reportCedulas.length === 0) {
    return <div className="p-8 text-center">No se encontraron datos para las cédulas seleccionadas.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 bg-background">
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

        <main className="space-y-8 print:space-y-0">
            {reportCedulas.map((cedula, idx) => (
                <div key={cedula.id} className="bg-white p-6 sm:p-8 shadow-lg print:shadow-none break-after-page page-break">
                    {/* Report Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                        <div className="flex items-center gap-4">
                             <ShieldCheck className="h-12 w-12 text-primary" />
                             <div>
                                <h2 className="text-2xl font-bold text-gray-800">Reporte de Mantenimiento</h2>
                                <p className="text-sm text-gray-500">Escuadra - Control de Seguridad</p>
                             </div>
                        </div>
                        <div className="text-left sm:text-right mt-4 sm:mt-0">
                            <p className="font-semibold text-gray-700">Folio: <span className="font-normal">{cedula.folio}</span></p>
                            <p className="font-semibold text-gray-700">Fecha de Reporte: <span className="font-normal">{reportDate}</span></p>
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
                            <div className="border rounded-lg divide-y divide-gray-200">
                                {cedula.protocolSteps.map((step, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 p-4 break-inside-avoid">
                                        <div className="md:col-span-2 space-y-3">
                                            <div>
                                                <p className="font-semibold text-gray-600 text-sm">Paso del Protocolo</p>
                                                <p className="text-gray-800">{step.step}</p>
                                            </div>
                                            {step.notes && (
                                                <div>
                                                    <p className="font-semibold text-gray-600 text-sm">Notas del Técnico</p>
                                                    <p className="text-gray-700 italic text-sm">"{step.notes}"</p>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4 pt-2">
                                                <div>
                                                    <p className="font-semibold text-gray-600 text-sm">Progreso</p>
                                                    <Badge variant="secondary">{step.completion}%</Badge>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-600 text-sm">Prioridad</p>
                                                    <Badge variant={getPriorityBadgeVariant(step.priority)} className="capitalize">{step.priority}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-600 text-sm">Evidencia Fotográfica</p>
                                            {step.imageUrl ? (
                                                <Image 
                                                    src={step.imageUrl} 
                                                    alt={`Evidencia para ${step.step}`} 
                                                    width={300} 
                                                    height={225} 
                                                    data-ai-hint="protocol evidence" 
                                                    className="rounded-md object-cover border w-full aspect-[4/3]"
                                                />
                                            ) : (
                                                <div className="w-full aspect-[4/3] bg-gray-100 rounded-md flex items-center justify-center border text-center">
                                                    <div>
                                                        <Camera className="h-8 w-8 text-gray-400 mx-auto"/>
                                                        <p className="text-xs text-gray-400 mt-1">Sin evidencia</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
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
            <ReportContent />
        </Suspense>
    );
}
