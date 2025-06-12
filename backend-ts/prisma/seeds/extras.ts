import { PrismaClient } from '../../generated/prisma';
import { randomUUID } from 'crypto';

export async function seedExtras(prisma: PrismaClient) {
  console.log('Seeding extras into the database...');
  
  try {
    const airline = await prisma.airline.findFirst();
    if (!airline) {
      console.log('No airline found in the database.');
      return;
    }

    const flights = await prisma.flight.findMany();
    if (flights.length === 0) {
      console.log('No flights found in the database.');
      return;
    }

    console.log(`Adding Extras to the database for airline: ${airline.name}`);

    // Check if extras already exist
    const existingExtras = await prisma.extra.findFirst();
    if (existingExtras) {
      console.log('Extras already exist in the database.');
      return;
    }

    // Create extras
    const extraMeal = await prisma.extra.create({
      data: {
        id: randomUUID(),
        name: 'Extra Meal',
        description: 'A delicious extra meal for your flight.',
        airline_id: airline.id,
        required_on_all_segments: false,
        stackable: true
      }
    });

    const extraMonkey = await prisma.extra.create({
      data: {
        id: randomUUID(),
        name: 'Extra Monkey',
        description: 'A delicious extra Monkey for your flight.',
        airline_id: airline.id,
        required_on_all_segments: true,
        stackable: false
      }
    });

    const extraBaggage = await prisma.extra.create({
      data: {
        id: randomUUID(),
        name: 'Additional Baggage',
        description: 'More baggage allowance for your flight.',
        airline_id: airline.id,
        required_on_all_segments: true,
        stackable: true
      }
    });

    const extras = [extraMeal, extraMonkey, extraBaggage];

    // Associate extras with flights
    for (const extra of extras) {
      for (const flight of flights) {
        await prisma.flight_extra.create({
          data: {
            id: randomUUID(),
            flight_id: flight.id,
            extra_id: extra.id,
            limit: 1, // Random limit between 1-5
            price: Math.floor(Math.random() * 91) + 10 // Random price between 10-100
          }
        });
      }
    }

    console.log('✅ Added Extras and Flight Extras to the database.');
  } catch (error) {
    console.error('❌ Error seeding extras:', error);
    throw error;
  }
} 
