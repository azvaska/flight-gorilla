import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);


export const AircraftSchema = z.object({
  id: z.number().int().positive().openapi({ description: 'Aircraft ID' }),
  name: z.string().min(1).openapi({ description: 'Aircraft name/model' }),
  rows: z.number().int().positive().openapi({ description: 'Number of rows' }),
  columns: z.number().int().positive().openapi({ description: 'Number of columns' }),
  unavailable_seats: z.array(z.string()).openapi({ description: 'List of unavailable seats' }),
}).openapi('Aircraft');


export const AircraftListQuerySchema = z.object({
  name: z.string().optional().openapi({ 
    description: 'Filter by aircraft name/model (case-insensitive)',
    example: ''
  }),
}).openapi('AircraftListQuery');


export const AircraftParamsSchema = z.object({
  aircraft_id: z.string().transform((val) => parseInt(val, 10)).pipe(
    z.number().int().positive().openapi({ description: 'The aircraft identifier' })
  ),
}).openapi('AircraftParams');


export const AircraftListResponseSchema = z.array(AircraftSchema).openapi('AircraftListResponse', { 
  description: 'List of aircraft'
});


export type Aircraft = z.infer<typeof AircraftSchema>;
export type AircraftListQuery = z.infer<typeof AircraftListQuerySchema>;
export type AircraftParams = z.infer<typeof AircraftParamsSchema>; 
