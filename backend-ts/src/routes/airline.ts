import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @openapi
 * /airline/all:
 *   get:
 *     summary: List airlines
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Airline'
 */
router.get('/all', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * @openapi
 * /airline/:
 *   get:
 *     summary: Get my airline
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Airline'
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * @openapi
 * /airline/{airline_id}:
 *   get:
 *     summary: Get airline by id
 *     parameters:
 *       - in: path
 *         name: airline_id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Airline'
 */
router.get('/:airline_id', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
