'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message } from "@/lib/types";
import { ChatMessage, LoadingMessage } from "./chat-message";
import React, { useRef, useEffect } from "react";
import { BotMessageSquare } from "lucide-react";

type ChatLayoutProps = {
  messages: Message[];
  isLoading: boolean;
  inputForm: React.ReactNode;
};

export function ChatLayout({ messages, isLoading, inputForm }: ChatLayoutProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl shadow-primary/10">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <BotMessageSquare className="h-6 w-6 text-primary" />
            Smart AI Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}
                {isLoading && <LoadingMessage />}
                <div ref={messagesEndRef} />
                </div>
            </ScrollArea>
        </CardContent>
        <CardFooter className="pt-6 border-t">
            {inputForm}
        </CardFooter>
      </Card>
    </div>
  );
}
