import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { 
  AirportListQuerySchema, 
  AirportParamsSchema,
  AirportListResponseSchema,
  AirportResponseSchema,
  type AirportListQuery,
  type AirportParams
} from '../schemas/airport';
import { registry } from '../config/openapi';
import { ErrorResponseSchema, ValidationErrorResponseSchema } from '../config/openapi';
import { validateQuery, validateParams } from '../utils/validation';
import '../types/express';

const prisma = new PrismaClient();
export const airportRouter = Router();


registry.registerPath({
  method: 'get',
  path: '/airports',
  description: 'List all airports with optional filtering',
  summary: 'Get airports list',
  tags: ['Airports'],
  request: {
    query: AirportListQuerySchema,
  },
  responses: {
    200: {
      description: 'Successful response',
      content: {
        'application/json': {
          schema: AirportListResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: ValidationErrorResponseSchema,
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
  path: '/airports/{airport_id}',
  description: 'Get a specific airport by ID',
  summary: 'Get airport details',
  tags: ['Airports'],
  request: {
    params: AirportParamsSchema,
  },
  responses: {
    200: {
      description: 'Successful response',
      content: {
        'application/json': {
          schema: AirportResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: ValidationErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Airport not found',
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


airportRouter.get('/', validateQuery(AirportListQuerySchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = req.validatedQuery as AirportListQuery;
    
    // Build Prisma where clause
    const where: any = {};
    
    if (query.name) {
      where.name = {
        contains: query.name,
        mode: 'insensitive',
      };
    }
    
    if (query.iata_code) {
      where.iata_code = {
        equals: query.iata_code.toUpperCase(),
        mode: 'insensitive',
      };
    }
    
    if (query.icao_code) {
      where.icao_code = {
        equals: query.icao_code.toUpperCase(),
        mode: 'insensitive',
      };
    }
    
    if (query.city_name) {
      where.city = {
        name: {
          contains: query.city_name,
          mode: 'insensitive',
        },
      };
    }
    
    if (query.nation_name) {
      where.city = {
        ...where.city,
        nation: {
          name: {
            contains: query.nation_name,
            mode: 'insensitive',
          },
        },
      };
    }

    const airports = await prisma.airport.findMany({
      where,
      include: {
        city: {
          include: {
            nation: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json(airports);
  } catch (error) {
    next(error);
  }
});

airportRouter.get('/:airport_id', validateParams(AirportParamsSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const params = req.validatedParams as AirportParams;
    const { airport_id } = params;

    const airport = await prisma.airport.findUnique({
      where: {
        id: airport_id,
      },
      include: {
        city: {
          include: {
            nation: true,
          },
        },
      },
    });

    if (!airport) {
      res.status(404).json({
        error: 'Airport not found',
      });
      return;
    }

    res.json(airport);
  } catch (error) {
    next(error);
  }
});


process.on('beforeExit', async () => {
  await prisma.$disconnect();
}); 
