import { Router, Request, Response } from 'express';

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
router.get('/', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
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
router.get('/:aircraft_id', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
