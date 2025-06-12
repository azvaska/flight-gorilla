import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { PrismaClient } from '../../generated/prisma';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { registry } from '../config/openapi';
import { 
  bookingInputSchema, 
  bookingListQuerySchema,
  bookingOutputSchema,
  BookingInput,
  BookingListQuery 
} from '../schemas/booking';
import { 
  priceFromFlight, 
  generateUniqueBookingNumber, 
  checkAndUpdateFlightCapacity 
} from '../utils/booking';

const router = Router();
const prisma = new PrismaClient();

// Validation middleware
const validateBookingInput = (req: Request, res: Response, next: any) => {
  try {
    // Validate request body without reassigning
    bookingInputSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    next(error);
  }
};

const validateBookingListQuery = (req: Request, res: Response, next: any) => {
  try {
    // Validate query parameters without reassigning
    bookingListQuerySchema.parse(req.query);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    next(error);
  }
};

// Helper function to format booking output (matches Python schemas)
async function formatBookingOutput(booking: any) {
  // Helper function to format flight data to match Python structure
  const formatFlightData = (flightData: any) => {
    const flight = flightData.flight;
    return {
      ...flight,
      airline: flight.route.airline,
      flight_number: flight.route.flight_number,
      departure_airport: flight.route.airport_route_departure_airport_idToairport,
      arrival_airport: flight.route.airport_route_arrival_airport_idToairport,
      aircraft: flight.airline_aircraft
    };
  };

  // Calculate insurance price (matches Python model property)
  const insurancePrice = Math.round(
    (booking.booking_departure_flight.reduce((sum: number, flight: any) => 
      sum + flight.flight.price_insurance, 0) +
    booking.booking_return_flight.reduce((sum: number, flight: any) => 
      sum + flight.flight.price_insurance, 0)) * 100
  ) / 100;

  // Calculate total price (matches Python model property)
  let totalPrice = 0;
  
  // Add departure flights price and extras
  for (const flight of booking.booking_departure_flight) {
    totalPrice += flight.price;
  }
  
  // Add return flights price and extras
  for (const flight of booking.booking_return_flight) {
    totalPrice += flight.price;
  }
  
  // Add booking extras
  for (const extra of booking.booking_flight_extra || []) {
    totalPrice += extra.extra_price;
  }
  
  // Add insurance if purchased
  if (booking.has_booking_insurance) {
    totalPrice += insurancePrice;
  }
  
  totalPrice = Math.round(totalPrice * 100) / 100;

  // Group extras by flight
  const extrasByFlight = new Map();
  for (const extra of booking.booking_flight_extra || []) {
    if (!extrasByFlight.has(extra.flight_id)) {
      extrasByFlight.set(extra.flight_id, []);
    }
    extrasByFlight.get(extra.flight_id).push({
      extra_id: extra.extra_id,
      extra_price: extra.extra_price,
      name: extra.flight_extra.extra.name,
      description: extra.flight_extra.extra.description,
      quantity: extra.quantity
    });
  }

  return {
    id: booking.id,
    booking_number: booking.booking_number,
    departure_flights: booking.booking_departure_flight.map((flight: any) => ({
      flight: formatFlightData(flight),
      seat_number: flight.seat_number,
      class_type: flight.class_type,
      price: flight.price,
      extras: extrasByFlight.get(flight.flight_id) || []
    })),
    return_flights: booking.booking_return_flight.map((flight: any) => ({
      flight: formatFlightData(flight),
      seat_number: flight.seat_number,
      class_type: flight.class_type,
      price: flight.price,
      extras: extrasByFlight.get(flight.flight_id) || []
    })),
    total_price: totalPrice,
    is_insurance_purchased: booking.has_booking_insurance,
    insurance_price: insurancePrice
  };
}


router.get('/', authenticateToken, validateBookingListQuery, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRoles = req.user!.roles;
    const query = req.query as BookingListQuery;

    // Build where clause based on user permissions (matches Python logic)
    let whereClause: any = {};

    const isAdmin = userRoles.includes('admin');
    const isAirlineAdmin = userRoles.includes('airline-admin');

    if (!isAdmin && !isAirlineAdmin) {
      // Regular users can only see their own bookings
      whereClause.user_id = userId;
    } else if (isAirlineAdmin) {
      // Get user's airline_id
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { airline_id: true }
      });

      if (!user?.airline_id) {
        res.status(400).json({ error: 'Airline ID is required for airline-admin' });
        return;
      }

      // Airline admins can see bookings for their flights
      whereClause = {
        OR: [
          {
            booking_departure_flight: {
              some: {
                flight: {
                  route: {
                    airline_id: user.airline_id
                  }
                }
              }
            }
          },
          {
            booking_return_flight: {
              some: {
                flight: {
                  route: {
                    airline_id: user.airline_id
                  }
                }
              }
            }
          }
        ]
      };
    }

    // Apply additional filters
    if (query.flight_id) {
      whereClause.OR = [
        {
          booking_departure_flight: {
            some: { flight_id: query.flight_id }
          }
        },
        {
          booking_return_flight: {
            some: { flight_id: query.flight_id }
          }
        }
      ];
    }

    if (query.class_type) {
      whereClause.OR = [
        {
          booking_departure_flight: {
            some: { class_type: query.class_type }
          }
        },
        {
          booking_return_flight: {
            some: { class_type: query.class_type }
          }
        }
      ];
    }

    if (query.user_id && (isAdmin || isAirlineAdmin)) {
      whereClause.user_id = query.user_id;
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        booking_departure_flight: {
          include: {
            flight: {
              include: {
                route: {
                  include: {
                    airport_route_departure_airport_idToairport: {
                      include: {
                        city: {
                          include: {
                            nation: true
                          }
                        }
                      }
                    },
                    airport_route_arrival_airport_idToairport: {
                      include: {
                        city: {
                          include: {
                            nation: true
                          }
                        }
                      }
                    },
                    airline: true
                  }
                },
                airline_aircraft: {
                  include: {
                    aircraft: true
                  }
                }
              }
            }
          }
        },
        booking_return_flight: {
          include: {
            flight: {
              include: {
                route: {
                  include: {
                    airport_route_departure_airport_idToairport: {
                      include: {
                        city: {
                          include: {
                            nation: true
                          }
                        }
                      }
                    },
                    airport_route_arrival_airport_idToairport: {
                      include: {
                        city: {
                          include: {
                            nation: true
                          }
                        }
                      }
                    },
                    airline: true
                  }
                },
                airline_aircraft: {
                  include: {
                    aircraft: true
                  }
                }
              }
            }
          }
        },
        booking_flight_extra: {
          include: {
            flight_extra: {
              include: {
                extra: true
              }
            }
          }
        }
      }
    });

    const formattedBookings = await Promise.all(
      bookings.map(booking => formatBookingOutput(booking))
    );

    res.json(formattedBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/', authenticateToken, requireRoles(['user']), validateBookingInput, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = req.body as BookingInput;

    // Use transaction with serializable isolation (matches Python)
    const result = await prisma.$transaction(async (tx) => {
      // Validate seat session belongs to user and is active
      const seatSession = await tx.seat_session.findFirst({
        where: {
          id: data.session_id,
          user_id: userId,
          session_end_time: {
            gt: new Date()
          }
        },
        include: {
          seat: true
        }
      });

      if (!seatSession) {
        throw new Error('Seat session does not belong to the user or has expired');
      }

      // Validate flights exist
      for (const flightId of [...data.departure_flights, ...data.return_flights]) {
        const flight = await tx.flight.findUnique({ where: { id: flightId } });
        if (!flight) {
          throw new Error(`Flight with ID ${flightId} not found`);
        }
      }

      // Validate extras exist and belong to selected flights
      for (const extra of data.extras) {
        const flightExtra = await tx.flight_extra.findUnique({
          where: { id: extra.id }
        });
        
        if (!flightExtra) {
          throw new Error(`Extra with ID ${extra.id} not found`);
        }

        const allFlightIds = [...data.departure_flights, ...data.return_flights];
        if (!allFlightIds.includes(flightExtra.flight_id)) {
          throw new Error('Extra does not belong to the selected flights');
        }
      }

      // Generate unique booking number
      let bookingNumber: string;
      let attempts = 0;
      do {
        bookingNumber = generateUniqueBookingNumber();
        const existing = await tx.booking.findFirst({
          where: { booking_number: bookingNumber }
        });
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        throw new Error('Could not generate unique booking number');
      }

      // Create booking
      const booking = await tx.booking.create({
        data: {
          id: randomUUID(),
          user_id: userId,
          payment_confirmed: true,
          has_booking_insurance: data.has_booking_insurance,
          booking_number: bookingNumber,
          created_at: new Date()
        }
      });

      const allSeats = seatSession.seat;

      // Create departure flight bookings
      for (const flightId of data.departure_flights) {
        for (const seat of allSeats) {
          if (seat.flight_id === flightId) {
            const flight = await tx.flight.findUnique({
              where: { id: flightId }
            });
            
            const flightPrice = priceFromFlight(flight, seat.class_type);
            
            await tx.booking_departure_flight.create({
              data: {
                flight_id: flightId,
                booking_id: booking.id,
                seat_number: seat.seat_number,
                class_type: seat.class_type,
                price: flightPrice
              }
            });

            await checkAndUpdateFlightCapacity(tx, flightId);
          }
        }
      }

      // Create return flight bookings
      for (const flightId of data.return_flights) {
        for (const seat of allSeats) {
          if (seat.flight_id === flightId) {
            const flight = await tx.flight.findUnique({
              where: { id: flightId }
            });
            
            const flightPrice = priceFromFlight(flight, seat.class_type);
            
            await tx.booking_return_flight.create({
              data: {
                flight_id: flightId,
                booking_id: booking.id,
                seat_number: seat.seat_number,
                class_type: seat.class_type,
                price: flightPrice
              }
            });

            await checkAndUpdateFlightCapacity(tx, flightId);
          }
        }
      }

      // Create booking extras
      for (const extra of data.extras) {
        const extraObj = await tx.flight_extra.findUnique({
          where: { id: extra.id }
        });

        if (extraObj) {
          await tx.booking_flight_extra.create({
            data: {
              booking_id: booking.id,
              flight_id: extraObj.flight_id,
              extra_id: extraObj.id,
              extra_price: extraObj.price * extra.quantity,
              quantity: extra.quantity
            }
          });
        }
      }

      // Delete seat session (booking confirmed)
      await tx.seat_session.delete({
        where: { id: data.session_id }
      });

      return booking;
    }, {
      isolationLevel: 'Serializable'
    });

    res.status(201).json({ id: result.id });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    
    if (error.message.includes('not found') || error.message.includes('does not belong')) {
      res.status(403).json({ error: error.message, code: 403 });
      return;
    }
    
    res.status(400).json({ error: error.message });
  }
});


router.get('/:booking_id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRoles = req.user!.roles;
    const bookingId = req.params.booking_id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        booking_departure_flight: {
          include: {
            flight: {
              include: {
                route: {
                  include: {
                    airport_route_departure_airport_idToairport: {
                      include: {
                        city: {
                          include: {
                            nation: true
                          }
                        }
                      }
                    },
                    airport_route_arrival_airport_idToairport: {
                      include: {
                        city: {
                          include: {
                            nation: true
                          }
                        }
                      }
                    },
                    airline: true
                  }
                },
                airline_aircraft: {
                  include: {
                    aircraft: true
                  }
                }
              }
            }
          }
        },
        booking_return_flight: {
          include: {
            flight: {
              include: {
                route: {
                  include: {
                    airport_route_departure_airport_idToairport: {
                      include: {
                        city: {
                          include: {
                            nation: true
                          }
                        }
                      }
                    },
                    airport_route_arrival_airport_idToairport: {
                      include: {
                        city: {
                          include: {
                            nation: true
                          }
                        }
                      }
                    },
                    airline: true
                  }
                },
                airline_aircraft: {
                  include: {
                    aircraft: true
                  }
                }
              }
            }
          }
        },
        booking_flight_extra: {
          include: {
            flight_extra: {
              include: {
                extra: true
              }
            }
          }
        }
      }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Check permissions (matches Python logic)
    const isAdmin = userRoles.includes('admin');
    const isAirlineAdmin = userRoles.includes('airline-admin');

    if (booking.user_id !== userId && !isAdmin && !isAirlineAdmin) {
      res.status(403).json({ error: 'You do not have permission to view this booking' });
      return;
    }

    // For airline admins, check if booking is for their airline's flight
    if (isAirlineAdmin && !isAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { airline_id: true }
      });

      if (!user?.airline_id) {
        res.status(403).json({ error: 'You do not have permission to view this booking' });
        return;
      }

      // Check if any flight in the booking belongs to the airline
      const hasAirlineFlights = booking.booking_departure_flight.some((df: any) => 
        df.flight.route.airline_id === user.airline_id
      ) || booking.booking_return_flight.some((rf: any) => 
        rf.flight.route.airline_id === user.airline_id
      );

      if (!hasAirlineFlights) {
        res.status(403).json({ error: 'You do not have permission to view this booking' });
        return;
      }
    }

    const formattedBooking = await formatBookingOutput(booking);
    res.json(formattedBooking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.delete('/:booking_id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRoles = req.user!.roles;
    const bookingId = req.params.booking_id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        booking_departure_flight: true,
        booking_return_flight: true
      }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Check permissions (matches Python logic)
    const isAdmin = userRoles.includes('admin');
    
    if (booking.user_id !== userId && !isAdmin) {
      res.status(403).json({ 
        error: 'You do not have permission to delete this booking',
        code: 403
      });
      return;
    }

    // Collect flight IDs before deletion to update capacity
    const flightIds = new Set<string>();
    booking.booking_departure_flight.forEach((df: any) => flightIds.add(df.flight_id));
    booking.booking_return_flight.forEach((rf: any) => flightIds.add(rf.flight_id));

    try {
      // Delete booking (cascade will handle related records)
      await prisma.booking.delete({
        where: { id: bookingId }
      });

      // Update flight capacities
      for (const flightId of flightIds) {
        await checkAndUpdateFlightCapacity(prisma, flightId);
      }

      res.json({ message: 'Booking deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2003') { // Foreign key constraint
        res.status(409).json({ 
          error: 'Booking cannot be deleted due to existing dependencies' 
        });
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register OpenAPI paths
registry.registerPath({
  method: 'get',
  path: '/booking',
  description: 'List bookings with optional filtering',
  summary: 'List bookings',
  tags: ['Booking'],
  security: [{ bearerAuth: [] }],
  request: {
    query: bookingListQuerySchema,
  },
  responses: {
    200: {
      description: 'List of bookings',
      content: {
        'application/json': {
          schema: z.array(bookingOutputSchema),
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/booking',
  description: 'Create a new booking',
  summary: 'Create booking',
  tags: ['Booking'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: bookingInputSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Booking created successfully',
      content: {
        'application/json': {
          schema: z.object({ id: z.string() }),
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: z.object({ error: z.string(), code: z.number().optional() }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/booking/{booking_id}',
  description: 'Fetch a booking by ID',
  summary: 'Get booking by ID',
  tags: ['Booking'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      booking_id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Booking details',
      content: {
        'application/json': {
          schema: bookingOutputSchema,
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/booking/{booking_id}',
  description: 'Delete a booking by ID',
  summary: 'Delete booking',
  tags: ['Booking'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      booking_id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Booking deleted successfully',
      content: {
        'application/json': {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: z.object({ error: z.string(), code: z.number().optional() }),
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
    },
    409: {
      description: 'Conflict - cannot delete due to dependencies',
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
    },
  },
});

export const bookingRouter = router; 
