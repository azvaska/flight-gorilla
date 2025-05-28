export interface IFlightSearchParams {
  departureId: string;
  departureType: 'airport' | 'city';
  arrivalId: string;
  arrivalType: 'airport' | 'city';
  departureDate: string;
  airlineId?: string;
  page?: number;
  limit?: number;
  sortBy: 'price' | 'duration' | 'stops';
  sortDirection: 'asc' | 'desc';
  maxPrice: number;
  minDepartureTime: string;
  maxDepartureTime: string;
}
