'use server';

/**
 * @fileOverview An AI agent that generates chat responses, maintaining conversation history.
 *
 * - generateChatResponseStream - A function that generates a streaming chat response.
 */

import {ai} from '@/ai/genkit';
import type { GenerateChatResponseInput } from '@/lib/types';

export async function generateChatResponseStream(input: GenerateChatResponseInput) {
  const {stream} = await ai.generate({
    model: 'googleai/gemini-1.5-flash-latest',
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
