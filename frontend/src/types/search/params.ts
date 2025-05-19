export interface IFlightSearchParams {
  departureId: string;
  departureType: 'airport' | 'city';
  arrivalId: string;
  arrivalType: 'airport' | 'city';
  departureDate: string;
  returnDate: string;
}
