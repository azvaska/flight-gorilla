import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);


export const CitySchema = z.object({
  id: z.number().int().positive().openapi({ description: 'City ID' }),
  name: z.string().min(1).openapi({ description: 'City name' }),
  nation: z.object({
    id: z.number().int().positive().openapi({ description: 'Nation ID' }),
    name: z.string().min(1).openapi({ description: 'Nation name' }),
  }).optional().openapi({ description: 'Associated Nation' }),
}).openapi('City');


export const AirportSchema = z.object({
  id: z.number().int().positive().openapi({ description: 'Airport ID' }),
  name: z.string().min(1).openapi({ description: 'Airport name' }),
  iata_code: z.string().length(3).nullable().openapi({ description: 'IATA code (3 characters)' }),
  icao_code: z.string().length(4).nullable().openapi({ description: 'ICAO code (4 characters)' }),
  latitude: z.number().min(-90).max(90).openapi({ description: 'Latitude coordinate' }),
  longitude: z.number().min(-180).max(180).openapi({ description: 'Longitude coordinate' }),
  city: CitySchema.openapi({ description: 'Associated City' }),
}).openapi('Airport');


export const AirportListQuerySchema = z.object({
  name: z.string().optional().openapi({ 
    description: 'Filter by airport name (case-insensitive, partial match)',
    example: ''
  }),
  city_name: z.string().optional().openapi({ 
    description: 'Filter by city name (case-insensitive, partial match)',
    example: ''
  }),
  nation_name: z.string().optional().openapi({ 
    description: 'Filter by nation name (case-insensitive, partial match)',
    example: ''
  }),
  iata_code: z.string().length(3).optional().openapi({ 
    description: 'Filter by IATA code (case-insensitive)',
    example: ''
  }),
  icao_code: z.string().length(4).optional().openapi({ 
    description: 'Filter by ICAO code (case-insensitive)',
    example: ''
  }),
}).openapi('AirportListQuery');


export const AirportParamsSchema = z.object({
  airport_id: z.string().transform((val) => parseInt(val, 10)).pipe(
    z.number().int().positive().openapi({ description: 'The airport identifier' })
  ),
}).openapi('AirportParams');


export const AirportListResponseSchema = z.array(AirportSchema).openapi('AirportListResponse', { 
  description: 'List of airports'
});

export const AirportResponseSchema = AirportSchema.openapi('AirportResponse', { 
  description: 'Single airport details'
});


export type Airport = z.infer<typeof AirportSchema>;
export type City = z.infer<typeof CitySchema>;
export type AirportListQuery = z.infer<typeof AirportListQuerySchema>;
export type AirportParams = z.infer<typeof AirportParamsSchema>; 
