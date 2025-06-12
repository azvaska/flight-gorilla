import { PrismaClient } from '../../generated/prisma';

interface AircraftData {
  name: string;
  rows: number;
  columns: number;
  unavailable_seats: string[];
}

export async function seedAircraft(prisma: PrismaClient) {
  console.log('Seeding aircraft into the database...');
  
  try {
    // List of common aircraft with their configurations
    // Format: (name, rows, columns, unavailable_seats)
    const aircraftData: AircraftData[] = [
      // Wide-body aircraft
      { name: 'Boeing 747-400', rows: 60, columns: 6, unavailable_seats: ['1A'] },  // Jumbo jet with 10-across seating
      { name: 'Boeing 777-300ER', rows: 55, columns: 6, unavailable_seats: [] },  // Long-range wide-body
      { name: 'Airbus A380-800', rows: 70, columns: 6, unavailable_seats: ['1A'] },  // Double-deck super jumbo
      { name: 'Airbus A350-900', rows: 52, columns: 6, unavailable_seats: [] },  // Latest generation wide-body
      { name: 'Airbus A330-300', rows: 50, columns: 6, unavailable_seats: [] },  // Common medium to long-range wide-body

      // Narrow-body aircraft
      { name: 'Boeing 737-800', rows: 32, columns: 6, unavailable_seats: [] },  // Popular short to medium range
      { name: 'Boeing 737 MAX 8', rows: 33, columns: 6, unavailable_seats: [] },  // New generation 737
      { name: 'Airbus A320neo', rows: 31, columns: 6, unavailable_seats: [] },  // New engine option A320
      { name: 'Airbus A321LR', rows: 36, columns: 6, unavailable_seats: [] },  // Long range variant of A321
    ];

    let addedCount = 0;
    
    for (const aircraft of aircraftData) {
      // Check if aircraft already exists
      const existing = await prisma.aircraft.findFirst({
        where: { name: aircraft.name }
      });
      
      if (existing) {
        console.log(`Aircraft ${aircraft.name} already exists, skipping...`);
        continue;
      }

      await prisma.aircraft.create({
        data: {
          name: aircraft.name,
          rows: aircraft.rows,
          columns: aircraft.columns,
          unavailable_seats: aircraft.unavailable_seats
        }
      });
      
      addedCount++;
    }

    console.log(`✅ Added ${addedCount} aircraft models to the database.`);
  } catch (error) {
    console.error('❌ Error seeding aircraft:', error);
    throw error;
  }
} 
