import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @openapi
 * /seat_session/:
 *   get:
 *     summary: Get active seat session
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SeatSession'
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * @openapi
 * /seat_session/:
 *   post:
 *     summary: Create seat session
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SeatSession'
 */
router.post('/', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * @openapi
 * /seat_session/{session_id}:
 *   get:
 *     summary: Get seat session by id
 *     parameters:
 *       - in: path
 *         name: session_id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SeatSession'
 */
router.get('/:session_id', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * @openapi
 * /seat_session/{session_id}:
 *   post:
 *     summary: Update seat session
 *     parameters:
 *       - in: path
 *         name: session_id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SeatSession'
 */
router.post('/:session_id', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * @openapi
 * /seat_session/{session_id}:
 *   delete:
 *     summary: Delete seat session
 *     parameters:
 *       - in: path
 *         name: session_id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 */
router.delete('/:session_id', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
