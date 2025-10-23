'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type * as Ably from 'ably';
import { getAblyClient } from '../lib/ablyClient';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import OnlineUsers from './OnlineUsers';
import { ChatMessage, SessionUser } from '../lib/types';
import { shortId } from '../lib/uuid';

const CHANNEL_NAME = 'global-chat';

type ChatRoomProps = {
  user: SessionUser;
};

export default function ChatRoom({ user }: ChatRoomProps) {
  const router = useRouter();
  const userId = user.id;
  const username = user.name;

  // --- Basic state
  const [mounted, setMounted] = useState(false);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<{ clientId: string; data?: any }[]>([]);
  const [showUsers, setShowUsers] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const typingSentRef = useRef(false);

  const ablyRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Load persisted messages
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;

    async function loadMessages() {
      try {
        const response = await fetch('/api/messages?limit=100', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`Failed to load messages (${response.status})`);
        }
        const data = await response.json();
        if (!cancelled && Array.isArray(data.messages)) {
          setMessages(
            data.messages.map((msg: any) => ({
              id: msg.id,
              userId: msg.userId,
              username: msg.username,
              text: msg.text,
              timestamp: new Date(msg.createdAt).getTime(),
            }))
          );
        }
      } catch (error) {
        console.error('message fetch error', error);
      }
    }

    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [mounted]);

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

    channel.presence
      .enter({ username, email: user.email, typing: false })
      .catch((error: unknown) => {
        console.error('presence.enter error', error);
      });

    // Subscribe to new messages live
    const onMessage = (msg: any) => {
      if (msg.name !== 'chat-message') return;
      setMessages((prev) => [
        ...prev,
        {
          id: msg.data?.messageId || msg.id || shortId('m-'),
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
      channel.presence
        .leave()
        .catch((error: unknown) => {
          if ((error as any)?.message !== 'Connection closed') {
            console.warn('presence.leave error', error);
          }
        });
    };
  }, [mounted, userId, username, user.email]);

  // --- Message sender
  const handleSendMessage = (text: string) => {
    const channel = channelRef.current;
    const value = text.trim();
    if (!channel || !value) return;

    const persistAndPublish = async () => {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: value }),
        });

        if (response.status === 401) {
          router.replace('/login');
          router.refresh();
          return;
        }

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.error || `Message save failed (${response.status})`);
        }

        const data = await response.json();
        const messageId = data?.message?.id || shortId('m-');

        await channel.publish('chat-message', {
          messageId,
          userId,
          username,
          text: value,
        });
      } catch (error) {
        console.error('send message error', error);
      } finally {
        try {
          if (typingSentRef.current) {
            channel.presence.update({ username, email: user.email, typing: false });
          }
        } catch (error) {
          console.error('typing status reset error', error);
        } finally {
          typingSentRef.current = false;
        }
      }
    };

    void persistAndPublish();

    // stop typing once message is sent
    // presence update handled in finally block
  };

  const handleTyping = (typing: boolean) => {
    if (!channelRef.current) return;
    if (typingSentRef.current === typing) return;
    try {
      channelRef.current.presence.update({ username, email: user.email, typing });
      typingSentRef.current = typing;
    } catch {}
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      if (ablyRef.current) {
        try {
          ablyRef.current.close();
        } catch (error) {
          console.error('ably close error', error);
        }
        ablyRef.current = null;
        channelRef.current = null;
      }

      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login');
      router.refresh();
    } catch (error) {
      console.error('logout error', error);
    } finally {
      setLogoutLoading(false);
    }
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
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              className="sm:hidden px-3 py-1.5 border hover:bg-gray-50"
              onClick={() => setShowUsers(s => !s)}
              aria-label="Toggle users sidebar"
            >
              Users ({users.length})
            </button>
            <div className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
              Global Chat
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="hidden sm:flex items-center gap-2 text-gray-600">
              <span className="text-xs uppercase tracking-wide text-gray-400">Signed in</span>
              <span className="font-medium">{username}</span>
            </div>
            <button
              className="px-3 py-1.5 border rounded-md hover:bg-gray-50 disabled:opacity-60"
              onClick={handleLogout}
              disabled={logoutLoading}
            >
              {logoutLoading ? 'Signing out...' : 'Logout'}
            </button>
            <div className={`flex items-center gap-2 ${connected ? 'text-green-600' : 'text-red-500'}`}>
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-600' : 'bg-red-500'}`} />
              {connected ? 'Connected' : 'Disconnected'}
            </div>
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
                if (typing.length === 1) return `${typing[0]} is typing...`;
                if (typing.length === 2) return `${typing[0]} and ${typing[1]} are typing...`;
                return `${typing[0]}, ${typing[1]} and others are typing...`;
              })()}
            </div>
          )}
          <MessageInput onSend={handleSendMessage} onTyping={handleTyping} />
        </div>
      </main>
    </div>
  );
}




