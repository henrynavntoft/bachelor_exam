import app from './app';
import http from 'http';
import { SocketService } from './services/socketService';

const PORT = process.env.PORT || 4000;

// Create HTTP server
const server = http.createServer(app);

// Initialize socket service with the server
new SocketService(server);

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
