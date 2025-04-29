import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Hash the passwords
    const adminPassword = await bcrypt.hash('Admin123-', 10);
    const hostPassword = await bcrypt.hash('Host123-', 10);
    const guestPassword = await bcrypt.hash('Guest123-', 10);

    // Create Admin User
    await prisma.user.create({
        data: {
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            hashedPassword: adminPassword,
            role: 'ADMIN',
        },
    });

    // Create Host User
    const host = await prisma.user.create({
        data: {
            firstName: 'Host',
            lastName: 'User',
            email: 'host@example.com',
            hashedPassword: hostPassword,
            role: 'HOST',
        },
    });

    // Create Guest User
    const guest = await prisma.user.create({
        data: {
            firstName: 'Guest',
            lastName: 'User',
            email: 'guest@example.com',
            hashedPassword: guestPassword,
            role: 'GUEST',
        },
    });

    // Create Event by Host
    const event = await prisma.event.create({
        data: {
            title: 'Frikadeller Night',
            description: 'Enjoy homemade Danish Frikadeller!',
            images: [], // Required field! Even if empty
            date: new Date('2025-05-01T18:00:00Z'),
            location: 'Copenhagen, Denmark',
            hostId: host.id,
        },
    });

    // Guest attends Event
    await prisma.attendee.create({
        data: {
            userId: guest.id,
            eventId: event.id,
        },
    });

    console.log('🌱 Database seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });