import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { ErrorResponseSchema } from '../config/openapi';

extendZodWithOpenApi(z);

// Base schemas
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

// Airline schemas
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

// Extra schemas
export const ExtraSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  airline_id: z.string().uuid(),
  required_on_all_segments: z.boolean().default(false),
  stackable: z.boolean().default(false),
});

export const ExtraCreateSchema = z.object({
  name: z.string(),
  description: z.string(),
  required_on_all_segments: z.boolean().default(false),
  stackable: z.boolean().default(false),
});

export const ExtraUpdateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  required_on_all_segments: z.boolean().optional(),
  stackable: z.boolean().optional(),
});

// Airline Aircraft schemas
export const AirlineAircraftSchema = z.object({
  id: z.string().uuid(),
  aircraft: AircraftSchema,
  airline_id: z.string().uuid(),
  first_class_seats: z.array(z.string()).optional(),
  business_class_seats: z.array(z.string()).optional(),
  economy_class_seats: z.array(z.string()).optional(),
  tail_number: z.string(),
});

export const AirlineAircraftMinifiedSchema = z.object({
  id: z.string().uuid(),
  tail_number: z.string(),
  aircraft: AircraftSchema,
});

export const AirlineAircraftInputSchema = z.object({
  aircraft_id: z.number().int(),
  first_class_seats: z.array(z.string()).optional(),
  business_class_seats: z.array(z.string()).optional(),
  economy_class_seats: z.array(z.string()).optional(),
  tail_number: z.string(),
});

export const AirlineAircraftPutSchema = z.object({
  aircraft_id: z.number().int().optional(),
  first_class_seats: z.array(z.string()).optional(),
  business_class_seats: z.array(z.string()).optional(),
  economy_class_seats: z.array(z.string()).optional(),
  tail_number: z.string().optional(),
});

// Route schemas
export const RouteSchema = z.object({
  id: z.number().int(),
  departure_airport: AirportSchema,
  arrival_airport: AirportSchema,
  airline_id: z.string().uuid(),
  period_start: z.string().datetime(),
  period_end: z.string().datetime(),
  flight_number: z.string(),
  is_editable: z.boolean().optional(),
});

export const RouteInputSchema = z.object({
  departure_airport_id: z.number().int(),
  arrival_airport_id: z.number().int(),
  period_start: z.string().datetime(),
  period_end: z.string().datetime(),
  flight_number: z.string(),
});

export const RoutePutSchema = z.object({
  departure_airport_id: z.number().int().optional(),
  arrival_airport_id: z.number().int().optional(),
  period_start: z.string().datetime().optional(),
  period_end: z.string().datetime().optional(),
  flight_number: z.string().optional(),
});

// Flight schemas
export const ExtraItemSchema = z.object({
  extra_id: z.string().uuid(),
  price: z.number(),
  limit: z.number().int(),
});

export const FlightModelInputSchema = z.object({
  route_id: z.number().int(),
  aircraft_id: z.string().uuid(),
  departure_time: z.string().datetime(),
  arrival_time: z.string().datetime(),
  price_economy_class: z.number(),
  price_business_class: z.number(),
  price_first_class: z.number(),
  price_insurance: z.number().optional(),
  extras: z.array(ExtraItemSchema).optional(),
});

export const FlightPutSchema = z.object({
  route_id: z.number().int().optional(),
  aircraft_id: z.string().uuid().optional(),
  departure_time: z.string().datetime().optional(),
  arrival_time: z.string().datetime().optional(),
  price_economy_class: z.number().optional(),
  price_business_class: z.number().optional(),
  price_first_class: z.number().optional(),
  price_insurance: z.number().optional(),
  extras: z.array(ExtraItemSchema).optional(),
});

export const FlightModelOutputSchema = z.object({
  id: z.string().uuid(),
  flight_number: z.string(),
  aircraft: AirlineAircraftSchema,
  route_id: z.number().int(),
  departure_time: z.string().datetime(),
  arrival_time: z.string().datetime(),
  departure_airport: AirportSchema,
  arrival_airport: AirportSchema,
  price_first_class: z.number(),
  price_business_class: z.number(),
  price_economy_class: z.number(),
  price_insurance: z.number(),
  gate: z.string().nullable(),
  terminal: z.string().nullable(),
  checkin_start_time: z.string().datetime(),
  checkin_end_time: z.string().datetime(),
  boarding_start_time: z.string().datetime(),
  boarding_end_time: z.string().datetime(),
});

export const FlightModelSeatsOutputSchema = z.object({
  id: z.string().uuid(),
  flight_number: z.string(),
  aircraft: AirlineAircraftSchema,
  route_id: z.number().int(),
  booked_seats: z.array(z.string()),
  departure_time: z.string().datetime(),
  arrival_time: z.string().datetime(),
  departure_airport: AirportSchema,
  arrival_airport: AirportSchema,
  price_first_class: z.number(),
  price_business_class: z.number(),
  price_economy_class: z.number(),
  price_insurance: z.number(),
  gate: z.string().nullable(),
  terminal: z.string().nullable(),
  checkin_start_time: z.string().datetime(),
  checkin_end_time: z.string().datetime(),
  boarding_start_time: z.string().datetime(),
  boarding_end_time: z.string().datetime(),
  is_editable: z.boolean().optional(),
});

export const AllFlightOutputSchema = z.object({
  id: z.string().uuid(),
  flight_number: z.string(),
  aircraft: AirlineAircraftMinifiedSchema,
  route_id: z.number().int(),
  departure_time: z.string().datetime(),
  arrival_time: z.string().datetime(),
  departure_airport: AirportSchema,
  arrival_airport: AirportSchema,
});

export const FlightsPaginationSchema = z.object({
  items: z.array(AllFlightOutputSchema),
  total_pages: z.number().int(),
});

export const SeatsInfoSchema = z.object({
  first_class_seats: z.array(z.string()),
  business_class_seats: z.array(z.string()),
  economy_class_seats: z.array(z.string()),
  booked_seats: z.array(z.string()),
});

// Stats schemas
export const FlightsFulfillmentSchema = z.object({
  month: z.number().int(),
  totalSeats: z.number().int(),
  totalBooks: z.number().int(),
});

export const RevenueSchema = z.object({
  month: z.number().int(),
  total: z.number(),
});

export const MostRequestedRouteSchema = z.object({
  airportFrom: z.string(),
  airportTo: z.string(),
  flight_number: z.string(),
  bookings: z.number().int(),
});

export const AirportFlightsSchema = z.object({
  airport: z.string(),
  flights: z.number().int(),
});

export const LeastUsedRouteSchema = z.object({
  airportFrom: z.string(),
  airportTo: z.string(),
  flight_number: z.string(),
  flights: z.number().int(),
});

export const StatsSchema = z.object({
  flights_fullfilment: z.array(FlightsFulfillmentSchema),
  revenue: z.array(RevenueSchema),
  mostRequestedRoutes: z.array(MostRequestedRouteSchema),
  airportsWithMostFlights: z.array(AirportFlightsSchema),
  leastUsedRoute: z.array(LeastUsedRouteSchema),
});

// Query params schemas
export const AirlineListQuerySchema = z.object({
  name: z.string().optional(),
  nation_id: z.number().int().optional(),
});

export const FlightPageQuerySchema = z.object({
  page_number: z.number().int().default(1),
  limit: z.number().int().default(10),
});

// Params schemas
export const AirlineIdParamsSchema = z.object({
  airline_id: z.string().uuid(),
});

export const ExtraIdParamsSchema = z.object({
  extra_id: z.string().uuid(),
});

export const AircraftIdParamsSchema = z.object({
  aircraft_id: z.string().uuid(),
});

export const RouteIdParamsSchema = z.object({
  route_id: z.number().int(),
});

export const FlightIdParamsSchema = z.object({
  flight_id: z.string().uuid(),
});

// Response schemas
export const AirlineListResponseSchema = z.array(AirlineSchema);
export const ExtraListResponseSchema = z.array(ExtraSchema);
export const AirlineAircraftListResponseSchema = z.array(AirlineAircraftSchema);
export const RouteListResponseSchema = z.array(RouteSchema);

// Types
export type AirlineListQuery = z.infer<typeof AirlineListQuerySchema>;
export type FlightPageQuery = z.infer<typeof FlightPageQuerySchema>;
export type AirlineIdParams = z.infer<typeof AirlineIdParamsSchema>;
export type ExtraIdParams = z.infer<typeof ExtraIdParamsSchema>;
export type AircraftIdParams = z.infer<typeof AircraftIdParamsSchema>;
export type RouteIdParams = z.infer<typeof RouteIdParamsSchema>;
export type FlightIdParams = z.infer<typeof FlightIdParamsSchema>;
export type AirlinePut = z.infer<typeof AirlinePutSchema>;
export type ExtraCreate = z.infer<typeof ExtraCreateSchema>;
export type ExtraUpdate = z.infer<typeof ExtraUpdateSchema>;
export type AirlineAircraftInput = z.infer<typeof AirlineAircraftInputSchema>;
export type AirlineAircraftPut = z.infer<typeof AirlineAircraftPutSchema>;
export type RouteInput = z.infer<typeof RouteInputSchema>;
export type RoutePut = z.infer<typeof RoutePutSchema>;
export type FlightModelInput = z.infer<typeof FlightModelInputSchema>;
export type FlightPut = z.infer<typeof FlightPutSchema>; 