import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);


const stringToBoolean = z.string().optional().transform(val => {
  if (val === undefined) return false;
  if (typeof val === 'boolean') return val;
  if (val.toLowerCase() === 'true' || val === '1' || val.toLowerCase() === 'yes') return true;
  if (val.toLowerCase() === 'false' || val === '0' || val.toLowerCase() === 'no') return false;
  throw new Error(`Invalid boolean value: ${val}`);
});


export const FlightSegmentSchema = z.object({
  id: z.string().openapi({ description: 'Flight segment ID' }),
  flight_number: z.string().openapi({ description: 'Flight number for this segment' }),
  airline_name: z.string().openapi({ description: 'Airline name for this segment' }),
  airline_id: z.string().openapi({ description: 'Airline ID for this segment' }),
  departure_airport: z.string().openapi({ description: 'Departure airport code for this segment' }),
  arrival_airport: z.string().openapi({ description: 'Arrival airport code for this segment' }),
  departure_time: z.string().datetime().openapi({ description: 'Departure time for this segment' }),
  arrival_time: z.string().datetime().openapi({ description: 'Arrival time for this segment' }),
  duration_minutes: z.number().int().openapi({ description: 'Flight duration in minutes for this segment' }),
  price_economy: z.number().openapi({ description: 'Economy class price for this segment' }),
  price_business: z.number().openapi({ description: 'Business class price for this segment' }),
  price_first: z.number().openapi({ description: 'First class price for this segment' }),
  aircraft_name: z.string().openapi({ description: 'Aircraft name for this segment' }),
  gate: z.string().nullable().openapi({ description: 'Departure gate for this segment' }),
  terminal: z.string().nullable().openapi({ description: 'Departure terminal for this segment' }),
}).openapi('FlightSegment');


export const LayoverSchema = z.object({
  airport: z.string().openapi({ description: 'Layover airport code' }),
  duration_minutes: z.number().int().openapi({ description: 'Layover duration in minutes' }),
}).openapi('Layover');


export const JourneySchema = z.object({
  departure_airport: z.string().openapi({ description: 'Origin airport code for the journey' }),
  arrival_airport: z.string().openapi({ description: 'Destination airport code for the journey' }),
  duration_minutes: z.number().int().openapi({ description: 'Total journey duration in minutes' }),
  price_economy: z.number().openapi({ description: 'Total economy class price for the journey' }),
  price_business: z.number().openapi({ description: 'Total business class price for the journey' }),
  price_first: z.number().openapi({ description: 'Total first class price for the journey' }),
  is_direct: z.boolean().openapi({ description: 'True if the journey is direct, false otherwise' }),
  stops: z.number().int().openapi({ description: 'Number of stops (layovers)' }),
  segments: z.array(FlightSegmentSchema).openapi({ description: 'List of flight segments in the journey' }),
  layovers: z.array(LayoverSchema).openapi({ description: 'List of layovers in the journey' }),
}).openapi('Journey');


const BaseSearchQuerySchema = z.object({
  departure_id: z.string().transform(val => parseInt(val, 10)).pipe(
    z.number().int().positive().openapi({ description: 'Departure id' })
  ),
  departure_type: z.enum(['airport', 'city']).openapi({ 
    description: 'Type of departure location: "airport" or "city"' 
  }),
  arrival_id: z.string().transform(val => parseInt(val, 10)).pipe(
    z.number().int().positive().openapi({ description: 'Arrival id' })
  ),
  arrival_type: z.enum(['airport', 'city']).openapi({ 
    description: 'Type of arrival location: "airport" or "city"' 
  }),
  airline_id: z.string().uuid().optional().openapi({ 
    description: 'Filter by specific airline ID' 
  }),
  price_max: z.string().optional().transform(val => val ? parseFloat(val) : undefined).pipe(
    z.number().positive().optional()
  ).openapi({ description: 'Maximum price (economy class)' }),
  departure_time_min: z.string().optional().openapi({ 
    description: 'Minimum departure time (HH:MM)' 
  }),
  departure_time_max: z.string().optional().openapi({ 
    description: 'Maximum departure time (HH:MM)' 
  }),
  order_by: z.enum(['price', 'duration', 'stops']).optional().openapi({ 
    description: 'Order by field (price, duration, stops)' 
  }),
  order_by_desc: stringToBoolean.openapi({ 
    description: 'Order by field descending' 
  }),
  page_number: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined).pipe(
    z.number().int().positive().optional()
  ).openapi({ description: 'Pagination offset (for large result sets)' }),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined).pipe(
    z.number().int().positive().optional()
  ).openapi({ description: 'Limit the number of results returned for page' }),
  max_transfers: z.string().optional().transform(val => val ? parseInt(val, 10) : 3).pipe(
    z.number().int().min(0).max(10)
  ).openapi({ description: 'Maximum number of transfers' }),
});


export const FlightSearchQuerySchema = BaseSearchQuerySchema.extend({
  departure_date: z.string().openapi({ 
    description: 'Departure date (DD-MM-YYYY)' 
  }),
}).openapi('FlightSearchQuery');


export const FlexibleDateSearchQuerySchema = BaseSearchQuerySchema.extend({
  departure_date: z.string().openapi({ 
    description: 'Departure date (MM-YYYY)' 
  }),
}).openapi('FlexibleDateSearchQuery');


export const SearchOutputSchema = z.object({
  journeys: z.array(JourneySchema).openapi({ description: 'List of flight journeys' }),
  total_pages: z.number().int().openapi({ description: 'Total number of pages for pagination' }),
}).openapi('SearchOutput');


export const FlexibleDateResponseSchema = z.array(
  z.number().nullable()
).openapi('FlexibleDateResponse', {
  description: 'Array of minimum prices for each day in the month, null for days with no flights'
});


export type FlightSegment = z.infer<typeof FlightSegmentSchema>;
export type Layover = z.infer<typeof LayoverSchema>;
export type Journey = z.infer<typeof JourneySchema>;
export type FlightSearchQuery = z.infer<typeof FlightSearchQuerySchema> & { user_id?: string };
export type FlexibleDateSearchQuery = z.infer<typeof FlexibleDateSearchQuerySchema> & { user_id?: string };
export type SearchOutput = z.infer<typeof SearchOutputSchema>;
