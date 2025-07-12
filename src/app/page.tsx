'use client';

import { useState, useRef, useTransition, type FormEvent } from 'react';
import Image from 'next/image';
import { generateChatResponseAction, summarizeFileAction, summarizeImageAction } from './actions';
import type { Message } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { readFileAsDataURL } from '@/lib/utils';
import { ChatLayout } from '@/components/chat-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, Image as ImageIcon, FileText } from 'lucide-react';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (ref: React.RefObject<HTMLInputElement>) => {
    ref.current?.click();
  };

  const addMessage = (role: 'user' | 'assistant', content: React.ReactNode) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, content }]);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    addMessage('user', (
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4" />
        <span>Summarize: {file.name}</span>
      </div>
    ));

    startTransition(async () => {
      try {
        const fileDataUri = await readFileAsDataURL(file);
        const result = await summarizeFileAction(fileDataUri);
        if (result.success) {
          addMessage('assistant', result.summary);
        } else {
          toast({ variant: 'destructive', title: 'Error', description: result.error });
          setMessages(prev => prev.slice(0, -1)); 
        }
      } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not process the file.' });
        setMessages(prev => prev.slice(0, -1));
      }
    });
    event.target.value = ''; 
  };
  
  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imageDataUri = await readFileAsDataURL(file);
      addMessage('user', (
        <div className="flex flex-col gap-2">
            <p>Describe this image:</p>
            <Image src={imageDataUri} alt={file.name} width={200} height={200} className="rounded-lg" />
        </div>
      ));

      startTransition(async () => {
        const result = await summarizeImageAction(imageDataUri);
        if (result.success) {
          addMessage('assistant', result.summary);
        } else {
          toast({ variant: 'destructive', title: 'Error', description: result.error });
          setMessages(prev => prev.slice(0, -1));
        }
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not process the image.' });
      setMessages(prev => prev.slice(0, -1));
    }
    event.target.value = '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userInput = input;
    setInput('');
    addMessage('user', userInput);

    startTransition(async () => {
      const result = await generateChatResponseAction(userInput);
      if (result.success) {
        addMessage('assistant', result.response);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
        setMessages(prev => prev.slice(0, -1));
      }
    });
  };

  const inputForm = (
    <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 text-muted-foreground hover:text-primary"
        onClick={() => handleFileUpload(imageInputRef)}
        disabled={isPending}
        aria-label="Upload Image"
      >
        <ImageIcon className="h-5 w-5" />
      </Button>
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageChange}
        className="hidden"
        accept="image/*"
        disabled={isPending}
      />
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 text-muted-foreground hover:text-primary"
        onClick={() => handleFileUpload(fileInputRef)}
        disabled={isPending}
        aria-label="Upload File"
      >
        <Paperclip className="h-5 w-5" />
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={isPending}
      />

      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask me anything..."
        className="flex-1"
        disabled={isPending}
        autoFocus
      />
      <Button type="submit" size="icon" disabled={isPending || !input.trim()} aria-label="Send Message">
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );

  return <ChatLayout messages={messages} isLoading={isPending} inputForm={inputForm} />;
}
