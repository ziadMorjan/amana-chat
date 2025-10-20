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
  const [showUsers, setShowUsers] = useState(false);
  const typingSentRef = useRef(false);

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

    const ably = getAblyClient(userId);
    if (!ably) return;
    ablyRef.current = ably;

    const channel = ably.channels.get(CHANNEL_NAME);
    channelRef.current = channel;

    // reflect connection state changes (connect/disconnect)
    setConnected(ably.connection.state === 'connected');
    const onConn = (stateChange: any) => {
      setConnected(stateChange.current === 'connected');
    };
    ably.connection.on(onConn);

    // presence tracking
    async function updatePresence() {
      try {
        const members = await channel.presence.get();
        const map = new Map<string, any>();
        members.forEach((m: any) => {
          // collapse multiple connections with the same clientId
          map.set(m.clientId, { clientId: m.clientId, data: m.data });
        });
        setUsers(Array.from(map.values()));
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

    // Subscribe to new messages live
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
      // remove connection listener
      try { ably.connection.off(onConn); } catch {}
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
    // stop typing once message is sent
    try {
      if (typingSentRef.current) {
        channelRef.current.presence.update({ username, typing: false });
        typingSentRef.current = false;
      }
    } catch {}
  };

  const handleTyping = (typing: boolean) => {
    if (!channelRef.current) return;
    if (typingSentRef.current === typing) return;
    try {
      channelRef.current.presence.update({ username, typing });
      typingSentRef.current = typing;
    } catch {}
  };

  // --- Render
  if (!mounted) {
    return <div className="flex items-center justify-center h-screen">Loading chat...</div>;
  }

  return (
    <div className="flex h-screen relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-neutral-900 dark:to-neutral-950">
      {/* Mobile overlay when users sidebar is open */}
      {showUsers && (
        <div
          className="fixed inset-0 bg-black/30 sm:hidden z-10"
          onClick={() => setShowUsers(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${showUsers ? 'fixed inset-y-0 left-0 z-20' : 'hidden'} sm:static sm:block w-64 bg-white/70 backdrop-blur-md border-r border-gray-200 p-4 flex flex-col shadow-lg`}
      >
        <h2 className="text-lg font-semibold mb-2">Online Users</h2>
        <OnlineUsers users={users} />
        <div className="mt-auto text-xs text-gray-400 border-t pt-2">
          You: <span className="font-medium">{username}</span>
        </div>
      </aside>

      {/* Chat area */}
      <main className="flex-1 flex flex-col bg-white/60 backdrop-blur-sm">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b bg-white/70 backdrop-blur-md">
          <button
            className="sm:hidden px-3 py-1.5 border hover:bg-gray-50"
            onClick={() => setShowUsers(s => !s)}
            aria-label="Toggle users sidebar"
          >
            Users ({users.length})
          </button>
          <div className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">Global Chat</div>
          <div className={`flex items-center gap-2 text-sm ${connected ? 'text-green-600' : 'text-red-500'}`}>
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-600' : 'bg-red-500'}`} />
            {connected ? 'Connected' : 'Disconnected'}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <MessageList messages={messages} currentUserId={userId} />
        </div>

        {/* Composer */}
        <div className="border-t border-gray-200 p-4 bg-white">
          {users.filter(u => u.clientId !== userId && u.data?.typing).length > 0 && (
            <div className="text-xs text-gray-500 mb-2">
              {(() => {
                const typing = users
                  .filter(u => u.clientId !== userId && u.data?.typing)
                  .map(u => u.data?.username || u.clientId);
                if (typing.length === 1) return `${typing[0]} is typing…`;
                if (typing.length === 2) return `${typing[0]} and ${typing[1]} are typing…`;
                return `${typing[0]}, ${typing[1]} and others are typing…`;
              })()}
            </div>
          )}
          <MessageInput onSend={handleSendMessage} onTyping={handleTyping} />
        </div>
      </main>
    </div>
  );
}
