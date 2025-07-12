'use server';

/**
 * @fileOverview Summarizes the content of a file provided as a data URI.
 *
 * - summarizeFile - A function that summarizes the content of a file.
 * - SummarizeFileInput - The input type for the summarizeFile function.
 * - SummarizeFileOutput - The return type for the summarizeFile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeFileInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The file's content as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SummarizeFileInput = z.infer<typeof SummarizeFileInputSchema>;

const SummarizeFileOutputSchema = z.object({
  summary: z.string().describe('A summary of the file content.'),
});
export type SummarizeFileOutput = z.infer<typeof SummarizeFileOutputSchema>;

export async function summarizeFile(input: SummarizeFileInput): Promise<SummarizeFileOutput> {
  return summarizeFileFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeFilePrompt',
  input: {schema: SummarizeFileInputSchema},
  output: {schema: SummarizeFileOutputSchema},
  prompt: `You are an expert summarizer. Please summarize the content of the following file:

Content: {{fileDataUri}}`,
});

const summarizeFileFlow = ai.defineFlow(
  {
    name: 'summarizeFileFlow',
    inputSchema: SummarizeFileInputSchema,
    outputSchema: SummarizeFileOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
