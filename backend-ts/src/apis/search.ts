import { Router, Request, Response, NextFunction } from 'express';
import { 
  SearchOutputSchema,
  FlexibleDateResponseSchema,
  FlightSearchQuerySchema,
  FlexibleDateSearchQuerySchema,
  type FlightSearchQuery,
  type FlexibleDateSearchQuery
} from '../schemas/search';
import { registry } from '../config/openapi';
import { ErrorResponseSchema } from '../config/openapi';
import { validateQuery } from '../utils/validation';
import { 
  generateJourney, 
  filterJourneys, 
  sortJourneys, 
  getAirports, 
  lowestPriceMultipleDates 
} from '../utils/search';

export const searchRouter = Router();

// Register OpenAPI paths
registry.registerPath({
  method: 'get',
  path: '/search/flights',
  description: 'Search for flights',
  summary: 'Search for flights based on departure/arrival airports and date using RAPTOR algorithm',
  tags: ['Search'],
  request: {
    query: FlightSearchQuerySchema,
  },
  responses: {
    200: {
      description: 'Flight search results',
      content: {
        'application/json': {
          schema: SearchOutputSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
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
  path: '/search/flexible-dates',
  description: 'Flexible date search',
  summary: 'Get minimum prices for each day in a month for a given departure and arrival airport',
  tags: ['Search'],
  request: {
    query: FlexibleDateSearchQuerySchema,
  },
  responses: {
    200: {
      description: 'Flexible date search results',
      content: {
        'application/json': {
          schema: FlexibleDateResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// Helper function to parse date in DD-MM-YYYY format
function parseDateDDMMYYYY(dateStr: string): Date {
  const [day, month, year] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Helper function to parse date in MM-YYYY format
function parseDateMMYYYY(dateStr: string): Date {
  const [month, year] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

// Helper function to calculate dates for a month
function calculateDates(date: Date): Date[] {
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  const dateRange: Date[] = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dateRange.push(new Date(d));
  }
  
  return dateRange;
}

// Routes
searchRouter.get('/flights', 
  validateQuery(FlightSearchQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.validatedQuery as FlightSearchQuery;

      // Parse and validate date
      let departureDate: Date;
      try {
        departureDate = parseDateDDMMYYYY(query.departure_date);
      } catch (error) {
        res.status(400).json({ error: 'Invalid departure date format. Use DD-MM-YYYY', code: 400 });
        return;
      }

      // Ensure departure date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (departureDate < today) {
        res.status(400).json({ error: 'Departure date cannot be in the past', code: 400 });
        return;
      }

      // Get airports
      const { departureAirports, arrivalAirports, error } = await getAirports(query);
      if (error) {
        res.status(error.code).json(error);
        return;
      }

      const unfilteredDepartureJourneys = [];

      for (const departureAirport of departureAirports) {
        for (const arrivalAirport of arrivalAirports) {
          // Generate journeys for each departure and arrival airport
          const departureResults = await generateJourney(
            departureAirport,
            arrivalAirport,
            departureDate,
            query.max_transfers,
            query
          );
          unfilteredDepartureJourneys.push(...departureResults);
        }
      }

      // Filter resulting journeys
      const filteredJourneys = filterJourneys(unfilteredDepartureJourneys, query);
      
      // Remove null values for sorting
      const validJourneys = filteredJourneys.filter(j => j !== null);
      
      // Sort results
      const sortedJourneys = sortJourneys(validJourneys, query);

      console.log('Found journeys:', sortedJourneys.length);

      const originalLen = sortedJourneys.length;
      
      // Set default limit
      const limit = query.limit || 10;
      
      // Paginate results
      let paginatedJourneys = sortedJourneys;
      if (query.page_number && limit) {
        const start = (query.page_number - 1) * limit;
        const end = start + limit;
        if (start >= sortedJourneys.length || start < 0) {
          paginatedJourneys = [];
        } else {
          paginatedJourneys = sortedJourneys.slice(start, Math.min(end, sortedJourneys.length));
        }
      }

      const totalPages = Math.ceil(originalLen / limit);

      res.json({
        journeys: paginatedJourneys,
        total_pages: totalPages
      });
    } catch (error) {
      console.error('Flight search error:', error);
      next(error);
    }
  }
);

searchRouter.get('/flexible-dates', 
  validateQuery(FlexibleDateSearchQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.validatedQuery as FlexibleDateSearchQuery;

      // Parse and validate date
      let departureDate: Date;
      try {
        departureDate = parseDateMMYYYY(query.departure_date);
      } catch (error) {
        res.status(400).json({ error: 'Invalid departure date format. Use MM-YYYY', code: 400 });
        return;
      }

      // Get airports
      const { departureAirports, arrivalAirports, error } = await getAirports(query);
      if (error) {
        res.status(error.code).json(error);
        return;
      }

      const departureDateRange = calculateDates(departureDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let departureJourneys: (number | null)[] = [];
      
      // If the month is the current month, filter out past dates
      if (departureDate.getMonth() === today.getMonth() && departureDate.getFullYear() === today.getFullYear()) {
        const todayDay = today.getDate();
        const filteredDateRange = departureDateRange.slice(todayDay - 1);
        
        // Add null values for past days
        departureJourneys = new Array(todayDay - 1).fill(null);
        
        // Get prices for remaining days
        const prices = await lowestPriceMultipleDates(
          filteredDateRange,
          departureAirports,
          arrivalAirports,
          query
        );
        departureJourneys.push(...prices);
      } else {
        // Get prices for all days in the month
        departureJourneys = await lowestPriceMultipleDates(
          departureDateRange,
          departureAirports,
          arrivalAirports,
          query
        );
      }

      res.json(departureJourneys);
    } catch (error) {
      console.error('Flexible date search error:', error);
      next(error);
    }
  }
); 
