import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { City, Nation } from '../models/Location';
import { Airport } from '../models/Airport';

const router = Router();

/**
 * @openapi
 * /location/all:
 *   get:
 *     summary: List locations
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cities:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/City'
 *                 nations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Nation'
 */
router.get('/all', async (req: Request, res: Response): Promise<void> => {
  const cityRepo = getRepository(City);
  const airportRepo = getRepository(Airport);
  const nationRepo = getRepository(Nation);
  try {
    const name = req.query.name as string | undefined;
    const includeNations = req.query.include_nations === 'true';

    const queries: { id: number | string; name: string; type: string }[] = [];

    const cityQuery = cityRepo.createQueryBuilder('city');
    if (name) cityQuery.where('LOWER(city.name) LIKE LOWER(:name)', { name: `%${name}%` });
    const cities = await cityQuery.getMany();
    queries.push(...cities.map((c) => ({ id: c.id, name: c.name, type: 'city' })));

    const airportQuery = airportRepo.createQueryBuilder('airport');
    if (name) {
      airportQuery.where('LOWER(airport.name) LIKE LOWER(:name) OR LOWER(airport.iata_code) LIKE LOWER(:name)', { name: `%${name}%` });
    }
    const airports = await airportQuery.getMany();
    queries.push(...airports.map((a) => ({ id: a.id, name: `${a.name} (${a.iata_code})`, type: 'airport' })));

    if (includeNations) {
      const nationQuery = nationRepo.createQueryBuilder('nation');
      if (name) nationQuery.where('LOWER(nation.name) LIKE LOWER(:name)', { name: `%${name}%` });
      const nations = await nationQuery.getMany();
      queries.push(...nations.map((n) => ({ id: n.id, name: n.name, type: 'nation' })));
    }

    res.json(queries);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * @openapi
 * /location/city:
 *   get:
 *     summary: List cities
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/City'
 */
router.get('/city', async (req: Request, res: Response): Promise<void> => {
  const repo = getRepository(City);
  try {
    const { name, include_nation, nation_id } = req.query;
    let query = repo.createQueryBuilder('city');

    if (include_nation === 'true') {
      query = query.leftJoinAndSelect('city.nation', 'nation');
    }
    if (name) {
      query.andWhere('LOWER(city.name) LIKE LOWER(:name)', { name: `%${name}%` });
    }
    if (nation_id) {
      query.andWhere('city.nation_id = :nid', { nid: nation_id });
    }
    const cities = await query.orderBy('city.name').getMany();
    res.json(cities);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * @openapi
 * /location/city/{city_id}:
 *   get:
 *     summary: Get city
 *     parameters:
 *       - in: path
 *         name: city_id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/City'
 */
router.get('/city/:city_id', async (req: Request, res: Response): Promise<void> => {
  const repo = getRepository(City);
  try {
    const city = await repo.findOne({
      where: { id: parseInt(req.params.city_id, 10) },
      relations: ['nation'],
    });
    if (!city) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(city);
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @openapi
 * /location/nations:
 *   get:
 *     summary: List nations
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Nation'
 */
router.get('/nations', async (req: Request, res: Response): Promise<void> => {
  const repo = getRepository(Nation);
  try {
    const { name, code, alpha2 } = req.query;
    const query = repo.createQueryBuilder('nation');
    if (name) query.where('LOWER(nation.name) LIKE LOWER(:name)', { name: `%${name}%` });
    if (code) query.andWhere('LOWER(nation.code) LIKE LOWER(:code)', { code: `%${code}%` });
    if (alpha2) query.andWhere('LOWER(nation.alpha2) = LOWER(:alpha2)', { alpha2 });
    const nations = await query.orderBy('nation.name').getMany();
    res.json(nations);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * @openapi
 * /location/nation/{nation_id}:
 *   get:
 *     summary: Get nation
 *     parameters:
 *       - in: path
 *         name: nation_id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Nation'
 */
router.get('/nation/:nation_id', async (req: Request, res: Response): Promise<void> => {
  const repo = getRepository(Nation);
  try {
    const nation = await repo.findOne({ where: { id: parseInt(req.params.nation_id, 10) } });
    if (!nation) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(nation);
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
