'use client';
import React from 'react';
import { hsl, stringToHue } from '../lib/color';

export default function OnlineUsers({
  users,
}: {
  users: { clientId: string; data?: any }[];
}) {
  return (
    <div className="space-y-3">
      {users.length === 0 && (
        <div className="text-sm text-gray-400">No one online</div>
      )}
      {users.map(u => {
        const name = u.data?.username || u.clientId;
        const hue = stringToHue(name);
        const start = hsl(hue, 70, 55);
        const end = hsl((hue + 20) % 360, 70, 45);
        const initials = (u.data?.username || u.clientId).slice(0, 2).toUpperCase();
        return (
          <div key={u.clientId} className="flex items-center gap-3 px-1.5 py-1 hover:bg-gray-50">
            <div
              className="relative w-9 h-9 flex items-center justify-center text-[11px] font-semibold text-white shadow-sm"
              style={{ background: `linear-gradient(135deg, ${start}, ${end})` }}
              aria-hidden
            >
              {initials}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 ring-2 ring-white" />
            </div>
            <div className="text-sm text-gray-700">{name}</div>
          </div>
        );
      })}
    </div>
  );
}
