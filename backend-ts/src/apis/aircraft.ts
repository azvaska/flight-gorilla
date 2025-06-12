import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { 
  AircraftListResponseSchema,
  AircraftListQuerySchema,
  AircraftParamsSchema,
  AircraftSchema,
  type AircraftListQuery,
  type AircraftParams
} from '../schemas/aircraft';
import { registry } from '../config/openapi';
import { ErrorResponseSchema } from '../config/openapi';
import { validateQuery, validateParams } from '../utils/validation';

const prisma = new PrismaClient();
export const aircraftRouter = Router();

// Register OpenAPI paths
registry.registerPath({
  method: 'get',
  path: '/aircraft',
  description: 'Get aircraft',
  summary: 'List all aircraft with optional filtering',
  tags: ['Aircraft'],
  request: {
    query: AircraftListQuerySchema,
  },
  responses: {
    200: {
      description: 'List of aircraft',
      content: {
        'application/json': {
          schema: AircraftListResponseSchema,
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
  path: '/aircraft/{aircraft_id}',
  description: 'Get aircraft by ID',
  summary: 'Fetch an aircraft given its identifier',
  tags: ['Aircraft'],
  request: {
    params: AircraftParamsSchema,
  },
  responses: {
    200: {
      description: 'Aircraft found',
      content: {
        'application/json': {
          schema: AircraftSchema,
        },
      },
    },
    404: {
      description: 'Aircraft not found',
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
aircraftRouter.get('/', 
  validateQuery(AircraftListQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.validatedQuery as AircraftListQuery;
      const { name } = query;

      // Build where conditions
      const where: any = {};
      
      if (name) {
        where.name = {
          contains: name,
          mode: 'insensitive',
        };
      }

      const aircraft = await prisma.aircraft.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        orderBy: { name: 'asc' },
      });

      const formattedAircraft = aircraft.map(ac => ({
        id: ac.id,
        name: ac.name,
        rows: ac.rows,
        columns: ac.columns,
        unavailable_seats: ac.unavailable_seats || [],
      }));

      res.json(formattedAircraft);
    } catch (error) {
      console.error('Get aircraft error:', error);
      next(error);
    }
  }
);

aircraftRouter.get('/:aircraft_id', 
  validateParams(AircraftParamsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { aircraft_id } = req.validatedParams as AircraftParams;

      const aircraft = await prisma.aircraft.findUnique({
        where: { id: aircraft_id },
      });

      if (!aircraft) {
        res.status(404).json({ error: 'Aircraft not found' });
        return;
      }

      res.json({
        id: aircraft.id,
        name: aircraft.name,
        rows: aircraft.rows,
        columns: aircraft.columns,
        unavailable_seats: aircraft.unavailable_seats || [],
      });
    } catch (error) {
      console.error('Get aircraft error:', error);
      next(error);
    }
  }
); 
