import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-file.ts';
import '@/ai/flows/summarize-image.ts';
import '@/ai/flows/generate-chat-response.ts';