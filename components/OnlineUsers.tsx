'use client';
import React from 'react';

export default function OnlineUsers({
  users,
}: {
  users: { clientId: string; data?: any }[];
}) {
  return (
    <div className="space-y-2">
      {users.length === 0 && (
        <div className="text-sm text-gray-400">No one online</div>
      )}
      {users.map(u => (
        <div key={u.clientId} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
            {u.data?.username ? u.data.username.slice(0, 2) : u.clientId.slice(0, 2)}
          </div>
          <div className="text-sm">{u.data?.username || u.clientId}</div>
        </div>
      ))}
    </div>
  );
}
