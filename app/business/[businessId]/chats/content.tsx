'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Chat {
  chatId: string;
  platformCustomerId: string;
  lastMessageAt: string;
}

export default function ChatsContent() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const businessId = params.businessId as string;

  useEffect(() => {
    if (businessId) {
      fetch(`/api/businesses/${businessId}/chats`)
        .then((res) => res.json())
        .then((data) => {
          setChats(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching chats:', error);
          setLoading(false);
        });
    }
  }, [businessId]);

  const handleDelete = async (chatId: string) => {
    if (window.confirm('Are you sure you want to delete this chat?')) {
      try {
        const response = await fetch(`/api/chats/${chatId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setChats(chats.filter((chat) => chat.chatId !== chatId));
        } else {
          const data = await response.json();
          console.error('Error deleting chat:', data.error);
        }
      } catch (error) {
        console.error('Error deleting chat:', error);
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chats</h1>
      <div className="grid grid-cols-1 gap-4">
        {chats.map((chat) => (
          <div key={chat.chatId} className="flex items-center justify-between p-4 border rounded-lg">
            <Link href={`/business/${businessId}/chats/${chat.chatId}`} className="flex-grow">
              <div className="block hover:bg-gray-100">
                <p className="font-semibold">Chat with: {chat.platformCustomerId}</p>
                <p className="text-sm text-gray-500">Last message: {new Date(chat.lastMessageAt).toLocaleString()}</p>
              </div>
            </Link>
            <button
              onClick={() => handleDelete(chat.chatId)}
              className="ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
