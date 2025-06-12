import { Router, Request, Response } from 'express';

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
router.get('/:flight_id', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
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
router.get('/extra/:flight_id', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
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
router.get('/seats/:flight_id', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
