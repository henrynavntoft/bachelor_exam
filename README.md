# Meet & Greet

A modern social dining platform where users can host and join community meals with real-time chat and ratings.

## 🛠️ Tech Stack

**Frontend:** Next.js 15, React 19, Tailwind CSS, Radix UI, Socket.IO  
**Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL, AWS S3  
**Infrastructure:** Docker, Nginx, Let's Encrypt SSL

## 🚀 Quick Start

1. **Clone and setup environment:**
```bash
git clone <repo-url>
cd bachelor_exam
export RTE=dev  # or 'prod' for production
```

2. **Configure environment files:**
```bash
# Create backend/.env.dev and frontend/.env.dev
# Add your DATABASE_URL, JWT_SECRET, AWS credentials, etc.
```

3. **Run with Docker:**
```bash
docker-compose up --build
```

4. **Access the application:**
- Frontend: http://localhost:80
- Prisma Studio: http://localhost:81

## 📝 Features

- 🍽️ Create and join dining events
- 💬 Real-time event chat
- ⭐ User rating system
- 🔐 Complete authentication flow
- 📱 Responsive modern UI
- 🗺️ Location integration with Mapbox


