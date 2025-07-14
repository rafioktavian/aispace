import { z } from 'zod';
import type { ReactNode } from 'react';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: ReactNode;
};

export const HistoryMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type HistoryMessage = z.infer<typeof HistoryMessageSchema>;

export const GenerateChatResponseInputSchema = z.object({
  prompt: z.string().describe("The user's latest message."),
  history: z.array(HistoryMessageSchema).describe('The conversation history.'),
});
export type GenerateChatResponseInput = z.infer<typeof GenerateChatResponseInputSchema>;
