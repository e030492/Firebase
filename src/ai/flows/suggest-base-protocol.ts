'use server';
/**
 * @fileOverview An AI agent that suggests the most relevant base protocol for a given piece of equipment.
 *
 * - suggestBaseProtocol - A function that handles the protocol suggestion process.
 * - SuggestBaseProtocolInput - The input type for the suggestBaseProtocol function.
 * - SuggestBaseProtocolOutput - The return type for the suggestBaseProtocol function.
 */

import {ai} from '@/ai/genkit';
import {Protocol, ProtocolStep, Equipment} from '@/lib/services';
import {z} from 'genkit';

const EquipmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  alias: z.string().optional(),
  description: z.string(),
  brand: z.string(),
  model: z.string(),
  type: z.string(),
  serial: z.string().optional(),
  client: z.string(),
  system: z.string(),
  location: z.string(),
  status: z.enum(['Activo', 'Inactivo', 'En Mantenimiento']),
  maintenanceStartDate: z.string().optional(),
  maintenancePeriodicity: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  ipAddress: z.string().optional(),
  configUser: z.string().optional(),
  configPassword: z.string().optional(),
});

const SuggestBaseProtocolInputSchema = z.object({
  equipment: EquipmentSchema.describe(
    'The specific piece of equipment for which to find similar items.'
  ),
  allEquipments: z
    .array(EquipmentSchema)
    .describe(
      'A list of all available equipments in the inventory to search through.'
    ),
});
export type SuggestBaseProtocolInput = z.infer<
  typeof SuggestBaseProtocolInputSchema
>;

const SuggestBaseProtocolOutputSchema = z
  .array(EquipmentSchema)
  .describe(
    'A list of equipment, including the original, that are similar enough to share a maintenance protocol.'
  );
export type SuggestBaseProtocolOutput = z.infer<
  typeof SuggestBaseProtocolOutputSchema
>;

export async function suggestBaseProtocol(
  input: SuggestBaseProtocolInput
): Promise<SuggestBaseProtocolOutput> {
  // Ensure the original equipment is always in the list and we don't duplicate it.
  const otherEquipments = input.allEquipments.filter(
    e => e.id !== input.equipment.id
  );
  if (otherEquipments.length === 0) {
    return [input.equipment];
  }
  const result = await suggestBaseProtocolFlow({
    ...input,
    allEquipments: otherEquipments,
  });
  // Ensure the original equipment is always included in the final list.
  const resultMap = new Map(result.map(e => [e.id, e]));
  if (!resultMap.has(input.equipment.id)) {
    return [input.equipment, ...result];
  }
  return result;
}

const prompt = ai.definePrompt({
  name: 'suggestBaseProtocolPrompt',
  input: {schema: SuggestBaseProtocolInputSchema},
  output: {schema: SuggestBaseProtocolOutputSchema},
  prompt: `You are an expert system for industrial equipment maintenance. Your task is to identify a group of equipment that can share the same maintenance protocol.

You will be given a primary piece of equipment and a list of all other available equipment in the inventory. Your goal is to return a list of all equipment (including the primary one) that are similar enough to use the same maintenance protocol.

The selection should be based on a fuzzy match of the equipment's characteristics. The most important fields for matching are 'type', 'brand', and 'model'. However, the match should not be strictly identical. For example, different types of cameras like 'Domo PTZ', 'Bala', or 'Mini Domo' can likely share the same base protocol. Similarly, models that only differ slightly in version numbers or minor features (e.g., 'DS-2CD2543G0-IS' vs 'DS-2CD2543G2-I') could also be grouped together.

Critically, analyze the 'name' and 'description' to understand the equipment's function. If the function is the same, they are strong candidates for grouping.

Primary Equipment to find matches for:
- ID: {{{equipment.id}}}
- Name: {{{equipment.name}}}
- Type: {{{equipment.type}}}
- Brand: {{{equipment.brand}}}
- Model: {{{equipment.model}}}
- Description: {{{equipment.description}}}

List of all other available equipment to search through:
{{#each allEquipments}}
- ID: {{{this.id}}}
  - Name: {{{this.name}}}
  - Type: {{{this.type}}}
  - Brand: {{{this.brand}}}
  - Model: {{{this.model}}}
  - Description: {{{this.description}}}
{{/each}}

Based on the provided list, return a JSON array of complete equipment objects that are suitable to share a protocol. The final list MUST include the primary equipment object.`,
});

const suggestBaseProtocolFlow = ai.defineFlow(
  {
    name: 'suggestBaseProtocolFlow',
    inputSchema: SuggestBaseProtocolInputSchema,
    outputSchema: SuggestBaseProtocolOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
