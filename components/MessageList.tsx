'use client';
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../lib/types';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
}

export default function MessageList({ messages, currentUserId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col space-y-2">
      {messages.map((msg) => {
        const isOwn = msg.userId === currentUserId;
        return (
          <div
            key={msg.id}
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs sm:max-w-md px-4 py-2 rounded-2xl shadow-sm break-words ${
                isOwn
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <p
                className={`text-[10px] mt-1 ${
                  isOwn ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {msg.username} •{' '}
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
