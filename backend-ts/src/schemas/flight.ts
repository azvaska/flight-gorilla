import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);


import { AirportSchema } from './airport';


export const FlightAirlineSchema = z.object({
  id: z.string().uuid().openapi({ description: 'Airline ID' }),
  name: z.string().min(1).openapi({ description: 'Airline name' }),
  first_class_description: z.string().nullable().openapi({ description: 'First class description' }),
  business_class_description: z.string().nullable().openapi({ description: 'Business class description' }),
  economy_class_description: z.string().nullable().openapi({ description: 'Economy class description' }),
}).openapi('FlightAirline');


export const FlightOutputSchema = z.object({
  id: z.string().uuid().openapi({ description: 'Flight ID' }),
  airline: FlightAirlineSchema.openapi({ description: 'Airline' }),
  flight_number: z.string().min(1).openapi({ description: 'Flight number' }),
  departure_time: z.string().datetime().openapi({ description: 'Departure time' }),
  arrival_time: z.string().datetime().openapi({ description: 'Arrival time' }),
  departure_airport: AirportSchema.openapi({ description: 'Departure Airport' }),
  arrival_airport: AirportSchema.openapi({ description: 'Arrival Airport' }),
  price_first_class: z.number().min(0).openapi({ description: 'First class price' }),
  price_business_class: z.number().min(0).openapi({ description: 'Business class price' }),
  price_economy_class: z.number().min(0).openapi({ description: 'Economy class price' }),
  price_insurance: z.number().min(0).openapi({ description: 'Insurance price' }),
}).openapi('FlightOutput');


export const SeatsInfoSchema = z.object({
  first_class_seats: z.array(z.string()).openapi({ description: 'First class seats' }),
  business_class_seats: z.array(z.string()).openapi({ description: 'Business class seats' }),
  economy_class_seats: z.array(z.string()).openapi({ description: 'Economy class seats' }),
  booked_seats: z.array(z.string()).openapi({ description: 'Booked seats' }),
}).openapi('SeatsInfo');


export const BookedSeatsSchema = z.object({
  flight_id: z.string().uuid().openapi({ description: 'Flight ID' }),
  seats_info: SeatsInfoSchema.openapi({ description: 'Seats info' }),
  rows: z.number().int().positive().openapi({ description: 'Rows of the aircraft' }),
}).openapi('BookedSeats');


export const FlightExtraSchema = z.object({
  id: z.string().uuid().openapi({ description: 'Flight Extra ID' }),
  name: z.string().min(1).openapi({ description: 'Name of the extra' }),
  description: z.string().min(1).openapi({ description: 'Description of the extra' }),
  extra_id: z.string().uuid().openapi({ description: 'Extra ID' }),
  price: z.number().min(0).openapi({ description: 'Price of the extra' }),
  limit: z.number().int().min(0).openapi({ description: 'Limit of the extra' }),
  stackable: z.boolean().openapi({ description: 'Is the extra stackable' }),
  required_on_all_segments: z.boolean().openapi({ description: 'Is the extra required on all segments' }),
}).openapi('FlightExtra');


export const FlightParamsSchema = z.object({
  flight_id: z.string().uuid().openapi({ description: 'The flight identifier' }),
}).openapi('FlightParams');


export const FlightExtraListResponseSchema = z.array(FlightExtraSchema).openapi('FlightExtraListResponse', { 
  description: 'List of flight extras'
});


export type FlightOutput = z.infer<typeof FlightOutputSchema>;
export type FlightAirline = z.infer<typeof FlightAirlineSchema>;
export type SeatsInfo = z.infer<typeof SeatsInfoSchema>;
export type BookedSeats = z.infer<typeof BookedSeatsSchema>;
export type FlightExtra = z.infer<typeof FlightExtraSchema>;
export type FlightParams = z.infer<typeof FlightParamsSchema>; 
