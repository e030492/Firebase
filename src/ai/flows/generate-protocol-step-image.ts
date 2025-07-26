'use server';
/**
 * @fileOverview An AI agent that generates an image for a specific maintenance protocol step.
 *
 * - generateProtocolStepImage - A function that handles the image generation process.
 * - GenerateProtocolStepImageInput - The input type for the generateProtocolStepImage function.
 * - GenerateProtocolStepImageOutput - The return type for the generateProtocolStepImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const GenerateProtocolStepImageInputSchema = z.object({
  name: z.string().describe('The name of the equipment.'),
  brand: z.string().describe('The brand of the equipment.'),
  model: z.string().describe('The model of the equipment.'),
  step: z.string().describe('The description of the maintenance protocol step.'),
});
export type GenerateProtocolStepImageInput = z.infer<typeof GenerateProtocolStepImageInputSchema>;

const GenerateProtocolStepImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type GenerateProtocolStepImageOutput = z.infer<typeof GenerateProtocolStepImageOutputSchema>;

export async function generateProtocolStepImage(
  input: GenerateProtocolStepImageInput
): Promise<GenerateProtocolStepImageOutput> {
  return generateProtocolStepImageFlow(input);
}

const generateProtocolStepImageFlow = ai.defineFlow(
  {
    name: 'generateProtocolStepImageFlow',
    inputSchema: GenerateProtocolStepImageInputSchema,
    outputSchema: GenerateProtocolStepImageOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: googleAI.model('gemini-2.0-flash-preview-image-generation'),
      prompt: `Create a technical, photorealistic illustration showing a specific maintenance step for a piece of equipment.
      - Equipment Name: "${input.name}"
      - Brand: ${input.brand}
      - Model: ${input.model}
      - Maintenance Step to Illustrate: "${input.step}"
      
      The image must be a clear, close-up, diagram-style photograph on a clean, solid white background. It must not contain any text, logos, or distracting elements. The primary focus should be on the specific action or component mentioned in the maintenance step.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed to return a valid image.');
    }

    return {imageUrl: media.url};
  }
);
