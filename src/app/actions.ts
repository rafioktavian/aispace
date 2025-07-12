'use server';

import { generateChatResponse } from '@/ai/flows/generate-chat-response';
import { summarizeFile } from '@/ai/flows/summarize-file';
import { summarizeImage } from '@/ai/flows/summarize-image';

export async function generateChatResponseAction(prompt: string) {
  try {
    const { response } = await generateChatResponse({ prompt });
    return { success: true, response };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to generate chat response.' };
  }
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
