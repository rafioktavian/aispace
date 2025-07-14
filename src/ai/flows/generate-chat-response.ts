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

export async function generateChatResponseStream(input: GenerateChatResponseInput) {
  const {stream} = await ai.generate({
    model: 'googleai/gemini-pro',
    prompt: [
      {
        text: `You are a helpful and friendly AI assistant. Respond to the user's prompt in a conversational manner.`,
      },
      ...input.history.map(msg => ({text: msg.content, role: msg.role})),
      {text: input.prompt},
    ],
    stream: true,
  });

  return stream;
}


const chatPrompt = ai.definePrompt({
    name: 'chatPrompt',
    input: { schema: GenerateChatResponseInputSchema },
    output: { schema: ChatResponseSchema },
    prompt: `You are a helpful and friendly AI assistant. Respond to the user's prompt in a conversational manner.
    
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
        const { output } = await chatPrompt(input);
        return output!;
    }
);