import { Router, Request, Response } from 'express';

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
router.get('/all', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
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
router.get('/city', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
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
router.get('/city/:city_id', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
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
router.get('/nations', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
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
router.get('/nation/:nation_id', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
