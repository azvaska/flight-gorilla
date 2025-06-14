import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { ErrorResponseSchema } from '../config/openapi';
import { classtype } from '../../generated/prisma';

extendZodWithOpenApi(z);


export const NationSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  code: z.string(),
  alpha2: z.string(),
});

export const AircraftSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  rows: z.number().int(),
  columns: z.number().int(),
  unavailable_seats: z.array(z.string()),
});

export const AirportSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  iata_code: z.string().nullable(),
  icao_code: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  city_id: z.number().int(),
});


export const AirlineSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string().nullable(),
  zip: z.string().nullable(),
  nation_id: z.number().int().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  first_class_description: z.string().nullable(),
  business_class_description: z.string().nullable(),
  economy_class_description: z.string().nullable(),
  nation: NationSchema.nullable(),
});

export const AirlinePutSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  zip: z.string().optional(),
  nation_id: z.number().int().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  first_class_description: z.string().optional(),
  business_class_description: z.string().optional(),
  economy_class_description: z.string().optional(),
});

export const AdminCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const NewAirlineSchema = z.object({
  airline: AirlineSchema,
  admin_credentials: AdminCredentialsSchema,
});


export const extraInputSchema = z.object({
  name: z.string().min(1, 'Name is required').openapi({ description: 'Extra name', example: 'Priority Boarding' }),
  description: z.string().min(1, 'Description is required').openapi({ description: 'Extra description', example: 'Board the aircraft before other passengers' }),
  required_on_all_segments: z.boolean().default(false).openapi({ description: 'Apply to all flights', example: false }),
  stackable: z.boolean().default(false).openapi({ description: 'Can be stacked with other extras', example: true })
}).openapi({ title: 'ExtraInput', description: 'Extra service input' });

export const extraOutputSchema = z.object({
  id: z.string().openapi({ description: 'Extra ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
  name: z.string().openapi({ description: 'Extra name', example: 'Priority Boarding' }),
  description: z.string().openapi({ description: 'Extra description', example: 'Board the aircraft before other passengers' }),
  airline_id: z.string().openapi({ description: 'Airline ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
  required_on_all_segments: z.boolean().openapi({ description: 'Apply to all flights', example: false }),
  stackable: z.boolean().openapi({ description: 'Can be stacked with other extras', example: true })
}).openapi({ title: 'ExtraOutput', description: 'Extra service details' });


export const airlineAircraftInputSchema = z.object({
  aircraft_id: z.number().int().min(1, 'Aircraft ID is required').openapi({ description: 'Aircraft ID', example: 1 }),
  first_class_seats: z.array(z.string()).optional().openapi({ description: 'First class seat numbers', example: ['1A', '1B', '1C'] }),
  business_class_seats: z.array(z.string()).optional().openapi({ description: 'Business class seat numbers', example: ['2A', '2B', '2C'] }),
  economy_class_seats: z.array(z.string()).optional().openapi({ description: 'Economy class seat numbers', example: ['3A', '3B', '3C'] }),
  tail_number: z.string().openapi({ description: 'Aircraft tail number', example: 'N123AB' })
}).openapi({ title: 'AirlineAircraftInput', description: 'Airline aircraft creation input' });

export const airlineAircraftUpdateSchema = z.object({
  aircraft_id: z.number().int().min(1).optional().openapi({ description: 'Aircraft ID', example: 1 }),
  first_class_seats: z.array(z.string()).optional().openapi({ description: 'First class seat numbers', example: ['1A', '1B', '1C'] }),
  business_class_seats: z.array(z.string()).optional().openapi({ description: 'Business class seat numbers', example: ['2A', '2B', '2C'] }),
  economy_class_seats: z.array(z.string()).optional().openapi({ description: 'Economy class seat numbers', example: ['3A', '3B', '3C'] }),
  tail_number: z.string().optional().openapi({ description: 'Aircraft tail number', example: 'N123AB' })
}).openapi({ title: 'AirlineAircraftUpdate', description: 'Airline aircraft update input' });

export const airlineAircraftOutputSchema = z.object({
  id: z.string().openapi({ description: 'Airline Aircraft ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
  aircraft: z.any().openapi({ description: 'Aircraft details' }),
  airline_id: z.string().openapi({ description: 'Airline ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
  first_class_seats: z.array(z.string()).openapi({ description: 'First class seat numbers', example: ['1A', '1B', '1C'] }),
  business_class_seats: z.array(z.string()).openapi({ description: 'Business class seat numbers', example: ['2A', '2B', '2C'] }),
  economy_class_seats: z.array(z.string()).openapi({ description: 'Economy class seat numbers', example: ['3A', '3B', '3C'] }),
  tail_number: z.string().openapi({ description: 'Aircraft tail number', example: 'N123AB' })
}).openapi({ title: 'AirlineAircraftOutput', description: 'Airline aircraft details' });


export const airlineUpdateSchema = z.object({
  name: z.string().min(1).optional().openapi({ description: 'Airline name', example: 'Sky Airlines' }),
  address: z.string().min(1).optional().openapi({ description: 'Airline address', example: '123 Airport Blvd' }),
  zip: z.string().min(1).optional().openapi({ description: 'ZIP/postal code', example: '12345' }),
  nation_id: z.number().int().min(1).optional().openapi({ description: 'Nation ID', example: 1 }),
  email: z.string().email().optional().openapi({ description: 'Email address', example: 'contact@skyairlines.com' }),
  website: z.string().url().optional().openapi({ description: 'Website URL', example: 'https://skyairlines.com' }),
  first_class_description: z.string().min(1).optional().openapi({ description: 'First class description', example: 'Luxury seating with premium amenities' }),
  business_class_description: z.string().min(1).optional().openapi({ description: 'Business class description', example: 'Comfortable seating with enhanced service' }),
  economy_class_description: z.string().min(1).optional().openapi({ description: 'Economy class description', example: 'Standard seating with basic amenities' })
}).openapi({ title: 'AirlineUpdate', description: 'Airline update input' });

export const airlineOutputSchema = z.object({
  id: z.string().openapi({ description: 'Airline ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
  name: z.string().openapi({ description: 'Airline name', example: 'Sky Airlines' }),
  address: z.string().nullable().openapi({ description: 'Airline address', example: '123 Airport Blvd' }),
  zip: z.string().nullable().openapi({ description: 'ZIP/postal code', example: '12345' }),
  nation_id: z.number().nullable().openapi({ description: 'Nation ID', example: 1 }),
  nation: z.any().nullable().openapi({ description: 'Nation details' }),
  email: z.string().nullable().openapi({ description: 'Email address', example: 'contact@skyairlines.com' }),
  website: z.string().nullable().openapi({ description: 'Website URL', example: 'https://skyairlines.com' }),
  first_class_description: z.string().nullable().openapi({ description: 'First class description', example: 'Luxury seating with premium amenities' }),
  business_class_description: z.string().nullable().openapi({ description: 'Business class description', example: 'Comfortable seating with enhanced service' }),
  economy_class_description: z.string().nullable().openapi({ description: 'Economy class description', example: 'Standard seating with basic amenities' })
}).openapi({ title: 'AirlineOutput', description: 'Airline details' });


export const routeInputSchema = z.object({
  departure_airport_id: z.number().int().min(1, 'Departure airport ID is required').openapi({ description: 'Departure airport ID', example: 1 }),
  arrival_airport_id: z.number().int().min(1, 'Arrival airport ID is required').openapi({ description: 'Arrival airport ID', example: 2 }),
  period_start: z.string().datetime().openapi({ description: 'Start of the route period', example: '2024-01-01T00:00:00Z' }),
  period_end: z.string().datetime().openapi({ description: 'End of the route period', example: '2024-12-31T23:59:59Z' }),
  flight_number: z.string().min(1, 'Flight number is required').openapi({ description: 'Flight number', example: 'SK123' })
}).openapi({ title: 'RouteInput', description: 'Route creation input' });

export const routeUpdateSchema = z.object({
  departure_airport_id: z.number().int().min(1).optional().openapi({ description: 'Departure airport ID', example: 1 }),
  arrival_airport_id: z.number().int().min(1).optional().openapi({ description: 'Arrival airport ID', example: 2 }),
  period_start: z.string().datetime().optional().openapi({ description: 'Start of the route period', example: '2024-01-01T00:00:00Z' }),
  period_end: z.string().datetime().optional().openapi({ description: 'End of the route period', example: '2024-12-31T23:59:59Z' }),
  flight_number: z.string().min(1).optional().openapi({ description: 'Flight number', example: 'SK123' })
}).openapi({ title: 'RouteUpdate', description: 'Route update input' });

export const routeOutputSchema = z.object({
  id: z.number().openapi({ description: 'Route ID', example: 1 }),
  departure_airport: z.any().openapi({ description: 'Departure airport details' }),
  arrival_airport: z.any().openapi({ description: 'Arrival airport details' }),
  airline_id: z.string().openapi({ description: 'Airline ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
  period_start: z.string().datetime().openapi({ description: 'Start of the route period', example: '2024-01-01T00:00:00Z' }),
  period_end: z.string().datetime().openapi({ description: 'End of the route period', example: '2024-12-31T23:59:59Z' }),
  flight_number: z.string().openapi({ description: 'Flight number', example: 'SK123' }),
  is_editable: z.boolean().openapi({ description: 'Is the route editable', example: true })
}).openapi({ title: 'RouteOutput', description: 'Route details' });


export const flightExtraItemSchema = z.object({
  extra_id: z.string().uuid('Invalid extra ID format').openapi({ description: 'Extra ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
  price: z.number().min(0, 'Price must be non-negative').openapi({ description: 'Price of the extra', example: 25.50 }),
  limit: z.number().int().min(1, 'Limit must be at least 1').openapi({ description: 'Limit of the extra', example: 10 })
}).openapi({ title: 'FlightExtraItem', description: 'Flight extra item' });

export const flightInputSchema = z.object({
  route_id: z.number().int().min(1, 'Route ID is required').openapi({ description: 'Route ID', example: 1 }),
  aircraft_id: z.string().uuid('Invalid aircraft ID format').openapi({ description: 'Airline Aircraft ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
  departure_time: z.string().datetime().openapi({ description: 'Departure time', example: '2024-06-15T10:00:00Z' }),
  arrival_time: z.string().datetime().openapi({ description: 'Arrival time', example: '2024-06-15T12:00:00Z' }),
  price_economy_class: z.number().min(0, 'Economy class price must be non-negative').openapi({ description: 'Economy class price', example: 299.99 }),
  price_business_class: z.number().min(0, 'Business class price must be non-negative').openapi({ description: 'Business class price', example: 599.99 }),
  price_first_class: z.number().min(0, 'First class price must be non-negative').openapi({ description: 'First class price', example: 999.99 }),
  price_insurance: z.number().min(0).optional().openapi({ description: 'Insurance price', example: 49.99 }),
  extras: z.array(flightExtraItemSchema).optional().openapi({ description: 'List of extras to add to the flight' }),
  gate: z.string().optional().openapi({ description: 'Gate', example: 'A12' }),
  terminal: z.string().optional().openapi({ description: 'Terminal', example: '1' }),
  checkin_start_time: z.string().datetime().openapi({ description: 'Checkin start time', example: '2024-06-15T08:00:00Z' }),
  checkin_end_time: z.string().datetime().openapi({ description: 'Checkin end time', example: '2024-06-15T09:00:00Z' }),
  boarding_start_time: z.string().datetime().openapi({ description: 'Boarding start time', example: '2024-06-15T09:00:00Z' }),
  boarding_end_time: z.string().datetime().openapi({ description: 'Boarding end time', example: '2024-06-15T10:00:00Z' })
}).openapi({ title: 'FlightInput', description: 'Flight creation input' });

export const flightUpdateSchema = z.object({
  route_id: z.number().int().min(1).optional().openapi({ description: 'Route ID', example: 1 }),
  aircraft_id: z.string().uuid().optional().openapi({ description: 'Airline Aircraft ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
  departure_time: z.string().datetime().optional().openapi({ description: 'Departure time', example: '2024-06-15T10:00:00Z' }),
  arrival_time: z.string().datetime().optional().openapi({ description: 'Arrival time', example: '2024-06-15T12:00:00Z' }),
  price_economy_class: z.number().min(0).optional().openapi({ description: 'Economy class price', example: 299.99 }),
  price_business_class: z.number().min(0).optional().openapi({ description: 'Business class price', example: 599.99 }),
  price_first_class: z.number().min(0).optional().openapi({ description: 'First class price', example: 999.99 }),
  price_insurance: z.number().min(0).optional().openapi({ description: 'Insurance price', example: 49.99 }),
  extras: z.array(flightExtraItemSchema).optional().openapi({ description: 'List of extras to add to the flight' })
}).openapi({ title: 'FlightUpdate', description: 'Flight update input' });

export const flightOutputSchema = z.object({
  id: z.string().openapi({ description: 'Flight ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
  flight_number: z.string().openapi({ description: 'Flight number', example: 'SK123' }),
  aircraft: z.any().openapi({ description: 'Aircraft details' }),
  route_id: z.number().openapi({ description: 'Route ID', example: 1 }),
  departure_time: z.string().datetime().openapi({ description: 'Departure time', example: '2024-06-15T10:00:00Z' }),
  arrival_time: z.string().datetime().openapi({ description: 'Arrival time', example: '2024-06-15T12:00:00Z' }),
  departure_airport: z.any().openapi({ description: 'Departure airport details' }),
  arrival_airport: z.any().openapi({ description: 'Arrival airport details' }),
  price_first_class: z.number().openapi({ description: 'First class price', example: 999.99 }),
  price_business_class: z.number().openapi({ description: 'Business class price', example: 599.99 }),
  price_economy_class: z.number().openapi({ description: 'Economy class price', example: 299.99 }),
  price_insurance: z.number().openapi({ description: 'Insurance price', example: 49.99 }),
  gate: z.string().nullable().openapi({ description: 'Gate', example: 'A12' }),
  terminal: z.string().nullable().openapi({ description: 'Terminal', example: '1' }),
  checkin_start_time: z.string().datetime().openapi({ description: 'Checkin start time', example: '2024-06-15T08:00:00Z' }),
  checkin_end_time: z.string().datetime().openapi({ description: 'Checkin end time', example: '2024-06-15T09:00:00Z' }),
  boarding_start_time: z.string().datetime().openapi({ description: 'Boarding start time', example: '2024-06-15T09:00:00Z' }),
  boarding_end_time: z.string().datetime().openapi({ description: 'Boarding end time', example: '2024-06-15T10:00:00Z' })
}).openapi({ title: 'FlightOutput', description: 'Flight details' });

export const flightSeatsOutputSchema = z.object({
  id: z.string().openapi({ description: 'Flight ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
  flight_number: z.string().openapi({ description: 'Flight number', example: 'SK123' }),
  aircraft: z.any().openapi({ description: 'Aircraft details' }),
  route_id: z.number().openapi({ description: 'Route ID', example: 1 }),
  departure_time: z.string().datetime().openapi({ description: 'Departure time', example: '2024-06-15T10:00:00Z' }),
  arrival_time: z.string().datetime().openapi({ description: 'Arrival time', example: '2024-06-15T12:00:00Z' }),
  departure_airport: z.any().openapi({ description: 'Departure airport details' }),
  arrival_airport: z.any().openapi({ description: 'Arrival airport details' }),
  price_first_class: z.number().openapi({ description: 'First class price', example: 999.99 }),
  price_business_class: z.number().openapi({ description: 'Business class price', example: 599.99 }),
  price_economy_class: z.number().openapi({ description: 'Economy class price', example: 299.99 }),
  price_insurance: z.number().openapi({ description: 'Insurance price', example: 49.99 }),
  gate: z.string().nullable().openapi({ description: 'Gate', example: 'A12' }),
  terminal: z.string().nullable().openapi({ description: 'Terminal', example: '1' }),
  checkin_start_time: z.string().datetime().openapi({ description: 'Checkin start time', example: '2024-06-15T08:00:00Z' }),
  checkin_end_time: z.string().datetime().openapi({ description: 'Checkin end time', example: '2024-06-15T09:00:00Z' }),
  boarding_start_time: z.string().datetime().openapi({ description: 'Boarding start time', example: '2024-06-15T09:00:00Z' }),
  boarding_end_time: z.string().datetime().openapi({ description: 'Boarding end time', example: '2024-06-15T10:00:00Z' }),
  booked_seats: z.array(z.string()).openapi({ description: 'List of booked seats', example: ['1A', '2B', '3C'] }),
  is_editable: z.boolean().openapi({ description: 'Is editable', example: true })
}).openapi({ title: 'FlightSeatsOutput', description: 'Flight details with seat information' });


export const airlineListQuerySchema = z.object({
  name: z.string().optional().openapi({ description: 'Filter by airline name (case-insensitive)', example: 'Sky' }),
  nation_id: z.string().optional().transform(val => val ? parseInt(val) : undefined).openapi({ description: 'Filter by nation ID', example: '1' })
}).openapi({ title: 'AirlineListQuery', description: 'Airline list query parameters' });

export const flightPageQuerySchema = z.object({
  page_number: z.string().optional().transform(val => val ? parseInt(val) : 1).openapi({ description: 'Page number for pagination', example: '1' }),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10).openapi({ description: 'Limit the number of results returned for page', example: '10' })
}).openapi({ title: 'FlightPageQuery', description: 'Flight pagination query parameters' });


export const flightsPaginationSchema = z.object({
  items: z.array(z.any()).openapi({ description: 'List of flights' }),
  total_pages: z.number().openapi({ description: 'Total number of flight pages', example: 5 })
}).openapi({ title: 'FlightsPagination', description: 'Paginated flights response' });


export const flightsFulfillmentSchema = z.object({
  month: z.number().openapi({ description: 'Month number', example: 6 }),
  totalSeats: z.number().openapi({ description: 'Total available seats', example: 1000 }),
  totalBooks: z.number().openapi({ description: 'Total bookings', example: 750 })
}).openapi({ title: 'FlightsFulfillment', description: 'Flights fulfillment data' });

export const revenueSchema = z.object({
  month: z.number().openapi({ description: 'Month number', example: 6 }),
  total: z.number().openapi({ description: 'Total revenue', example: 125000.50 })
}).openapi({ title: 'Revenue', description: 'Revenue data' });

export const mostRequestedRouteSchema = z.object({
  airportFrom: z.string().openapi({ description: 'Departure airport IATA code', example: 'JFK' }),
  airportTo: z.string().openapi({ description: 'Arrival airport IATA code', example: 'LAX' }),
  flight_number: z.string().openapi({ description: 'Flight number', example: 'SK123' }),
  bookings: z.number().openapi({ description: 'Number of bookings', example: 45 })
}).openapi({ title: 'MostRequestedRoute', description: 'Most requested route data' });

export const airportFlightsSchema = z.object({
  airport: z.string().openapi({ description: 'Airport IATA code', example: 'JFK' }),
  flights: z.number().openapi({ description: 'Number of flights', example: 120 })
}).openapi({ title: 'AirportFlights', description: 'Airport flights data' });

export const leastUsedRouteSchema = z.object({
  airportFrom: z.string().openapi({ description: 'Departure airport IATA code', example: 'JFK' }),
  airportTo: z.string().openapi({ description: 'Arrival airport IATA code', example: 'LAX' }),
  flight_number: z.string().openapi({ description: 'Flight number', example: 'SK123' }),
  flights: z.number().openapi({ description: 'Number of flights', example: 2 })
}).openapi({ title: 'LeastUsedRoute', description: 'Least used route data' });

export const airlineStatsSchema = z.object({
  flights_fullfilment: z.array(flightsFulfillmentSchema).openapi({ description: 'Flights fulfillment data' }),
  revenue: z.array(revenueSchema).openapi({ description: 'Revenue data' }),
  mostRequestedRoutes: z.array(mostRequestedRouteSchema).openapi({ description: 'Most requested routes' }),
  airportsWithMostFlights: z.array(airportFlightsSchema).openapi({ description: 'Airports with most flights' }),
  leastUsedRoute: z.array(leastUsedRouteSchema).openapi({ description: 'Least used routes' })
}).openapi({ title: 'AirlineStats', description: 'Airline statistics' });


export type ExtraInput = z.infer<typeof extraInputSchema>;
export type ExtraOutput = z.infer<typeof extraOutputSchema>;
export type AirlineAircraftInput = z.infer<typeof airlineAircraftInputSchema>;
export type AirlineAircraftUpdate = z.infer<typeof airlineAircraftUpdateSchema>;
export type AirlineAircraftOutput = z.infer<typeof airlineAircraftOutputSchema>;
export type AirlineUpdate = z.infer<typeof airlineUpdateSchema>;
export type AirlineOutput = z.infer<typeof airlineOutputSchema>;
export type RouteInput = z.infer<typeof routeInputSchema>;
export type RouteUpdate = z.infer<typeof routeUpdateSchema>;
export type RouteOutput = z.infer<typeof routeOutputSchema>;
export type FlightInput = z.infer<typeof flightInputSchema>;
export type FlightUpdate = z.infer<typeof flightUpdateSchema>;
export type FlightOutput = z.infer<typeof flightOutputSchema>;
export type FlightSeatsOutput = z.infer<typeof flightSeatsOutputSchema>;
export type AirlineListQuery = z.infer<typeof airlineListQuerySchema>;
export type FlightPageQuery = z.infer<typeof flightPageQuerySchema>;
export type FlightsPagination = z.infer<typeof flightsPaginationSchema>;
export type AirlineStats = z.infer<typeof airlineStatsSchema>; 
