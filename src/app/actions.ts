'use server';

import { generateChatResponseStream } from '@/ai/flows/generate-chat-response';
import type { HistoryMessage } from '@/lib/types';
import { summarizeFile } from '@/ai/flows/summarize-file';
import { summarizeImage } from '@/ai/flows/summarize-image';

export async function generateChatResponseAction(prompt: string, history: HistoryMessage[]) {
    return generateChatResponseStream({ prompt, history });
}

export async function summarizeFileAction(fileDataUri: string) {
  try {
    const { summary } = await summarizeFile({ fileDataUri });
    return { success: true, summary };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to summarize file.' };
  }
}

export async function summarizeImageAction(imageDataUri: string) {
  try {
    const { summary } = await summarizeImage({ imageDataUri });
    return { success: true, summary };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to summarize image.' };
  }
}
