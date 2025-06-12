import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @openapi
 * /booking/:
 *   get:
 *     summary: List bookings
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingOutput'
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * @openapi
 * /booking/:
 *   post:
 *     summary: Create booking
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingCreation'
 */
router.post('/', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * @openapi
 * /booking/{booking_id}:
 *   get:
 *     summary: Get booking by id
 *     parameters:
 *       - in: path
 *         name: booking_id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingOutput'
 */
router.get('/:booking_id', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * @openapi
 * /booking/{booking_id}:
 *   delete:
 *     summary: Delete booking
 *     parameters:
 *       - in: path
 *         name: booking_id
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
router.delete('/:booking_id', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
