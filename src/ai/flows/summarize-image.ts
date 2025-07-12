'use server';

/**
 * @fileOverview An image summarization AI agent.
 *
 * - summarizeImage - A function that handles the image summarization process.
 * - SummarizeImageInput - The input type for the summarizeImage function.
 * - SummarizeImageOutput - The return type for the summarizeImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SummarizeImageInput = z.infer<typeof SummarizeImageInputSchema>;

const SummarizeImageOutputSchema = z.object({
  summary: z.string().describe('A textual summary of the image.'),
});
export type SummarizeImageOutput = z.infer<typeof SummarizeImageOutputSchema>;

export async function summarizeImage(input: SummarizeImageInput): Promise<SummarizeImageOutput> {
  return summarizeImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeImagePrompt',
  input: {schema: SummarizeImageInputSchema},
  output: {schema: SummarizeImageOutputSchema},
  prompt: `You are an AI that summarizes images.

  Please provide a concise summary of the image.

  Image: {{media url=imageDataUri}}`,
});

const summarizeImageFlow = ai.defineFlow(
  {
    name: 'summarizeImageFlow',
    inputSchema: SummarizeImageInputSchema,
    outputSchema: SummarizeImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
