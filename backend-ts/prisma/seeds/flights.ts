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
  const airlineCode = airlineName.split(' ').map(word => word[0]).join('').toUpperCase();
  const number = Math.floor(Math.random() * 9000) + 1000;
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

export async function seedFlights(prisma: PrismaClient) {
  console.log('Seeding flights into the database...');
  
  try {
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

    const baseDate = new Date();
    baseDate.setHours(baseDate.getHours() + 2); // Start 2 hours from now

    let routeCount = 0;
    const maxRoutes = 50; // Limit for demo

    // Generate European routes
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

      // Create route
      const flightNumber = generateUniqueFlightNumber(airline.name);
      const periodStart = new Date(baseDate);
      const periodEnd = new Date(baseDate);
      periodEnd.setDate(periodEnd.getDate() + 30); // 30 days period

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

      // Create flights for this route (2-3 flights over the period)
      const numFlights = Math.floor(Math.random() * 2) + 2;
      
      for (let i = 0; i < numFlights; i++) {
        const flightDate = new Date(baseDate);
        flightDate.setDate(flightDate.getDate() + (i * 10)); // Spread flights over time
        
        const departureTime = getRealisticDepartureTime(flightDate, false);
        const durationMinutes = calculateFlightDuration(distance);
        const arrivalTime = new Date(departureTime.getTime() + (durationMinutes * 60000));
        
        // Check-in and boarding times
        const checkinStartTime = new Date(departureTime.getTime() - (2 * 60 * 60 * 1000)); // 2 hours before
        const checkinEndTime = new Date(departureTime.getTime() - (30 * 60 * 1000)); // 30 min before
        const boardingStartTime = new Date(departureTime.getTime() - (45 * 60 * 1000)); // 45 min before
        const boardingEndTime = new Date(departureTime.getTime() - (10 * 60 * 1000)); // 10 min before

        // Calculate prices
        const economyPrice = calculateRealisticPrice(distance, 'ECONOMY_CLASS', true, false);
        const businessPrice = calculateRealisticPrice(distance, 'BUSINESS_CLASS', true, false);
        const firstPrice = calculateRealisticPrice(distance, 'FIRST_CLASS', true, false);

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
            terminal: Math.floor(Math.random() * 3) + 1 + '',
            price_first_class: firstPrice,
            price_business_class: businessPrice,
            price_economy_class: economyPrice,
            price_insurance: Math.round(economyPrice * 0.1),
            fully_booked: false
          }
        });
      }

      routeCount++;
    }

    // Generate some intercontinental routes
    const maxInterRoutes = 10;
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

      // Create route
      const flightNumber = generateUniqueFlightNumber(airline.name);
      const periodStart = new Date(baseDate);
      const periodEnd = new Date(baseDate);
      periodEnd.setDate(periodEnd.getDate() + 30);

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

      // Create 1-2 flights for intercontinental routes
      const numFlights = Math.floor(Math.random() * 2) + 1;
      
      for (let i = 0; i < numFlights; i++) {
        const flightDate = new Date(baseDate);
        flightDate.setDate(flightDate.getDate() + (i * 15)); // More spread for long-haul
        
        const departureTime = getRealisticDepartureTime(flightDate, true);
        const durationMinutes = calculateFlightDuration(distance);
        const arrivalTime = new Date(departureTime.getTime() + (durationMinutes * 60000));
        
        // Longer check-in times for international flights
        const checkinStartTime = new Date(departureTime.getTime() - (3 * 60 * 60 * 1000)); // 3 hours before
        const checkinEndTime = new Date(departureTime.getTime() - (60 * 60 * 1000)); // 1 hour before
        const boardingStartTime = new Date(departureTime.getTime() - (90 * 60 * 1000)); // 90 min before
        const boardingEndTime = new Date(departureTime.getTime() - (20 * 60 * 1000)); // 20 min before

        // Calculate higher prices for intercontinental
        const economyPrice = calculateRealisticPrice(distance, 'ECONOMY_CLASS', false, true);
        const businessPrice = calculateRealisticPrice(distance, 'BUSINESS_CLASS', false, true);
        const firstPrice = calculateRealisticPrice(distance, 'FIRST_CLASS', false, true);

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
            terminal: Math.floor(Math.random() * 2) + 1 + '',
            price_first_class: firstPrice,
            price_business_class: businessPrice,
            price_economy_class: economyPrice,
            price_insurance: Math.round(economyPrice * 0.15),
            fully_booked: false
          }
        });
      }

      interRouteCount++;
    }

    console.log(`✅ Created ${routeCount} European routes and ${interRouteCount} intercontinental routes with flights`);
  } catch (error) {
    console.error('❌ Error seeding flights:', error);
    throw error;
  }
} 
