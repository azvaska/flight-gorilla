import { Router, Request, Response } from 'express';

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
router.get('/', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
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
router.get('/:airport_id', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
