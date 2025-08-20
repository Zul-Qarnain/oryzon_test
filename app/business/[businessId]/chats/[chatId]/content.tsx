'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Message {
  messageId: string;
  senderType: 'BOT' | 'CUSTOMER' | 'AGENT';
  content: string;
  timestamp: string;
}

export default function ChatContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const chatId = params.chatId as string;

  useEffect(() => {
    if (chatId) {
      fetch(`/api/chats/${chatId}/messages`)
        .then((res) => res.json())
        .then((data) => {
          setMessages(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching messages:', error);
          setLoading(false);
        });
    }
  }, [chatId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chat Details</h1>
      <div className="flex flex-col space-y-2">
        {messages.map((message) => (
          <div
            key={message.messageId}
            className={`p-2 rounded-lg max-w-lg ${
              message.senderType === 'CUSTOMER'
                ? 'bg-blue-500 text-white self-start'
                : 'bg-gray-200 text-black self-end'
            }`}>
            <p>{message.content}</p>
            <p className="text-xs text-right mt-1">{new Date(message.timestamp).toLocaleTimeString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
