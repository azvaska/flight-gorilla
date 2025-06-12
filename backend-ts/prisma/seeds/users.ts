import { PrismaClient } from '../../generated/prisma';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

async function hashPassword(password: string): Promise<string> {
  // Use bycript
  return await bcrypt.hash(password, 12);
}

export async function seedUsers(prisma: PrismaClient) {
  console.log('Seeding users into the database...');
  
  try {
    // Create roles
    const userRole = await prisma.role.upsert({
      where: { name: 'user' },
      update: {},
      create: {
        name: 'user',
        description: 'Regular user role',
        permissions: JSON.stringify(['user-read', 'user-write'])
      }
    });

    const adminRole = await prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'Administrator role',
        permissions: JSON.stringify(['admin-read', 'admin-write'])
      }
    });

    const airlineAdminRole = await prisma.role.upsert({
      where: { name: 'airline-admin' },
      update: {},
      create: {
        name: 'airline-admin',
        description: 'Airline administrator role',
        permissions: JSON.stringify(['airline-admin-read', 'airline-admin-write'])
      }
    });

    // Create default user
    const existingUser1 = await prisma.user.findFirst({
      where: { email: 'a@a.c' }
    });

    if (!existingUser1) {
      const user1 = await prisma.user.create({
        data: {
          id: randomUUID(),
          email: 'a@a.c',
          password: await hashPassword('a'),
          name: 'tesst',
          surname: 'test',
          zip: '12345',
          address: '123 Test St',
          nation_id: 1, // Assuming a default nation ID exists
          active: true,
          fs_uniquifier: randomUUID().replace(/-/g, '').substring(0, 64)
        }
      });

      await prisma.roles_users.create({
        data: {
          user_id: user1.id,
          role_id: userRole.id
        }
      });

      console.log("✅ Created default user 'a@a.c'.");
    }

    // Create test user
    const existingUser2 = await prisma.user.findFirst({
      where: { email: 'test@test.it' }
    });

    if (!existingUser2) {
      const user2 = await prisma.user.create({
        data: {
          id: randomUUID(),
          email: 'test@test.it',
          password: await hashPassword('test'),
          name: 'Test',
          surname: 'Test',
          zip: '12345',
          address: '123 Test St',
          nation_id: 1, // Assuming a default nation ID exists
          active: true,
          fs_uniquifier: randomUUID().replace(/-/g, '').substring(0, 64)
        }
      });

      await prisma.roles_users.create({
        data: {
          user_id: user2.id,
          role_id: userRole.id
        }
      });

      console.log("✅ Created default user 'test@test.it'.");
    }

    // Create admin user
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@a.c' }
    });

    if (!existingAdmin) {
      const adminUser = await prisma.user.create({
        data: {
          id: randomUUID(),
          email: 'admin@a.c',
          password: await hashPassword('a'),
          name: 'admin',
          surname: 'test',
          active: true,
          fs_uniquifier: randomUUID().replace(/-/g, '').substring(0, 64)
        }
      });

      await prisma.roles_users.create({
        data: {
          user_id: adminUser.id,
          role_id: adminRole.id
        }
      });

      console.log("✅ Created default admin 'admin@a.c'.");
    }

    // Create default airline-admin user associated with existing airline
    const airline = await prisma.airline.findFirst({
      where: { name: 'Sky High Airlines' }
    });

    if (airline) {
      const existingAirlineAdmin = await prisma.user.findFirst({
        where: { email: 'a' }
      });

      if (!existingAirlineAdmin) {
        const airlineAdminUser = await prisma.user.create({
          data: {
            id: randomUUID(),
            email: 'a',
            password: await hashPassword('a'),
            name: 'Sky',
            surname: 'test',
            zip: '12345',
            address: '123 Sky St',
            nation_id: 1, // Assuming a default nation ID exists
            airline_id: airline.id,
            active: true,
            fs_uniquifier: randomUUID().replace(/-/g, '').substring(0, 64)
          }
        });

        await prisma.roles_users.create({
          data: {
            user_id: airlineAdminUser.id,
            role_id: airlineAdminRole.id
          }
        });

        console.log("✅ Created default airline-admin user 'a'.");
      }
    }

    console.log('✅ Users seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
} 
