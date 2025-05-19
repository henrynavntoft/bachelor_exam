import { useState, useEffect, useRef } from 'react';
import { useEventChat } from '@/hooks/useEventChat';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
        <div className="flex flex-col h-[calc(80vh-8rem)]">
            {/* Chat messages area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
                {loading ? (
                    <div className="py-8 text-center">Loading messages...</div>
                ) : error ? (
                    <div className="py-8 text-center text-red-500">{error}</div>
                ) : messages.length === 0 ? (
                    <div className="py-8 text-center">No messages yet. Start the conversation!</div>
                ) : (
                    // Display messages in chronological order (oldest to newest)
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
                                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg px-4 py-2 
                                        ${isCurrentUser
                                            ? 'bg-brand text-brand-foreground'
                                            : 'bg-muted'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="h-6 w-6 rounded-full overflow-hidden flex items-center justify-center bg-background/10">
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
                                    <p className="text-sm break-words">{msg.content}</p>
                                    <p className="text-xs opacity-75 mt-1 text-right">
                                        {format(new Date(msg.createdAt), 'MMM d, HH:mm')}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                {/* Invisible element to scroll to */}
                <div ref={messagesEndRef} />
            </div>

            {/* Message input area */}
            <div className="p-4 border-t">
                <div className="flex gap-2">
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
                    >
                        Send
                    </Button>
                </div>
                {!isConnected && (
                    <p className="text-xs text-muted-foreground mt-2">
                        Connecting to chat...
                    </p>
                )}
            </div>
        </div>
    );
}