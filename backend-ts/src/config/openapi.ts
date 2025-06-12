import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// Register security schemes
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

// Common error responses
export const ErrorResponseSchema = z.object({
  error: z.string().describe('Error message'),
});

export const ValidationErrorResponseSchema = z.object({
  error: z.string().describe('Validation error message'),
  details: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional().describe('Detailed validation errors'),
});

registry.register('ErrorResponse', ErrorResponseSchema);
registry.register('ValidationErrorResponse', ValidationErrorResponseSchema); 
