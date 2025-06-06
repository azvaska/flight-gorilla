import { IFlight } from "@/types/flight";

export function getCurrentFlight(departureFlights: IFlight[], returnFlights: IFlight[] | undefined, currentFlightIndex: number) {

  if (currentFlightIndex < departureFlights.length) {
    return departureFlights[currentFlightIndex];
  }

  const newIndex = currentFlightIndex - departureFlights.length;

  if (returnFlights && newIndex < returnFlights.length) {
    return returnFlights[newIndex];
  }

  return undefined;
  
}

export function beautifyFlightClass(flightClass: string) {
  switch (flightClass) {
    case 'FIRST_CLASS':
      return 'First Class';
    case 'BUSINESS_CLASS':
      return 'Business Class';
    case 'ECONOMY_CLASS':
      return 'Economy Class';
    default:
      return flightClass;
  }
}
