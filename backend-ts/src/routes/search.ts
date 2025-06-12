import { Router, Request, Response } from 'express';

const router = Router();

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
router.get('/flights', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
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
router.get('/flexible-dates', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
