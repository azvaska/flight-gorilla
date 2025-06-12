import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Flight, FlightExtra } from '../models/Flight';
import { AirlineAircraft } from '../models/AirlineAircraft';
import { ClassType } from '../models/Common';
import { AirlineAircraftSeat } from '../models/AirlineAircraftSeat';

const router = Router();

/**
 * @openapi
 * /flight/{flight_id}:
 *   get:
 *     summary: Get flight by id
 *     parameters:
 *       - in: path
 *         name: flight_id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Flight'
 */
router.get('/:flight_id', async (req: Request, res: Response): Promise<void> => {
  const repo = getRepository(Flight);
  try {
    const flight = await repo.findOne({
      where: { id: req.params.flight_id },
      relations: ['route', 'route.departure_airport', 'route.arrival_airport', 'route.airline', 'aircraft'],
    });
    if (!flight) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(flight);
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @openapi
 * /flight/extra/{flight_id}:
 *   get:
 *     summary: Get extras for flight
 *     parameters:
 *       - in: path
 *         name: flight_id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FlightExtra'
 */
router.get('/extra/:flight_id', async (req: Request, res: Response): Promise<void> => {
  const repo = getRepository(FlightExtra);
  try {
    const extras = await repo.find({ where: { flight_id: req.params.flight_id } });
    if (!extras.length) {
      res.status(404).json({ error: 'Flight extras not found for the flight' });
      return;
    }
    res.json(extras);
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @openapi
 * /flight/seats/{flight_id}:
 *   get:
 *     summary: Get booked seats for flight
 *     parameters:
 *       - in: path
 *         name: flight_id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Seat'
 */
router.get('/seats/:flight_id', async (req: Request, res: Response): Promise<void> => {
  const repo = getRepository(Flight);
  try {
    const flight = await repo.findOne({
      where: { id: req.params.flight_id },
      relations: ['aircraft', 'aircraft.seats', 'aircraft.aircraft'],
    });
    if (!flight) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    const seats = flight.aircraft.seats || [];
    const first = seats.filter((s) => s.class_type === ClassType.FIRST_CLASS).map((s) => s.seat_number);
    const business = seats.filter((s) => s.class_type === ClassType.BUSINESS_CLASS).map((s) => s.seat_number);
    const economy = seats.filter((s) => s.class_type === ClassType.ECONOMY_CLASS).map((s) => s.seat_number);
    const seatsInfo = {
      first_class_seats: first,
      business_class_seats: business,
      economy_class_seats: economy,
      booked_seats: [],
    } as any;
    res.json({ flight_id: flight.id, seats_info: seatsInfo, rows: flight.aircraft.aircraft.rows });
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
