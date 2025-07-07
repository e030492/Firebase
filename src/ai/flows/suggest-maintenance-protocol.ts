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
  equipmentName: z.string().describe('The name of the equipment.'),
  equipmentDescription: z.string().describe('The description of the equipment.'),
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
  prompt: `You are an expert maintenance technician.

You will suggest maintenance protocol steps for the given equipment, including the priority (baja, media, alta) and estimated percentage of completion for each step. Return a JSON array of objects with "step", "priority", and "percentage" keys.

Equipment Name: {{{equipmentName}}}
Equipment Description: {{{equipmentDescription}}}`,
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
