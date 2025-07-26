'use server';
/**
 * @fileOverview An AI agent that generates an image for a piece of equipment.
 *
 * - generateEquipmentImage - A function that handles the image generation process.
 * - GenerateEquipmentImageInput - The input type for the generateEquipmentImage function.
 * - GenerateEquipmentImageOutput - The return type for the generateEquipmentImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const GenerateEquipmentImageInputSchema = z.object({
  name: z.string().describe('The name of the equipment.'),
  brand: z.string().describe('The brand of the equipment.'),
  model: z.string().describe('The model of the equipment.'),
  type: z.string().describe('The type of the equipment.'),
});
export type GenerateEquipmentImageInput = z.infer<typeof GenerateEquipmentImageInputSchema>;

const GenerateEquipmentImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type GenerateEquipmentImageOutput = z.infer<typeof GenerateEquipmentImageOutputSchema>;

export async function generateEquipmentImage(
  input: GenerateEquipmentImageInput
): Promise<GenerateEquipmentImageOutput> {
  return generateEquipmentImageFlow(input);
}

const generateEquipmentImageFlow = ai.defineFlow(
  {
    name: 'generateEquipmentImageFlow',
    inputSchema: GenerateEquipmentImageInputSchema,
    outputSchema: GenerateEquipmentImageOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: googleAI.model('gemini-2.0-flash-preview-image-generation'),
      prompt: `Professional, photorealistic image of a piece of equipment for a product catalog. The equipment is a ${input.type} named "${input.name}", brand ${input.brand}, model ${input.model}. The image should be on a clean, white background, without any text or logos.`,
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
