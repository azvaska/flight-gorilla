import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { 
  FlightOutputSchema,
  BookedSeatsSchema,
  FlightExtraListResponseSchema,
  FlightParamsSchema,
  type FlightParams
} from '../schemas/flight';
import { registry } from '../config/openapi';
import { ErrorResponseSchema } from '../config/openapi';
import { validateParams } from '../utils/validation';

const prisma = new PrismaClient();
export const flightRouter = Router();

// Helper function to format flight data for response
const formatFlightResponse = (flight: any) => {
  return {
    id: flight.id,
    airline: {
      id: flight.airline_aircraft.airline.id,
      name: flight.airline_aircraft.airline.name,
      first_class_description: flight.airline_aircraft.airline.first_class_description,
      business_class_description: flight.airline_aircraft.airline.business_class_description,
      economy_class_description: flight.airline_aircraft.airline.economy_class_description,
    },
    flight_number: flight.route.flight_number,
    departure_time: flight.departure_time.toISOString(),
    arrival_time: flight.arrival_time.toISOString(),
    departure_airport: {
      id: flight.route.airport_route_departure_airport_idToairport.id,
      name: flight.route.airport_route_departure_airport_idToairport.name,
      iata_code: flight.route.airport_route_departure_airport_idToairport.iata_code,
      icao_code: flight.route.airport_route_departure_airport_idToairport.icao_code,
      latitude: flight.route.airport_route_departure_airport_idToairport.latitude,
      longitude: flight.route.airport_route_departure_airport_idToairport.longitude,
      city: flight.route.airport_route_departure_airport_idToairport.city,
    },
    arrival_airport: {
      id: flight.route.airport_route_arrival_airport_idToairport.id,
      name: flight.route.airport_route_arrival_airport_idToairport.name,
      iata_code: flight.route.airport_route_arrival_airport_idToairport.iata_code,
      icao_code: flight.route.airport_route_arrival_airport_idToairport.icao_code,
      latitude: flight.route.airport_route_arrival_airport_idToairport.latitude,
      longitude: flight.route.airport_route_arrival_airport_idToairport.longitude,
      city: flight.route.airport_route_arrival_airport_idToairport.city,
    },
    price_first_class: flight.price_first_class,
    price_business_class: flight.price_business_class,
    price_economy_class: flight.price_economy_class,
    price_insurance: flight.price_insurance,
  };
};

// Helper function to get seats info for a flight
const getSeatsInfo = async (flightId: string) => {
  // Get aircraft seat configuration
  const flight = await prisma.flight.findUnique({
    where: { id: flightId },
    include: {
      airline_aircraft: {
        include: {
          aircraft: true,
          airline_aircraft_seat: true
        }
      }
    }
  });

  if (!flight) {
    return null;
  }

  const aircraft = flight.airline_aircraft.aircraft;
  const seatConfig = flight.airline_aircraft.airline_aircraft_seat;

  // Generate all possible seats based on aircraft configuration
  const allSeats: string[] = [];
  const columns = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, aircraft.columns);
  
  for (let row = 1; row <= aircraft.rows; row++) {
    for (const col of columns) {
      const seatNumber = `${row}${col}`;
      if (!aircraft.unavailable_seats.includes(seatNumber)) {
        allSeats.push(seatNumber);
      }
    }
  }

  // Categorize seats by class
  const firstClassSeats: string[] = [];
  const businessClassSeats: string[] = [];
  const economyClassSeats: string[] = [];

  seatConfig.forEach(seat => {
    if (allSeats.includes(seat.seat_number)) {
      switch (seat.class_type) {
        case 'FIRST_CLASS':
          firstClassSeats.push(seat.seat_number);
          break;
        case 'BUSINESS_CLASS':
          businessClassSeats.push(seat.seat_number);
          break;
        case 'ECONOMY_CLASS':
          economyClassSeats.push(seat.seat_number);
          break;
      }
    }
  });

  // Get booked seats from bookings
  const bookedSeats = await prisma.booking_departure_flight.findMany({
    where: { flight_id: flightId },
    select: { seat_number: true }
  });

  // Get seats reserved in active seat sessions
  const now = new Date();
  const activeSeatSessions = await prisma.seat.findMany({
    where: {
      flight_id: flightId,
      seat_session: {
        session_end_time: {
          gt: now
        }
      }
    },
    select: { seat_number: true }
  });

  const bookedSeatNumbers = [
    ...bookedSeats.map(booking => booking.seat_number),
    ...activeSeatSessions.map(seat => seat.seat_number)
  ];

  return {
    first_class_seats: firstClassSeats,
    business_class_seats: businessClassSeats,
    economy_class_seats: economyClassSeats,
    booked_seats: bookedSeatNumbers,
  };
};

// Register OpenAPI paths
registry.registerPath({
  method: 'get',
  path: '/flight/{flight_id}',
  description: 'Get flight by ID',
  summary: 'Fetch a flight with nested route and airport/city data',
  tags: ['Flight'],
  request: {
    params: FlightParamsSchema,
  },
  responses: {
    200: {
      description: 'Flight found',
      content: {
        'application/json': {
          schema: FlightOutputSchema,
        },
      },
    },
    404: {
      description: 'Flight not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/flight/extra/{flight_id}',
  description: 'Get flight extras',
  summary: 'Get all extras for a specific flight',
  tags: ['Flight'],
  request: {
    params: FlightParamsSchema,
  },
  responses: {
    200: {
      description: 'Flight extras found',
      content: {
        'application/json': {
          schema: FlightExtraListResponseSchema,
        },
      },
    },
    404: {
      description: 'Flight extras not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/flight/seats/{flight_id}',
  description: 'Get flight seats',
  summary: 'Get all booked seats for a specific flight',
  tags: ['Flight'],
  request: {
    params: FlightParamsSchema,
  },
  responses: {
    200: {
      description: 'Flight seats info',
      content: {
        'application/json': {
          schema: BookedSeatsSchema,
        },
      },
    },
    404: {
      description: 'Flight not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// Routes
// Specific routes must come before parameterized routes
flightRouter.get('/extra/:flight_id', 
  validateParams(FlightParamsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { flight_id } = req.validatedParams as FlightParams;

      const flightExtras = await prisma.flight_extra.findMany({
        where: { flight_id },
        include: {
          extra: true
        }
      });

      if (!flightExtras || flightExtras.length === 0) {
        res.status(404).json({ error: 'Flight extras not found for the flight' });
        return;
      }

      const formattedExtras = flightExtras.map(fe => ({
        id: fe.id,
        name: fe.extra.name,
        description: fe.extra.description,
        extra_id: fe.extra_id,
        price: fe.price,
        limit: fe.limit,
        stackable: fe.extra.stackable,
        required_on_all_segments: fe.extra.required_on_all_segments,
      }));

      res.json(formattedExtras);
    } catch (error) {
      console.error('Get flight extras error:', error);
      next(error);
    }
  }
);

flightRouter.get('/seats/:flight_id', 
  validateParams(FlightParamsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { flight_id } = req.validatedParams as FlightParams;

      const flight = await prisma.flight.findUnique({
        where: { id: flight_id },
        include: {
          airline_aircraft: {
            include: {
              aircraft: true
            }
          }
        }
      });

      if (!flight) {
        res.status(404).json({ error: 'Flight not found' });
        return;
      }

      const seatsInfo = await getSeatsInfo(flight_id);
      
      if (!seatsInfo) {
        res.status(404).json({ error: 'Flight not found' });
        return;
      }

      res.json({
        flight_id: flight.id,
        seats_info: seatsInfo,
        rows: flight.airline_aircraft.aircraft.rows,
      });
    } catch (error) {
      console.error('Get flight seats error:', error);
      next(error);
    }
  }
);

flightRouter.get('/:flight_id', 
  validateParams(FlightParamsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { flight_id } = req.validatedParams as FlightParams;

      const flight = await prisma.flight.findUnique({
        where: { id: flight_id },
        include: {
          route: {
            include: {
              airport_route_departure_airport_idToairport: {
                include: {
                  city: {
                    include: {
                      nation: true
                    }
                  }
                }
              },
              airport_route_arrival_airport_idToairport: {
                include: {
                  city: {
                    include: {
                      nation: true
                    }
                  }
                }
              }
            }
          },
          airline_aircraft: {
            include: {
              airline: true
            }
          }
        }
      });

      if (!flight) {
        res.status(404).json({ error: 'Flight not found' });
        return;
      }

      res.json(formatFlightResponse(flight));
    } catch (error) {
      console.error('Get flight error:', error);
      next(error);
    }
  }
);

// Cleanup on app termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
}); 
