import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// Card type enum
export const CardTypeSchema = z.enum(['DEBIT', 'CREDIT', 'PREPAID']).openapi('CardType');

// Nation schema (for nested responses)
export const NationSchema = z.object({
  id: z.number().int().positive().openapi({ description: 'Nation ID' }),
  name: z.string().min(1).openapi({ description: 'Nation name' }),
  code: z.string().openapi({ description: 'Nation code' }),
  alpha2: z.string().length(2).openapi({ description: 'Nation alpha2 code' }),
}).openapi('Nation');

// Payment card input schema
export const PaymentCardInputSchema = z.object({
  holder_name: z.string().min(1).openapi({ description: 'Card holder full name' }),
  card_name: z.string().min(1).openapi({ description: 'Card name' }),
  last_4_digits: z.string().length(4).openapi({ description: 'Last 4 digits of card' }),
  expiration_date: z.string().min(1).openapi({ description: 'Card expiration date' }),
  circuit: z.string().min(1).openapi({ description: 'Card circuit' }),
  card_type: CardTypeSchema.openapi({ description: 'Card type' }),
}).openapi('PaymentCardInput');

// Payment card output schema
export const PaymentCardOutputSchema = z.object({
  id: z.number().int().positive().openapi({ description: 'Card ID' }),
  holder_name: z.string().openapi({ description: 'Card holder full name' }),
  card_name: z.string().openapi({ description: 'Card name' }),
  last_4_digits: z.string().openapi({ description: 'Last 4 digits of card' }),
  expiration_date: z.string().openapi({ description: 'Card expiration date' }),
  circuit: z.string().openapi({ description: 'Card circuit' }),
  card_type: CardTypeSchema.openapi({ description: 'Card type' }),
}).openapi('PaymentCardOutput');

// User base schema
export const UserSchema = z.object({
  id: z.string().uuid().openapi({ description: 'User ID' }),
  email: z.string().email().openapi({ description: 'Email address' }),
  name: z.string().min(1).openapi({ description: 'First name' }),
  surname: z.string().min(1).openapi({ description: 'Last name' }),
  address: z.string().nullable().optional().openapi({ description: 'Address' }),
  zip: z.string().nullable().optional().openapi({ description: 'ZIP/postal code' }),
  nation_id: z.number().int().positive().nullable().optional().openapi({ description: 'Nation ID' }),
  airline_id: z.string().uuid().nullable().optional().openapi({ description: 'Airline ID' }),
  active: z.boolean().openapi({ description: 'Account active status' }),
}).openapi('User');

// User output schema (with nested relations)
export const UserOutputSchema = z.object({
  id: z.string().uuid().openapi({ description: 'User ID' }),
  email: z.string().email().openapi({ description: 'Email address' }),
  name: z.string().min(1).openapi({ description: 'First name' }),
  surname: z.string().min(1).openapi({ description: 'Last name' }),
  address: z.string().nullable().optional().openapi({ description: 'Address' }),
  zip: z.string().nullable().optional().openapi({ description: 'ZIP/postal code' }),
  nation: NationSchema.nullable().optional().openapi({ description: 'Nation' }),
  airline_id: z.string().uuid().nullable().optional().openapi({ description: 'Airline ID' }),
  active: z.boolean().openapi({ description: 'Account active status' }),
  cards: z.array(PaymentCardOutputSchema).openapi({ description: 'List of payment cards' }),
  type: z.enum(['airline', 'user']).openapi({ description: 'User type (airline or user)' }),
}).openapi('UserOutput');

// User update schema
export const UserUpdateSchema = z.object({
  email: z.string().email().optional().openapi({ description: 'Email address' }),
  name: z.string().min(1).optional().openapi({ description: 'First name' }),
  surname: z.string().min(1).optional().openapi({ description: 'Last name' }),
  address: z.string().optional().openapi({ description: 'Address' }),
  zip: z.string().optional().openapi({ description: 'ZIP/postal code' }),
  nation_id: z.number().int().positive().optional().openapi({ description: 'Nation ID' }),
}).openapi('UserUpdate');

// Password update schema
export const UpdatePasswordSchema = z.object({
  old_password: z.string().min(1).openapi({ description: 'Current password' }),
  new_password: z.string().min(6).openapi({ description: 'New password (minimum 6 characters)' }),
}).openapi('UpdatePassword');

// User list query parameters
export const UserListQuerySchema = z.object({
  email: z.string().optional().openapi({ description: 'Filter by email (case-insensitive)' }),
  name: z.string().optional().openapi({ description: 'Filter by name (case-insensitive)' }),
  active: z.boolean().optional().openapi({ description: 'Filter by active status' }),
  role: z.string().optional().openapi({ description: 'Filter by role' }),
}).openapi('UserListQuery');

// Path parameters
export const UserParamsSchema = z.object({
  user_id: z.string().uuid().openapi({ description: 'The user identifier' }),
}).openapi('UserParams');

export const CardParamsSchema = z.object({
  card_id: z.string().transform((val) => parseInt(val, 10)).pipe(
    z.number().int().positive().openapi({ description: 'The card identifier' })
  ),
}).openapi('CardParams');

// Response schemas
export const UserListResponseSchema = z.array(UserOutputSchema).openapi('UserListResponse', { 
  description: 'List of users'
});

export const PaymentCardListResponseSchema = z.array(PaymentCardOutputSchema).openapi('PaymentCardListResponse', { 
  description: 'List of payment cards'
});

export const MessageResponseSchema = z.object({
  message: z.string().openapi({ description: 'Success message' }),
}).openapi('MessageResponse');

// Type exports
export type User = z.infer<typeof UserSchema>;
export type UserOutput = z.infer<typeof UserOutputSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type PaymentCardInput = z.infer<typeof PaymentCardInputSchema>;
export type PaymentCardOutput = z.infer<typeof PaymentCardOutputSchema>;
export type UpdatePassword = z.infer<typeof UpdatePasswordSchema>;
export type UserListQuery = z.infer<typeof UserListQuerySchema>;
export type UserParams = z.infer<typeof UserParamsSchema>;
export type CardParams = z.infer<typeof CardParamsSchema>;
export type CardType = z.infer<typeof CardTypeSchema>; 
