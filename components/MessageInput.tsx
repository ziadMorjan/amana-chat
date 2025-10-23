'use client';
import React, { useState } from 'react';

export default function MessageInput({
  onSend,
  onTyping,
}: {
  onSend: (text: string) => void;
  onTyping?: (typing: boolean) => void;
}) {
  const [text, setText] = useState('');
  const maxLength = 1000;

  function submit() {
    const value = text.trim();
    if (!value) return;
    onSend(value);
    onTyping?.(false);
    setText('');
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    submit();
  }

  const remaining = maxLength - text.length;
  const disabled = !text.trim();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-3 items-end">
        <input
          value={text}
          onChange={e => {
            const v = e.target.value;
            setText(v);
            if (v.trim().length > 0) {
              onTyping?.(true);
            } else {
              onTyping?.(false);
            }
          }}
          maxLength={maxLength}
          placeholder="Type a message and press Enter"
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring"
        />
        <button
          type="submit"
          disabled={disabled}
          className={`px-4 py-2 rounded-xl transition flex items-center space-x-1 ${
            disabled
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          <span>Send</span>
          <span aria-hidden="true">&rarr;</span>
          <span className="sr-only">Send message</span>
        </button>
      </div>
      <div className="text-xs text-gray-400 select-none">{remaining} characters left</div>
    </form>
  );
}


