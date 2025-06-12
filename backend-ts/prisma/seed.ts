import { PrismaClient } from '../generated/prisma';
import { seedNations } from './seeds/nations';
import { seedAirports } from './seeds/airports.js';
import { seedAircraft } from './seeds/aircraft.js';
import { seedAirlines, seedAirlineAircrafts } from './seeds/airlines.js';
import { seedUsers } from './seeds/users.js';
import { seedFlights } from './seeds/flights.js';
import { seedExtras } from './seeds/extras.js';
import { seedBookings } from './seeds/bookings.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Seed in the correct order due to foreign key dependencies
    console.log('📍 Seeding nations...');
    await seedNations(prisma);

    console.log('🏢 Seeding airports...');
    await seedAirports(prisma);

    console.log('✈️ Seeding aircraft...');
    await seedAircraft(prisma);

    console.log('🏢 Seeding airlines...');
    await seedAirlines(prisma);

    console.log('🛩️ Seeding airline aircrafts...');
    await seedAirlineAircrafts(prisma);

    console.log('👥 Seeding users...');
    await seedUsers(prisma);

    console.log('🛫 Seeding flights...');
    await seedFlights(prisma);

    console.log('🎁 Seeding extras...');
    await seedExtras(prisma);

    console.log('📋 Seeding bookings...');
    await seedBookings(prisma);

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 
