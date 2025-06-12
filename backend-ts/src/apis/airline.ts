import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { PrismaClient } from '../../generated/prisma';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { registry } from '../config/openapi';
import { 
  extraInputSchema,
  extraOutputSchema,
  airlineAircraftInputSchema,
  airlineAircraftUpdateSchema,
  airlineAircraftOutputSchema,
  airlineUpdateSchema,
  airlineOutputSchema,
  routeInputSchema,
  routeUpdateSchema,
  routeOutputSchema,
  flightInputSchema,
  flightUpdateSchema,
  flightOutputSchema,
  flightSeatsOutputSchema,
  airlineListQuerySchema,
  flightPageQuerySchema,
  flightsPaginationSchema,
  airlineStatsSchema,
} from '../schemas/airline';

const router = Router();
const prisma = new PrismaClient();



// Helper function to get airline ID from user (matches Python decorator)
const getAirlineIdFromUser = async (userId: string): Promise<string | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { airline_id: true }
  });
  return user?.airline_id || null;
};



// Helper function to format airline aircraft data
const formatAirlineAircraftData = (aircraft: any) => {
  // Get seat arrays from airline_aircraft_seat relationships
  const firstClassSeats = aircraft.airline_aircraft_seat
    ?.filter((seat: any) => seat.class_type === 'FIRST_CLASS')
    .map((seat: any) => seat.seat_number) || [];
  
  const businessClassSeats = aircraft.airline_aircraft_seat
    ?.filter((seat: any) => seat.class_type === 'BUSINESS_CLASS')
    .map((seat: any) => seat.seat_number) || [];
  
  const economyClassSeats = aircraft.airline_aircraft_seat
    ?.filter((seat: any) => seat.class_type === 'ECONOMY_CLASS')
    .map((seat: any) => seat.seat_number) || [];

  return {
    id: aircraft.id,
    aircraft: aircraft.aircraft,
    airline_id: aircraft.airline_id,
    first_class_seats: firstClassSeats,
    business_class_seats: businessClassSeats,
    economy_class_seats: economyClassSeats,
    tail_number: aircraft.tail_number
  };
};

// Helper function to format route data
const formatRouteData = (route: any) => {
  // Check if route is editable (no associated flights)
  const isEditable = !route.flight || route.flight.length === 0;

  return {
    id: route.id,
    departure_airport: route.airport_route_departure_airport_idToairport,
    arrival_airport: route.airport_route_arrival_airport_idToairport,
    airline_id: route.airline_id,
    period_start: route.period_start.toISOString(),
    period_end: route.period_end.toISOString(),
    flight_number: route.flight_number,
    is_editable: isEditable
  };
};

// Register OpenAPI routes
registry.registerPath({
  method: 'get',
  path: '/airline/all',
  description: 'List all airlines with optional filtering',
  summary: 'Get all airlines',
  request: {
    query: airlineListQuerySchema,
  },
  responses: {
    200: {
      description: 'List of airlines',
      content: {
        'application/json': {
          schema: z.array(airlineOutputSchema),
        },
      },
    },
    400: {
      description: 'Bad Request',
    },
    500: {
      description: 'Internal Server Error',
    },
  },
  tags: ['Airline'],
});

registry.registerPath({
  method: 'get',
  path: '/airline',
  description: 'Fetch the airline associated with the current user',
  summary: 'Get current user airline',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Airline details',
      content: {
        'application/json': {
          schema: airlineOutputSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
    },
    403: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Not Found',
    },
  },
  tags: ['Airline'],
});

registry.registerPath({
  method: 'get',
  path: '/airline/{airline_id}',
  description: 'Fetch an airline given its identifier',
  summary: 'Get airline by ID',
  request: {
    params: z.object({
      airline_id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Airline details',
      content: {
        'application/json': {
          schema: airlineOutputSchema,
        },
      },
    },
    404: {
      description: 'Not Found',
    },
  },
  tags: ['Airline'],
});

registry.registerPath({
  method: 'put',
  path: '/airline/{airline_id}',
  description: 'Update an airline given its identifier',
  summary: 'Update airline',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      airline_id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: airlineUpdateSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated airline',
      content: {
        'application/json': {
          schema: airlineOutputSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
    },
    403: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Not Found',
    },
  },
  tags: ['Airline'],
});

registry.registerPath({
  method: 'get',
  path: '/airline/extras',
  description: 'Get all extras for the current airline',
  summary: 'Get airline extras',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of extras',
      content: {
        'application/json': {
          schema: z.array(extraOutputSchema),
        },
      },
    },
    400: {
      description: 'Bad Request',
    },
    403: {
      description: 'Unauthorized',
    },
  },
  tags: ['Airline Extras'],
});

registry.registerPath({
  method: 'post',
  path: '/airline/extras',
  description: 'Add a new extra for the current airline',
  summary: 'Create airline extra',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: extraInputSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created extra',
      content: {
        'application/json': {
          schema: extraOutputSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
    },
    403: {
      description: 'Unauthorized',
    },
  },
  tags: ['Airline Extras'],
});

registry.registerPath({
  method: 'get',
  path: '/airline/extras/{extra_id}',
  description: 'Get a specific extra',
  summary: 'Get extra by ID',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      extra_id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Extra details',
      content: {
        'application/json': {
          schema: extraOutputSchema,
        },
      },
    },
    403: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Not Found',
    },
  },
  tags: ['Airline Extras'],
});

registry.registerPath({
  method: 'put',
  path: '/airline/extras/{extra_id}',
  description: 'Update an extra',
  summary: 'Update extra',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      extra_id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: extraInputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated extra',
      content: {
        'application/json': {
          schema: extraOutputSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
    },
    403: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Not Found',
    },
  },
  tags: ['Airline Extras'],
});

registry.registerPath({
  method: 'delete',
  path: '/airline/extras/{extra_id}',
  description: 'Delete an extra',
  summary: 'Delete extra',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      extra_id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Extra deleted successfully',
    },
    403: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Not Found',
    },
    409: {
      description: 'Conflict - Extra is associated with flights',
    },
  },
  tags: ['Airline Extras'],
});

registry.registerPath({
  method: 'get',
  path: '/airline/aircrafts',
  description: 'Get all aircraft for the current airline',
  summary: 'Get airline aircraft',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of aircraft',
      content: {
        'application/json': {
          schema: z.array(airlineAircraftOutputSchema),
        },
      },
    },
    400: {
      description: 'Bad Request',
    },
    403: {
      description: 'Unauthorized',
    },
  },
  tags: ['Airline Aircraft'],
});

registry.registerPath({
  method: 'post',
  path: '/airline/aircrafts',
  description: 'Add a new aircraft for the current airline',
  summary: 'Create airline aircraft',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: airlineAircraftInputSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created aircraft',
      content: {
        'application/json': {
          schema: airlineAircraftOutputSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
    },
    403: {
      description: 'Unauthorized',
    },
    409: {
      description: 'Conflict',
    },
  },
  tags: ['Airline Aircraft'],
});

// Additional aircraft endpoints
registry.registerPath({
  method: 'get',
  path: '/airline/aircrafts/{aircraft_id}',
  description: 'Get a specific aircraft',
  summary: 'Get aircraft by ID',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      aircraft_id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Aircraft details',
      content: {
        'application/json': {
          schema: airlineAircraftOutputSchema,
        },
      },
    },
    403: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Not Found',
    },
  },
  tags: ['Airline Aircraft'],
});

registry.registerPath({
  method: 'put',
  path: '/airline/aircrafts/{aircraft_id}',
  description: 'Update an aircraft',
  summary: 'Update aircraft',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      aircraft_id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: airlineAircraftUpdateSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated aircraft',
      content: {
        'application/json': {
          schema: airlineAircraftOutputSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
    },
    403: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Not Found',
    },
  },
  tags: ['Airline Aircraft'],
});

registry.registerPath({
  method: 'delete',
  path: '/airline/aircrafts/{aircraft_id}',
  description: 'Delete an aircraft',
  summary: 'Delete aircraft',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      aircraft_id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Aircraft deleted successfully',
    },
    403: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Not Found',
    },
    409: {
      description: 'Conflict - Aircraft is associated with flights',
    },
  },
  tags: ['Airline Aircraft'],
});

// Route endpoints
registry.registerPath({
  method: 'get',
  path: '/airline/routes',
  description: 'Get all routes for the current airline',
  summary: 'Get airline routes',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of routes',
      content: {
        'application/json': {
          schema: z.array(routeOutputSchema),
        },
      },
    },
    400: {
      description: 'Bad Request',
    },
    403: {
      description: 'Unauthorized',
    },
  },
  tags: ['Airline Routes'],
});

registry.registerPath({
  method: 'post',
  path: '/airline/routes',
  description: 'Add a new route for the current airline',
  summary: 'Create airline route',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: routeInputSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created route',
      content: {
        'application/json': {
          schema: routeOutputSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
    },
    403: {
      description: 'Unauthorized',
    },
  },
  tags: ['Airline Routes'],
});

registry.registerPath({
  method: 'get',
  path: '/airline/routes/{route_id}',
  description: 'Get a specific route',
  summary: 'Get route by ID',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      route_id: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Route details',
      content: {
        'application/json': {
          schema: routeOutputSchema,
        },
      },
    },
    403: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Not Found',
    },
  },
  tags: ['Airline Routes'],
});

registry.registerPath({
  method: 'put',
  path: '/airline/routes/{route_id}',
  description: 'Update a route',
  summary: 'Update route',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      route_id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: routeUpdateSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated route',
      content: {
        'application/json': {
          schema: routeOutputSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
    },
    403: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Not Found',
    },
  },
  tags: ['Airline Routes'],
});

registry.registerPath({
  method: 'delete',
  path: '/airline/routes/{route_id}',
  description: 'Delete a route',
  summary: 'Delete route',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      route_id: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Route deleted successfully',
    },
    403: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Not Found',
    },
    409: {
      description: 'Conflict - Route has associated flights',
    },
  },
  tags: ['Airline Routes'],
});

// Flight endpoints
registry.registerPath({
  method: 'get',
  path: '/airline/flights',
  description: 'Get all flights for the current airline with pagination',
  summary: 'Get airline flights',
  security: [{ bearerAuth: [] }],
  request: {
    query: flightPageQuerySchema,
  },
  responses: {
    200: {
      description: 'Paginated list of flights',
      content: {
        'application/json': {
          schema: flightsPaginationSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
    },
    403: {
      description: 'Unauthorized',
    },
  },
  tags: ['Airline Flights'],
});

registry.registerPath({
  method: 'post',
  path: '/airline/flights',
  description: 'Create a new flight for the current airline',
  summary: 'Create airline flight',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: flightInputSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created flight',
      content: {
        'application/json': {
          schema: flightOutputSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
    },
    403: {
      description: 'Unauthorized',
    },
  },
  tags: ['Airline Flights'],
});

registry.registerPath({
  method: 'get',
  path: '/airline/flights/{flight_id}',
  description: 'Get a specific flight with seat information',
  summary: 'Get flight by ID',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      flight_id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Flight details with seats',
      content: {
        'application/json': {
          schema: flightSeatsOutputSchema,
        },
      },
    },
    403: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Not Found',
    },
  },
  tags: ['Airline Flights'],
});

registry.registerPath({
  method: 'put',
  path: '/airline/flights/{flight_id}',
  description: 'Update a flight',
  summary: 'Update flight',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      flight_id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: flightUpdateSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated flight',
      content: {
        'application/json': {
          schema: flightOutputSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
    },
    403: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Not Found',
    },
  },
  tags: ['Airline Flights'],
});

registry.registerPath({
  method: 'delete',
  path: '/airline/flights/{flight_id}',
  description: 'Delete a flight',
  summary: 'Delete flight',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      flight_id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Flight deleted successfully',
    },
    403: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Not Found',
    },
    409: {
      description: 'Conflict - Flight has bookings or already departed',
    },
  },
  tags: ['Airline Flights'],
});

// Stats endpoint
registry.registerPath({
  method: 'get',
  path: '/airline/stats',
  description: 'Get airline statistics',
  summary: 'Get airline stats',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Airline statistics',
      content: {
        'application/json': {
          schema: airlineStatsSchema,
        },
      },
    },
    403: {
      description: 'Unauthorized',
    },
    500: {
      description: 'Internal Server Error',
    },
  },
  tags: ['Airline Stats'],
});

// GET /airline/all - List all airlines with optional filtering
router.get('/all', async (req: Request, res: Response) => {
  try {
    const query = airlineListQuerySchema.parse(req.query);
    
    let whereClause: any = {};
    
    if (query.name) {
      whereClause.name = {
        contains: query.name,
        mode: 'insensitive'
      };
    }
    
    if (query.nation_id) {
      whereClause.nation_id = query.nation_id;
    }

    const airlines = await prisma.airline.findMany({
      where: whereClause,
      include: {
        nation: true
      }
    });

    res.json(airlines);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    console.error('Error fetching airlines:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /airline/ - Fetch the airline associated with the current user
router.get('/', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    const airline = await prisma.airline.findUnique({
      where: { id: airlineId },
      include: {
        nation: true,
        extra: true
      }
    });

    if (!airline) {
      res.status(404).json({ error: 'Airline not found' });
      return;
    }

    res.json(airline);
  } catch (error) {
    console.error('Error fetching airline:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /airline/extras - Get all extras for the current airline
router.get('/extras', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    const extras = await prisma.extra.findMany({
      where: { airline_id: airlineId }
    });

    res.json(extras);
  } catch (error) {
    console.error('Error fetching extras:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /airline/extras - Add a new extra for the current airline
router.post('/extras', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    const data = extraInputSchema.parse(req.body);
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    const newExtra = await prisma.$transaction(async (tx) => {
      return await tx.extra.create({
        data: {
          id: randomUUID(),
          name: data.name,
          description: data.description,
          airline_id: airlineId,
          required_on_all_segments: data.required_on_all_segments,
          stackable: data.stackable
        }
      });
    });

    res.status(201).json(newExtra);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    console.error('Error creating extra:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /airline/extras/:extra_id - Get a specific extra
router.get('/extras/:extra_id', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    const extraId = req.params.extra_id;
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    const extra = await prisma.extra.findUnique({
      where: { id: extraId }
    });

    if (!extra) {
      res.status(404).json({ error: 'Extra not found' });
      return;
    }

    if (extra.airline_id !== airlineId) {
      res.status(403).json({ error: 'You do not have permission to get this extra', code: 403 });
      return;
    }

    res.json(extra);
  } catch (error) {
    console.error('Error fetching extra:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /airline/extras/:extra_id - Update an extra
router.put('/extras/:extra_id', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    const extraId = req.params.extra_id;
    const data = extraInputSchema.parse(req.body);
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    const extra = await prisma.extra.findUnique({
      where: { id: extraId }
    });

    if (!extra) {
      res.status(404).json({ error: 'Extra not found' });
      return;
    }

    if (extra.airline_id !== airlineId) {
      res.status(403).json({ error: 'You do not have permission to update this extra', code: 403 });
      return;
    }

    const updatedExtra = await prisma.extra.update({
      where: { id: extraId },
      data: {
        name: data.name,
        description: data.description,
        required_on_all_segments: data.required_on_all_segments,
        stackable: data.stackable
      }
    });

    res.json(updatedExtra);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    console.error('Error updating extra:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /airline/extras/:extra_id - Delete an extra
router.delete('/extras/:extra_id', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    const extraId = req.params.extra_id;
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    const extra = await prisma.extra.findUnique({
      where: { id: extraId }
    });

    if (!extra) {
      res.status(404).json({ error: 'Extra not found' });
      return;
    }

    if (extra.airline_id !== airlineId) {
      res.status(403).json({ error: 'You do not have permission to delete this extra', code: 403 });
      return;
    }

    try {
      await prisma.extra.delete({
        where: { id: extraId }
      });
      res.json({ message: 'Extra deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2003') { // Foreign key constraint
        res.status(409).json({ error: 'This extra is associated with flights and cannot be deleted' });
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting extra:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /airline/aircrafts - Get all aircraft for the current airline
router.get('/aircrafts', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    const aircraft = await prisma.airline_aircraft.findMany({
      where: { airline_id: airlineId },
      include: {
        aircraft: true,
        airline_aircraft_seat: true
      }
    });

    const formattedAircraft = aircraft.map(formatAirlineAircraftData);
    res.json(formattedAircraft);
  } catch (error) {
    console.error('Error fetching aircraft:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /airline/aircrafts - Add a new aircraft for the current airline
router.post('/aircrafts', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    const data = airlineAircraftInputSchema.parse(req.body);
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    const completeAircraft = await prisma.$transaction(async (tx) => {
      // Create the airline aircraft
      const newAircraft = await tx.airline_aircraft.create({
        data: {
          id: randomUUID(),
          aircraft_id: data.aircraft_id,
          airline_id: airlineId,
          tail_number: data.tail_number
        }
      });

      // Create seat assignments if provided
      const seatData = [];
      
      if (data.first_class_seats) {
        for (const seatNumber of data.first_class_seats) {
          seatData.push({
            airline_aircraft_id: newAircraft.id,
            seat_number: seatNumber,
            class_type: 'FIRST_CLASS' as const
          });
        }
      }
      
      if (data.business_class_seats) {
        for (const seatNumber of data.business_class_seats) {
          seatData.push({
            airline_aircraft_id: newAircraft.id,
            seat_number: seatNumber,
            class_type: 'BUSINESS_CLASS' as const
          });
        }
      }
      
      if (data.economy_class_seats) {
        for (const seatNumber of data.economy_class_seats) {
          seatData.push({
            airline_aircraft_id: newAircraft.id,
            seat_number: seatNumber,
            class_type: 'ECONOMY_CLASS' as const
          });
        }
      }

      if (seatData.length > 0) {
        await tx.airline_aircraft_seat.createMany({
          data: seatData
        });
      }

      // Fetch the complete aircraft with seats within the transaction
      return await tx.airline_aircraft.findUnique({
        where: { id: newAircraft.id },
        include: {
          aircraft: true,
          airline_aircraft_seat: true
        }
      });
    });

    if (!completeAircraft) {
      res.status(500).json({ error: 'Failed to retrieve created aircraft' });
      return;
    }

    res.status(201).json(formatAirlineAircraftData(completeAircraft));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    console.error('Error creating aircraft:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /airline/aircrafts/:aircraft_id - Get a specific aircraft
router.get('/aircrafts/:aircraft_id', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    const aircraftId = req.params.aircraft_id;
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    const aircraft = await prisma.airline_aircraft.findUnique({
      where: { id: aircraftId },
      include: {
        aircraft: true,
        airline_aircraft_seat: true
      }
    });

    if (!aircraft) {
      res.status(404).json({ error: 'Aircraft not found' });
      return;
    }

    if (aircraft.airline_id !== airlineId) {
      res.status(403).json({ error: 'You do not have permission to get this aircraft', code: 403 });
      return;
    }

    res.json(formatAirlineAircraftData(aircraft));
  } catch (error) {
    console.error('Error fetching aircraft:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /airline/aircrafts/:aircraft_id - Update an aircraft
router.put('/aircrafts/:aircraft_id', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    const aircraftId = req.params.aircraft_id;
    const data = airlineAircraftUpdateSchema.parse(req.body);
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    const aircraft = await prisma.airline_aircraft.findUnique({
      where: { id: aircraftId }
    });

    if (!aircraft) {
      res.status(404).json({ error: 'Aircraft not found' });
      return;
    }

    if (aircraft.airline_id !== airlineId) {
      res.status(403).json({ error: 'You do not have permission to update this aircraft', code: 403 });
      return;
    }

    // Update aircraft basic info
    const updateData: any = {};
    if (data.aircraft_id !== undefined) updateData.aircraft_id = data.aircraft_id;
    if (data.tail_number !== undefined) updateData.tail_number = data.tail_number;

    if (Object.keys(updateData).length > 0) {
      await prisma.airline_aircraft.update({
        where: { id: aircraftId },
        data: updateData
      });
    }

    // Update seat assignments if provided
    if (data.first_class_seats !== undefined || data.business_class_seats !== undefined || data.economy_class_seats !== undefined) {
      // Delete existing seats
      await prisma.airline_aircraft_seat.deleteMany({
        where: { airline_aircraft_id: aircraftId }
      });

      // Add new seats
      const seatData = [];
      
      if (data.first_class_seats) {
        for (const seatNumber of data.first_class_seats) {
          seatData.push({
            airline_aircraft_id: aircraftId,
            seat_number: seatNumber,
            class_type: 'FIRST_CLASS' as const
          });
        }
      }
      
      if (data.business_class_seats) {
        for (const seatNumber of data.business_class_seats) {
          seatData.push({
            airline_aircraft_id: aircraftId,
            seat_number: seatNumber,
            class_type: 'BUSINESS_CLASS' as const
          });
        }
      }
      
      if (data.economy_class_seats) {
        for (const seatNumber of data.economy_class_seats) {
          seatData.push({
            airline_aircraft_id: aircraftId,
            seat_number: seatNumber,
            class_type: 'ECONOMY_CLASS' as const
          });
        }
      }

      if (seatData.length > 0) {
        await prisma.airline_aircraft_seat.createMany({
          data: seatData
        });
      }
    }

    // Fetch updated aircraft
    const updatedAircraft = await prisma.airline_aircraft.findUnique({
      where: { id: aircraftId },
      include: {
        aircraft: true,
        airline_aircraft_seat: true
      }
    });

    if (!updatedAircraft) {
      res.status(500).json({ error: 'Failed to retrieve updated aircraft' });
      return;
    }

    res.json(formatAirlineAircraftData(updatedAircraft));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    console.error('Error updating aircraft:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /airline/aircrafts/:aircraft_id - Delete an aircraft
router.delete('/aircrafts/:aircraft_id', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    const aircraftId = req.params.aircraft_id;
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    const aircraft = await prisma.airline_aircraft.findUnique({
      where: { id: aircraftId }
    });

    if (!aircraft) {
      res.status(404).json({ error: 'Aircraft not found' });
      return;
    }

    if (aircraft.airline_id !== airlineId) {
      res.status(403).json({ error: 'You do not have permission to delete this aircraft', code: 403 });
      return;
    }

    try {
      await prisma.airline_aircraft.delete({
        where: { id: aircraftId }
      });
      res.json({ message: 'Aircraft deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2003') { // Foreign key constraint
        res.status(409).json({ error: 'This aircraft is associated with flights and cannot be deleted' });
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting aircraft:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /airline/routes - Get all routes for the current airline
router.get('/routes', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    const routes = await prisma.route.findMany({
      where: { airline_id: airlineId },
      include: {
        airport_route_departure_airport_idToairport: true,
        airport_route_arrival_airport_idToairport: true,
        flight: {
          include: {
            booking_departure_flight: true,
            booking_return_flight: true
          }
        }
      }
    });

    const formattedRoutes = routes.map(formatRouteData);
    res.json(formattedRoutes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /airline/routes - Add a new route for the current airline
router.post('/routes', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    const data = routeInputSchema.parse(req.body);
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    const newRoute = await prisma.$transaction(async (tx) => {
      return await tx.route.create({
        data: {
          departure_airport_id: data.departure_airport_id,
          arrival_airport_id: data.arrival_airport_id,
          airline_id: airlineId,
          period_start: new Date(data.period_start),
          period_end: new Date(data.period_end),
          flight_number: data.flight_number
        },
        include: {
          airport_route_departure_airport_idToairport: true,
          airport_route_arrival_airport_idToairport: true,
          flight: {
            include: {
              booking_departure_flight: true,
              booking_return_flight: true
            }
          }
        }
      });
    });

    res.status(201).json(formatRouteData(newRoute));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    console.error('Error creating route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /airline/routes/:route_id - Get a specific route
router.get('/routes/:route_id', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    const routeId = parseInt(req.params.route_id);
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        airport_route_departure_airport_idToairport: {
          include: {
            city: true
          }
        },
        airport_route_arrival_airport_idToairport: {
          include: {
            city: true
          }
        },
        flight: {
          include: {
            booking_departure_flight: true,
            booking_return_flight: true
          }
        }
      }
    });

    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    if (route.airline_id !== airlineId) {
      res.status(403).json({ error: 'You do not have permission to get this route', code: 403 });
      return;
    }

    res.json(formatRouteData(route));
  } catch (error) {
    console.error('Error fetching route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /airline/routes/:route_id - Update a route
router.put('/routes/:route_id', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    const routeId = parseInt(req.params.route_id);
    const data = routeUpdateSchema.parse(req.body);
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    const route = await prisma.route.findUnique({
      where: { id: routeId }
    });

    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    if (route.airline_id !== airlineId) {
      res.status(403).json({ error: 'You do not have permission to update this route', code: 403 });
      return;
    }

    const updateData: any = {};
    if (data.departure_airport_id !== undefined) updateData.departure_airport_id = data.departure_airport_id;
    if (data.arrival_airport_id !== undefined) updateData.arrival_airport_id = data.arrival_airport_id;
    if (data.period_start !== undefined) updateData.period_start = new Date(data.period_start);
    if (data.period_end !== undefined) updateData.period_end = new Date(data.period_end);
    if (data.flight_number !== undefined) updateData.flight_number = data.flight_number;

    const updatedRoute = await prisma.route.update({
      where: { id: routeId },
      data: updateData,
      include: {
        airport_route_departure_airport_idToairport: true,
        airport_route_arrival_airport_idToairport: true,
        flight: {
          include: {
            booking_departure_flight: true,
            booking_return_flight: true
          }
        }
      }
    });

    res.json(formatRouteData(updatedRoute));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    console.error('Error updating route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /airline/routes/:route_id - Delete a route
router.delete('/routes/:route_id', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    const routeId = parseInt(req.params.route_id);
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        flight: true
      }
    });

    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    if (route.airline_id !== airlineId) {
      res.status(403).json({ error: 'You do not have permission to delete this route', code: 403 });
      return;
    }

    // Check if route has associated flights
    if (route.flight && route.flight.length > 0) {
      res.status(409).json({ error: 'Cannot delete route with associated flights' });
      return;
    }

    try {
      await prisma.route.delete({
        where: { id: routeId }
      });
      res.json({ message: 'Route deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2003') { // Foreign key constraint
        res.status(409).json({ error: 'This route is associated with flights and cannot be deleted' });
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /airline/flights - Get all flights for the current airline with pagination
router.get('/flights', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    const query = flightPageQuerySchema.parse(req.query);
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    const pageNumber = query.page_number || 1;
    const limit = query.limit || 10;

    if (pageNumber < 1) {
      res.status(400).json({ error: 'Page number must be greater than 0' });
      return;
    }
    if (limit < 1) {
      res.status(400).json({ error: 'Limit must be greater than 0' });
      return;
    }

    // Get total count for pagination
    const totalFlights = await prisma.flight.count({
      where: {
        route: {
          airline_id: airlineId
        }
      }
    });

    if (totalFlights === 0) {
      res.json({
        items: [],
        total_pages: 0
      });
      return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(totalFlights / limit);
    const offset = (pageNumber - 1) * limit;

    // Get flights with pagination
    const flights = await prisma.flight.findMany({
      where: {
        route: {
          airline_id: airlineId
        }
      },
      include: {
        route: {
          include: {
            airport_route_departure_airport_idToairport: true,
            airport_route_arrival_airport_idToairport: true
          }
        },
        airline_aircraft: {
          include: {
            aircraft: true
          }
        },
        booking_departure_flight: true,
        booking_return_flight: true
      },
      skip: offset,
      take: limit
    });

    const formattedFlights = flights.map(flight => {
      const isEditable = flight.booking_departure_flight.length === 0 && flight.booking_return_flight.length === 0;


      return ({
      id: flight.id,
      flight_number: flight.route.flight_number,
      aircraft: {
        id: flight.airline_aircraft.id,
        tail_number: flight.airline_aircraft.tail_number,
        aircraft: flight.airline_aircraft.aircraft
      },
      route_id: flight.route_id,
      departure_time: flight.departure_time.toISOString(),
      arrival_time: flight.arrival_time.toISOString(),
      departure_airport: flight.route.airport_route_departure_airport_idToairport,
      arrival_airport: flight.route.airport_route_arrival_airport_idToairport,
      is_editable: isEditable,
    })});

    res.json({
      items: formattedFlights,
      total_pages: totalPages
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    console.error('Error fetching flights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /airline/flights - Create a new flight for the current airline
router.post('/flights', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    const data = flightInputSchema.parse(req.body);
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    // Validate that the airline aircraft belongs to the airline
    const aircraft = await prisma.airline_aircraft.findUnique({
      where: { id: data.aircraft_id }
    });

    if (!aircraft || aircraft.airline_id !== airlineId) {
      res.status(403).json({ error: 'The specified aircraft does not belong to your airline' });
      return;
    }

    // Validate that the route belongs to the airline
    const route = await prisma.route.findUnique({
      where: { id: data.route_id }
    });

    if (!route || route.airline_id !== airlineId) {
      res.status(403).json({ error: 'The specified route does not belong to your airline' });
      return;
    }

    // Pre-validate extras if provided to fail fast before transaction
    let airlineExtras: Map<string, any> | null = null;
    if (data.extras && data.extras.length > 0) {
      const airline = await prisma.airline.findUnique({
        where: { id: airlineId },
        include: { extra: true }
      });

      airlineExtras = new Map(airline!.extra.map(extra => [extra.id, extra]));

      for (const extraData of data.extras) {
        // Check if extra belongs to airline
        if (!airlineExtras.has(extraData.extra_id)) {
          res.status(403).json({ error: `Extra ${extraData.extra_id} does not belong to airline ${airlineId}` });
          return;
        }

        const extraOriginal = airlineExtras.get(extraData.extra_id)!;
        
        // Check if extra is stackable and if limit is appropriate
        if (!extraOriginal.stackable && extraData.limit > 1) {
          res.status(400).json({ error: `Extra ${extraOriginal.name} is not stackable, limit must be 1` });
          return;
        }
      }
    }

    const departureTime = new Date(data.departure_time);
    const arrivalTime = new Date(data.arrival_time);

    // Calculate default checkin and boarding times
    const checkinStartTime = new Date(departureTime.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
    const checkinEndTime = new Date(departureTime.getTime() - 1 * 60 * 60 * 1000); // 1 hour before
    const boardingStartTime = new Date(departureTime.getTime() - 1 * 60 * 60 * 1000); // 1 hour before
    const boardingEndTime = departureTime;

    const completeNewFlight = await prisma.$transaction(async (tx) => {
      // Create the flight
      const newFlight = await tx.flight.create({
        data: {
          id: randomUUID(),
          route_id: data.route_id,
          aircraft_id: data.aircraft_id,
          departure_time: departureTime,
          arrival_time: arrivalTime,
          price_economy_class: data.price_economy_class,
          price_business_class: data.price_business_class,
          price_first_class: data.price_first_class,
          price_insurance: data.price_insurance || 0.0,
          checkin_start_time: checkinStartTime,
          checkin_end_time: checkinEndTime,
          boarding_start_time: boardingStartTime,
          boarding_end_time: boardingEndTime,
          gate: null,
          terminal: null,
          fully_booked: false
        }
      });

      // Handle extras if provided
      if (data.extras && data.extras.length > 0 && airlineExtras) {
        for (const extraData of data.extras) {
          await tx.flight_extra.create({
            data: {
              id: randomUUID(),
              flight_id: newFlight.id,
              extra_id: extraData.extra_id,
              price: extraData.price,
              limit: extraData.limit
            }
          });
        }
      }

      // Fetch the complete flight with includes for response
      return await tx.flight.findUnique({
        where: { id: newFlight.id },
        include: {
          route: {
            include: {
              airport_route_departure_airport_idToairport: true,
              airport_route_arrival_airport_idToairport: true
            }
          },
          airline_aircraft: {
            include: {
              aircraft: true,
              airline_aircraft_seat: true
            }
          }
        }
      });
    });

    if (!completeNewFlight) {
      res.status(500).json({ error: 'Failed to retrieve created flight' });
      return;
    }

    // Format response
    const formattedFlight = {
      id: completeNewFlight.id,
      flight_number: completeNewFlight.route.flight_number,
      aircraft: formatAirlineAircraftData(completeNewFlight.airline_aircraft),
      route_id: completeNewFlight.route_id,
      departure_time: completeNewFlight.departure_time.toISOString(),
      arrival_time: completeNewFlight.arrival_time.toISOString(),
      departure_airport: completeNewFlight.route.airport_route_departure_airport_idToairport,
      arrival_airport: completeNewFlight.route.airport_route_arrival_airport_idToairport,
      price_first_class: completeNewFlight.price_first_class,
      price_business_class: completeNewFlight.price_business_class,
      price_economy_class: completeNewFlight.price_economy_class,
      price_insurance: completeNewFlight.price_insurance,
      gate: completeNewFlight.gate,
      terminal: completeNewFlight.terminal,
      checkin_start_time: completeNewFlight.checkin_start_time.toISOString(),
      checkin_end_time: completeNewFlight.checkin_end_time.toISOString(),
      boarding_start_time: completeNewFlight.boarding_start_time.toISOString(),
      boarding_end_time: completeNewFlight.boarding_end_time.toISOString()
    };

    res.status(201).json(formattedFlight);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    console.error('Error creating flight:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /airline/flights/:flight_id - Get a specific flight with seat information
router.get('/flights/:flight_id', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    const flightId = req.params.flight_id;
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    const flight = await prisma.flight.findFirst({
      where: {
        id: flightId,
        route: {
          airline_id: airlineId
        }
      },
      include: {
        route: {
          include: {
            airport_route_departure_airport_idToairport: {
              include: {
                city: true
              }
            },
            airport_route_arrival_airport_idToairport: {
              include: {
                city: true
              }
            }
          }
        },
        airline_aircraft: {
          include: {
            aircraft: true,
            airline_aircraft_seat: true
          }
        },
        booking_departure_flight: {
          include: {
            booking: true
          }
        },
        booking_return_flight: {
          include: {
            booking: true
          }
        }
      }
    });

    if (!flight) {
      res.status(404).json({ error: 'Flight not found' });
      return;
    }

    // Get booked seats
    const bookedSeats: string[] = [];
    flight.booking_departure_flight.forEach(booking => {
      if (booking.seat_number) bookedSeats.push(booking.seat_number);
    });
    flight.booking_return_flight.forEach(booking => {
      if (booking.seat_number) bookedSeats.push(booking.seat_number);
    });

    // Check if flight is editable (no bookings)
    const isEditable = flight.booking_departure_flight.length === 0 && flight.booking_return_flight.length === 0;

    const formattedFlight = {
      id: flight.id,
      flight_number: flight.route.flight_number,
      aircraft: formatAirlineAircraftData(flight.airline_aircraft),
      route_id: flight.route_id,
      departure_time: flight.departure_time.toISOString(),
      arrival_time: flight.arrival_time.toISOString(),
      departure_airport: flight.route.airport_route_departure_airport_idToairport,
      arrival_airport: flight.route.airport_route_arrival_airport_idToairport,
      price_first_class: flight.price_first_class,
      price_business_class: flight.price_business_class,
      price_economy_class: flight.price_economy_class,
      price_insurance: flight.price_insurance,
      gate: flight.gate,
      terminal: flight.terminal,
      checkin_start_time: flight.checkin_start_time.toISOString(),
      checkin_end_time: flight.checkin_end_time.toISOString(),
      boarding_start_time: flight.boarding_start_time.toISOString(),
      boarding_end_time: flight.boarding_end_time.toISOString(),
      booked_seats: bookedSeats,
      is_editable: isEditable
    };

    res.json(formattedFlight);
  } catch (error) {
    console.error('Error fetching flight:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /airline/flights/:flight_id - Update a flight
router.put('/flights/:flight_id', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    const flightId = req.params.flight_id;
    const data = flightUpdateSchema.parse(req.body);
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    const flight = await prisma.flight.findFirst({
      where: {
        id: flightId,
        route: {
          airline_id: airlineId
        }
      }
    });

    if (!flight) {
      res.status(404).json({ error: 'Flight not found' });
      return;
    }

    // Validate aircraft if provided
    if (data.aircraft_id) {
      const aircraft = await prisma.airline_aircraft.findUnique({
        where: { id: data.aircraft_id }
      });

      if (!aircraft || aircraft.airline_id !== airlineId) {
        res.status(403).json({ error: 'The specified aircraft does not belong to your airline' });
        return;
      }
    }

    // Validate route if provided
    if (data.route_id) {
      const route = await prisma.route.findUnique({
        where: { id: data.route_id }
      });

      if (!route || route.airline_id !== airlineId) {
        res.status(403).json({ error: 'The specified route does not belong to your airline' });
        return;
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (data.route_id !== undefined) updateData.route_id = data.route_id;
    if (data.aircraft_id !== undefined) updateData.aircraft_id = data.aircraft_id;
    if (data.departure_time !== undefined) updateData.departure_time = new Date(data.departure_time);
    if (data.arrival_time !== undefined) updateData.arrival_time = new Date(data.arrival_time);
    if (data.price_economy_class !== undefined) updateData.price_economy_class = data.price_economy_class;
    if (data.price_business_class !== undefined) updateData.price_business_class = data.price_business_class;
    if (data.price_first_class !== undefined) updateData.price_first_class = data.price_first_class;
    if (data.price_insurance !== undefined) updateData.price_insurance = data.price_insurance;

    // Update flight
    const updatedFlight = await prisma.flight.update({
      where: { id: flightId },
      data: updateData,
      include: {
        route: {
          include: {
            airport_route_departure_airport_idToairport: true,
            airport_route_arrival_airport_idToairport: true
          }
        },
        airline_aircraft: {
          include: {
            aircraft: true,
            airline_aircraft_seat: true
          }
        }
      }
    });

    // Handle extras if provided
    if (data.extras !== undefined) {
      // Remove existing extras
      await prisma.flight_extra.deleteMany({
        where: { flight_id: flightId }
      });

      // Add new extras
      if (data.extras && data.extras.length > 0) {
        const airline = await prisma.airline.findUnique({
          where: { id: airlineId },
          include: { extra: true }
        });

        const airlineExtras = new Map(airline!.extra.map(extra => [extra.id, extra]));

        for (const extraData of data.extras) {
          // Check if extra belongs to airline
          if (!airlineExtras.has(extraData.extra_id)) {
            res.status(403).json({ error: `Extra ${extraData.extra_id} does not belong to airline ${airlineId}` });
            return;
          }

          const extraOriginal = airlineExtras.get(extraData.extra_id)!;
          
          // Check if extra is stackable and if limit is appropriate
          if (!extraOriginal.stackable && extraData.limit > 1) {
            res.status(400).json({ error: `Extra ${extraOriginal.name} is not stackable, limit must be 1` });
            return;
          }

          await prisma.flight_extra.create({
            data: {
              id: randomUUID(),
              flight_id: flightId,
              extra_id: extraData.extra_id,
              price: extraData.price,
              limit: extraData.limit
            }
          });
        }
      }
    }

    // Format response
    const formattedFlight = {
      id: updatedFlight.id,
      flight_number: updatedFlight.route.flight_number,
      aircraft: formatAirlineAircraftData(updatedFlight.airline_aircraft),
      route_id: updatedFlight.route_id,
      departure_time: updatedFlight.departure_time.toISOString(),
      arrival_time: updatedFlight.arrival_time.toISOString(),
      departure_airport: updatedFlight.route.airport_route_departure_airport_idToairport,
      arrival_airport: updatedFlight.route.airport_route_arrival_airport_idToairport,
      price_first_class: updatedFlight.price_first_class,
      price_business_class: updatedFlight.price_business_class,
      price_economy_class: updatedFlight.price_economy_class,
      price_insurance: updatedFlight.price_insurance,
      gate: updatedFlight.gate,
      terminal: updatedFlight.terminal,
      checkin_start_time: updatedFlight.checkin_start_time.toISOString(),
      checkin_end_time: updatedFlight.checkin_end_time.toISOString(),
      boarding_start_time: updatedFlight.boarding_start_time.toISOString(),
      boarding_end_time: updatedFlight.boarding_end_time.toISOString()
    };

    res.json(formattedFlight);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    console.error('Error updating flight:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /airline/flights/:flight_id - Delete a flight
router.delete('/flights/:flight_id', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = await getAirlineIdFromUser(userId);
    const flightId = req.params.flight_id;
    
    if (!airlineId) {
      res.status(400).json({ error: 'Airline ID is required for airline-admin' });
      return;
    }

    const flight = await prisma.flight.findFirst({
      where: {
        id: flightId,
        route: {
          airline_id: airlineId
        }
      },
      include: {
        booking_departure_flight: true,
        booking_return_flight: true
      }
    });

    if (!flight) {
      res.status(404).json({ error: 'Flight not found' });
      return;
    }

    // Check if the flight is in the past
    if (flight.departure_time < new Date()) {
      res.status(409).json({ error: 'Cannot delete flights that have already departed' });
      return;
    }

    // Check if flight has bookings
    if (flight.booking_departure_flight.length > 0 || flight.booking_return_flight.length > 0) {
      res.status(409).json({ error: 'This flight has associated bookings and cannot be deleted' });
      return;
    }

    try {
      await prisma.flight.delete({
        where: { id: flightId }
      });
      res.json({ message: 'Flight deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2003') { // Foreign key constraint
        res.status(409).json({ error: 'This flight has associated bookings and cannot be deleted' });
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting flight:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /airline/stats - Get airline statistics
// GET /airline/stats - Get airline statistics
// Stats endpoint
router.get('/stats',
  authenticateToken,
  requireRoles(['airline-admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const airlineId = await getAirlineIdFromUser(userId);
      
      if (!airlineId) {
        res.status(403).json({ error: 'User is not associated with an airline' });
        return;
      }

      const currentYear = new Date().getFullYear();

      // 1. Flights Fulfillment - Monthly stats for current year
      const flightFulfillmentRaw = await prisma.$queryRaw<Array<{
        month: number;
        totalSeats: bigint;
        totalBooks: bigint;
      }>>`
        SELECT 
          EXTRACT(MONTH FROM f.departure_time)::int as month,
          COUNT(DISTINCT aas.seat_number) as "totalSeats",
          (COUNT(DISTINCT (bdf.booking_id, bdf.flight_id)) + 
           COUNT(DISTINCT (brf.booking_id, brf.flight_id))) as "totalBooks"
        FROM flight f
        JOIN route r ON f.route_id = r.id
        JOIN airline_aircraft aa ON f.aircraft_id = aa.id
        JOIN airline_aircraft_seat aas ON aa.id = aas.airline_aircraft_id
        LEFT JOIN booking_departure_flight bdf ON f.id = bdf.flight_id
        LEFT JOIN booking_return_flight brf ON f.id = brf.flight_id
        WHERE r.airline_id = ${airlineId}::uuid
          AND EXTRACT(YEAR FROM f.departure_time) = ${currentYear}
        GROUP BY EXTRACT(MONTH FROM f.departure_time)
        ORDER BY month
      `;

      // Initialize all months with zero values
      const flightsFulfillment = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        totalSeats: 0,
        totalBooks: 0
      }));

      // Update with actual data
      flightFulfillmentRaw.forEach(row => {
        const monthIndex = row.month - 1;
        flightsFulfillment[monthIndex] = {
          month: row.month,
          totalSeats: Number(row.totalSeats),
          totalBooks: Number(row.totalBooks)
        };
      });

      // 2. Revenue - Monthly revenue for current year
      const revenueRaw = await prisma.$queryRaw<Array<{
        month: number;
        departureRevenue: number;
        returnRevenue: number;
      }>>`
        SELECT 
          EXTRACT(MONTH FROM f.departure_time)::int as month,
          COALESCE(SUM(bdf.price), 0) as "departureRevenue",
          COALESCE(SUM(brf.price), 0) as "returnRevenue"
        FROM flight f
        JOIN route r ON f.route_id = r.id
        LEFT JOIN booking_departure_flight bdf ON f.id = bdf.flight_id
        LEFT JOIN booking_return_flight brf ON f.id = brf.flight_id
        WHERE r.airline_id = ${airlineId}::uuid
          AND EXTRACT(YEAR FROM f.departure_time) = ${currentYear}
        GROUP BY EXTRACT(MONTH FROM f.departure_time)
        ORDER BY month
      `;

      // Initialize all months with zero revenue
      const revenue = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        total: 0
      }));

      // Update with actual data
      revenueRaw.forEach(row => {
        const monthIndex = row.month - 1;
        revenue[monthIndex] = {
          month: row.month,
          total: Math.round((row.departureRevenue + row.returnRevenue) * 100) / 100
        };
      });

      // 3. Most Requested Routes (top 10 by booking-to-seat ratio)
      const mostRequestedRoutesRaw = await prisma.$queryRaw<Array<{
        airportFrom: string;
        airportTo: string;
        bookings: bigint;
        totalSeats: bigint;
      }>>`
        WITH route_seats AS (
          SELECT 
            r.id as route_id,
            dep_ap.iata_code as departure_iata,
            arr_ap.iata_code as arrival_iata,
            COUNT(aas.seat_number) as total_seats
          FROM route r
          JOIN airport dep_ap ON r.departure_airport_id = dep_ap.id
          JOIN airport arr_ap ON r.arrival_airport_id = arr_ap.id
          JOIN flight f ON r.id = f.route_id
          JOIN airline_aircraft aa ON f.aircraft_id = aa.id
          JOIN airline_aircraft_seat aas ON aa.id = aas.airline_aircraft_id
          WHERE r.airline_id = ${airlineId}::uuid
          GROUP BY r.id, dep_ap.iata_code, arr_ap.iata_code
        ),
        route_bookings AS (
          SELECT 
            r.id as route_id,
            (COUNT(DISTINCT (bdf.booking_id, bdf.flight_id)) + 
             COUNT(DISTINCT (brf.booking_id, brf.flight_id))) as total_bookings
          FROM route r
          JOIN flight f ON r.id = f.route_id
          LEFT JOIN booking_departure_flight bdf ON f.id = bdf.flight_id
          LEFT JOIN booking_return_flight brf ON f.id = brf.flight_id
          WHERE r.airline_id = ${airlineId}::uuid
          GROUP BY r.id
        )
        SELECT 
          rs.departure_iata as "airportFrom",
          rs.arrival_iata as "airportTo",
          COALESCE(rb.total_bookings, 0) as bookings,
          rs.total_seats as "totalSeats"
        FROM route_seats rs
        LEFT JOIN route_bookings rb ON rs.route_id = rb.route_id
        WHERE rs.total_seats > 0
        ORDER BY (COALESCE(rb.total_bookings, 0)::float / rs.total_seats) DESC
        LIMIT 10
      `;

      const mostRequestedRoutes = mostRequestedRoutesRaw.map(row => ({
        airportFrom: row.airportFrom,
        airportTo: row.airportTo,
        bookings: Number(row.bookings),
        total_seats: Number(row.totalSeats),
        booking_ratio: row.totalSeats > 0 ? Number(row.bookings) / Number(row.totalSeats) : 0
      }));

      // 4. Airports with Most Flights (top 10)
      const airportsWithMostFlightsRaw = await prisma.$queryRaw<Array<{
        airport: string;
        flights: bigint;
      }>>`
        SELECT 
          dep_ap.iata_code as airport,
          COUNT(f.id) as flights
        FROM flight f
        JOIN route r ON f.route_id = r.id
        JOIN airport dep_ap ON r.departure_airport_id = dep_ap.id
        WHERE r.airline_id = ${airlineId}::uuid
        GROUP BY dep_ap.iata_code
        ORDER BY COUNT(f.id) DESC
        LIMIT 10
      `;

      const airportsWithMostFlights = airportsWithMostFlightsRaw.map(row => ({
        airport: row.airport,
        flights: Number(row.flights)
      }));

      // 5. Least Used Routes (bottom 10 by flight count)
      const leastUsedRouteRaw = await prisma.$queryRaw<Array<{
        airportFrom: string;
        airportTo: string;
        flights: bigint;
      }>>`
        SELECT 
          dep_ap.iata_code as "airportFrom",
          arr_ap.iata_code as "airportTo",
          COUNT(f.id) as flights
        FROM route r
        JOIN airport dep_ap ON r.departure_airport_id = dep_ap.id
        JOIN airport arr_ap ON r.arrival_airport_id = arr_ap.id
        JOIN flight f ON r.id = f.route_id
        WHERE r.airline_id = ${airlineId}::uuid
        GROUP BY dep_ap.iata_code, arr_ap.iata_code
        ORDER BY COUNT(f.id) ASC
        LIMIT 10
      `;

      const leastUsedRoute = leastUsedRouteRaw.map(row => ({
        airportFrom: row.airportFrom,
        airportTo: row.airportTo,
        flights: Number(row.flights)
      }));

      const stats = {
        flights_fullfilment: flightsFulfillment,
        revenue: revenue,
        mostRequestedRoutes: mostRequestedRoutes,
        airportsWithMostFlights: airportsWithMostFlights,
        leastUsedRoute: leastUsedRoute
      };

      res.status(200).json(stats);
    } catch (error) {
      console.error('Error fetching airline stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /airline/:airline_id - Update an airline given its identifier
router.put('/:airline_id', authenticateToken, requireRoles(['airline-admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const airlineId = req.params.airline_id;
    const data = airlineUpdateSchema.parse(req.body);

    // Check if the user is an airline admin and if they are trying to update their own airline
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { airline_id: true, confirmed_at: true }
    });

    if (user?.airline_id !== airlineId) {
      res.status(403).json({ error: 'You do not have permission to update this airline', code: 403 });
      return;
    }

    const airline = await prisma.airline.findUnique({
      where: { id: airlineId }
    });

    if (!airline) {
      res.status(404).json({ error: 'Airline not found' });
      return;
    }

    // Update airline with provided data
    const updatedAirline = await prisma.airline.update({
      where: { id: airlineId },
      data: data,
      include: {
        nation: true
      }
    });

    // Check if all required fields are present and not null (matches Python logic)
    const requiredFields = ['name', 'nation_id', 'address', 'email', 'website', 'zip', 
                           'first_class_description', 'business_class_description', 
                           'economy_class_description'];

    const allNotNull = requiredFields.every(field => 
      updatedAirline[field as keyof typeof updatedAirline] !== null
    );

    if (allNotNull && user.confirmed_at !== null) {
      await prisma.user.update({
        where: { id: userId },
        data: { active: true }
      });
    }

    res.json(updatedAirline);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    console.error('Error updating airline:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /airline/:airline_id - Fetch an airline given its identifier (MUST BE LAST)
router.get('/:airline_id', async (req: Request, res: Response) => {
  try {
    const airlineId = req.params.airline_id;

    const airline = await prisma.airline.findUnique({
      where: { id: airlineId },
      include: {
        nation: true,
        extra: true
      }
    });

    if (!airline) {
      res.status(404).json({ error: 'Airline not found' });
      return;
    }

    res.json(airline);
  } catch (error) {
    console.error('Error fetching airline:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const airlineRouter = router; 
