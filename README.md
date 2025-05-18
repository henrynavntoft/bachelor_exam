# Meet & Greet

A full-stack application for creating, hosting, and attending events. Built with Next.js, Express, PostgreSQL, and Docker.

## 🚀 Features

- **User Authentication**: Secure login, registration, and password reset
- **Event Management**: Create, edit, and manage events as a host
- **Event Discovery**: Browse and join events as a guest
- **Real-time Chat**: Communicate with event hosts and attendees
- **Image Upload**: Store and serve event images
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

### Frontend
- [Next.js 15](https://nextjs.org/) - React framework with SSR/SSG
- [React 19](https://react.dev/) - UI library
- [TailwindCSS 4](https://tailwindcss.com/) - Utility-first CSS framework
- [React Query](https://tanstack.com/query) - Data fetching and caching
- [Zod](https://zod.dev/) - Type validation
- [Socket.io Client](https://socket.io/) - Real-time communication

### Backend
- [Express 5](https://expressjs.com/) - Node.js web application framework
- [Prisma 6](https://www.prisma.io/) - ORM for database access
- [PostgreSQL 17](https://www.postgresql.org/) - Relational database
- [JWT](https://jwt.io/) - Authentication
- [Socket.io](https://socket.io/) - Real-time communication server
- [AWS S3](https://aws.amazon.com/s3/) - Image storage

### Infrastructure
- [Docker](https://www.docker.com/) - Containerization
- [Nginx](https://nginx.org/) - Web server and reverse proxy

## 🏗️ Project Structure

```
.
├── frontend/              # Next.js client application
├── backend/               # Express API server
├── nginx.dev.conf         # Nginx development configuration
├── nginx.prod.conf        # Nginx production configuration
├── compose.yaml           # Docker Compose configuration
└── pgdata/                # PostgreSQL data directory
```

## 🚦 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Environment Setup

1. Create `.env.dev` and `.env.dev` files in both frontend and backend directories with appropriate values.

2. Set the `RTE` environment variable to specify the runtime environment:
   ```bash
   export RTE=dev  # or prod
   ```

### Starting the Application

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## 🔧 Database Management

If you have problems with PostgreSQL and Prisma, it's probably because you need to deploy or migrate the database. Run these commands inside the Docker container:

```bash
# Access the backend container
docker exec -it backend /bin/bash

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# If you need to reset the database (be careful with this in production!)
npx prisma migrate reset
```

## 🧪 Development

### Frontend

```bash
# Access the frontend container
docker exec -it frontend /bin/bash

# Install new dependencies
npm install package-name
```

### Backend

```bash
# Access the backend container
docker exec -it backend /bin/bash

# Run database seed script
npm run seed
```

## 📝 License

[MIT License](LICENSE) 