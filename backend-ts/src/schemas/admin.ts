import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { NationSchema } from './user';

extendZodWithOpenApi(z);


export const AdminUserSchema = z.object({
  id: z.string().uuid().openapi({ description: 'User ID' }),
  email: z.string().email().openapi({ description: 'Email address' }),
  name: z.string().openapi({ description: 'First name' }),
  surname: z.string().openapi({ description: 'Last name' }),
  address: z.string().nullable().optional().openapi({ description: 'Address' }),
  zip: z.string().nullable().optional().openapi({ description: 'ZIP/postal code' }),
  nation: NationSchema.nullable().optional().openapi({ description: 'Nation' }),
  active: z.boolean().openapi({ description: 'Account active status' }),
  type: z.enum(['airline', 'user']).openapi({ description: 'User type (airline or user)' }),
}).openapi('AdminUser');


export const AirlineWithUsersSchema = z.object({
  id: z.string().uuid().openapi({ description: 'Airline ID' }),
  name: z.string().openapi({ description: 'Airline name' }),
  nation: NationSchema.nullable().optional().openapi({ description: 'Nation' }),
  address: z.string().nullable().optional().openapi({ description: 'Address' }),
  zip: z.string().nullable().optional().openapi({ description: 'ZIP code' }),
  email: z.string().nullable().optional().openapi({ description: 'Email' }),
  website: z.string().nullable().optional().openapi({ description: 'Website' }),
  first_class_description: z.string().nullable().optional().openapi({ description: 'First class description' }),
  business_class_description: z.string().nullable().optional().openapi({ description: 'Business class description' }),
  economy_class_description: z.string().nullable().optional().openapi({ description: 'Economy class description' }),
  user: AdminUserSchema.nullable().optional().openapi({ description: 'User associated with this airline' }),
}).openapi('AirlineWithUsers');


export const AdminAirlineUpdateSchema = z.object({
  name: z.string().min(1).optional().openapi({ description: 'Airline name' }),
  address: z.string().optional().openapi({ description: 'Airline address' }),
  zip: z.string().optional().openapi({ description: 'ZIP/postal code' }),
  nation_id: z.number().int().min(1).optional().openapi({ description: 'Nation ID' }),
  email: z.string().email().optional().openapi({ description: 'Email address' }),
  website: z.string().url().optional().openapi({ description: 'Website URL' }),
  first_class_description: z.string().optional().openapi({ description: 'First class description' }),
  business_class_description: z.string().optional().openapi({ description: 'Business class description' }),
  economy_class_description: z.string().optional().openapi({ description: 'Economy class description' }),
}).openapi('AdminAirlineUpdate');


export const AdminUserListQuerySchema = z.object({
  email: z.string().optional().openapi({ description: 'Filter by email (case-insensitive)' }),
  name: z.string().optional().openapi({ description: 'Filter by name (case-insensitive)' }),
  active: z.boolean().optional().openapi({ description: 'Filter by active status' }),
  role: z.string().optional().openapi({ description: 'Filter by role' }),
}).openapi('AdminUserListQuery');


export const AdminAirlineParamsSchema = z.object({
  airline_id: z.string().uuid().openapi({ description: 'The airline identifier' }),
}).openapi('AdminAirlineParams');

export const AdminUserParamsSchema = z.object({
  user_id: z.string().uuid().openapi({ description: 'The user identifier' }),
}).openapi('AdminUserParams');


export const AdminAirlineListResponseSchema = z.array(AirlineWithUsersSchema).openapi('AdminAirlineListResponse', {
  description: 'List of airlines with their associated users'
});

export const AdminUserListResponseSchema = z.array(AdminUserSchema).openapi('AdminUserListResponse', {
  description: 'List of users'
});

export const AdminMessageResponseSchema = z.object({
  message: z.string().openapi({ description: 'Success message' }),
}).openapi('AdminMessageResponse');

export const AdminErrorResponseSchema = z.object({
  error: z.string().openapi({ description: 'Error message' }),
  code: z.number().int().optional().openapi({ description: 'Error code' }),
}).openapi('AdminErrorResponse');


export type AdminUser = z.infer<typeof AdminUserSchema>;
export type AirlineWithUsers = z.infer<typeof AirlineWithUsersSchema>;
export type AdminAirlineUpdate = z.infer<typeof AdminAirlineUpdateSchema>;
export type AdminUserListQuery = z.infer<typeof AdminUserListQuerySchema>;
export type AdminAirlineParams = z.infer<typeof AdminAirlineParamsSchema>;
export type AdminUserParams = z.infer<typeof AdminUserParamsSchema>; 
