import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();


registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});


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


import { 
  extraInputSchema as bookingExtraInputSchema, 
  bookingInputSchema, 
  bookingListQuerySchema,
  bookedFlightExtraOutputSchema,
  bookedFlightOutputSchema,
  bookingOutputSchema
} from '../schemas/booking';

registry.register('BookingExtraInput', bookingExtraInputSchema);
registry.register('BookingInput', bookingInputSchema);
registry.register('BookingListQuery', bookingListQuerySchema);
registry.register('BookedFlightExtra', bookedFlightExtraOutputSchema);
registry.register('BookedFlight', bookedFlightOutputSchema);
registry.register('BookingOutput', bookingOutputSchema);


import {
  extraInputSchema,
  extraOutputSchema,
  airlineAircraftInputSchema,
  airlineAircraftUpdateSchema,
  airlineAircraftOutputSchema,
  airlineUpdateSchema,
  airlineOutputSchema,
  routeInputSchema,
  routeUpdateSchema,
  routeOutputSchema,
  flightInputSchema,
  flightUpdateSchema,
  flightOutputSchema,
  flightSeatsOutputSchema,
  airlineListQuerySchema,
  flightPageQuerySchema,
  flightsPaginationSchema,
  airlineStatsSchema,
  flightExtraItemSchema,
  flightsFulfillmentSchema,
  revenueSchema,
  mostRequestedRouteSchema,
  airportFlightsSchema,
  leastUsedRouteSchema
} from '../schemas/airline';

registry.register('ExtraInput', extraInputSchema);
registry.register('ExtraOutput', extraOutputSchema);
registry.register('AirlineAircraftInput', airlineAircraftInputSchema);
registry.register('AirlineAircraftUpdate', airlineAircraftUpdateSchema);
registry.register('AirlineAircraftOutput', airlineAircraftOutputSchema);
registry.register('AirlineUpdate', airlineUpdateSchema);
registry.register('AirlineOutput', airlineOutputSchema);
registry.register('RouteInput', routeInputSchema);
registry.register('RouteUpdate', routeUpdateSchema);
registry.register('RouteOutput', routeOutputSchema);
registry.register('FlightInput', flightInputSchema);
registry.register('FlightUpdate', flightUpdateSchema);
registry.register('FlightOutput', flightOutputSchema);
registry.register('FlightSeatsOutput', flightSeatsOutputSchema);
registry.register('AirlineListQuery', airlineListQuerySchema);
registry.register('FlightPageQuery', flightPageQuerySchema);
registry.register('FlightsPagination', flightsPaginationSchema);
registry.register('AirlineStats', airlineStatsSchema);
registry.register('FlightExtraItem', flightExtraItemSchema);
registry.register('FlightsFulfillment', flightsFulfillmentSchema);
registry.register('Revenue', revenueSchema);
registry.register('MostRequestedRoute', mostRequestedRouteSchema);
registry.register('AirportFlights', airportFlightsSchema);
registry.register('LeastUsedRoute', leastUsedRouteSchema);


import {
  AdminUserSchema,
  AirlineWithUsersSchema,
  AdminAirlineUpdateSchema,
  AdminUserListQuerySchema,
  AdminAirlineParamsSchema,
  AdminUserParamsSchema,
  AdminAirlineListResponseSchema,
  AdminUserListResponseSchema,
  AdminMessageResponseSchema,
  AdminErrorResponseSchema
} from '../schemas/admin';

registry.register('AdminUser', AdminUserSchema);
registry.register('AirlineWithUsers', AirlineWithUsersSchema);
registry.register('AdminAirlineUpdate', AdminAirlineUpdateSchema);
registry.register('AdminUserListQuery', AdminUserListQuerySchema);
registry.register('AdminAirlineParams', AdminAirlineParamsSchema);
registry.register('AdminUserParams', AdminUserParamsSchema);
registry.register('AdminAirlineListResponse', AdminAirlineListResponseSchema);
registry.register('AdminUserListResponse', AdminUserListResponseSchema);
registry.register('AdminMessageResponse', AdminMessageResponseSchema);
registry.register('AdminErrorResponse', AdminErrorResponseSchema); 
