import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// Nation schema
export const NationSchema = z.object({
  id: z.number().int().positive().openapi({ description: 'Nation ID' }),
  name: z.string().min(1).openapi({ description: 'Nation name' }),
  code: z.string().openapi({ description: 'Nation code' }),
  alpha2: z.string().length(2).openapi({ description: 'Nation alpha2 code' }),
}).openapi('Nation');

// City schema without nation (for when include_nation is false)
export const CityWithoutNationSchema = z.object({
  id: z.number().int().positive().openapi({ description: 'City ID' }),
  name: z.string().min(1).openapi({ description: 'City name' }),
}).openapi('CityWithoutNation');

// City schema with nation
export const CitySchema = z.object({
  id: z.number().int().positive().openapi({ description: 'City ID' }),
  name: z.string().min(1).openapi({ description: 'City name' }),
  nation: NationSchema.nullable().optional().openapi({ description: 'Associated Nation' }),
}).openapi('City');

// Location schema for combined search
export const LocationSchema = z.object({
  id: z.number().int().positive().openapi({ description: 'Unique identifier' }),
  name: z.string().min(1).openapi({ description: 'Name of the location' }),
  type: z.enum(['city', 'nation', 'airport']).openapi({ description: 'Type: city, nation, or airport' }),
}).openapi('Location');

// Query parameters for location search
export const LocationListQuerySchema = z.object({
  name: z.string().optional().openapi({ 
    description: 'Filter by location name (case-insensitive, partial match)',
    example: ''
  }),
  include_nations: z.string().optional().transform(val => val === 'true').openapi({ 
    description: 'Include nations in the response',
    example: 'false'
  }),
}).openapi('LocationListQuery');

// Query parameters for city list
export const CityListQuerySchema = z.object({
  name: z.string().optional().openapi({ 
    description: 'Filter by city name (case-insensitive, partial match)',
    example: ''
  }),
  include_nation: z.string().optional().transform(val => val === 'true').openapi({ 
    description: 'Add nation information',
    example: 'false'
  }),
  nation_id: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined).pipe(
    z.number().int().positive().optional()
  ).openapi({ 
    description: 'Filter by nation id',
    example: ''
  }),
}).openapi('CityListQuery');

// Query parameters for nation list
export const NationListQuerySchema = z.object({
  name: z.string().optional().openapi({ 
    description: 'Filter by nation name (case-insensitive, partial match)',
    example: ''
  }),
  code: z.string().optional().openapi({ 
    description: 'Filter by nation code (case-insensitive, partial match)',
    example: ''
  }),
  alpha2: z.string().optional().openapi({ 
    description: 'Filter by nation alpha2 code (case-insensitive, exact match)',
    example: ''
  }),
}).openapi('NationListQuery');

// Path parameters
export const CityParamsSchema = z.object({
  city_id: z.string().transform((val) => parseInt(val, 10)).pipe(
    z.number().int().positive().openapi({ description: 'The city identifier' })
  ),
}).openapi('CityParams');

export const NationParamsSchema = z.object({
  nation_id: z.string().transform((val) => parseInt(val, 10)).pipe(
    z.number().int().positive().openapi({ description: 'The nation identifier' })
  ),
}).openapi('NationParams');

// Response schemas
export const LocationListResponseSchema = z.array(LocationSchema).openapi('LocationListResponse', { 
  description: 'List of locations (cities, nations, airports)'
});

export const CityListResponseSchema = z.array(CitySchema).openapi('CityListResponse', { 
  description: 'List of cities'
});

export const CityWithoutNationListResponseSchema = z.array(CityWithoutNationSchema).openapi('CityWithoutNationListResponse', { 
  description: 'List of cities without nation information'
});

export const NationListResponseSchema = z.array(NationSchema).openapi('NationListResponse', { 
  description: 'List of nations'
});

// Type exports
export type Nation = z.infer<typeof NationSchema>;
export type City = z.infer<typeof CitySchema>;
export type CityWithoutNation = z.infer<typeof CityWithoutNationSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type LocationListQuery = z.infer<typeof LocationListQuerySchema>;
export type CityListQuery = z.infer<typeof CityListQuerySchema>;
export type NationListQuery = z.infer<typeof NationListQuerySchema>;
export type CityParams = z.infer<typeof CityParamsSchema>;
export type NationParams = z.infer<typeof NationParamsSchema>; 
