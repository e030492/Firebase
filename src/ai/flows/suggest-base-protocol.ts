'use server';
/**
 * @fileOverview An AI agent that suggests the most relevant base protocol for a given piece of equipment.
 *
 * - suggestBaseProtocol - A function that handles the protocol suggestion process.
 * - SuggestBaseProtocolInput - The input type for the suggestBaseProtocol function.
 * - SuggestBaseProtocolOutput - The return type for the suggestBaseProtocol function.
 */

import {ai} from '@/ai/genkit';
import {Protocol, ProtocolStep} from '@/lib/services';
import {z} from 'genkit';

const ProtocolStepSchema = z.object({
  step: z.string(),
  priority: z.enum(['baja', 'media', 'alta']),
  percentage: z.number(),
  completion: z.number(),
  notes: z.string(),
  imageUrl: z.string(),
});

const ProtocolSchema = z.object({
  id: z.string(),
  type: z.string(),
  brand: z.string(),
  model: z.string(),
  steps: z.array(ProtocolStepSchema),
});

const SuggestBaseProtocolInputSchema = z.object({
  equipment: z.object({
    name: z.string().describe('The name of the equipment for which to find a protocol.'),
    type: z.string().describe('The type of the equipment.'),
    brand: z.string().describe('The brand of the equipment.'),
    model: z.string().describe('The model of the equipment.'),
  }),
  existingProtocols: z
    .array(ProtocolSchema)
    .describe('A list of all available base protocols to choose from.'),
});
export type SuggestBaseProtocolInput = z.infer<
  typeof SuggestBaseProtocolInputSchema
>;

const SuggestBaseProtocolOutputSchema = z
  .object({
    protocol: ProtocolSchema.nullable().describe(
      'The most relevant protocol from the existing list. Null if no relevant protocol is found.'
    ),
    reason: z
      .string()
      .describe('A brief explanation of why this protocol was chosen.'),
  })
  .describe('The suggested protocol and the reason for the suggestion.');
export type SuggestBaseProtocolOutput = z.infer<
  typeof SuggestBaseProtocolOutputSchema
>;

export async function suggestBaseProtocol(
  input: SuggestBaseProtocolInput
): Promise<SuggestBaseProtocolOutput> {
  return suggestBaseProtocolFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestBaseProtocolPrompt',
  input: {schema: SuggestBaseProtocolInputSchema},
  output: {schema: SuggestBaseProtocolOutputSchema},
  prompt: `You are an expert system for industrial equipment maintenance. Your task is to select the most appropriate base maintenance protocol for a given piece of equipment from a list of existing protocols.

The selection should be based on a fuzzy match of the equipment's characteristics (name, type, brand, model). The goal is to find the *most relevant* existing protocol to avoid creating duplicates. The match does not need to be exact. Prioritize matching the 'type' field, as it is the most critical. For example, different camera types like 'Domo PTZ', 'Bala', or 'Mini Domo' can likely share the same base protocol.

Equipment to find protocol for:
- Name: {{{equipment.name}}}
- Type: {{{equipment.type}}}
- Brand: {{{equipment.brand}}}
- Model: {{{equipment.model}}}

List of available base protocols:
{{#each existingProtocols}}
- ID: {{{this.id}}}
  - Type: {{{this.type}}}
  - Brand: {{{this.brand}}}
  - Model: {{{this.model}}}
  - Steps: {{jsonEncode this.steps}}
{{/each}}

Based on the provided list, identify the single best protocol for the given equipment.

Respond with a JSON object. In the 'protocol' field, place the complete JSON object of the chosen protocol. If no suitable protocol is found from the list, the 'protocol' field should be null. In the 'reason' field, provide a short, one-sentence explanation in Spanish for your choice. For example: "Se eligió este protocolo porque el tipo de equipo 'Domo PTZ' es muy similar al tipo 'Cámara Bala'."`,
});

const suggestBaseProtocolFlow = ai.defineFlow(
  {
    name: 'suggestBaseProtocolFlow',
    inputSchema: SuggestBaseProtocolInputSchema,
    outputSchema: SuggestBaseProtocolOutputSchema,
  },
  async input => {
    if (input.existingProtocols.length === 0) {
      return {
        protocol: null,
        reason: 'No hay protocolos base existentes en el sistema.',
      };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
