import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { prisma } from '../config/prisma';
import jwt, { JwtPayload } from 'jsonwebtoken';
import * as cookieModule from 'cookie';

// Reuse the JWT secret from your auth middleware
const JWT_SECRET = process.env.JWT_SECRET || '';
if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET environment variable is not defined for SocketService.');
}

interface AuthenticatedSocket extends Socket {
    userId?: string;
    role?: string;
}

interface DecodedToken extends JwtPayload {
    userId: string;
    role: string;
    iat?: number;
    exp?: number;
}

export class SocketService {
    private io: SocketIOServer;

    constructor(httpServer: HTTPServer) {
        console.log('Initializing SocketService...');

        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: true, // Allow all origins - cookies will restrict this anyway
                methods: ["GET", "POST"],
                credentials: true, // Important for cookie passing
            },
            // The path is already correct in your nginx config: /socket.io/
        });

        this.setupAuthMiddleware();
        this.setupEventHandlers();

        console.log('SocketService initialized');
    }

    private setupAuthMiddleware() {
        // Socket.IO middleware that extracts user from cookie-based JWT
        this.io.use((socket: AuthenticatedSocket, next) => {
            try {
                console.log('Socket connection attempt...');

                // Extract cookies from handshake headers
                const cookieHeader = socket.handshake.headers.cookie;

                console.log('Cookie header present:', !!cookieHeader);

                if (!cookieHeader) {
                    console.error('No cookies in request');
                    return next(new Error('Authentication required - no cookies'));
                }

                try {
                    // Parse the cookies string into an object
                    const parsedCookies = cookieModule.parse(cookieHeader);
                    console.log('Cookies parsed successfully, keys:', Object.keys(parsedCookies));

                    const token = parsedCookies.authToken;

                    console.log('authToken cookie present:', !!token);

                    if (!token) {
                        console.error('No authToken cookie found');
                        console.log('Available cookies:', Object.keys(parsedCookies).join(', '));
                        return next(new Error('Authentication token required'));
                    }

                    // Verify the JWT token
                    try {
                        const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

                        // Attach user data to the socket for later use
                        socket.userId = decoded.userId;
                        socket.role = decoded.role;

                        console.log(`Socket authenticated: userId=${socket.userId}, role=${socket.role}`);
                        next();
                    } catch (jwtError) {
                        console.error('Socket JWT verification error:', (jwtError as Error).message);
                        console.error('JWT Secret first 3 chars:', JWT_SECRET.substring(0, 3) + '...');
                        return next(new Error('Invalid authentication token'));
                    }
                } catch (cookieParseError) {
                    console.error('Error parsing cookies:', cookieParseError);
                    return next(new Error('Failed to parse authentication cookies'));
                }
            } catch (error) {
                console.error('Socket authentication error:', error);
                next(new Error('Authentication failed'));
            }
        });
    }

    private setupEventHandlers() {
        this.io.on('connection', (socket: AuthenticatedSocket) => {
            console.log(`User connected: ${socket.id}, userId: ${socket.userId}`);

            // Join event chat room
            socket.on('join-event-chat', async (eventId: string) => {
                if (!socket.userId) {
                    socket.emit('error', 'Authentication required');
                    return;
                }

                try {
                    // Join the room for this event
                    socket.join(eventId);
                    console.log(`User ${socket.id} (${socket.userId}) joined event chat: ${eventId}`);

                    // Fetch recent messages for this event
                    const recentMessages = await prisma.message.findMany({
                        where: { eventId },
                        orderBy: { createdAt: 'desc' },
                        take: 50, // Limit to the last 50 messages
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    profilePicture: true,
                                }
                            }
                        }
                    });

                    // Format messages for the client
                    const formattedMessages = recentMessages.map(msg => ({
                        id: msg.id,
                        content: msg.content,
                        createdAt: msg.createdAt.toISOString(),
                        eventId: msg.eventId,
                        user: {
                            id: msg.user.id,
                            name: `${msg.user.firstName} ${msg.user.lastName}`.trim(),
                            email: msg.user.email,
                        }
                    }));

                    // Send recent messages to just this socket
                    socket.emit('recent-messages', formattedMessages.reverse()); // Reverse to get chronological order
                } catch (error) {
                    console.error('Error joining event chat:', error);
                    socket.emit('error', 'Failed to join event chat');
                }
            });

            // Handle sending a message
            socket.on('send-message', async ({ eventId, content }: { eventId: string, content: string }) => {
                if (!socket.userId) {
                    socket.emit('error', 'Authentication required');
                    return;
                }

                try {
                    // First check if the event exists
                    const eventExists = await prisma.event.findUnique({
                        where: { id: eventId },
                        select: { id: true }
                    });

                    if (!eventExists) {
                        console.error(`Attempted to send message to non-existent event: ${eventId}`);
                        socket.emit('error', 'This event does not exist');
                        return;
                    }

                    // Save message to database only if event exists
                    const savedMessage = await prisma.message.create({
                        data: {
                            content,
                            eventId,
                            userId: socket.userId,
                        },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    profilePicture: true,
                                }
                            }
                        }
                    });

                    // Format and broadcast message to all clients in the event room
                    const messageToEmit = {
                        id: savedMessage.id,
                        content: savedMessage.content,
                        createdAt: savedMessage.createdAt.toISOString(),
                        eventId: savedMessage.eventId,
                        user: {
                            id: savedMessage.user.id,
                            name: `${savedMessage.user.firstName} ${savedMessage.user.lastName}`.trim(),
                            email: savedMessage.user.email,
                        }
                    };

                    this.io.to(eventId).emit('new-message', messageToEmit);
                } catch (error) {
                    console.error('Error sending message:', error);
                    socket.emit('error', 'Failed to send message');
                }
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                console.log(`User disconnected: ${socket.id}`);
            });
        });
    }
} 