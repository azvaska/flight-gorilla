import { PrismaClient } from '../../generated/prisma';
import { Journey, FlightSegment, Layover } from '../schemas/search';

const prisma = new PrismaClient();

interface FlightPath {
  id: string;
  route_id: number;
  departure_time: Date;
  arrival_time: Date;
  price_economy_class: number;
  price_business_class: number;
  price_first_class: number;
  aircraft_id: string;
  gate: string | null;
  terminal: string | null;
  fully_booked: boolean;
  route?: any;
}

interface SearchArgs {
  departure_id: number;
  departure_type: 'airport' | 'city';
  arrival_id: number;
  arrival_type: 'airport' | 'city';
  airline_id?: string;
  price_max?: number;
  departure_time_min?: string;
  departure_time_max?: string;
  order_by?: 'price' | 'duration' | 'stops';
  order_by_desc: boolean;
  page_number?: number;
  limit?: number;
  max_transfers: number;
  user_id?: string;
}

interface EarliestArrival {
  time: Date;
  path: FlightPath[];
  cost: number;
}

interface PreloadedData {
  flights: Map<number, FlightPath[]>; // airportId -> flights
  airports: Map<number, any>;
  routes: Map<number, any>;
  airlineAircraft: Map<string, any>;
}

export class SearchFlight {
  private preloadedData: PreloadedData | null = null;

  /**
   * Optimized RAPTOR search with proper earliest arrival tracking
   */
  async raptorSearch(
    originId: number,
    destinationId: number,
    departureDate: Date,
    maxTransfers: number,
    minTransferMinutes: number,
    args: SearchArgs
  ): Promise<{ [k: number]: Journey[] }> {
    // Prepare extended date window (support multi-day journeys)
    const startOfDay = new Date(departureDate);
    startOfDay.setHours(0, 0, 0, 0);
    const dateMin = startOfDay;
    const dateMax = new Date(departureDate);
    dateMax.setDate(dateMax.getDate() + 2); // Extended to 2 days for international travel
    dateMax.setHours(0, 0, 0, 0);

    // Preload all relevant data to minimize DB queries
    await this.preloadData(dateMin, dateMax, args);

    // Storage for all itineraries by exact #transfers
    const allByTransfers: { [k: number]: Journey[] } = {};
    for (let k = 0; k <= maxTransfers; k++) {
      allByTransfers[k] = [];
    }

    // RAPTOR's earliest arrival times per round
    const earliestArrival: EarliestArrival[][] = [];
    for (let k = 0; k <= maxTransfers + 1; k++) {
      earliestArrival[k] = [];
    }

    // Initialize round 0 - direct flights from origin
    earliestArrival[0][originId] = {
      time: startOfDay,
      path: [],
      cost: 0
    };

    const processedPaths = new Set<string>();
    const markedStops = new Set<number>();

    // RAPTOR rounds
    for (let k = 1; k <= maxTransfers + 1; k++) {
      markedStops.clear();
      
      // Mark stops improved in previous round
      for (const airportId in earliestArrival[k - 1]) {
        const airport = parseInt(airportId);
        if (earliestArrival[k - 1][airport]) {
          markedStops.add(airport);
        }
      }

      if (markedStops.size === 0) break; // No improvements possible

      // Process each marked stop
      for (const currentAirport of markedStops) {
        const currentState = earliestArrival[k - 1][currentAirport];
        if (!currentState) continue;

        // Get all flights from this airport
        const flights = this.preloadedData?.flights.get(currentAirport) || [];
        
        for (const flight of flights) {
          if (!flight.route) continue;

          // Calculate minimum departure time
          let minDepTime = currentState.time;
          if (currentState.path.length > 0) {
            minDepTime = new Date(currentState.time.getTime() + minTransferMinutes * 60 * 1000);
          }

          // Check if flight is valid
          if (flight.departure_time < minDepTime || flight.departure_time >= dateMax) {
            continue;
          }

          // Apply filters
          if (!this.passesFilters(flight, args)) {
            continue;
          }

          const destAirport = flight.route.arrival_airport_id;
          const newPath = [...currentState.path, flight];
          const newCost = currentState.cost + flight.price_economy_class;

          // Check if this improves the arrival time at destination
          const existingArrival = earliestArrival[k][destAirport];
          const shouldUpdate = !existingArrival || 
            flight.arrival_time < existingArrival.time ||
            (flight.arrival_time.getTime() === existingArrival.time.getTime() && newCost < existingArrival.cost);

          if (shouldUpdate) {
            earliestArrival[k][destAirport] = {
              time: flight.arrival_time,
              path: newPath,
              cost: newCost
            };

            // If this reaches the destination, record the journey
            if (destAirport === destinationId && newPath.length - 1 === k - 1) {
              const flightIds = newPath.map(f => f.id).join(',');
              if (!processedPaths.has(flightIds)) {
                processedPaths.add(flightIds);
                const result = await this.formatJourneyResult(newPath, originId, destinationId);
                if (result) {
                  allByTransfers[k - 1].push(result);
                }
              }
            }
          }
        }
      }

      // Copy non-improved arrivals from previous round
      for (const airportId in earliestArrival[k - 1]) {
        const airport = parseInt(airportId);
        if (!earliestArrival[k][airport] && earliestArrival[k - 1][airport]) {
          earliestArrival[k][airport] = earliestArrival[k - 1][airport];
        }
      }
    }

    return allByTransfers;
  }

  /**
   * Preload all relevant data to minimize database queries
   */
  private async preloadData(dateMin: Date, dateMax: Date, args: SearchArgs): Promise<void> {
    // Get all relevant flights in the date range
    const whereClause: any = {
      departure_time: {
        gte: dateMin,
        lt: dateMax,
      },
      fully_booked: false,
    };

    // Apply airline filter to reduce data load
    if (args.airline_id) {
      whereClause.route = {
        airline_id: args.airline_id
      };
    }

    const flights = await prisma.flight.findMany({
      where: whereClause,
      include: {
        route: {
          include: {
            airline: true
          }
        }
      },
      orderBy: {
        departure_time: 'asc'
      }
    });

    // Group flights by departure airport
    const flightsByAirport = new Map<number, FlightPath[]>();
    for (const flight of flights) {
      if (!flight.route) continue;
      
      const departureAirportId = flight.route.departure_airport_id;
      if (!flightsByAirport.has(departureAirportId)) {
        flightsByAirport.set(departureAirportId, []);
      }
      flightsByAirport.get(departureAirportId)!.push(flight as FlightPath);
    }

    // Preload airports (batch query)
    const airportIds = new Set<number>();
    flights.forEach(f => {
      if (f.route) {
        airportIds.add(f.route.departure_airport_id);
        airportIds.add(f.route.arrival_airport_id);
      }
    });

    const airports = await prisma.airport.findMany({
      where: {
        id: { in: Array.from(airportIds) }
      }
    });

    const airportMap = new Map<number, any>();
    airports.forEach(airport => airportMap.set(airport.id, airport));

    // Preload aircraft data (batch query)
    const aircraftIds = flights.map(f => f.aircraft_id).filter(Boolean);
    const aircraftData = await prisma.airline_aircraft.findMany({
      where: {
        id: { in: aircraftIds }
      },
      include: {
        aircraft: true
      }
    });

    const aircraftMap = new Map<string, any>();
    aircraftData.forEach(ac => aircraftMap.set(ac.id, ac));

    // Preload routes (already included in flights)
    const routeMap = new Map<number, any>();
    flights.forEach(f => {
      if (f.route) {
        routeMap.set(f.route.id, f.route);
      }
    });

    this.preloadedData = {
      flights: flightsByAirport,
      airports: airportMap,
      routes: routeMap,
      airlineAircraft: aircraftMap
    };
  }

  /**
   * Optimized filter checking using preloaded data
   */
  private passesFilters(flight: FlightPath, args: SearchArgs): boolean {
    // Airline filter (already applied in preload if specified)
    if (args.airline_id && flight.route?.airline_id !== args.airline_id) {
      return false;
    }

    // Price filter
    if (args.price_max && flight.price_economy_class > args.price_max) {
      return false;
    }

    // Time range filters
    if (args.departure_time_min) {
      const timeStr = flight.departure_time.toTimeString().substring(0, 5);
      if (timeStr < args.departure_time_min) {
        return false;
      }
    }

    if (args.departure_time_max) {
      const timeStr = flight.departure_time.toTimeString().substring(0, 5);
      if (timeStr > args.departure_time_max) {
        return false;
      }
    }

    return true;
  }

  /**
   * Optimized journey formatting using preloaded data
   */
  private async formatJourneyResult(
    flightPath: FlightPath[],
    originId: number,
    destinationId: number
  ): Promise<Journey | null> {
    if (!flightPath.length || !this.preloadedData) return null;

    const firstFlight = flightPath[0];
    const lastFlight = flightPath[flightPath.length - 1];

    // Get origin and destination airports from preloaded data
    const originAirport = this.preloadedData.airports.get(originId);
    const destinationAirport = this.preloadedData.airports.get(destinationId);

    if (!originAirport || !destinationAirport) return null;
    if (!originAirport.iata_code || !destinationAirport.iata_code) return null;

    // Calculate total duration
    const totalDurationMinutes = Math.floor(
      (lastFlight.arrival_time.getTime() - firstFlight.departure_time.getTime()) / (1000 * 60)
    );

    // Calculate total prices
    const totalEconomyPrice = flightPath.reduce((sum, flight) => sum + flight.price_economy_class, 0);
    const totalBusinessPrice = flightPath.reduce((sum, flight) => sum + flight.price_business_class, 0);
    const totalFirstPrice = flightPath.reduce((sum, flight) => sum + flight.price_first_class, 0);

    // Create segments using preloaded data
    const segments: FlightSegment[] = [];
    for (const flight of flightPath) {
      const route = this.preloadedData.routes.get(flight.route_id);
      if (!route) continue;

      const departureAirport = this.preloadedData.airports.get(route.departure_airport_id);
      const arrivalAirport = this.preloadedData.airports.get(route.arrival_airport_id);

      if (!departureAirport || !arrivalAirport) continue;

      const segment = this.processFlightSegment(flight, route, departureAirport, arrivalAirport);
      if (segment) {
        segments.push(segment);
      }
    }

    // Create layover information
    const layovers: Layover[] = [];
    for (let i = 0; i < flightPath.length - 1; i++) {
      const currentFlight = flightPath[i];
      const nextFlight = flightPath[i + 1];
      
      const currentRoute = this.preloadedData.routes.get(currentFlight.route_id);
      if (!currentRoute) continue;

      const airport = this.preloadedData.airports.get(currentRoute.arrival_airport_id);
      if (!airport || !airport.iata_code) continue;

      const layoverDuration = Math.floor(
        (nextFlight.departure_time.getTime() - currentFlight.arrival_time.getTime()) / (1000 * 60)
      );

      layovers.push({
        airport: airport.iata_code,
        duration_minutes: layoverDuration
      });
    }

    return {
      departure_airport: originAirport.iata_code,
      arrival_airport: destinationAirport.iata_code,
      duration_minutes: totalDurationMinutes,
      price_economy: Math.round(totalEconomyPrice * 100) / 100,
      price_business: Math.round(totalBusinessPrice * 100) / 100,
      price_first: Math.round(totalFirstPrice * 100) / 100,
      is_direct: flightPath.length === 1,
      stops: flightPath.length - 1,
      segments,
      layovers
    };
  }

  /**
   * Process flight segment using preloaded data
   */
  private processFlightSegment(
    flight: FlightPath,
    route: any,
    departureAirport: any,
    arrivalAirport: any
  ): FlightSegment | null {
    if (!departureAirport.iata_code || !arrivalAirport.iata_code) {
      return null;
    }
    
    const aircraftInstance = this.preloadedData?.airlineAircraft.get(flight.aircraft_id);
    if (!aircraftInstance?.aircraft) return null;

    const aircraft = aircraftInstance.aircraft;
    const airline = route.airline;

    // Calculate flight duration in minutes
    const durationMinutes = Math.floor(
      (flight.arrival_time.getTime() - flight.departure_time.getTime()) / (1000 * 60)
    );

    return {
      id: flight.id,
      flight_number: route.flight_number,
      airline_name: airline ? airline.name : 'Unknown Airline',
      airline_id: airline ? airline.id : '',
      departure_airport: departureAirport.iata_code,
      arrival_airport: arrivalAirport.iata_code,
      departure_time: flight.departure_time.toISOString(),
      arrival_time: flight.arrival_time.toISOString(),
      duration_minutes: durationMinutes,
      price_economy: Math.round(flight.price_economy_class * 100) / 100,
      price_business: Math.round(flight.price_business_class * 100) / 100,
      price_first: Math.round(flight.price_first_class * 100) / 100,
      aircraft_name: aircraft.name || 'Unknown Aircraft',
      gate: flight.gate || null,
      terminal: flight.terminal || null
    };
  }

  // Remove the old applyFilters method as it's now integrated into passesFilters
  // Remove the old processFlightResult method as it's now processFlightSegment
}

export async function checkDuplicateFlight(journey: Journey, args: SearchArgs): Promise<boolean> {
  if (!args.user_id) return false;
  
  for (const segment of journey.segments) {
    // Check if the user has a booking with this flight as departure flight
    const bookingDeparture = await prisma.booking_departure_flight.findFirst({
      where: {
        flight_id: segment.id,
        booking: {
          user_id: args.user_id
        }
      }
    });

    // Check if the user has a booking with this flight as return flight
    const bookingReturn = await prisma.booking_return_flight.findFirst({
      where: {
        flight_id: segment.id,
        booking: {
          user_id: args.user_id
        }
      }
    });

    if (bookingDeparture || bookingReturn) {
      return true;
    }
  }

  return false;
}

export async function filterJourneys(unfilteredJourneys: (Journey | null)[], args: SearchArgs): Promise<(Journey | null)[]> {
  const filteredJourneys: (Journey | null)[] = [];

  for (const journey of unfilteredJourneys) {
    if (journey === null) {
      filteredJourneys.push(null);
      continue;
    }

    // Remove journeys where user already has a booking for any segment
    if (args.user_id) {
      const userHasBooking = await checkDuplicateFlight(journey, args);
      if (userHasBooking) {
        continue;
      }
    }

    // Filter by departure time range
    if (args.departure_time_min) {
      const minTime = args.departure_time_min;
      const departureTime = new Date(journey.segments[0].departure_time);
      const timeStr = departureTime.toTimeString().substring(0, 5); // HH:MM format
      
      if (timeStr < minTime) {
        continue;
      }
    }

    if (args.departure_time_max) {
      const maxTime = args.departure_time_max;
      const departureTime = new Date(journey.segments[0].departure_time);
      const timeStr = departureTime.toTimeString().substring(0, 5); // HH:MM format
      
      if (timeStr > maxTime) {
        continue;
      }
    }

    if (args.price_max) {
      if (journey.price_economy > args.price_max) {
        continue;
      }
    }

    filteredJourneys.push(journey);
  }

  return filteredJourneys;
}

export function sortJourneys(unfilteredJourneys: Journey[], args: SearchArgs): Journey[] {
  const journeys = [...unfilteredJourneys];

  if (args.order_by === 'price') {
    journeys.sort((a, b) => {
      const diff = a.price_economy - b.price_economy;
      return args.order_by_desc ? -diff : diff;
    });
  } else if (args.order_by === 'duration') {
    journeys.sort((a, b) => {
      const diff = a.duration_minutes - b.duration_minutes;
      return args.order_by_desc ? -diff : diff;
    });
  } else if (args.order_by === 'stops') {
    journeys.sort((a, b) => {
      const diff = a.stops - b.stops;
      return args.order_by_desc ? -diff : diff;
    });
  }

  return journeys;
}

export async function getAirports(args: SearchArgs): Promise<{
  departureAirports: any[];
  arrivalAirports: any[];
  error: { error: string; code: number } | null;
}> {
  let departureAirports: any[] = [];
  let arrivalAirports: any[] = [];
  let error: { error: string; code: number } | null = null;

  // Get departure airports
  if (args.departure_type === 'airport') {
    if (!args.departure_id) {
      error = { error: 'Departure airport ID is required', code: 400 };
    } else {
      departureAirports = await prisma.airport.findMany({
        where: { id: args.departure_id }
      });
    }
  } else {
    if (!args.departure_id) {
      error = { error: 'Departure city ID is required', code: 400 };
    } else {
      departureAirports = await prisma.airport.findMany({
        where: { city_id: args.departure_id }
      });
    }
  }

  // Get arrival airports
  if (args.arrival_type === 'airport') {
    if (!args.arrival_id) {
      error = { error: 'Arrival airport ID is required', code: 400 };
    } else {
      arrivalAirports = await prisma.airport.findMany({
        where: { id: args.arrival_id }
      });
    }
  } else {
    if (!args.arrival_id) {
      error = { error: 'Arrival city ID is required', code: 400 };
    } else {
      arrivalAirports = await prisma.airport.findMany({
        where: { city_id: args.arrival_id }
      });
    }
  }

  if (!departureAirports.length || !arrivalAirports.length) {
    error = { error: 'No valid departure or arrival airports found', code: 400 };
  }

  return { departureAirports, arrivalAirports, error };
}

export async function lowestPriceMultipleDates(
  departureDateRange: Date[],
  departureAirports: any[],
  arrivalAirports: any[],
  args: SearchArgs
): Promise<(number | null)[]> {
  const departureJourneys: (number | null)[] = [];

  for (const date of departureDateRange) {
    const journeyDeparture: Journey[] = [];

    for (const departureAirport of departureAirports) {
      for (const arrivalAirport of arrivalAirports) {
        const departureResults = await generateJourney(
          departureAirport,
          arrivalAirport,
          date,
          args.max_transfers,
          args
        );
        journeyDeparture.push(...departureResults);
      }
    }

    const sortedJourneys = sortJourneys(journeyDeparture, args);

    // Get the best price for each day
    let bestPrice: number | null = null;
    if (sortedJourneys.length > 0) {
      // Use async filter function
      const filtered = (await filterJourneys(sortedJourneys, args)).filter(j => j !== null) as Journey[];
      if (filtered.length > 0) {
        bestPrice = filtered[0].price_economy;
      }
    }

    departureJourneys.push(bestPrice);
  }

  return departureJourneys;
}

export async function generateJourney(
  departureAirport: any,
  arrivalAirport: any,
  departureDate: Date,
  maxTransfers: number = 3,
  args: SearchArgs,
  minTransferTime: number = 120
): Promise<Journey[]> {
  const result: Journey[] = [];
  
  const searchFlight = new SearchFlight();
  const departureResults = await searchFlight.raptorSearch(
    departureAirport.id,
    arrivalAirport.id,
    departureDate,
    maxTransfers,
    minTransferTime,
    args
  );

  // Collect results from all transfer levels
  for (const kStep in departureResults) {
    result.push(...departureResults[parseInt(kStep)]);
  }

  return result;
}