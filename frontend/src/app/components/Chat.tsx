import { useState, useEffect, useRef } from 'react';
import { useEventChat } from '@/hooks/useEventChat';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from 'lucide-react';
import Image from 'next/image';

interface ChatProps {
    eventId: string;
}

export default function EventChat({ eventId }: ChatProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const { messages, sendMessage, loading, error, isConnected } = useEventChat(eventId);
    const [text, setText] = useState('');
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollAreaRef.current && messages.length > 0) {
            const scrollContainer = scrollAreaRef.current;
            setTimeout(() => {
                const scrollContent = scrollContainer.querySelector('[data-radix-scroll-area-viewport]');
                if (scrollContent) {
                    scrollContent.scrollTop = scrollContent.scrollHeight;
                }
            }, 100);
        }
    }, [messages]);

    // Don't render chat if user is not authenticated
    if (isLoading) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <div className="p-4 text-center">Please log in to join the chat.</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Event Chat</h3>
                <div className={`text-xs px-2 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                    }`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </div>
            </div>

            {loading ? (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">Loading messages...</div>
            ) : error ? (
                <div className="py-8 text-center text-red-500">{error}</div>
            ) : (
                <ScrollArea
                    ref={scrollAreaRef}
                    className="max-h-96 overflow-y-auto border dark:border-gray-700 p-4 rounded-lg bg-gray-50 dark:bg-gray-900"
                    scrollHideDelay={0}
                >
                    {messages.length === 0 ? (
                        <div className="py-8 text-center text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</div>
                    ) : (
                        messages.map((msg) => {
                            const isCurrentUser = msg.user.id === user?.id ||
                                msg.user.email === user?.email;

                            // Determine the profile image URL - safely handling optional fields
                            const profileImageUrl = isCurrentUser
                                ? (user?.profilePicture || null)
                                : (msg.user.image || null);

                            return (
                                <div
                                    key={msg.id}
                                    className={`mb-4 ${isCurrentUser ? 'text-right' : 'text-left'}`}
                                >
                                    <div className={`inline-block max-w-3/4 px-3 py-2 rounded-lg 
                                        ${isCurrentUser
                                            ? 'bg-brand text-primary-foreground'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="h-6 w-6 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden flex items-center justify-center">
                                                {profileImageUrl ? (
                                                    <Image
                                                        src={profileImageUrl}
                                                        alt={`${msg.user.name || 'User'}'s profile`}
                                                        width={25}
                                                        height={25}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                                                )}
                                            </div>
                                            <span className="text-xs font-semibold">
                                                {isCurrentUser ? 'You' : msg.user.name || msg.user.email || 'Unknown'}
                                            </span>
                                        </div>
                                        <p className="text-sm">{msg.content}</p>
                                        <p className="text-xs opacity-75 mt-1">
                                            {new Date(msg.createdAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </ScrollArea>
            )}

            <div className="flex gap-2 mt-4">

                <Input

                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your message..."
                    disabled={!isConnected}
                />
                <Button
                    onClick={() => {
                        if (text.trim()) {
                            sendMessage(text);
                            setText('');
                        }
                    }}
                    disabled={!isConnected || !text.trim()}
                    className=""
                >
                    Send
                </Button>

            </div>
        </div>
    );
}