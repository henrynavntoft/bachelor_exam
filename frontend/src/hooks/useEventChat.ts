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
        image?: string | null;
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

        // Configure Socket.IO client with production-ready settings
        const socket = io({
            // Path is automatically handled by Nginx
            transports: ['websocket', 'polling'],  // Try WebSocket first, fall back to polling
            reconnection: true,                   // Enable reconnection
            reconnectionAttempts: 5,              // Number of reconnection attempts
            reconnectionDelay: 1000,              // Starting delay between reconnection attempts
            reconnectionDelayMax: 5000,           // Maximum delay between attempts
            timeout: 20000,                       // Connection timeout
            autoConnect: true,                    // Connect automatically
            withCredentials: true,                // Send cookies with the request
        });

        socketRef.current = socket;

        // Connection established
        socket.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
            setError(null); // Clear any previous connection errors

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

        // Handle reconnection attempts
        socket.io.on('reconnect_attempt', (attemptNumber) => {
            console.log(`Socket reconnection attempt #${attemptNumber}`);
        });

        // Handle successful reconnection
        socket.io.on('reconnect', () => {
            console.log('Socket reconnected successfully');
            socket.emit('join-event-chat', eventId); // Rejoin the event chat room after reconnection
        });

        // Handle maximum reconnection attempts reached
        socket.io.on('reconnect_failed', () => {
            console.error('Socket reconnection failed after maximum attempts');
            setError('Connection lost. Please refresh the page to reconnect.');
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