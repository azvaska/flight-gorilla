import 'reflect-metadata';
import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { createConnection } from 'typeorm';
import authRoutes from './routes/auth';
import aircraftRoutes from './routes/aircraft';
import airportRoutes from './routes/airport';
import airlineRoutes from './routes/airline';
import bookingRoutes from './routes/booking';
import flightRoutes from './routes/flight';
import locationRoutes from './routes/location';
import seatSessionRoutes from './routes/seatSession';
import searchRoutes from './routes/search';
import userRoutes from './routes/user';
import adminRoutes from './routes/admin';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { User } from './models/User';
import { Airline } from './models/Airline';
import { Aircraft } from './models/Aircraft';
import { AirlineAircraft } from './models/AirlineAircraft';
import { AirlineAircraftSeat } from './models/AirlineAircraftSeat';
import { Airport } from './models/Airport';
import { City, Nation } from './models/Location';
import { Extra } from './models/Extra';
import { Route, Flight, FlightExtra } from './models/Flight';
import { Booking, BookingDepartureFlight, BookingReturnFlight, BookingFlightExtra } from './models/Booking';
import { SeatSession, Seat } from './models/SeatSession';
import { PayementCard } from './models/Payment';
import { Role } from './models/Role';

async function start() {
  await createConnection({
    type: 'postgres',
    url: config.databaseUrl,
    entities: [
      User,
      Role,
      PayementCard,
      Nation,
      City,
      Airline,
      Aircraft,
      AirlineAircraft,
      AirlineAircraftSeat,
      Airport,
      Extra,
      Route,
      Flight,
      FlightExtra,
      Booking,
      BookingDepartureFlight,
      BookingReturnFlight,
      BookingFlightExtra,
      SeatSession,
      Seat,
    ],
    synchronize: true,
  });

  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: { title: 'FlightGorilla API', version: '1.0.0' },
      components: {
        schemas: {
          Message: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          Error: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          UserLogin: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              active: { type: 'boolean' },
              type: { type: 'string' },
            },
          },
          LoginOutput: {
            type: 'object',
            properties: {
              access_token: { type: 'string' },
              user: { $ref: '#/components/schemas/UserLogin' },
            },
          },
          DebitCard: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              holder_name: { type: 'string' },
              card_name: { type: 'string' },
              last_4_digits: { type: 'string' },
              expiration_date: { type: 'string' },
              circuit: { type: 'string' },
              card_type: { type: 'string' },
            },
          },
          Aircraft: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              rows: { type: 'integer' },
              columns: { type: 'integer' },
            },
          },
          UserOutput: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              surname: { type: 'string' },
              address: { type: 'string' },
              zip: { type: 'string' },
              nation_id: { type: 'integer' },
              airline_id: { type: 'string' },
              active: { type: 'boolean' },
              cards: {
                type: 'array',
                items: { $ref: '#/components/schemas/DebitCard' },
              },
              type: { type: 'string' },
            },
          },
          Seat: {
            type: 'object',
            properties: {
              flight_id: { type: 'string' },
              seat_number: { type: 'string' },
              class_type: { type: 'string' },
            },
          },
          SeatSession: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              user_id: { type: 'string' },
              flight_id: { type: 'string' },
              seats: {
                type: 'array',
                items: { $ref: '#/components/schemas/Seat' },
              },
            },
          },
          Airline: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              address: { type: 'string' },
              zip: { type: 'string' },
              nation_id: { type: 'integer' },
              email: { type: 'string' },
              website: { type: 'string' },
            },
          },
          Airport: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              iata_code: { type: 'string' },
              icao_code: { type: 'string' },
              latitude: { type: 'number' },
              longitude: { type: 'number' },
              city_id: { type: 'integer' },
            },
          },
          City: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              nation_id: { type: 'integer' },
            },
          },
          Nation: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
            },
          },
          BookingOutput: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              booking_number: { type: 'string' },
              departure_flights: { type: 'array', items: { type: 'object' } },
              return_flights: { type: 'array', items: { type: 'object' } },
              total_price: { type: 'number' },
              is_insurance_purchased: { type: 'boolean' },
              insurance_price: { type: 'number' },
            },
          },
          BookingCreation: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
          Flight: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              route_id: { type: 'integer' },
              aircraft_id: { type: 'string' },
              departure_time: { type: 'string' },
              arrival_time: { type: 'string' },
              price_economy_class: { type: 'number' },
              price_business_class: { type: 'number' },
              price_first_class: { type: 'number' },
              price_insurance: { type: 'number' },
            },
          },
          FlightExtra: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              flight_id: { type: 'string' },
              extra_id: { type: 'string' },
              price: { type: 'number' },
              limit: { type: 'integer' },
            },
          },
          FlightSearchResult: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              flight_number: { type: 'string' },
              airline_name: { type: 'string' },
              airline_id: { type: 'string' },
              departure_airport: { type: 'string' },
              arrival_airport: { type: 'string' },
              departure_time: { type: 'string' },
              arrival_time: { type: 'string' },
              duration_minutes: { type: 'integer' },
              price_economy: { type: 'number' },
              price_business: { type: 'number' },
              price_first: { type: 'number' },
              available_economy_seats: { type: 'integer' },
              available_business_seats: { type: 'integer' },
              available_first_seats: { type: 'integer' },
              aircraft_name: { type: 'string' },
              gate: { type: 'string' },
              terminal: { type: 'string' },
            },
          },
        },
      },
    },
    apis: ['./src/routes/*.ts'],
  });

  app.get('/swagger.json', (_req: Request, res: Response): void => {
    res.json(swaggerSpec);
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/auth', authRoutes);
  app.use('/aircraft', aircraftRoutes);
  app.use('/airports', airportRoutes);
  app.use('/airline', airlineRoutes);
  app.use('/booking', bookingRoutes);
  app.use('/flight', flightRoutes);
  app.use('/location', locationRoutes);
  app.use('/seat_session', seatSessionRoutes);
  app.use('/search', searchRoutes);
  app.use('/user', userRoutes);
  app.use('/admin', adminRoutes);

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
});
