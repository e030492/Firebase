
'use server';
/**
 * @fileOverview An AI agent that suggests the most relevant base protocol for a given piece of equipment.
 *
 * - suggestBaseProtocol - A function that handles the protocol suggestion process.
 * - SuggestBaseProtocolInput - The input type for the suggestBaseProtocol function.
 * - SuggestBaseProtocolOutput - The return type for the suggestBaseProtocol function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SimplifiedEquipmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  brand: z.string(),
  model: z.string(),
  type: z.string(),
});
type SimplifiedEquipment = z.infer<typeof SimplifiedEquipmentSchema>;


const SuggestBaseProtocolInputSchema = z.object({
  equipment: SimplifiedEquipmentSchema.describe(
    'The specific piece of equipment for which to find similar items.'
  ),
  allEquipments: z
    .array(SimplifiedEquipmentSchema)
    .describe(
      'A list of all available equipments in the inventory to search through.'
    ),
});
export type SuggestBaseProtocolInput = z.infer<
  typeof SuggestBaseProtocolInputSchema
>;

const SuggestBaseProtocolOutputSchema = z
  .array(SimplifiedEquipmentSchema)
  .describe(
    'A list of equipment, including the original, that are similar enough to share a maintenance protocol.'
  );
export type SuggestBaseProtocolOutput = z.infer<
  typeof SuggestBaseProtocolOutputSchema
>;

export async function suggestBaseProtocol(
  input: SuggestBaseProtocolInput
): Promise<SuggestBaseProtocolOutput> {
  // If there are no other equipments to compare with, just return the original one.
  if (!input.allEquipments || input.allEquipments.length === 0) {
    return [input.equipment];
  }
  
  const result = await suggestBaseProtocolFlow(input);

  // Fallback in case the AI returns an empty or invalid result
  if (!result || result.length === 0) {
    return [input.equipment];
  }

  // Ensure the original equipment is always included in the final list.
  const resultMap = new Map(result.map(e => [e.id, e]));
  if (!resultMap.has(input.equipment.id)) {
    // Add the original equipment to the beginning of the list if it's not already there.
    return [input.equipment, ...result.filter(e => e.id !== input.equipment.id)];
  }
  return result;
}

const prompt = ai.definePrompt({
  name: 'suggestBaseProtocolPrompt',
  input: {schema: SuggestBaseProtocolInputSchema},
  output: {schema: SuggestBaseProtocolOutputSchema},
  prompt: `You are an expert system for industrial equipment maintenance. Your task is to identify a group of equipment that can share the same maintenance protocol based on a flexible similarity analysis.

You will be given a primary piece of equipment and a list of all other available equipment in the inventory.

**CRITICAL INSTRUCTIONS:**

1.  **Similarity Focus:** Your main goal is to find equipment that is functionally similar. The decision should be based almost exclusively on two fields: \`name\` and \`brand\`.
2.  **Flexible Name Matching:** The \`name\` field does not need to be an exact match. You must group items even if their names differ by up to 40%. This means you should group them if they share the same core function, even with different specifications (like megapixels, sizes, or version numbers).
3.  **De-prioritize Other Fields:** Do NOT require \`model\` or \`type\` to be the same. These fields can vary. For example, a "Domo" camera and a "Bala" camera from the same brand and product line should be grouped together.
4.  **Guiding Principle:** Ask yourself: "Would a technician find it reasonable to apply the same base maintenance checklist to these two items?" If yes, group them.

**EXAMPLES of correct grouping:**
*   "Camara IP 8 MP" and "Camara IP 4 MP" -> **GROUP THEM**. They are both IP cameras.
*   "Camara Domo PTZ" and "Camara Bala" -> **GROUP THEM**. They are both cameras, likely sharing cleaning and inspection protocols.
*   "Lector RFID DS-2CD2543G0-IS" and "Lector RFID DS-2CD2543G2-I" -> **GROUP THEM**. The model variation is minor.

If no other equipment is similar, return an array containing ONLY the primary equipment. The final list MUST always include the primary equipment object.

Primary Equipment to find matches for:
- ID: {{{equipment.id}}}
- Name: {{{equipment.name}}}
- Brand: {{{equipment.brand}}}
- Model: {{{equipment.model}}}
- Type: {{{equipment.type}}}
- Description: {{{equipment.description}}}

List of all other available equipment to search through:
{{#each allEquipments}}
- ID: {{{this.id}}}
  - Name: {{{this.name}}}
  - Brand: {{{this.brand}}}
  - Model: {{{this.model}}}
  - Type: {{{this.type}}}
  - Description: {{{this.description}}}
{{/each}}

Based on the provided list, return a JSON array of equipment objects that are suitable to share a protocol.`,
});

const suggestBaseProtocolFlow = ai.defineFlow(
  {
    name: 'suggestBaseProtocolFlow',
    inputSchema: SuggestBaseProtocolInputSchema,
    outputSchema: SuggestBaseProtocolOutputSchema,
  },
  async input => {
    const response = await prompt(input);
    
    // Handle cases where the model doesn't return a valid structured output.
    if (!response || !response.output) {
      // If the AI fails to return a valid list, return at least the original equipment.
      return [input.equipment];
    }
    return response.output;
  }
);
    
