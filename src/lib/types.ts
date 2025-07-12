import type { ReactNode } from 'react';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: ReactNode;
};
