import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { classtype } from '../../generated/prisma';

extendZodWithOpenApi(z);

// Extra input schema for booking
export const extraInputSchema = z.object({
  id: z.string().uuid('Invalid extra ID format').openapi({ description: 'Flight extra ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').openapi({ description: 'Quantity of the extra service', example: 2 })
}).openapi({ title: 'ExtraInput', description: 'Extra service input for booking' });

// Main booking input schema
export const bookingInputSchema = z.object({
  session_id: z.string().uuid('Invalid session ID format').openapi({ description: 'Seat session ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
  departure_flights: z.array(z.string().uuid('Invalid flight ID format')).min(1, 'At least one departure flight is required').openapi({ description: 'List of departure flight IDs', example: ['123e4567-e89b-12d3-a456-426614174000'] }),
  return_flights: z.array(z.string().uuid('Invalid flight ID format')).openapi({ description: 'List of return flight IDs', example: ['123e4567-e89b-12d3-a456-426614174001'] }),
  extras: z.array(extraInputSchema).openapi({ description: 'List of extra services to book' }),
  has_booking_insurance: z.boolean().openapi({ description: 'Whether to purchase booking insurance', example: true })
}).openapi({ title: 'BookingInput', description: 'Booking creation request' });

// Booking list query parameters
export const bookingListQuerySchema = z.object({
  flight_id: z.string().uuid().optional().openapi({ description: 'Filter by flight ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
  user_id: z.string().uuid().optional().openapi({ description: 'Filter by user ID (admin/airline-admin only)', example: '123e4567-e89b-12d3-a456-426614174000' }),
  class_type: z.nativeEnum(classtype).optional().openapi({ description: 'Filter by class type', example: 'ECONOMY_CLASS' })
}).openapi({ title: 'BookingListQuery', description: 'Query parameters for listing bookings' });

// Booked flight extra output schema
export const bookedFlightExtraOutputSchema = z.object({
  extra_id: z.string().openapi({ description: 'Flight extra ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
  extra_price: z.number().openapi({ description: 'Total price for this extra', example: 25.50 }),
  name: z.string().openapi({ description: 'Extra service name', example: 'Priority Boarding' }),
  description: z.string().openapi({ description: 'Extra service description', example: 'Board the aircraft before other passengers' }),
  quantity: z.number().int().openapi({ description: 'Quantity booked', example: 1 })
}).openapi({ title: 'BookedFlightExtra', description: 'Booked flight extra service details' });

// Booked flight output schema
export const bookedFlightOutputSchema = z.object({
  flight: z.any().openapi({ description: 'Flight details object' }), // Will be populated with flight data
  seat_number: z.string().openapi({ description: 'Assigned seat number', example: '12A' }),
  class_type: z.nativeEnum(classtype).openapi({ description: 'Flight class type', example: 'ECONOMY_CLASS' }),
  price: z.number().openapi({ description: 'Flight price', example: 299.99 }),
  extras: z.array(bookedFlightExtraOutputSchema).openapi({ description: 'List of booked extras for this flight' })
}).openapi({ title: 'BookedFlight', description: 'Booked flight details' });

// Main booking output schema
export const bookingOutputSchema = z.object({
  id: z.string().openapi({ description: 'Booking ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
  booking_number: z.string().openapi({ description: 'Booking reference number', example: 'ABC123' }),
  departure_flights: z.array(bookedFlightOutputSchema).openapi({ description: 'List of departure flights' }),
  return_flights: z.array(bookedFlightOutputSchema).openapi({ description: 'List of return flights' }),
  total_price: z.number().openapi({ description: 'Total booking price including extras and insurance', example: 649.98 }),
  is_insurance_purchased: z.boolean().openapi({ description: 'Whether booking insurance was purchased', example: true }),
  insurance_price: z.number().openapi({ description: 'Insurance price', example: 49.99 })
}).openapi({ title: 'BookingOutput', description: 'Complete booking details' });

// Type exports
export type ExtraInput = z.infer<typeof extraInputSchema>;
export type BookingInput = z.infer<typeof bookingInputSchema>;
export type BookingListQuery = z.infer<typeof bookingListQuerySchema>;
export type BookedFlightExtraOutput = z.infer<typeof bookedFlightExtraOutputSchema>;
export type BookedFlightOutput = z.infer<typeof bookedFlightOutputSchema>;
export type BookingOutput = z.infer<typeof bookingOutputSchema>; 
