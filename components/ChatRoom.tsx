'use client';
import React, { useEffect, useRef, useState } from 'react';
import type * as Ably from 'ably';
import { getAblyClient } from '../lib/ablyClient';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import OnlineUsers from './OnlineUsers';
import { ChatMessage } from '../lib/types';
import { shortId } from '../lib/uuid';

const CHANNEL_NAME = 'global-chat';

export default function ChatRoom() {
  // --- Basic state
  const [mounted, setMounted] = useState(false);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<{ clientId: string; data?: any }[]>([]);

  const ablyRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);

  // --- Persistent identity
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    // create / restore identity
    const savedUserId = localStorage.getItem('userId');
    const savedUsername = localStorage.getItem('username');

    if (savedUserId && savedUsername) {
      setUserId(savedUserId);
      setUsername(savedUsername);
    } else {
      const newId = shortId('u-');
      const newName = 'User-' + newId.slice(-4);
      setUserId(newId);
      setUsername(newName);
      localStorage.setItem('userId', newId);
      localStorage.setItem('username', newName);
    }

    setMounted(true);
  }, []);

  // --- Main Ably logic
  useEffect(() => {
    if (!mounted || !userId || !username) return;

    const ably = getAblyClient();
    if (!ably) return;
    ablyRef.current = ably;

    const channel = ably.channels.get(CHANNEL_NAME);
    channelRef.current = channel;

    ably.connection.once('connected', () => setConnected(true));

    // presence tracking
    async function updatePresence() {
      try {
        const members = await channel.presence.get();
        setUsers(members.map((m: any) => ({ clientId: m.clientId, data: m.data })));
      } catch (err) {
        console.error('presence.get error', err);
      }
    }

    channel.presence.subscribe(updatePresence);
    updatePresence();
    channel.presence.enter({ username });

    // load previous messages
    (async () => {
      try {
        const page = await channel.history({ limit: 50 });
        if (page?.items) {
          const hist = page.items.map((itm: any) => ({
            id: itm.id || shortId('m-'),
            userId: itm.data?.userId || 'unknown',
            username: itm.data?.username || 'unknown',
            text: itm.data?.text || '',
            timestamp: new Date(itm.timestamp || Date.now()).getTime(),
          }));
          setMessages(hist.reverse());
        }
      } catch (err) {
        console.error('history error', err);
      }
    })();

    // ✅ Subscribe to new messages live
    const onMessage = (msg: any) => {
      if (msg.name !== 'chat-message') return;
      setMessages((prev) => [
        ...prev,
        {
          id: msg.id || shortId('m-'),
          userId: msg.data?.userId,
          username: msg.data?.username,
          text: msg.data?.text,
          timestamp: new Date(msg.timestamp || Date.now()).getTime(),
        },
      ]);
    };
    channel.subscribe('chat-message', onMessage);

    // cleanup
    return () => {
      channel.presence.unsubscribe(updatePresence);
      channel.unsubscribe('chat-message', onMessage);
      try {
        channel.presence.leave();
      } catch {}
    };
  }, [mounted, userId, username]);

  // --- Message sender
  const handleSendMessage = (text: string) => {
    if (!channelRef.current || !text.trim()) return;
    channelRef.current.publish('chat-message', { userId, username, text });
  };

  // --- Render
  if (!mounted) {
    return <div className="flex items-center justify-center h-screen">Loading chat...</div>;
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
        <h2 className="text-lg font-semibold mb-2">Online Users</h2>
        <OnlineUsers users={users} />
        <div className="mt-auto text-xs text-gray-400 border-t pt-2">
          You: <span className="font-medium">{username}</span>
          <div className={`mt-1 ${connected ? 'text-green-600' : 'text-red-500'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </aside>

      {/* Chat area */}
      <main className="flex-1 flex flex-col bg-gray-50">
        <div className="flex-1 overflow-y-auto p-4">
          <MessageList messages={messages} currentUserId={userId} />
        </div>
        <div className="border-t border-gray-200 p-4 bg-white">
          <MessageInput onSend={handleSendMessage} />
        </div>
      </main>
    </div>
  );
}
