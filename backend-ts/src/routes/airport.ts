import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Airport } from '../models/Airport';
import { City, Nation } from '../models/Location';

const router = Router();

/**
 * @openapi
 * /airports/:
 *   get:
 *     summary: List airports
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Airport'
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const repo = getRepository(Airport);
  try {
    const query = repo
      .createQueryBuilder('airport')
      .leftJoinAndSelect('airport.city', 'city')
      .leftJoinAndSelect('city.nation', 'nation');

    const { name, city_name, nation_name, iata_code, icao_code } = req.query;

    if (name) {
      query.andWhere('LOWER(airport.name) LIKE LOWER(:name)', { name: `%${name}%` });
    }
    if (iata_code) {
      query.andWhere('UPPER(airport.iata_code) = UPPER(:iata)', { iata: iata_code });
    }
    if (icao_code) {
      query.andWhere('UPPER(airport.icao_code) = UPPER(:icao)', { icao: icao_code });
    }
    if (city_name) {
      query.andWhere('LOWER(city.name) LIKE LOWER(:city)', { city: `%${city_name}%` });
    }
    if (nation_name) {
      query.andWhere('LOWER(nation.name) LIKE LOWER(:nation)', { nation: `%${nation_name}%` });
    }

    const airports = await query.getMany();
    res.json(airports);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * @openapi
 * /airports/{airport_id}:
 *   get:
 *     summary: Get airport by id
 *     parameters:
 *       - in: path
 *         name: airport_id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Airport'
 */
router.get('/:airport_id', async (req: Request, res: Response): Promise<void> => {
  const repo = getRepository(Airport);
  try {
    const airport = await repo.findOne({
      where: { id: parseInt(req.params.airport_id, 10) },
      relations: ['city', 'city.nation'],
    });
    if (!airport) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(airport);
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
