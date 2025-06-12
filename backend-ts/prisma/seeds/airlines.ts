import { PrismaClient, classtype } from '../../generated/prisma';
import { randomUUID } from 'crypto';

function generateSeatLayout(rows: number, columns: number, unavailableSeats: string[]): string[] {
  const allSeats: string[] = [];
  
  for (let row = 1; row <= rows; row++) {
    for (let col = 0; col < columns; col++) {
      const seatNumber = `${row}${String.fromCharCode(65 + col)}`;
      allSeats.push(seatNumber);
    }
  }
  
  return allSeats.filter(seat => !unavailableSeats.includes(seat));
}

function generateTailNumber(): string {
  const prefixes = ['N', 'G', 'D', 'C', 'B'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const numbers = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const suffix = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                 String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${prefix}${numbers}${suffix}`;
}

export async function seedAirlines(prisma: PrismaClient) {
  console.log('Seeding airlines into the database...');
  
  try {
    const airlineName = "Sky High Airlines";

    // Check if airline already exists
    const existing = await prisma.airline.findFirst({
      where: { name: airlineName }
    });

    if (existing) {
      console.log(`Airline '${airlineName}' already exists, skipping.`);
      return;
    }

    // Create new airline
    await prisma.airline.create({
      data: {
        id: randomUUID(),
        name: airlineName,
        address: "123 Aviation Blvd, New York, NY",
        zip: "10001",
        nation_id: 1, // Assuming a valid nation ID exists in the database
        email: "contact@skyhighairlines.com",
        website: "https://www.skyhighairlines.com",
        first_class_description: "Luxurious seating with gourmet meals and premium services.",
        business_class_description: "Comfortable seating with excellent meals and services.",
        economy_class_description: "Affordable seating with basic amenities for a comfortable journey."
      }
    });

    console.log(`✅ Created airline '${airlineName}'.`);
  } catch (error) {
    console.error('❌ Error seeding airlines:', error);
    throw error;
  }
}

export async function seedAirlineAircrafts(prisma: PrismaClient) {
  console.log('Seeding airline aircrafts into the database...');
  
  try {
    // Get first airline
    const airline = await prisma.airline.findFirst();
    if (!airline) {
      console.log('No airline found in the database.');
      return;
    }

    // Retrieve all aircraft models to associate with the airline
    const aircraftModels = await prisma.aircraft.findMany();

    console.log(`\nAssociating aircraft with airline: ${airline.name}`);
    
    for (const aircraftModel of aircraftModels) {
      // Check if this specific aircraft model is already associated with the airline
      const existingAirlineAircraft = await prisma.airline_aircraft.findFirst({
        where: {
          airline_id: airline.id,
          aircraft_id: aircraftModel.id
        }
      });

      if (existingAirlineAircraft) {
        console.log(`Aircraft model ${aircraftModel.name} (ID: ${aircraftModel.id}) is already associated with airline ${airline.name} (Tail: ${existingAirlineAircraft.tail_number}). Skipping.`);
        continue;
      }

      // Generate all available seats in order (row by row)
      const allAvailableSeats = generateSeatLayout(
        aircraftModel.rows, 
        aircraftModel.columns,
        aircraftModel.unavailable_seats
      );

      // Define proportions for seat classes based on rows
      const totalRows = aircraftModel.rows;
      const firstClassRows = Math.max(1, Math.floor(totalRows * 0.1)); // 10% of rows for first class (at least 1 row)
      const businessClassRows = Math.max(1, Math.floor(totalRows * 0.2)); // 20% of rows for business class (at least 1 row)
      // Economy gets the rest of the rows

      // Get seats for each class in order
      const firstClassSeats = allAvailableSeats.filter(seat => {
        const rowNum = parseInt(seat.slice(0, -1));
        return rowNum <= firstClassRows;
      });

      const businessClassSeats = allAvailableSeats.filter(seat => {
        const rowNum = parseInt(seat.slice(0, -1));
        return rowNum > firstClassRows && rowNum <= (firstClassRows + businessClassRows);
      });

      const economyClassSeats = allAvailableSeats.filter(seat => {
        const rowNum = parseInt(seat.slice(0, -1));
        return rowNum > (firstClassRows + businessClassRows);
      });

      // Generate unique tail number
      let tailNumber = generateTailNumber();
      while (await prisma.airline_aircraft.findFirst({ where: { tail_number: tailNumber } })) {
        tailNumber = generateTailNumber();
      }

      // Create airline aircraft entry
      const airlineAircraftEntry = await prisma.airline_aircraft.create({
        data: {
          id: randomUUID(),
          aircraft_id: aircraftModel.id,
          airline_id: airline.id,
          tail_number: tailNumber
        }
      });

      // Create seat assignments
      const seatData = [
        ...firstClassSeats.map(seat => ({
          airline_aircraft_id: airlineAircraftEntry.id,
          seat_number: seat,
          class_type: classtype.FIRST_CLASS
        })),
        ...businessClassSeats.map(seat => ({
          airline_aircraft_id: airlineAircraftEntry.id,
          seat_number: seat,
          class_type: classtype.BUSINESS_CLASS
        })),
        ...economyClassSeats.map(seat => ({
          airline_aircraft_id: airlineAircraftEntry.id,
          seat_number: seat,
          class_type: classtype.ECONOMY_CLASS
        }))
      ];

      await prisma.airline_aircraft_seat.createMany({
        data: seatData
      });

      console.log(`✅ Associated aircraft ${aircraftModel.name} (ID: ${aircraftModel.id}) with airline ${airline.name} (Tail: ${tailNumber})`);
    }

    console.log('✅ Airline aircrafts seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding airline aircrafts:', error);
    throw error;
  }
} 
