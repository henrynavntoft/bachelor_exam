import { useState, useEffect, useRef } from 'react';
import { useEventChat } from '@/hooks/useEventChat';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

interface ChatProps {
    eventId: string;
}

export default function EventChat({ eventId }: ChatProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const { messages, sendMessage, loading, error, isConnected } = useEventChat(eventId);
    const [text, setText] = useState('');
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to top when new messages arrive (since newest messages are at top)
    useEffect(() => {
        if (scrollAreaRef.current && messages.length > 0) {
            const scrollContainer = scrollAreaRef.current;
            setTimeout(() => {
                const scrollContent = scrollContainer.querySelector('[data-radix-scroll-area-viewport]');
                if (scrollContent) {
                    scrollContent.scrollTop = 0;
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
        <div className="border p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Event Chat</h3>
                <div className={`text-xs px-2 py-1 ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </div>
            </div>

            {loading ? (
                <div className="py-8 text-center">Loading messages...</div>
            ) : error ? (
                <div className="py-8 text-center text-red-500">{error}</div>
            ) : (
                <ScrollArea
                    ref={scrollAreaRef}
                    className="max-h-96 overflow-y-auto border p-4"
                    scrollHideDelay={0}
                >
                    {messages.length === 0 ? (
                        <div className="py-8 text-center">No messages yet. Start the conversation!</div>
                    ) : (
                        // Reverse the messages array to show latest messages first
                        [...messages].reverse().map((msg) => {
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
                                    <div className={`inline-block max-w-3/4 px-3 py-2 
                                        ${isCurrentUser
                                            ? 'bg-brand'
                                            : 'bg-muted'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="h-6 w-6 overflow-hidden flex items-center justify-center">
                                                {profileImageUrl ? (
                                                    <Image
                                                        src={profileImageUrl}
                                                        alt={`${msg.user.name || 'User'}'s profile`}
                                                        width={25}
                                                        height={25}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="h-3 w-3" />
                                                )}
                                            </div>
                                            <span className="text-xs font-semibold">
                                                {isCurrentUser ? 'You' : msg.user.name || msg.user.email || 'Unknown'}
                                            </span>
                                        </div>
                                        <p className="text-sm">{msg.content}</p>
                                        <p className="text-xs opacity-75 mt-1">
                                            {format(new Date(msg.createdAt), 'MMM d, HH:mm')}
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
                    className="flex-1"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your message..."
                    disabled={!isConnected}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && text.trim()) {
                            sendMessage(text);
                            setText('');
                        }
                    }}
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