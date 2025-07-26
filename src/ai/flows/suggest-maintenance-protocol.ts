
// use server'
'use server';
/**
 * @fileOverview An AI agent that suggests maintenance protocol steps based on equipment name and description.
 *
 * - suggestMaintenanceProtocol - A function that handles the maintenance protocol suggestion process.
 * - SuggestMaintenanceProtocolInput - The input type for the suggestMaintenanceProtocol function.
 * - SuggestMaintenanceProtocolOutput - The return type for the suggestMaintenanceProtocol function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMaintenanceProtocolInputSchema = z.object({
  name: z.string().describe('The name of the equipment.'),
  description: z.string().describe('The description of the equipment.'),
  brand: z.string().describe('The brand of the equipment.'),
  model: z.string().describe('The model of the equipment.'),
  type: z.string().describe('The type of the equipment.'),
});
export type SuggestMaintenanceProtocolInput = z.infer<
  typeof SuggestMaintenanceProtocolInputSchema
>;

const SuggestMaintenanceProtocolOutputSchema = z.array(
  z.object({
    step: z.string().describe('A step in the maintenance protocol.'),
    priority: z
      .enum(['baja', 'media', 'alta'])
      .describe('The priority of the maintenance step (baja, media, alta).'),
    percentage: z
      .number()
      .min(0)
      .max(100)
      .describe('The estimated percentage of completion for the step.'),
    imageUrl: z.string().describe('An empty string for the image URL field.')
  })
);
export type SuggestMaintenanceProtocolOutput = z.infer<
  typeof SuggestMaintenanceProtocolOutputSchema
>;

export async function suggestMaintenanceProtocol(
  input: SuggestMaintenanceProtocolInput
): Promise<SuggestMaintenanceProtocolOutput> {
  return suggestMaintenanceProtocolFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMaintenanceProtocolPrompt',
  input: {schema: SuggestMaintenanceProtocolInputSchema},
  output: {schema: SuggestMaintenanceProtocolOutputSchema},
  prompt: `Eres un técnico experto en mantenimiento de equipos electrónicos delicados.

Sugerirás un protocolo de mantenimiento completo y detallado para el equipo dado. El protocolo debe ser exhaustivo y profesional.

Es fundamental que incluyas pasos específicos para la limpieza interna de los componentes. Esto implica:
- Pasos para abrir la carcasa del equipo de forma segura.
- Inspección visual de componentes internos (tarjetas, ventiladores, conectores) para detectar polvo, corrosión o daños como capacitores hinchados.
- Pasos detallados para la limpieza de tarjetas electrónicas y circuitos, recomendando el uso de productos especializados como aire comprimido, alcohol isopropílico y cepillos antiestáticos, y mencionando las precauciones para no dañar los componentes.
- Revisión y limpieza de sistemas de ventilación internos.

Además de la limpieza interna, el protocolo debe cubrir la inspección y mantenimiento externo.

Para cada paso, define su prioridad (baja, media, alta) y un porcentaje estimado de finalización. Devuelve un array JSON de objetos con las claves "step", "priority", "percentage" y "imageUrl" (siempre como un string vacío). Toda la salida de texto, especialmente el valor de "step", debe estar en español.

Estos son los datos del equipo:
Nombre del Equipo: {{{name}}}
Marca: {{{brand}}}
Modelo: {{{model}}}
Tipo: {{{type}}}
Descripción del Equipo: {{{description}}}`,
});

const suggestMaintenanceProtocolFlow = ai.defineFlow(
  {
    name: 'suggestMaintenanceProtocolFlow',
    inputSchema: SuggestMaintenanceProtocolInputSchema,
    outputSchema: SuggestMaintenanceProtocolOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
