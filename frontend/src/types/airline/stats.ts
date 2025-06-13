/**
 * @file stats.ts
 * @description Defines interfaces for the dashboard statistics data.
 */


export interface IFlightFulfillmentData {
  month: number;
  totalSeats: number;
  totalBooks: number;
}


export interface IRevenueData {
  month: number;
  total: number;
}


export interface IMostRequestedRouteData {
  airportFrom: string;
  airportTo: string;
  flight_number: string;
  bookings: number;
  booking_ratio: number;
}


export interface IAirportsWithMostFlightsData {
  airport: string;
  flights: number;
}


export interface ILeastUsedRouteData {
  airportFrom: string;
  airportTo: string;
  flight_number: string;
  flights: number;
}

/**
 * @interface IStats
 * @description Represents the overall structure for the dashboard statistics.
 * This interface combines data for flights fulfillment, revenue,
 * most requested routes, airports with most flights, and least used routes.
 */
export interface IStats {
  flights_fullfilment: IFlightFulfillmentData[];
  revenue: IRevenueData[];
  mostRequestedRoutes: IMostRequestedRouteData[];
  airportsWithMostFlights: IAirportsWithMostFlightsData[];
  leastUsedRoute: ILeastUsedRouteData[];
}
