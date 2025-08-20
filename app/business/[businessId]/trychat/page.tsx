"use client";
import React, { useState } from 'react';
import { useTryChatContext } from '@/app/lib/context/TryChatContext';
import { ChatWithIncludes } from '@/backend/services/chats/chats.types';
import { Message } from '@/backend/services/messages/messages.types';

const ChatUI = ({ chat, onBack }: { chat: ChatWithIncludes, onBack: () => void }) => {
    const { sendTestMessage, loading } = useTryChatContext();
    const [message, setMessage] = useState('');
    const [image, setImage] = useState<File | null>(null);

    const handleSend = async () => {
        if (message.trim() || image) {
            let imageUrl: string | undefined;
            if (image) {
                // Implement your image upload logic here and get the URL
                // For now, we'll just use a placeholder
                imageUrl = "https://via.placeholder.com/150";
            }
            await sendTestMessage({ text: message, image: imageUrl });
            setMessage('');
            setImage(null);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center p-4 bg-gray-100 border-b">
                <button onClick={onBack} className="mr-4">Back</button>
                <h2 className="text-xl font-bold">{chat.customer?.fullName || 'Test Chat'}</h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                {chat.messages?.map((msg: Message) => (
                    <div key={msg.messageId} className={`flex ${msg.senderType === 'CUSTOMER' ? 'justify-start' : 'justify-end'} mb-4`}>
                        <div className={`p-2 rounded-lg ${msg.senderType === 'CUSTOMER' ? 'bg-gray-200' : 'bg-blue-500 text-white'}`}>
                            {msg.contentType === 'IMAGE' ? <img src={msg.content} alt="sent" className="max-w-xs" /> : <p>{msg.content}</p>}
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 bg-gray-100 border-t">
                <div className="flex items-center">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1 p-2 border rounded-lg"
                        placeholder="Type a message..."
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
                        className="ml-2"
                    />
                    <button onClick={handleSend} disabled={loading} className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg">
                        {loading ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const TryChatPage = () => {
    const { testChats, newChat, loading, error } = useTryChatContext();
    const [selectedChat, setSelectedChat] = useState<ChatWithIncludes | null>(null);

    if (loading && testChats.length === 0) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="flex h-screen">
            <div className={`w-full md:w-1/3 border-r ${selectedChat ? 'hidden md:block' : 'block'}`}>
                <div className="p-4 border-b">
                    <button onClick={newChat} disabled={loading} className="w-full px-4 py-2 bg-green-500 text-white rounded-lg">
                        {loading ? 'Starting...' : 'New Chat'}
                    </button>
                </div>
                <div className="overflow-y-auto">
                    {testChats.map(chat => (
                        <div key={chat.chatId} onClick={() => setSelectedChat(chat)} className="p-4 border-b cursor-pointer hover:bg-gray-50">
                            <p className="font-bold">{chat.customer?.fullName || 'Test Chat'}</p>
                            <p className="text-sm text-gray-500 truncate">{chat.messages?.[chat.messages.length - 1]?.content}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className={`w-full md:w-2/3 ${selectedChat ? 'block' : 'hidden md:block'}`}>
                {selectedChat ? (
                    <ChatUI chat={selectedChat} onBack={() => setSelectedChat(null)} />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p>Select a chat to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TryChatPage;
