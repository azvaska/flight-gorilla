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

export class SearchFlight {
  async raptorSearch(
    originId: number,
    destinationId: number,
    departureDate: Date,
    maxTransfers: number,
    minTransferMinutes: number,
    args: SearchArgs
  ): Promise<{ [k: number]: Journey[] }> {
    // Prepare date window
    const startOfDay = new Date(departureDate);
    startOfDay.setHours(0, 0, 0, 0);
    const dateMin = startOfDay;
    const dateMax = new Date(departureDate);
    dateMax.setDate(dateMax.getDate() + 1);
    dateMax.setHours(0, 0, 0, 0);

    // Storage for all itineraries by exact #transfers
    const allByTransfers: { [k: number]: Journey[] } = {};
    for (let k = 0; k <= maxTransfers; k++) {
      allByTransfers[k] = [];
    }

    // Keep track of processed flight paths to avoid duplicates
    const processedPaths = new Set<string>();

    // BFS-like expansion over k transfers
    let frontier: Array<[number, Date, FlightPath[]]> = [[originId, startOfDay, []]];

    for (let k = 0; k <= maxTransfers; k++) {
      const nextFrontier: Array<[number, Date, FlightPath[]]> = [];

      for (const [currentAirport, arrivalTime, path] of frontier) {
        // Determine minimum departure time
        let minDepTime = arrivalTime;
        if (path.length > 0) {
          minDepTime = new Date(arrivalTime.getTime() + minTransferMinutes * 60 * 1000);
        }

        // Find flights departing after minDepTime and within the same travel day
        let flightsQuery = prisma.flight.findMany({
          where: {
            route: {
              departure_airport_id: currentAirport,
            },
            departure_time: {
              gte: minDepTime,
              lt: dateMax,
            },
            fully_booked: false,
          },
          include: {
            route: true,
          },
        });

        const possibleFlights = await this.applyFilters(flightsQuery, departureDate, args);

        for (const flight of possibleFlights) {
          if (!flight.route) continue;

          const newPath = [...path, flight as FlightPath];
          const destAirport = flight.route.arrival_airport_id;

          // If this flight reaches the final destination, record it
          if (destAirport === destinationId) {
            // Only record if exactly k transfers
            if (newPath.length - 1 === k) {
              const flightIds = newPath.map(f => f.id).join(',');

              if (!processedPaths.has(flightIds)) {
                processedPaths.add(flightIds);
                const result = await this.formatJourneyResult(newPath, originId, destinationId);
                if (result) {
                  allByTransfers[k].push(result);
                  continue;
                }
              }
            }
          }

          // For non-destination flights, add to next frontier
          if (k < maxTransfers) {
            nextFrontier.push([destAirport, flight.arrival_time, newPath]);
          }
        }
      }

      frontier = nextFrontier;
    }

    return allByTransfers;
  }

  private async applyFilters(
    flightsQuery: Promise<any[]>,
    departureDate: Date,
    args: SearchArgs
  ): Promise<any[]> {
    let flights = await flightsQuery;

    // Apply airline filter
    if (args.airline_id) {
      flights = flights.filter(flight => 
        flight.route && flight.route.airline_id === args.airline_id
      );
    }

    // Apply price filter
    if (args.price_max) {
      flights = flights.filter(flight => 
        flight.price_economy_class <= args.price_max!
      );
    }

    return flights;
  }

  private async formatJourneyResult(
    flightPath: FlightPath[],
    originId: number,
    destinationId: number
  ): Promise<Journey | null> {
    if (!flightPath.length) return null;

    const firstFlight = flightPath[0];
    const lastFlight = flightPath[flightPath.length - 1];

    // Get origin and destination airports
    const [originAirport, destinationAirport] = await Promise.all([
      prisma.airport.findUnique({ where: { id: originId } }),
      prisma.airport.findUnique({ where: { id: destinationId } })
    ]);

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

    // Create segments
    const segments: FlightSegment[] = [];
    for (const flight of flightPath) {
      const route = await prisma.route.findUnique({
        where: { id: flight.route_id },
        include: { airline: true }
      });

      if (!route) continue;

      const [departureAirport, arrivalAirport] = await Promise.all([
        prisma.airport.findUnique({ where: { id: route.departure_airport_id } }),
        prisma.airport.findUnique({ where: { id: route.arrival_airport_id } })
      ]);

      if (!departureAirport || !arrivalAirport) continue;

      const segment = await this.processFlightResult(flight, route, departureAirport, arrivalAirport);
      if (segment) {
        segments.push(segment);
      }
    }

    // Create layover information
    const layovers: Layover[] = [];
    for (let i = 0; i < flightPath.length - 1; i++) {
      const currentFlight = flightPath[i];
      const nextFlight = flightPath[i + 1];
      
      const currentRoute = await prisma.route.findUnique({
        where: { id: currentFlight.route_id }
      });

      if (!currentRoute) continue;

      const airport = await prisma.airport.findUnique({
        where: { id: currentRoute.arrival_airport_id }
      });

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

  private async processFlightResult(
    flight: FlightPath,
    route: any,
    departureAirport: any,
    arrivalAirport: any
  ): Promise<FlightSegment | null> {
    const airline = route.airline;
    
    // Check if airports have valid IATA codes
    if (!departureAirport.iata_code || !arrivalAirport.iata_code) {
      return null;
    }
    
    const aircraftInstance = await prisma.airline_aircraft.findUnique({
      where: { id: flight.aircraft_id },
      include: { aircraft: true }
    });

    if (!aircraftInstance) return null;

    const aircraft = aircraftInstance.aircraft;
    if (!aircraft) return null;

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
