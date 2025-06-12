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

async function runSeedOperation(
  name: string, 
  emoji: string, 
  operation: () => Promise<void>
): Promise<boolean> {
  try {
    console.log(`${emoji} Seeding ${name}...`);
    await operation();
    console.log(`✅ ${name} seeding completed successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ Error seeding ${name}:`, error);
    return false;
  }
}

async function main() {
  console.log('🌱 Starting database seeding...');

  const results: { [key: string]: boolean } = {};

  // Seed in the correct order due to foreign key dependencies
  results['nations'] = await runSeedOperation('nations', '📍', () => seedNations(prisma));
  
  results['airports'] = await runSeedOperation('airports', '🏢', () => seedAirports(prisma));
  
  results['aircraft'] = await runSeedOperation('aircraft', '✈️', () => seedAircraft(prisma));
  
  results['airlines'] = await runSeedOperation('airlines', '🏢', () => seedAirlines(prisma));
  
  results['airline aircrafts'] = await runSeedOperation('airline aircrafts', '🛩️', () => seedAirlineAircrafts(prisma));
  
  results['users'] = await runSeedOperation('users', '👥', () => seedUsers(prisma));
  
  results['flights'] = await runSeedOperation('flights', '🛫', () => seedFlights(prisma));
  
  results['extras'] = await runSeedOperation('extras', '🎁', () => seedExtras(prisma));
  
  results['bookings'] = await runSeedOperation('bookings', '📋', () => seedBookings(prisma));

  // Summary
  console.log('\n📊 Seeding Summary:');
  const successful = Object.entries(results).filter(([_, success]) => success);
  const failed = Object.entries(results).filter(([_, success]) => !success);

  if (successful.length > 0) {
    console.log('✅ Successful operations:');
    successful.forEach(([name]) => console.log(`  - ${name}`));
  }

  if (failed.length > 0) {
    console.log('❌ Failed operations:');
    failed.forEach(([name]) => console.log(`  - ${name}`));
  }

  console.log(`\n🎯 Overall: ${successful.length}/${Object.keys(results).length} operations completed successfully`);

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 
