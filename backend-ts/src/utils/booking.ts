import { classtype } from '../../generated/prisma';
import { randomBytes } from 'crypto';


export function priceFromFlight(flight: any, classType: classtype): number {
  let flightPrice = 0.0;
  
  if (classType === classtype.FIRST_CLASS) {
    flightPrice = flight.price_first_class;
  } else if (classType === classtype.BUSINESS_CLASS) {
    flightPrice = flight.price_business_class;
  } else if (classType === classtype.ECONOMY_CLASS) {
    flightPrice = flight.price_economy_class;
  }
  
  return flightPrice;
}


export function generateUniqueBookingNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  
  return result;
}


export async function checkAndUpdateFlightCapacity(prisma: any, flightId: string): Promise<void> {
  const flight = await prisma.flight.findUnique({
    where: { id: flightId },
    include: {
      airline_aircraft: {
        include: {
          aircraft: true
        }
      },
      booking_departure_flight: true,
      booking_return_flight: true
    }
  });
  
  if (!flight) {
    return;
  }
  
  // Get total seats available on the aircraft
  const aircraft = flight.airline_aircraft.aircraft;
  const totalSeats = 
    aircraft.first_class_seats + 
    aircraft.business_class_seats + 
    aircraft.economy_class_seats;
  
  // Get total booked seats for this flight
  const bookedSeatsCount = 
    flight.booking_departure_flight.length + 
    flight.booking_return_flight.length;
  
  // Update fully_booked flag
  const fullyBooked = bookedSeatsCount >= totalSeats;
  
  await prisma.flight.update({
    where: { id: flightId },
    data: { fully_booked: fullyBooked }
  });
} 
