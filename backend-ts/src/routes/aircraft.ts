import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Aircraft } from '../models/Aircraft';

const router = Router();

/**
 * @openapi
 * /aircraft/:
 *   get:
 *     summary: List all aircraft
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Aircraft'
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const repo = getRepository(Aircraft);
  try {
    const query = repo.createQueryBuilder('aircraft');
    if (req.query.name) {
      query.where('LOWER(aircraft.name) LIKE LOWER(:name)', {
        name: `%${req.query.name}%`,
      });
    }
    const aircrafts = await query.getMany();
    res.json(aircrafts);
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @openapi
 * /aircraft/{aircraft_id}:
 *   get:
 *     summary: Get aircraft by id
 *     parameters:
 *       - in: path
 *         name: aircraft_id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Aircraft'
 */
router.get('/:aircraft_id', async (req: Request, res: Response): Promise<void> => {
  const repo = getRepository(Aircraft);
  try {
    const aircraft = await repo.findOne({
      where: { id: parseInt(req.params.aircraft_id, 10) },
    });
    if (!aircraft) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(aircraft);
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
