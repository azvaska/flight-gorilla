import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { 
  LocationListResponseSchema,
  CityListResponseSchema,
  NationListResponseSchema,
  LocationListQuerySchema,
  CityListQuerySchema,
  NationListQuerySchema,
  CityParamsSchema,
  NationParamsSchema,
  CitySchema,
  NationSchema,
  type LocationListQuery,
  type CityListQuery,
  type NationListQuery,
  type CityParams,
  type NationParams
} from '../schemas/location';
import { registry } from '../config/openapi';
import { ErrorResponseSchema } from '../config/openapi';
import { validateQuery, validateParams } from '../utils/validation';

const prisma = new PrismaClient();
export const locationRouter = Router();

// Register OpenAPI paths
registry.registerPath({
  method: 'get',
  path: '/location/all',
  description: 'Get all locations',
  summary: 'List all locations (cities, nations, airports) with optional filtering',
  tags: ['Location'],
  request: {
    query: LocationListQuerySchema,
  },
  responses: {
    200: {
      description: 'List of locations',
      content: {
        'application/json': {
          schema: LocationListResponseSchema,
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
  path: '/location/city',
  description: 'Get cities',
  summary: 'List all cities with optional filtering and pagination',
  tags: ['Location'],
  request: {
    query: CityListQuerySchema,
  },
  responses: {
    200: {
      description: 'List of cities',
      content: {
        'application/json': {
          schema: CityListResponseSchema,
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
  path: '/location/city/{city_id}',
  description: 'Get city by ID',
  summary: 'Fetch a city given its identifier',
  tags: ['Location'],
  request: {
    params: CityParamsSchema,
  },
  responses: {
    200: {
      description: 'City found',
      content: {
        'application/json': {
          schema: CitySchema,
        },
      },
    },
    404: {
      description: 'City not found',
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
  path: '/location/nations',
  description: 'Get nations',
  summary: 'List all nations with optional filtering',
  tags: ['Location'],
  request: {
    query: NationListQuerySchema,
  },
  responses: {
    200: {
      description: 'List of nations',
      content: {
        'application/json': {
          schema: NationListResponseSchema,
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
  path: '/location/nation/{nation_id}',
  description: 'Get nation by ID',
  summary: 'Fetch a nation given its identifier',
  tags: ['Location'],
  request: {
    params: NationParamsSchema,
  },
  responses: {
    200: {
      description: 'Nation found',
      content: {
        'application/json': {
          schema: NationSchema,
        },
      },
    },
    404: {
      description: 'Nation not found',
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
locationRouter.get('/all', 
  validateQuery(LocationListQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.validatedQuery as LocationListQuery;
      const { name, include_nations = false } = query;

      const results: any[] = [];

      // Build where conditions for name filtering
      const nameFilter = name ? {
        contains: name,
        mode: 'insensitive' as const,
      } : undefined;

      // Get cities
      const cities = await prisma.city.findMany({
        where: name ? { name: nameFilter } : undefined,
        orderBy: { name: 'asc' },
      });

      results.push(...cities.map(city => ({
        id: city.id,
        name: city.name,
        type: 'city' as const,
      })));

      // Get airports with IATA code concatenation
      const airports = await prisma.airport.findMany({
        where: name ? {
          OR: [
            { name: nameFilter },
            { iata_code: nameFilter },
          ]
        } : undefined,
        orderBy: { name: 'asc' },
      });

      results.push(...airports.map(airport => ({
        id: airport.id,
        name: airport.iata_code ? `${airport.name} (${airport.iata_code})` : airport.name,
        type: 'airport' as const,
      })));

      // Get nations (only if requested)
      if (include_nations) {
        const nations = await prisma.nation.findMany({
          where: name ? { name: nameFilter } : undefined,
          orderBy: { name: 'asc' },
        });

        results.push(...nations.map(nation => ({
          id: nation.id,
          name: nation.name,
          type: 'nation' as const,
        })));
      }

      // Sort all results by name
      results.sort((a, b) => a.name.localeCompare(b.name));

      res.json(results);
    } catch (error) {
      console.error('Get all locations error:', error);
      next(error);
    }
  }
);

locationRouter.get('/city', 
  validateQuery(CityListQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.validatedQuery as CityListQuery;
      const { name, include_nation = false, nation_id } = query;

      // Build where conditions
      const where: any = {};
      
      if (name) {
        where.name = {
          contains: name,
          mode: 'insensitive',
        };
      }
      
      if (nation_id) {
        where.nation_id = nation_id;
      }

      if (include_nation) {
        const cities = await prisma.city.findMany({
          where: Object.keys(where).length > 0 ? where : undefined,
          include: { nation: true },
          orderBy: { name: 'asc' },
        });

        const formattedCities = cities.map(city => ({
          id: city.id,
          name: city.name,
          nation: city.nation,
        }));
        res.json(formattedCities);
      } else {
        const cities = await prisma.city.findMany({
          where: Object.keys(where).length > 0 ? where : undefined,
          orderBy: { name: 'asc' },
        });

        const formattedCities = cities.map(city => ({
          id: city.id,
          name: city.name,
        }));
        res.json(formattedCities);
      }
    } catch (error) {
      console.error('Get cities error:', error);
      next(error);
    }
  }
);

locationRouter.get('/city/:city_id', 
  validateParams(CityParamsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { city_id } = req.validatedParams as CityParams;

      const city = await prisma.city.findUnique({
        where: { id: city_id },
        include: { nation: true },
      });

      if (!city) {
        res.status(404).json({ error: 'City not found' });
        return;
      }

      res.json({
        id: city.id,
        name: city.name,
        nation: city.nation,
      });
    } catch (error) {
      console.error('Get city error:', error);
      next(error);
    }
  }
);

locationRouter.get('/nations', 
  validateQuery(NationListQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.validatedQuery as NationListQuery;
      const { name, code, alpha2 } = query;

      // Build where conditions
      const where: any = {};
      
      if (name) {
        where.name = {
          contains: name,
          mode: 'insensitive',
        };
      }
      
      if (code) {
        where.code = {
          contains: code,
          mode: 'insensitive',
        };
      }
      
      if (alpha2) {
        where.alpha2 = {
          equals: alpha2,
          mode: 'insensitive',
        };
      }

      const nations = await prisma.nation.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        orderBy: { name: 'asc' },
      });

      res.json(nations);
    } catch (error) {
      console.error('Get nations error:', error);
      next(error);
    }
  }
);

locationRouter.get('/nation/:nation_id', 
  validateParams(NationParamsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { nation_id } = req.validatedParams as NationParams;

      const nation = await prisma.nation.findUnique({
        where: { id: nation_id },
      });

      if (!nation) {
        res.status(404).json({ error: 'Nation not found' });
        return;
      }

      res.json(nation);
    } catch (error) {
      console.error('Get nation error:', error);
      next(error);
    }
  }
);

// Cleanup on app termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
}); 
