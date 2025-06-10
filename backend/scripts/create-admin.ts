import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        // Admin details - customize these for your production environment
        const email = 'admin@meetandgreet.com'; // Change this to your desired admin email
        const password = 'AdminPassword123!'; // Change this to a secure password
        const firstName = 'Admin';
        const lastName = 'User';

        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email }
        });

        if (existingAdmin) {
            console.log(`❌ Admin user with email ${email} already exists.`);
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                profilePicture: 'https://robohash.org/ADMIN.png?set=set1',
                hashedPassword,
                role: 'ADMIN',
                isVerified: true,
            },
        });

        console.log('✅ Admin user created successfully!');
        console.log(`📧 Email: ${admin.email}`);
        console.log(`🔑 Password: ${password}`);
        console.log(`🆔 User ID: ${admin.id}`);
        console.log('⚠️  Please change the password after first login!');
        
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin(); 