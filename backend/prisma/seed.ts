import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Hash the passwords
    const adminPassword = await bcrypt.hash('Admin123-', 10);

    // Create Admin User
    await prisma.user.create({
        data: {
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            profilePicture: 'https://robohash.org/BKM.png?set=set1',
            hashedPassword: adminPassword,
            role: 'ADMIN',
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