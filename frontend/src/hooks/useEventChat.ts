import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

// Hook that handles event chat functionality
export function useEventChat(eventId: string) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!eventId) return;

        setLoading(true);
        setError(null);

        // Simplest connection - the URL is automatically deduced from window.location
        // This works because nginx serves both frontend and socket.io endpoints from same domain
        const socket = io();

        socketRef.current = socket;

        // Connection established
        socket.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
            // Join the event chat room
            socket.emit('join-event-chat', eventId);
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        // Handle connection errors
        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            setError(`Connection error: ${err.message}`);
            setLoading(false);
        });

        // Handle initial load of recent messages
        socket.on('recent-messages', (recentMessages: Message[]) => {
            console.log('Received recent messages:', recentMessages.length);
            setMessages(recentMessages);
            setLoading(false);
        });

        // Handle new messages
        socket.on('new-message', (message: Message) => {
            setMessages((prev) => [...prev, message]);
        });

        // Handle errors from server
        socket.on('error', (errorMessage: string) => {
            console.error('Socket error from server:', errorMessage);
            setError(errorMessage);
        });

        // Cleanup on unmount
        return () => {
            console.log('Cleaning up socket connection');
            socket.disconnect();
        };
    }, [eventId]);

    // Function to send a message
    const sendMessage = (content: string) => {
        if (!socketRef.current || !isConnected) {
            setError('Cannot send message: not connected');
            return;
        }

        if (!content.trim()) {
            return;
        }

        socketRef.current.emit('send-message', { eventId, content });
    };

    return {
        messages,
        sendMessage,
        loading,
        error,
        isConnected
    };
}