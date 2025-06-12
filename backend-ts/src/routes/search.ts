import { Router, Request, Response } from 'express';
import { getRepository, SelectQueryBuilder } from 'typeorm';
import { Flight } from '../models/Flight';
import { Airport } from '../models/Airport';
import { ClassType } from '../models/Common';

const router = Router();

function parseDate(value: string, flexible = false): Date | null {
  const parts = value.split('-').map((p) => parseInt(p, 10));
  if (flexible) {
    if (parts.length !== 2) return null;
    const [month, year] = parts;
    return new Date(year, month - 1, 1);
  }
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  return new Date(year, month - 1, day);
}

async function getAirports(id: number, type: string): Promise<Airport[]> {
  const repo = getRepository(Airport);
  if (type === 'airport') {
    return repo.find({ where: { id } });
  }
  return repo.find({ where: { city_id: id } });
}

function buildFlightResult(flight: Flight) {
  const seats = flight.aircraft.seats || [];
  return {
    id: flight.id,
    flight_number: flight.route.flight_number,
    airline_name: flight.route.airline.name,
    airline_id: flight.route.airline.id,
    departure_airport: flight.route.departure_airport.iata_code,
    arrival_airport: flight.route.arrival_airport.iata_code,
    departure_time: flight.departure_time,
    arrival_time: flight.arrival_time,
    duration_minutes: Math.floor((flight.arrival_time.getTime() - flight.departure_time.getTime()) / 60000),
    price_economy: flight.price_economy_class,
    price_business: flight.price_business_class,
    price_first: flight.price_first_class,
    available_economy_seats: seats.filter((s) => s.class_type === ClassType.ECONOMY_CLASS).length,
    available_business_seats: seats.filter((s) => s.class_type === ClassType.BUSINESS_CLASS).length,
    available_first_seats: seats.filter((s) => s.class_type === ClassType.FIRST_CLASS).length,
    aircraft_name: flight.aircraft.aircraft.name,
    gate: flight.gate,
    terminal: flight.terminal,
  };
}

function applyFilters(
  qb: SelectQueryBuilder<Flight>,
  args: any
): SelectQueryBuilder<Flight> {
  if (args.airline_id) {
    qb = qb.andWhere('route.airline_id = :airlineId', {
      airlineId: args.airline_id,
    });
  }
  if (args.price_max) {
    qb = qb.andWhere('flight.price_economy_class <= :priceMax', {
      priceMax: parseFloat(args.price_max as string),
    });
  }
  return qb;
}

async function queryFlightsFromAirport(
  airportId: number,
  minDeparture: Date,
  dateMax: Date,
  args: any
): Promise<Flight[]> {
  let qb = getRepository(Flight)
    .createQueryBuilder('flight')
    .leftJoinAndSelect('flight.route', 'route')
    .leftJoinAndSelect('route.departure_airport', 'dep')
    .leftJoinAndSelect('route.arrival_airport', 'arr')
    .leftJoinAndSelect('route.airline', 'airline')
    .leftJoinAndSelect('flight.aircraft', 'acinst')
    .leftJoinAndSelect('acinst.aircraft', 'ac')
    .leftJoinAndSelect('acinst.seats', 'seat')
    .where('route.departure_airport_id = :depId', { depId: airportId })
    .andWhere('flight.departure_time >= :minDep AND flight.departure_time < :maxDep', {
      minDep: minDeparture,
      maxDep: dateMax,
    })
    .andWhere('flight.fully_booked = false');

  qb = applyFilters(qb, args);
  return qb.getMany();
}

async function formatJourney(
  path: Flight[],
  originId: number,
  destinationId: number
): Promise<any | null> {
  if (!path.length) return null;
  const first = path[0];
  const last = path[path.length - 1];
  const airportRepo = getRepository(Airport);
  const origin = await airportRepo.findOne({ where: { id: originId } });
  const destination = await airportRepo.findOne({ where: { id: destinationId } });
  if (!origin || !destination) return null;

  const totalDuration = Math.floor(
    (last.arrival_time.getTime() - first.departure_time.getTime()) / 60000
  );
  const priceEco = path.reduce((s, f) => s + f.price_economy_class, 0);
  const priceBus = path.reduce((s, f) => s + f.price_business_class, 0);
  const priceFirst = path.reduce((s, f) => s + f.price_first_class, 0);

  const segments = path.map((f) => buildFlightResult(f));
  const layovers: { airport: string; duration_minutes: number }[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    const next = path[i + 1];
    const airport = current.route.arrival_airport;
    const minutes = Math.floor(
      (next.departure_time.getTime() - current.arrival_time.getTime()) / 60000
    );
    layovers.push({ airport: airport.iata_code!, duration_minutes: minutes });
  }

  return {
    departure_airport: origin.iata_code,
    arrival_airport: destination.iata_code,
    duration_minutes: totalDuration,
    price_economy: Number(priceEco.toFixed(2)),
    price_business: Number(priceBus.toFixed(2)),
    price_first: Number(priceFirst.toFixed(2)),
    is_direct: path.length === 1,
    stops: path.length - 1,
    segments,
    layovers,
  };
}

interface FrontierState {
  airportId: number;
  arrivalTime: Date;
  path: Flight[];
}

async function raptorSearch(
  originId: number,
  destinationId: number,
  departureDate: Date,
  maxTransfers: number,
  minTransferMinutes: number,
  args: any
): Promise<Record<number, any[]>> {
  const startOfDay = new Date(departureDate);
  startOfDay.setHours(0, 0, 0, 0);
  const dateMax = new Date(startOfDay);
  dateMax.setDate(dateMax.getDate() + 1);

  const allByTransfers: Record<number, any[]> = {};
  for (let i = 0; i <= maxTransfers; i++) allByTransfers[i] = [];

  const processedPaths = new Set<string>();
  const processedFrontiers = new Set<string>();

  let frontier: FrontierState[] = [
    { airportId: originId, arrivalTime: startOfDay, path: [] },
  ];

  for (let k = 0; k <= maxTransfers; k++) {
    const nextFrontier: FrontierState[] = [];
    for (const state of frontier) {
      let minDep = state.arrivalTime;
      if (state.path.length) {
        minDep = new Date(minDep.getTime() + minTransferMinutes * 60000);
      }
      const flights = await queryFlightsFromAirport(
        state.airportId,
        minDep,
        dateMax,
        args
      );
      for (const flight of flights) {
        const dest = flight.route.arrival_airport_id;
        const newPath = [...state.path, flight];
        if (dest === destinationId && newPath.length - 1 === k) {
          const key = newPath.map((f) => f.id).join(',');
          if (!processedPaths.has(key)) {
            processedPaths.add(key);
            const result = await formatJourney(newPath, originId, destinationId);
            if (result) allByTransfers[k].push(result);
          }
        }
        if (k < maxTransfers) {
          const pathKey = newPath.map((f) => f.id).join(',') + '|' + dest;
          if (!processedFrontiers.has(pathKey)) {
            processedFrontiers.add(pathKey);
            nextFrontier.push({
              airportId: dest,
              arrivalTime: flight.arrival_time,
              path: newPath,
            });
          }
        }
      }
    }
    frontier = nextFrontier;
  }

  return allByTransfers;
}

async function generateJourney(
  dep: Airport,
  arr: Airport,
  date: Date,
  maxTransfers: number,
  args: any
): Promise<any[]> {
  const res = await raptorSearch(dep.id, arr.id, date, maxTransfers, 120, args);
  const journeys: any[] = [];
  Object.keys(res).forEach((k) => {
    journeys.push(...res[Number(k)]);
  });
  return journeys;
}

function calculateMonthDates(base: Date): Date[] {
  const dates: Date[] = [];
  const days = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  for (let i = 1; i <= days; i++) {
    dates.push(new Date(base.getFullYear(), base.getMonth(), i));
  }
  return dates;
}

function filterJourneys(journeys: any[], args: any) {
  return journeys.filter((j) => {
    if (args.departure_time_min) {
      const [h, m] = (args.departure_time_min as string).split(':').map(Number);
      const min = h * 60 + m;
      const jt = new Date(j.segments[0].departure_time);
      const jm = jt.getHours() * 60 + jt.getMinutes();
      if (jm < min) return false;
    }
    if (args.departure_time_max) {
      const [h, m] = (args.departure_time_max as string).split(':').map(Number);
      const max = h * 60 + m;
      const jt = new Date(j.segments[0].departure_time);
      const jm = jt.getHours() * 60 + jt.getMinutes();
      if (jm > max) return false;
    }
    if (args.price_max && j.price_economy > parseFloat(args.price_max as string)) {
      return false;
    }
    return true;
  });
}

function sortJourneys(journeys: any[], args: any) {
  if (args.order_by === 'price') {
    journeys.sort((a, b) => (a.price_economy - b.price_economy) * (args.order_by_desc === 'true' ? -1 : 1));
  } else if (args.order_by === 'duration') {
    journeys.sort((a, b) => (a.duration_minutes - b.duration_minutes) * (args.order_by_desc === 'true' ? -1 : 1));
  } else if (args.order_by === 'stops') {
    journeys.sort((a, b) => (a.stops - b.stops) * (args.order_by_desc === 'true' ? -1 : 1));
  }
  return journeys;
}

async function searchFlightsForAirports(depId: number, arrId: number, date: Date, args: any) {
  const repo = getRepository(Flight);
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  let qb = repo
    .createQueryBuilder('flight')
    .leftJoinAndSelect('flight.route', 'route')
    .leftJoinAndSelect('route.departure_airport', 'dep')
    .leftJoinAndSelect('route.arrival_airport', 'arr')
    .leftJoinAndSelect('route.airline', 'airline')
    .leftJoinAndSelect('flight.aircraft', 'acinst')
    .leftJoinAndSelect('acinst.aircraft', 'ac')
    .leftJoinAndSelect('acinst.seats', 'seat')
    .where('route.departure_airport_id = :dep', { dep: depId })
    .andWhere('route.arrival_airport_id = :arr', { arr: arrId })
    .andWhere('flight.departure_time >= :start AND flight.departure_time < :end', { start, end })
    .andWhere('flight.fully_booked = false');

  if (args.airline_id) {
    qb = qb.andWhere('route.airline_id = :aid', { aid: args.airline_id });
  }
  if (args.price_max) {
    qb = qb.andWhere('flight.price_economy_class <= :pm', { pm: parseFloat(args.price_max as string) });
  }
  if (args.departure_time_min) {
    const [h, m] = (args.departure_time_min as string).split(':').map(Number);
    const minT = new Date(start);
    minT.setHours(h, m, 0, 0);
    qb = qb.andWhere('flight.departure_time >= :minT', { minT });
  }
  if (args.departure_time_max) {
    const [h, m] = (args.departure_time_max as string).split(':').map(Number);
    const maxT = new Date(start);
    maxT.setHours(h, m, 0, 0);
    qb = qb.andWhere('flight.departure_time <= :maxT', { maxT });
  }
  const flights = await qb.getMany();
  return flights.map(buildFlightResult);
}

/**
 * @openapi
 * /search/flights:
 *   get:
 *     summary: Search flights
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 journeys:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FlightSearchResult'
 *                 total_pages:
 *                   type: integer
 */
router.get('/flights', async (req: Request, res: Response): Promise<void> => {
  try {
    const args = req.query as any;
    const dateStr = args.departure_date as string;
    const date = dateStr ? parseDate(dateStr) : null;
    if (!date) {
      res.status(400).json({ error: 'Invalid departure date format. Use DD-MM-YYYY' });
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      res.status(400).json({ error: 'Departure date cannot be in the past' });
      return;
    }

    const depId = parseInt(args.departure_id as string, 10);
    const arrId = parseInt(args.arrival_id as string, 10);
    const departureAirports = await getAirports(depId, args.departure_type as string);
    const arrivalAirports = await getAirports(arrId, args.arrival_type as string);
    if (!departureAirports.length || !arrivalAirports.length) {
      res.status(400).json({ error: 'No valid departure or arrival airports found' });
      return;
    }

    const maxTransfers = args.max_transfers
      ? parseInt(args.max_transfers as string, 10)
      : 3;
    let journeys: any[] = [];
    for (const dep of departureAirports) {
      for (const arr of arrivalAirports) {
        const j = await generateJourney(dep, arr, date, maxTransfers, args);
        journeys.push(...j);
      }
    }
    journeys = sortJourneys(filterJourneys(journeys, args), args);
    const limit = args.limit ? parseInt(args.limit as string, 10) : 10;
    const page = args.page_number ? parseInt(args.page_number as string, 10) : 0;
    const totalPages = Math.ceil(journeys.length / limit);
    if (page) {
      const start = (page - 1) * limit;
      journeys = journeys.slice(start, start + limit);
    } else {
      journeys = journeys.slice(0, limit);
    }

    res.json({ journeys, total_pages: totalPages });
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @openapi
 * /search/flexible-dates:
 *   get:
 *     summary: Search flights flexible dates
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FlightSearchResult'
 */
router.get('/flexible-dates', async (req: Request, res: Response): Promise<void> => {
  try {
    const args = req.query as any;
    const dateStr = args.departure_date as string;
    const base = dateStr ? parseDate(dateStr, true) : null;
    if (!base) {
      res.status(400).json({ error: 'Invalid departure date format. Use MM-YYYY' });
      return;
    }

    const depId = parseInt(args.departure_id as string, 10);
    const arrId = parseInt(args.arrival_id as string, 10);
    const departureAirports = await getAirports(depId, args.departure_type as string);
    const arrivalAirports = await getAirports(arrId, args.arrival_type as string);
    if (!departureAirports.length || !arrivalAirports.length) {
      res.status(400).json({ error: 'No valid departure or arrival airports found' });
      return;
    }

    const maxTransfers = args.max_transfers
      ? parseInt(args.max_transfers as string, 10)
      : 3;
    const result: (number | null)[] = [];
    let dates = calculateMonthDates(base);
    const today = new Date();
    if (base.getMonth() === today.getMonth() && base.getFullYear() === today.getFullYear()) {
      dates = dates.slice(today.getDate());
      result.push(...Array(today.getDate()).fill(null));
    }
    for (const current of dates) {
      let dayJourneys: any[] = [];
      for (const dep of departureAirports) {
        for (const arr of arrivalAirports) {
          const j = await generateJourney(dep, arr, current, maxTransfers, args);
          dayJourneys.push(...j);
        }
      }
      dayJourneys = sortJourneys(filterJourneys(dayJourneys, args), args);
      result.push(dayJourneys.length ? dayJourneys[0].price_economy : null);
    }

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
