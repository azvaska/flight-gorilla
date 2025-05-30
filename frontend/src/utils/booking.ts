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
