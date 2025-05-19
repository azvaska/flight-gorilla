export interface IFlightSearchParams {
  departureId: string;
  departureType: 'airport' | 'city';
  arrivalId: string;
  arrivalType: 'airport' | 'city';
  departureDate: string;
  airlineId?: string;
  maxPrice?: number;
  minDepartureTime?: string;
  maxDepartureTime?: string;
  page?: number;
  limit?: number;
}
