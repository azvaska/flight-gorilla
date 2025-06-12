import { PrismaClient } from '../../generated/prisma';
import { randomUUID } from 'crypto';

// Major worldwide airports with realistic data - simplified version
const WORLD_AIRPORTS = {
  // Europe - Major hubs
  'LHR': { name: 'London Heathrow', city: 'London', country: 'UK', lat: 51.4700, lon: -0.4543, timezone_offset: 0 },
  'CDG': { name: 'Charles de Gaulle', city: 'Paris', country: 'France', lat: 49.0097, lon: 2.5479, timezone_offset: 1 },
  'FRA': { name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lon: 8.5622, timezone_offset: 1 },
  'AMS': { name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lon: 4.7683, timezone_offset: 1 },
  'MAD': { name: 'Madrid Barajas', city: 'Madrid', country: 'Spain', lat: 40.4839, lon: -3.5680, timezone_offset: 1 },
  'FCO': { name: 'Rome Fiumicino', city: 'Rome', country: 'Italy', lat: 41.8003, lon: 12.2389, timezone_offset: 1 },
  'MXP': { name: 'Milan Malpensa', city: 'Milan', country: 'Italy', lat: 45.6306, lon: 8.7281, timezone_offset: 1 },
  'VCE': { name: 'Venice Marco Polo', city: 'Venice', country: 'Italy', lat: 45.5053, lon: 12.3519, timezone_offset: 1 },
  'NAP': { name: 'Naples Airport', city: 'Naples', country: 'Italy', lat: 40.8860, lon: 14.2908, timezone_offset: 1 },
  'BCN': { name: 'Barcelona Airport', city: 'Barcelona', country: 'Spain', lat: 41.2974, lon: 2.0833, timezone_offset: 1 },
  
  // International destinations
  'JFK': { name: 'John F Kennedy Intl', city: 'New York', country: 'USA', lat: 40.6413, lon: -73.7781, timezone_offset: -5 },
  'LAX': { name: 'Los Angeles Intl', city: 'Los Angeles', country: 'USA', lat: 34.0522, lon: -118.2437, timezone_offset: -8 },
  'DXB': { name: 'Dubai International', city: 'Dubai', country: 'UAE', lat: 25.2532, lon: 55.3657, timezone_offset: 4 },
  'NRT': { name: 'Tokyo Narita', city: 'Tokyo', country: 'Japan', lat: 35.7720, lon: 140.3928, timezone_offset: 9 },
  'SIN': { name: 'Singapore Changi', city: 'Singapore', country: 'Singapore', lat: 1.3644, lon: 103.9915, timezone_offset: 8 }
};

// Popular European routes (higher frequency)
const POPULAR_EUROPEAN_ROUTES = [
  ['LHR', 'CDG'], ['LHR', 'FRA'], ['LHR', 'AMS'], ['LHR', 'MAD'], ['LHR', 'FCO'],
  ['LHR', 'MXP'], ['LHR', 'BCN'], ['CDG', 'FRA'], ['CDG', 'MAD'], ['CDG', 'FCO'],
  ['FRA', 'FCO'], ['FRA', 'MXP'], ['AMS', 'FCO'], ['AMS', 'MXP'], ['FCO', 'MXP'],
  ['FCO', 'VCE'], ['FCO', 'NAP'], ['MXP', 'VCE'], ['MXP', 'NAP'], ['BCN', 'FCO']
];

// Popular intercontinental routes from Europe
const INTERCONTINENTAL_ROUTES = [
  ['LHR', 'JFK'], ['LHR', 'LAX'], ['LHR', 'DXB'], ['LHR', 'NRT'], ['LHR', 'SIN'],
  ['CDG', 'JFK'], ['CDG', 'LAX'], ['CDG', 'DXB'], ['CDG', 'SIN'], ['CDG', 'NRT'],
  ['FRA', 'JFK'], ['FRA', 'LAX'], ['FRA', 'DXB'], ['FRA', 'SIN'], ['FRA', 'NRT'],
  ['FCO', 'JFK'], ['FCO', 'DXB'], ['FCO', 'NRT'], ['MXP', 'JFK'], ['MXP', 'DXB']
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateFlightDuration(distanceKm: number): number {
  // Average commercial aircraft speed: 850 km/h
  // Add 30 minutes for taxi, takeoff, and landing
  const flightTimeHours = distanceKm / 850;
  const totalTimeMinutes = (flightTimeHours * 60) + 30;
  return Math.round(totalTimeMinutes);
}

function calculateRealisticPrice(distanceKm: number, classType: 'FIRST_CLASS' | 'BUSINESS_CLASS' | 'ECONOMY_CLASS', isPopular = false, isIntercontinental = false): number {
  // Base price calculation
  let basePrice = 50 + (distanceKm * 0.15);
  
  // Route popularity multiplier
  if (isPopular) basePrice *= 1.2;
  if (isIntercontinental) basePrice *= 1.8;
  
  // Class multipliers
  switch (classType) {
    case 'FIRST_CLASS':
      return Math.round(basePrice * 4.5);
    case 'BUSINESS_CLASS':
      return Math.round(basePrice * 2.8);
    case 'ECONOMY_CLASS':
    default:
      return Math.round(basePrice);
  }
}

function generateUniqueFlightNumber(airlineName: string): string {
  // Generate a more robust airline code (2-3 characters)
  const words = airlineName.split(' ').filter(word => word.length > 0);
  let airlineCode = '';
  
  if (words.length >= 2) {
    // Use first 2 letters of first word + first letter of second word
    airlineCode = (words[0].substring(0, 2) + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    // Use first 3 letters of the word
    airlineCode = words[0].substring(0, 3).toUpperCase();
  } else {
    // Fallback
    airlineCode = 'AIR';
  }
  
  // Use a much larger number pool (10000-99999 for 5-digit numbers)
  const number = Math.floor(Math.random() * 90000) + 10000;
  return `${airlineCode}${number}`;
}

function getRealisticDepartureTime(baseDate: Date, isIntercontinental = false): Date {
  const hours = isIntercontinental 
    ? [6, 8, 10, 14, 16, 18, 22, 23] // Long-haul preferred times
    : [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]; // Short-haul spread
  
  const selectedHour = hours[Math.floor(Math.random() * hours.length)];
  const minutes = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
  
  const departureTime = new Date(baseDate);
  departureTime.setHours(selectedHour, minutes, 0, 0);
  
  return departureTime;
}

// Generate a manual flight (from original seed file)
async function generateManualFlight(
  prisma: PrismaClient,
  routeId: number,
  aircraftId: string,
  day = 1,
  hour = 12,
  minute = 0,
  durationHour = 1
) {
  const departureTime = new Date(2026, 0, day, hour, minute, 0); // Month is 0-indexed
  const arrivalTime = new Date(departureTime.getTime() + (durationHour * 60 + 30) * 60000); // Add duration + 30 min

  await prisma.flight.create({
    data: {
      id: randomUUID(),
      route_id: routeId,
      aircraft_id: aircraftId,
      departure_time: departureTime,
      arrival_time: arrivalTime,
      checkin_start_time: new Date(departureTime.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
      checkin_end_time: new Date(departureTime.getTime() - 60 * 60 * 1000), // 1 hour before
      boarding_start_time: new Date(departureTime.getTime() - 30 * 60 * 1000), // 30 min before
      boarding_end_time: new Date(departureTime.getTime() - 15 * 60 * 1000), // 15 min before
      gate: `A${Math.floor(Math.random() * 20) + 1}`,
      terminal: (Math.floor(Math.random() * 3) + 1).toString(),
      price_economy_class: Math.round((Math.random() * 400 + 100) * 100) / 100, // 100-500
      price_business_class: Math.round((Math.random() * 1000 + 500) * 100) / 100, // 500-1500
      price_first_class: Math.round((Math.random() * 1500 + 1500) * 100) / 100, // 1500-3000
      price_insurance: Math.round((Math.random() * 80 + 20) * 100) / 100, // 20-100
      fully_booked: false
    }
  });
}

// Create original test flights (from original seed file)
async function createOriginalTestFlights(prisma: PrismaClient): Promise<number> {
  console.log('\n🔧 Creating original test flights for development...');
  
  // Get first airline
  const airline = await prisma.airline.findFirst();
  if (!airline) {
    console.log('No airlines found. Cannot create original test flights.');
    return 0;
  }

  // Get airline aircraft
  const airlineAircraft = await prisma.airline_aircraft.findFirst({
    where: { airline_id: airline.id }
  });
  const airlineAircraftSec = await prisma.airline_aircraft.findFirst({
    where: { airline_id: airline.id },
    skip: 1
  });

  if (!airlineAircraft) {
    console.log('No aircraft found for airline. Cannot create original test flights.');
    return 0;
  }

  let originalFlightsCreated = 0;

  // Get all airports for random route generation
  const allAirports = await prisma.airport.findMany();
  if (allAirports.length < 5) {
    console.log('Not enough airports for original test flights.');
    return 0;
  }

  // Generate flights for each aircraft (original logic)
  const allAirlineAircraft = await prisma.airline_aircraft.findMany({
    where: { airline_id: airline.id }
  });

  for (const aircraft of allAirlineAircraft) {
    // Randomly generate a route
    let departureAirport = allAirports[Math.floor(Math.random() * allAirports.length)];
    let arrivalAirport = allAirports[Math.floor(Math.random() * allAirports.length)];
    
    // Ensure different airports
    while (arrivalAirport.id === departureAirport.id) {
      arrivalAirport = allAirports[Math.floor(Math.random() * allAirports.length)];
    }

    const route = await prisma.route.create({
      data: {
        departure_airport_id: departureAirport.id,
        arrival_airport_id: arrivalAirport.id,
        airline_id: airline.id,
        flight_number: `${aircraft.tail_number}${Math.floor(Math.random() * 900) + 100}`,
        period_start: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    });

    // Generate random departure time within the next 30 days
    const departureTime = new Date(
      Date.now() + 
      Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000 + // Random days (1-30)
      Math.floor(Math.random() * 24) * 60 * 60 * 1000 + // Random hours
      Math.floor(Math.random() * 60) * 60 * 1000 // Random minutes
    );

    // Generate random flight duration (1 to 10 hours)
    const flightDurationHours = Math.floor(Math.random() * 10) + 1;
    const flightDurationMinutes = Math.floor(Math.random() * 60);
    const arrivalTime = new Date(
      departureTime.getTime() + 
      flightDurationHours * 60 * 60 * 1000 + 
      flightDurationMinutes * 60 * 1000
    );

    await prisma.flight.create({
      data: {
        id: randomUUID(),
        route_id: route.id,
        aircraft_id: aircraft.id,
        departure_time: departureTime,
        arrival_time: arrivalTime,
        checkin_start_time: new Date(departureTime.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
        checkin_end_time: new Date(departureTime.getTime() - 30 * 60 * 1000), // 30 min before
        boarding_start_time: new Date(departureTime.getTime() - 30 * 60 * 1000), // 30 min before
        boarding_end_time: new Date(departureTime.getTime() - 15 * 60 * 1000), // 15 min before
        gate: `A${Math.floor(Math.random() * 20) + 1}`,
        terminal: (Math.floor(Math.random() * 3) + 1).toString(),
        price_economy_class: Math.round((Math.random() * 400 + 100) * 100) / 100, // 100-500
        price_business_class: Math.round((Math.random() * 1000 + 500) * 100) / 100, // 500-1500
        price_first_class: Math.round((Math.random() * 1500 + 1500) * 100) / 100, // 1500-3000
        price_insurance: Math.round((Math.random() * 80 + 20) * 100) / 100, // 20-100
        fully_booked: false
      }
    });

    originalFlightsCreated++;
    
    console.log(`Created original flight ${route.flight_number} from ${departureAirport.iata_code || departureAirport.name} to ${arrivalAirport.iata_code || arrivalAirport.name}`);
  }

  // Create specific test routes (from original seed file)
  if (allAirports.length >= 5) {
    const testRoutesData = [
      { dep: 1, arr: 2, flight_num: '123', day: 1, hour: 12, duration: 1 },
      { dep: 1, arr: 2, flight_num: '1N2', day: 1, hour: 2, duration: 1 },
      { dep: 2, arr: 3, flight_num: '2N3', day: 1, hour: 6, duration: 1 },
      { dep: 2, arr: 3, flight_num: '2N3S', day: 1, hour: 6, duration: 0 },
      { dep: 3, arr: 4, flight_num: '3N4', day: 1, hour: 11, duration: 1 },
      { dep: 3, arr: 4, flight_num: '3N4B', day: 1, hour: 10, duration: 0 },
      { dep: 1, arr: 5, flight_num: '1N5', day: 1, hour: 3, duration: 1 },
      { dep: 5, arr: 4, flight_num: '5N4', day: 1, hour: 8, duration: 1 },
      { dep: 1, arr: 4, flight_num: '1N4', day: 1, hour: 9, duration: 1 },
      { dep: 4, arr: 1, flight_num: '4N1', day: 3, hour: 10, duration: 1 }
    ];

    for (const routeData of testRoutesData) {
      // Check if airports exist (using 1-based indexing from Python)
      if (routeData.dep <= allAirports.length && routeData.arr <= allAirports.length) {
        const route = await prisma.route.create({
          data: {
            departure_airport_id: allAirports[routeData.dep - 1].id, // Convert to 0-based index
            arrival_airport_id: allAirports[routeData.arr - 1].id, // Convert to 0-based index
            airline_id: airline.id,
            flight_number: routeData.flight_num,
            period_start: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
            period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          }
        });

        // Choose aircraft based on flight number (same logic as Python)
        const aircraftToUse = (routeData.flight_num.includes('S') || routeData.flight_num.includes('B')) 
          ? (airlineAircraftSec || airlineAircraft) 
          : airlineAircraft;

        await generateManualFlight(
          prisma,
          route.id,
          aircraftToUse.id,
          routeData.day,
          routeData.hour,
          0,
          routeData.duration
        );

        originalFlightsCreated++;
        
        console.log(`Created test route ${routeData.flight_num}: Airport ${routeData.dep} → Airport ${routeData.arr}`);
      }
    }
  }

  return originalFlightsCreated;
}

export async function seedFlights(prisma: PrismaClient) {
  console.log('Seeding flights into the database...');
  
  try {
    // Create original test flights first
    try {
      const originalCount = await createOriginalTestFlights(prisma);
      console.log(`✅ Created ${originalCount} original test flights`);
    } catch (error) {
      console.error('❌ Error creating original test flights:', error);
    }

    const airline = await prisma.airline.findFirst();
    if (!airline) {
      console.log('No airline found in the database.');
      return;
    }

    const aircrafts = await prisma.airline_aircraft.findMany({
      include: { aircraft: true }
    });

    if (aircrafts.length === 0) {
      console.log('No airline aircrafts found in the database.');
      return;
    }

    // Get or create airports for our routes
    const airportMap = new Map<string, any>();
    
    for (const [iataCode, airportData] of Object.entries(WORLD_AIRPORTS)) {
      let airport = await prisma.airport.findFirst({
        where: { iata_code: iataCode }
      });
      
      if (!airport) {
        // Create a basic city and nation if they don't exist
        let nation = await prisma.nation.findFirst({
          where: { name: airportData.country }
        });
        
        if (!nation) {
          nation = await prisma.nation.create({
            data: {
              name: airportData.country,
              code: airportData.country.toUpperCase(),
              alpha2: airportData.country.substring(0, 2).toUpperCase()
            }
          });
        }
        
        let city = await prisma.city.findFirst({
          where: { 
            name: airportData.city,
            nation_id: nation.id
          }
        });
        
        if (!city) {
          city = await prisma.city.create({
            data: {
              name: airportData.city,
              nation_id: nation.id
            }
          });
        }
        
        airport = await prisma.airport.create({
          data: {
            name: airportData.name,
            iata_code: iataCode,
            latitude: airportData.lat,
            longitude: airportData.lon,
            city_id: city.id
          }
        });
      }
      
      airportMap.set(iataCode, airport);
    }

    console.log(`Processing routes with ${aircrafts.length} aircraft...`);

    // Generate flights across the entire year (2025)
    const currentYear = new Date().getFullYear();
    const baseDate = new Date(currentYear, 0, 1); // Start from January 1st of current year

    let routeCount = 0;
    const maxRoutes = 120; // Increased for more comprehensive data

    // Generate European routes with multiple flights per month
    for (const [depIata, arrIata] of POPULAR_EUROPEAN_ROUTES) {
      if (routeCount >= maxRoutes) break;
      
      const depAirport = airportMap.get(depIata);
      const arrAirport = airportMap.get(arrIata);
      
      if (!depAirport || !arrAirport) continue;

      const aircraft = aircrafts[Math.floor(Math.random() * aircrafts.length)];
      const distance = calculateDistance(
        depAirport.latitude, depAirport.longitude,
        arrAirport.latitude, arrAirport.longitude
      );

      // Create route with year-long period
      const flightNumber = generateUniqueFlightNumber(airline.name);
      const periodStart = new Date(currentYear, 0, 1); // January 1st
      const periodEnd = new Date(currentYear, 11, 31); // December 31st

      const route = await prisma.route.create({
        data: {
          flight_number: flightNumber,
          departure_airport_id: depAirport.id,
          arrival_airport_id: arrAirport.id,
          airline_id: airline.id,
          period_start: periodStart,
          period_end: periodEnd
        }
      });

      // Create multiple flights spread across all 12 months (2-4 flights per month for popular routes)
      const flightsPerMonth = Math.floor(Math.random() * 3) + 2; // 2-4 flights per month
      
      for (let month = 0; month < 12; month++) {
        for (let flightInMonth = 0; flightInMonth < flightsPerMonth; flightInMonth++) {
          // Random day within the month
          const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
          const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
          
          const flightDate = new Date(currentYear, month, randomDay);
          
          const departureTime = getRealisticDepartureTime(flightDate, false);
          const durationMinutes = calculateFlightDuration(distance);
          const arrivalTime = new Date(departureTime.getTime() + (durationMinutes * 60000));
          
          // Check-in and boarding times
          const checkinStartTime = new Date(departureTime.getTime() - (2 * 60 * 60 * 1000)); // 2 hours before
          const checkinEndTime = new Date(departureTime.getTime() - (30 * 60 * 1000)); // 30 min before
          const boardingStartTime = new Date(departureTime.getTime() - (45 * 60 * 1000)); // 45 min before
          const boardingEndTime = new Date(departureTime.getTime() - (10 * 60 * 1000)); // 10 min before

          // Calculate prices with seasonal variation
          const seasonalMultiplier = month >= 5 && month <= 8 ? 1.3 : 1.0; // Summer premium
          const economyPrice = calculateRealisticPrice(distance, 'ECONOMY_CLASS', true, false) * seasonalMultiplier;
          const businessPrice = calculateRealisticPrice(distance, 'BUSINESS_CLASS', true, false) * seasonalMultiplier;
          const firstPrice = calculateRealisticPrice(distance, 'FIRST_CLASS', true, false) * seasonalMultiplier;

          await prisma.flight.create({
            data: {
              id: randomUUID(),
              route_id: route.id,
              aircraft_id: aircraft.id,
              departure_time: departureTime,
              arrival_time: arrivalTime,
              checkin_start_time: checkinStartTime,
              checkin_end_time: checkinEndTime,
              boarding_start_time: boardingStartTime,
              boarding_end_time: boardingEndTime,
              gate: `A${Math.floor(Math.random() * 20) + 1}`,
              terminal: (Math.floor(Math.random() * 3) + 1).toString(),
              price_first_class: Math.round(firstPrice),
              price_business_class: Math.round(businessPrice),
              price_economy_class: Math.round(economyPrice),
              price_insurance: Math.round(economyPrice * 0.1),
              fully_booked: false
            }
          });
        }
      }

      routeCount++;
    }

    // Generate intercontinental routes with flights throughout the year
    const maxInterRoutes = 40; // Increased for more data
    let interRouteCount = 0;

    for (const [depIata, arrIata] of INTERCONTINENTAL_ROUTES) {
      if (interRouteCount >= maxInterRoutes) break;
      
      const depAirport = airportMap.get(depIata);
      const arrAirport = airportMap.get(arrIata);
      
      if (!depAirport || !arrAirport) continue;

      const aircraft = aircrafts[Math.floor(Math.random() * aircrafts.length)];
      const distance = calculateDistance(
        depAirport.latitude, depAirport.longitude,
        arrAirport.latitude, arrAirport.longitude
      );

      // Create route with year-long period
      const flightNumber = generateUniqueFlightNumber(airline.name);
      const periodStart = new Date(currentYear, 0, 1);
      const periodEnd = new Date(currentYear, 11, 31);

      const route = await prisma.route.create({
        data: {
          flight_number: flightNumber,
          departure_airport_id: depAirport.id,
          arrival_airport_id: arrAirport.id,
          airline_id: airline.id,
          period_start: periodStart,
          period_end: periodEnd
        }
      });

      // Create 1-2 flights per month for intercontinental routes
      const flightsPerMonth = Math.floor(Math.random() * 2) + 1; // 1-2 flights per month
      
      for (let month = 0; month < 12; month++) {
        for (let flightInMonth = 0; flightInMonth < flightsPerMonth; flightInMonth++) {
          const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
          const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
          
          const flightDate = new Date(currentYear, month, randomDay);
          
          const departureTime = getRealisticDepartureTime(flightDate, true);
          const durationMinutes = calculateFlightDuration(distance);
          const arrivalTime = new Date(departureTime.getTime() + (durationMinutes * 60000));
          
          // Longer check-in times for international flights
          const checkinStartTime = new Date(departureTime.getTime() - (3 * 60 * 60 * 1000)); // 3 hours before
          const checkinEndTime = new Date(departureTime.getTime() - (60 * 60 * 1000)); // 1 hour before
          const boardingStartTime = new Date(departureTime.getTime() - (90 * 60 * 1000)); // 90 min before
          const boardingEndTime = new Date(departureTime.getTime() - (20 * 60 * 1000)); // 20 min before

          // Calculate higher prices for intercontinental with seasonal variation
          const seasonalMultiplier = month >= 5 && month <= 8 ? 1.4 : 1.0; // Higher summer premium for long-haul
          const economyPrice = calculateRealisticPrice(distance, 'ECONOMY_CLASS', false, true) * seasonalMultiplier;
          const businessPrice = calculateRealisticPrice(distance, 'BUSINESS_CLASS', false, true) * seasonalMultiplier;
          const firstPrice = calculateRealisticPrice(distance, 'FIRST_CLASS', false, true) * seasonalMultiplier;

          await prisma.flight.create({
            data: {
              id: randomUUID(),
              route_id: route.id,
              aircraft_id: aircraft.id,
              departure_time: departureTime,
              arrival_time: arrivalTime,
              checkin_start_time: checkinStartTime,
              checkin_end_time: checkinEndTime,
              boarding_start_time: boardingStartTime,
              boarding_end_time: boardingEndTime,
              gate: `B${Math.floor(Math.random() * 15) + 1}`,
              terminal: (Math.floor(Math.random() * 2) + 1).toString(),
              price_first_class: Math.round(firstPrice),
              price_business_class: Math.round(businessPrice),
              price_economy_class: Math.round(economyPrice),
              price_insurance: Math.round(economyPrice * 0.15),
              fully_booked: false
            }
          });
        }
      }

      interRouteCount++;
    }

    // Calculate total flights generated
    const estimatedEuropeanFlights = routeCount * 12 * 2.5; // avg 2.5 flights per month per route
    const estimatedInterFlights = interRouteCount * 12 * 1.5; // avg 1.5 flights per month per route
    const totalEstimatedFlights = estimatedEuropeanFlights + estimatedInterFlights;

    console.log(`✅ Created ${routeCount} European routes and ${interRouteCount} intercontinental routes`);
    console.log(`📊 Estimated total flights generated: ~${Math.round(totalEstimatedFlights)} flights spread across all 12 months of ${currentYear}`);
  } catch (error) {
    console.error('❌ Error seeding flights:', error);
    throw error;
  }
} 
