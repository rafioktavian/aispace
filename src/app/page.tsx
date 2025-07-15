'use client';

import { useState, useRef, useTransition, type FormEvent, useEffect } from 'react';
import Image from 'next/image';
import { generateChatResponseAction, summarizeFileAction, summarizeImageAction } from './actions';
import type { Message, HistoryMessage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { readFileAsDataURL } from '@/lib/utils';
import { ChatLayout } from '@/components/chat-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Send, Image as ImageIcon, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (isCameraOpen) {
      const getCameraPermission = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('Camera API is not available in this browser.');
            setHasCameraPermission(false);
            toast({
              variant: 'destructive',
              title: 'Camera Not Supported',
              description: 'Your browser does not support the camera API.',
            });
            return;
        }

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
          });
        }
      };

      getCameraPermission();

      return () => {
        // Stop camera stream when component unmounts or dialog closes
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  }, [isCameraOpen, toast]);


  const handleFileUpload = (ref: React.RefObject<HTMLInputElement>) => {
    ref.current?.click();
  };

  const addMessage = (role: 'user' | 'assistant', content: React.ReactNode, id?: string) => {
    const messageId = id || crypto.randomUUID();
    setMessages((prev) => [...prev, { id: messageId, role, content }]);
    return messageId;
  };
  
  const updateMessage = (id: string, newContent: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === id) {
        const content = typeof msg.content === 'string' ? msg.content + newContent : newContent;
        return { ...msg, content };
      }
      return msg;
    }));
  }
  
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

  const processCapturedImage = (imageDataUri: string) => {
    addMessage('user', (
        <div className="flex flex-col gap-2">
            <p>Describe this captured photo:</p>
            <Image src={imageDataUri} alt="Captured from camera" width={200} height={150} className="rounded-lg" />
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
  }

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUri = canvas.toDataURL('image/jpeg');
            processCapturedImage(dataUri);
            setIsCameraOpen(false);
        }
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;
  
    const userInput = input;
    const currentMessages = [...messages, { id: crypto.randomUUID(), role: 'user' as const, content: userInput }];
    setMessages(currentMessages);
    setInput('');
  
    const assistantMessageId = addMessage('assistant', '');
  
    startTransition(async () => {
      const history: HistoryMessage[] = currentMessages
        .filter(m => typeof m.content === 'string' && m.content.length > 0)
        .map(m => ({
          // Ensure role is either 'user' or 'model'
          role: m.role === 'user' ? 'user' : 'model',
          content: m.content as string,
        }));
        
      try {
        const {stream} = await generateChatResponseAction(userInput, history.slice(0, -1)); // Exclude the current user prompt from history for this call
        for await (const chunk of stream) {
          updateMessage(assistantMessageId, chunk.response ?? '');
        }
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to get a response from the assistant.',
        });
        setMessages(prev => prev.filter(m => m.id !== assistantMessageId));
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
        onClick={() => setIsCameraOpen(true)}
        disabled={isPending}
        aria-label="Take a photo"
      >
        <Camera className="h-5 w-5" />
      </Button>

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

  return (
    <>
      <ChatLayout messages={messages} isLoading={isPending} inputForm={inputForm} />
      <canvas ref={canvasRef} className="hidden"></canvas>
      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Take a Photo</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4">
                <div className="w-full bg-black rounded-md overflow-hidden aspect-video relative">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    {hasCameraPermission === false && (
                         <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Alert variant="destructive" className="w-auto">
                                <AlertTitle>Camera Access Denied</AlertTitle>
                                <AlertDescription>
                                    Please allow camera access to use this feature.
                                </AlertDescription>
                            </Alert>
                         </div>
                    )}
                     {hasCameraPermission === undefined && (
                         <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                           <p className="text-white">Requesting camera permission...</p>
                         </div>
                    )}
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsCameraOpen(false)}>Cancel</Button>
                <Button onClick={handleTakePhoto} disabled={!hasCameraPermission || isPending}>
                    <Camera className="mr-2 h-4 w-4" />
                    Take Photo
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
