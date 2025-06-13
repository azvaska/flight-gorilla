import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);


export const UserLoginSchema = z.object({
  id: z.string().uuid().openapi({ description: 'User ID' }),
  active: z.boolean().openapi({ description: 'User active status' }),
  type: z.enum(['airline', 'user']).openapi({ description: 'User type (airline or user)' }),
}).openapi('UserLogin');


export const LoginInputSchema = z.object({
  email: z.string().openapi({ description: 'Email address' }),
  password: z.string().min(1).openapi({ description: 'Password' }),
}).openapi('LoginInput');


export const LoginOutputSchema = z.object({
  access_token: z.string().openapi({ description: 'JWT Access Token' }),
  user: UserLoginSchema.openapi({ description: 'User information' }),
}).openapi('LoginOutput');


export const RegisterInputSchema = z.object({
  email: z.string().email().openapi({ description: 'Email address' }),
  password: z.string().min(6).openapi({ description: 'Password (minimum 6 characters)' }),
  name: z.string().min(1).openapi({ description: 'First name' }),
  surname: z.string().min(1).openapi({ description: 'Last name' }),
  address: z.string().optional().openapi({ description: 'Address' }),
  zip: z.string().optional().openapi({ description: 'ZIP/postal code' }),
  nation_id: z.number().int().positive().optional().openapi({ description: 'Nation ID' }),
}).openapi('RegisterInput');


export const AirlineRegisterInputSchema = z.object({
  email: z.string().email().openapi({ description: 'Login Email' }),
  name: z.string().min(1).openapi({ description: 'First name' }),
  surname: z.string().min(1).openapi({ description: 'Last name' }),
  airline_name: z.string().min(1).openapi({ description: 'Airline name' }),
}).openapi('AirlineRegisterInput');


export const CredentialsSchema = z.object({
  email: z.string().email().openapi({ description: 'Email' }),
  password: z.string().openapi({ description: 'Temporary password' }),
}).openapi('Credentials');


export const AirlineRegisterOutputSchema = z.object({
  message: z.string().openapi({ description: 'Success message' }),
  credentials: CredentialsSchema.openapi({ description: 'Login credentials' }),
}).openapi('AirlineRegisterOutput');


export const LogoutResponseSchema = z.object({
  message: z.string().openapi({ description: 'Logout message' }),
}).openapi('LogoutResponse');


export type UserLogin = z.infer<typeof UserLoginSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type LoginOutput = z.infer<typeof LoginOutputSchema>;
export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type AirlineRegisterInput = z.infer<typeof AirlineRegisterInputSchema>;
export type AirlineRegisterOutput = z.infer<typeof AirlineRegisterOutputSchema>;
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>; 
