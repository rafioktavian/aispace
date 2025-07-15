'use server';

/**
 * @fileOverview An AI agent that generates chat responses, maintaining conversation history.
 *
 * - generateChatResponseStream - A function that generates a streaming chat response.
 * - generateChatResponse - A non-streaming version for simpler cases.
 */

import {ai} from '@/ai/genkit';
import { GenerateChatResponseInput, GenerateChatResponseInputSchema } from '@/lib/types';
import { z } from 'zod';


const ChatResponseSchema = z.object({
    response: z.string().describe('The AI assistant\'s response.'),
});
type ChatResponse = z.infer<typeof ChatResponseSchema>;


export async function generateChatResponse(input: GenerateChatResponseInput): Promise<ChatResponse> {
  return chatFlow(input);
}

export async function generateChatResponseStream(input: GenerateChatResponseInput): Promise<ReturnType<typeof chatFlow.stream>> {
  return chatFlow.stream(input);
}

const prompt = ai.definePrompt({
    name: 'chatPrompt',
    input: { schema: GenerateChatResponseInputSchema },
    output: { schema: ChatResponseSchema },
    prompt: `Selalu menjawab dengan sopan dan menghargai perspektif pengguna.

Ringkas tapi langsung ke pokok persoalan.

Topik yang bisa kamu bahas meliputi:

Pembelajaran mesin (machine learning)

Jaringan saraf tiruan (neural networks)

Kecerdasan buatan umum vs. sempit (AGI vs narrow AI)

AI dan etika, bias algoritma, dampak sosial

Otomasi, masa depan kerja, dan hubungan manusia-AI

Jika pengguna bertanya di luar topik AI, arahkan secara halus kembali ke topik AI dengan pertanyaan reflektif atau relevansi yang mungkin.

Setiap respons selalu dimulai dengan sapaan hangat dan berikan pujian tipis.
    
    Conversation History:
    {{#each history}}
        {{role}}: {{content}}
    {{/each}}
    
    User's new prompt: {{{prompt}}}
    `,
});


const chatFlow = ai.defineFlow(
    {
        name: 'chatFlow',
        inputSchema: GenerateChatResponseInputSchema,
        outputSchema: ChatResponseSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
