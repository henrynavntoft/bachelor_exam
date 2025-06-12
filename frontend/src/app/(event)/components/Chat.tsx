import { useState, useEffect, useRef } from 'react';
import { useEventChat } from '@/hooks/useEventChat';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X, Send, AlertTriangle, CheckCircle2, ArrowDown } from 'lucide-react';
import { ChatMessage } from '@/app/(event)/components/ChatMessage';

interface ChatProps {
    eventId: string;
    hostId: string;
    onClose?: () => void;
}

export default function Chat({ eventId, hostId, onClose }: ChatProps) {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { messages, sendMessage, loading, error, isConnected } = useEventChat(eventId);
    const [text, setText] = useState('');
    const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
    const [isNearBottom, setIsNearBottom] = useState(true);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef(0);

    // Handle initial scroll to bottom
    useEffect(() => {
        if (!loading && messages.length > 0 && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
    }, [loading, messages.length]);

    // Handle new messages and scroll behavior
    useEffect(() => {
        if (messages.length > prevMessagesLengthRef.current) {
            if (isNearBottom) {
                // Only auto-scroll if user is near the bottom
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else {
                // Show indicator if user is scrolled up
                setShowNewMessageIndicator(true);
            }
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages, isNearBottom]);

    // Check if user is near bottom of chat
    const handleScroll = () => {
        if (!chatContainerRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const scrollBottom = scrollHeight - scrollTop - clientHeight;

        // Consider "near bottom" if within 100px of bottom
        setIsNearBottom(scrollBottom < 100);

        // Hide indicator when scrolled to bottom
        if (scrollBottom < 50) {
            setShowNewMessageIndicator(false);
        }
    };

    const handleSendMessage = () => {
        if (text.trim()) {
            sendMessage(text);
            setText('');
            // Scroll to bottom after sending message
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setShowNewMessageIndicator(false);
    };

    // Don't render chat if user is not authenticated
    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <div className="p-4 text-center">Please log in to join the chat.</div>;
    }

    return (
        <div className="flex flex-col relative bg-background h-full w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-2">
                <h3 className="font-medium">Event Chat</h3>
                <div className="flex items-center gap-3">
                    {/* Connection status indicator */}
                    <div className="flex items-center" title={isConnected ? "Connected" : "Disconnected"}>
                        {isConnected ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                    </div>
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Chat messages area */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                onScroll={handleScroll}
            >
                {loading ? (
                    <div className="py-8 text-center flex flex-col items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-brand mb-2" />
                        <span>Loading messages...</span>
                    </div>
                ) : error ? (
                    <div className="py-8 text-center text-destructive flex flex-col items-center gap-2">
                        <AlertTriangle className="h-6 w-6" />
                        <div>{error}</div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.reload()}
                            className="mt-2"
                        >
                            Try reconnecting
                        </Button>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    // Display messages in chronological order
                    messages.map((msg) => (
                        <ChatMessage
                            key={msg.id}
                            id={msg.id}
                            content={msg.content}
                            createdAt={msg.createdAt}
                            user={msg.user}
                            isCurrentUser={msg.user.id === user?.id || msg.user.email === user?.email}
                            isHost={msg.user.id === hostId}
                        />
                    ))
                )}
                {/* Invisible element to scroll to */}
                <div ref={messagesEndRef} />
            </div>

            {/* New messages indicator */}
            {showNewMessageIndicator && (
                <div className="absolute bottom-16 right-4">
                    <Button
                        size="sm"
                        className="rounded-full shadow-md"
                        onClick={scrollToBottom}
                    >
                        <ArrowDown className="h-4 w-4 mr-1" />
                        New messages
                    </Button>
                </div>
            )}

            {/* Message input area */}
            <div className="p-4">
                <div className="flex gap-2">
                    <Input
                        className="flex-1"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={isConnected ? "Type your message..." : "Connecting..."}
                        disabled={!isConnected}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && text.trim()) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!isConnected || !text.trim()}
                        size="icon"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                {!isConnected && (
                    <p className="text-xs text-yellow-500 mt-2 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Connecting to chat...
                    </p>
                )}
            </div>
        </div>
    );
} 