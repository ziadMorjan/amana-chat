'use client';
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../lib/types';
import { hsl, stringToHue } from '../lib/color';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
}

export default function MessageList({ messages, currentUserId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col gap-3 px-3 sm:px-4 py-2">
      {messages.map((msg, idx) => {
        const isOwn = msg.userId === currentUserId;
        const name = msg.username || 'Unknown';
        const hue = stringToHue(name);
        const start = hsl(hue, 70, 55);
        const end = hsl((hue + 20) % 360, 70, 45);
        const initials = name.slice(0, 2).toUpperCase();

        const prev = idx > 0 ? messages[idx - 1] : undefined;
        const sameAuthorRecent = !!(
          prev && prev.userId === msg.userId && msg.timestamp - prev.timestamp < 5 * 60 * 1000
        );

        return (
          <div
            key={msg.id}
            className={`flex items-end ${sameAuthorRecent ? 'gap-2' : 'gap-3 sm:gap-4'} ${
              isOwn ? 'justify-end' : 'justify-start'
            }`}
          >
            {!isOwn && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shadow-sm"
                style={{ background: `linear-gradient(135deg, ${start}, ${end})` }}
                aria-hidden
              >
                {initials}
              </div>
            )}

            <div
              className={`max-w-[78%] sm:max-w-[70%] ${
                sameAuthorRecent ? 'px-3 py-2' : 'px-3.5 py-2.5 sm:px-4 sm:py-3'
              } rounded-2xl shadow-sm break-words border ${
                isOwn
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-500/30 rounded-br-none'
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 border-gray-200/60 rounded-bl-none'
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.text}</p>
              {!sameAuthorRecent && (
                <p className={`text-[10px] mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                  {name} -{' '}
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>

            {isOwn && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shadow-sm"
                style={{ background: `linear-gradient(135deg, ${start}, ${end})` }}
                aria-hidden
              >
                {initials}
              </div>
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

