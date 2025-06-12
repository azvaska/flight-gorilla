import { PrismaClient } from '../../generated/prisma';
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';

interface AirportRow {
  type: string;
  municipality: string;
  iso_country: string;
  iata_code: string;
  icao_code: string;
  ident: string;
  name: string;
  longitude_deg: string;
  latitude_deg: string;
}

export async function seedAirports(prisma: PrismaClient) {
  console.log('Seeding airports into the database...');
  
  try {
    const csvFilePath = path.join(process.cwd(), 'prisma', 'seeds', 'data', 'airports.csv');
    
    if (!fs.existsSync(csvFilePath)) {
      console.log('airports.csv file not found, skipping airports seeding');
      return;
    }

    const airports: AirportRow[] = [];
    
    // Read CSV file
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row: AirportRow) => {
          if (row.type && row.type.includes('airport')) {
            airports.push(row);
          }
        })
        .on('end', () => resolve())
        .on('error', reject);
    });

    console.log(`Processing ${airports.length} airports...`);

    for (const row of airports) {
      let cityName = row.municipality;
      const nation = await prisma.nation.findFirst({
        where: { alpha2: row.iso_country }
      });

      let iataCode = row.iata_code || null;
      let icaoCode = row.icao_code || row.ident;
      
      if (icaoCode && icaoCode.length !== 4) {
        icaoCode = '';
      }

      if (!cityName) {
        cityName = row.name.split('Airport')[0].trim();
      }

      if (cityName && nation) {
        // Avoid duplicates - find or create city
        let city = await prisma.city.findFirst({
          where: {
            name: cityName,
            nation_id: nation.id
          }
        });

        if (!city) {
          city = await prisma.city.create({
            data: {
              name: cityName,
              nation_id: nation.id
            }
          });
        }

        // Check if airport already exists
        if (iataCode) {
          const existingAirport = await prisma.airport.findFirst({
            where: { iata_code: iataCode }
          });
          
          if (existingAirport) {
            continue;
          }
        }

        // Create airport
        await prisma.airport.create({
          data: {
            name: row.name,
            iata_code: iataCode,
            icao_code: icaoCode || null,
            longitude: parseFloat(row.longitude_deg),
            latitude: parseFloat(row.latitude_deg),
            city_id: city.id
          }
        });
      } else {
        console.log(`City or nation not found for airport: ${row.name}, nation: ${row.iso_country}`);
      }
    }

    console.log('✅ Airports seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding airports:', error);
    throw error;
  }
} 
