import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// Seat schema
export const SeatSchema = z.object({
  seat_number: z.string().min(1).openapi({ description: 'Seat number' }),
  flight_id: z.string().uuid().openapi({ description: 'Flight ID' }),
}).openapi('Seat');

// Seat Session schema
export const SeatSessionSchema = z.object({
  id: z.string().uuid().openapi({ description: 'Session ID' }),
  seats: z.array(SeatSchema).openapi({ description: 'List of reserved seat numbers' }),
  session_start_time: z.string().datetime().openapi({ description: 'Session start time' }),
  session_end_time: z.string().datetime().openapi({ description: 'Session end time (expiration)' }),
}).openapi('SeatSession');

// Request schemas
export const AddSeatRequestSchema = z.object({
  flight_id: z.string().uuid().openapi({ description: 'Flight UUID' }),
  seat_number: z.string().min(1).openapi({ description: 'Seat number' }),
}).openapi('AddSeatRequest');

// Path parameters
export const SeatSessionParamsSchema = z.object({
  session_id: z.string().uuid().openapi({ description: 'The seat session identifier' }),
}).openapi('SeatSessionParams');

// Response schemas
export const SeatSessionResponseSchema = SeatSessionSchema.openapi('SeatSessionResponse');
export const MessageResponseSchema = z.object({
  message: z.string().openapi({ description: 'Success message' }),
  code: z.number().openapi({ description: 'Response code' }),
}).openapi('MessageResponse');

// Type exports
export type Seat = z.infer<typeof SeatSchema>;
export type SeatSession = z.infer<typeof SeatSessionSchema>;
export type AddSeatRequest = z.infer<typeof AddSeatRequestSchema>;
export type SeatSessionParams = z.infer<typeof SeatSessionParamsSchema>; 
