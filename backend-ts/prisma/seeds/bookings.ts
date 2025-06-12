import { PrismaClient, classtype } from '../../generated/prisma';
import { randomUUID } from 'crypto';

function generateUniqueBookingNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getFlightPrice(flight: any, classType: classtype): number {
  switch (classType) {
    case classtype.FIRST_CLASS:
      return flight.price_first_class;
    case classtype.BUSINESS_CLASS:
      return flight.price_business_class;
    case classtype.ECONOMY_CLASS:
    default:
      return flight.price_economy_class;
  }
}

async function getAvailableSeat(
  prisma: PrismaClient, 
  flightId: string, 
  classType: classtype, 
  bookedSeats: Set<string>
): Promise<string | null> {
  // Get aircraft seats for this flight and class
  const flight = await prisma.flight.findUnique({
    where: { id: flightId },
    include: {
      airline_aircraft: {
        include: {
          airline_aircraft_seat: {
            where: { class_type: classType }
          }
        }
      }
    }
  });

  if (!flight) return null;

  const availableSeats = flight.airline_aircraft.airline_aircraft_seat
    .map(seat => seat.seat_number)
    .filter(seat => !bookedSeats.has(seat));

  if (availableSeats.length === 0) return null;

  return availableSeats[Math.floor(Math.random() * availableSeats.length)];
}

async function createRealisticBooking(
  prisma: PrismaClient,
  user: any,
  departureFlight: any,
  returnFlight: any = null,
  forceClass: classtype | null = null
): Promise<boolean> {
  try {
    // Get already booked seats for both flights
    const bookedSeats = new Set<string>();
    
    const departureBookings = await prisma.booking_departure_flight.findMany({
      where: { flight_id: departureFlight.id }
    });
    departureBookings.forEach(booking => bookedSeats.add(booking.seat_number));

    if (returnFlight) {
      const returnBookings = await prisma.booking_return_flight.findMany({
        where: { flight_id: returnFlight.id }
      });
      returnBookings.forEach(booking => bookedSeats.add(booking.seat_number));
    }

    // Determine class type with realistic distribution
    let classType: classtype;
    if (forceClass) {
      classType = forceClass;
    } else {
      const rand = Math.random();
      if (rand < 0.85) {
        classType = classtype.ECONOMY_CLASS;
      } else if (rand < 0.97) {
        classType = classtype.BUSINESS_CLASS;
      } else {
        classType = classtype.FIRST_CLASS;
      }
    }

    // Check seat availability for departure flight
    let departureSeat = await getAvailableSeat(prisma, departureFlight.id, classType, bookedSeats);
    if (!departureSeat) {
      // Fallback to economy if preferred class is full
      if (classType !== classtype.ECONOMY_CLASS) {
        classType = classtype.ECONOMY_CLASS;
        departureSeat = await getAvailableSeat(prisma, departureFlight.id, classType, bookedSeats);
        if (!departureSeat) return false; // Flight completely full
      } else {
        return false; // Flight completely full
      }
    }

    bookedSeats.add(departureSeat);

    // Check return flight seat if exists
    let returnSeat: string | null = null;
    if (returnFlight) {
      returnSeat = await getAvailableSeat(prisma, returnFlight.id, classType, bookedSeats);
      if (!returnSeat) {
        // Try economy class fallback
        if (classType !== classtype.ECONOMY_CLASS) {
          returnSeat = await getAvailableSeat(prisma, returnFlight.id, classtype.ECONOMY_CLASS, bookedSeats);
        }
        if (!returnSeat) return false; // Return flight full
      }
      bookedSeats.add(returnSeat);
    }

    // Create booking
    const bookingId = randomUUID();
    let bookingNumber = generateUniqueBookingNumber();
    
    // Ensure booking number is unique
    while (await prisma.booking.findFirst({ where: { booking_number: bookingNumber } })) {
      bookingNumber = generateUniqueBookingNumber();
    }

    let totalPrice = 0;

    // Create departure flight booking
    const departurePrice = getFlightPrice(departureFlight, classType) * (0.95 + Math.random() * 0.1); // ±5% price variation
    totalPrice += departurePrice;

    // Create return flight booking if exists
    let returnPrice = 0;
    if (returnFlight) {
      returnPrice = getFlightPrice(returnFlight, classType) * (0.95 + Math.random() * 0.1);
      totalPrice += returnPrice;
    }

    // Add insurance (30% chance)
    const hasInsurance = Math.random() < 0.3;
    if (hasInsurance) {
      totalPrice += departureFlight.price_insurance;
      if (returnFlight) {
        totalPrice += returnFlight.price_insurance;
      }
    }

    const booking = await prisma.booking.create({
      data: {
        id: bookingId,
        user_id: user.id,
        booking_number: bookingNumber,
        payment_confirmed: Math.random() < 0.9, // 90% confirmed
        has_booking_insurance: hasInsurance,
        created_at: new Date()
      }
    });

    // Create departure flight booking
    await prisma.booking_departure_flight.create({
      data: {
        booking_id: bookingId,
        flight_id: departureFlight.id,
        seat_number: departureSeat,
        class_type: classType,
        price: departurePrice
      }
    });

    // Create return flight booking if exists
    if (returnFlight && returnSeat) {
      await prisma.booking_return_flight.create({
        data: {
          booking_id: bookingId,
          flight_id: returnFlight.id,
          seat_number: returnSeat,
          class_type: classType,
          price: returnPrice
        }
      });
    }

    // Add extras (40% chance for at least one extra)
    if (Math.random() < 0.4) {
      const departureExtras = await prisma.flight_extra.findMany({
        where: { flight_id: departureFlight.id }
      });

      if (departureExtras.length > 0) {
        const numExtras = Math.random() < 0.7 ? 1 : Math.random() < 0.9 ? 2 : 3;
        const selectedExtras = departureExtras
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(numExtras, departureExtras.length));

        for (const flightExtra of selectedExtras) {
          const quantity = Math.floor(Math.random() * Math.min(flightExtra.limit, 3)) + 1;
          
          // Create booking extra for departure flight
          await prisma.booking_flight_extra.create({
            data: {
              booking_id: bookingId,
              flight_id: departureFlight.id,
              extra_id: flightExtra.extra_id,
              quantity: quantity,
              extra_price: flightExtra.price
            }
          });

          // Add same extra to return flight if exists and available
          if (returnFlight) {
            const returnExtra = await prisma.flight_extra.findFirst({
              where: {
                flight_id: returnFlight.id,
                extra_id: flightExtra.extra_id
              }
            });

            if (returnExtra) {
              await prisma.booking_flight_extra.create({
                data: {
                  booking_id: bookingId,
                  flight_id: returnFlight.id,
                  extra_id: returnExtra.extra_id,
                  quantity: quantity,
                  extra_price: returnExtra.price
                }
              });
            }
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error creating booking:', error);
    return false;
  }
}

export async function seedBookings(prisma: PrismaClient) {
  console.log('Seeding bookings into the database...');
  
  try {
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      console.log('No users found in the database.');
      return;
    }

    const flights = await prisma.flight.findMany({
      include: {
        airline_aircraft: {
          include: {
            airline_aircraft_seat: true
          }
        }
      }
    });

    if (flights.length === 0) {
      console.log('No flights found in the database.');
      return;
    }

    console.log(`Creating bookings for ${users.length} users and ${flights.length} flights...`);

    let successfulBookings = 0;
    const targetBookings = 50; // Target number of bookings

    // Generate single-trip bookings
    for (let i = 0; i < targetBookings * 0.6; i++) { // 60% single trips
      const user = users[Math.floor(Math.random() * users.length)];
      const flight = flights[Math.floor(Math.random() * flights.length)];
      
      const success = await createRealisticBooking(prisma, user, flight);
      if (success) successfulBookings++;
    }

    // Generate round-trip bookings
    for (let i = 0; i < targetBookings * 0.4; i++) { // 40% round trips
      const user = users[Math.floor(Math.random() * users.length)];
      const departureFlight = flights[Math.floor(Math.random() * flights.length)];
      
      // Find a return flight (different from departure)
      const possibleReturnFlights = flights.filter(f => f.id !== departureFlight.id);
      if (possibleReturnFlights.length > 0) {
        const returnFlight = possibleReturnFlights[Math.floor(Math.random() * possibleReturnFlights.length)];
        
        const success = await createRealisticBooking(prisma, user, departureFlight, returnFlight);
        if (success) successfulBookings++;
      }
    }

    // Generate some business class bookings
    for (let i = 0; i < 10; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const flight = flights[Math.floor(Math.random() * flights.length)];
      
      const success = await createRealisticBooking(prisma, user, flight, null, classtype.BUSINESS_CLASS);
      if (success) successfulBookings++;
    }

    console.log(`✅ Successfully created ${successfulBookings} bookings`);
  } catch (error) {
    console.error('❌ Error seeding bookings:', error);
    throw error;
  }
} 
