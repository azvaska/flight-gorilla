import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { config } from '../config';

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: User login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginOutput'
 *       401:
 *         description: Unauthorized
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const repo = getRepository(User);
  const { email, password } = req.body as { email: string; password: string };
  const user: any = await repo.findOne({ where: { email } });
  if (!user || user.password !== password) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const token = jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: '15m' });
  const type = user.roles?.[0]?.name;
  res.json({ access_token: token, user: { id: user.id, active: user.active, type } });
});

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh token
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginOutput'
 */
router.post('/refresh', (req: Request, res: Response): void => {
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 */
router.post('/logout', (_req: Request, res: Response): void => {
  res.json({ message: 'Successfully logged out' });
});

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserOutput'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginOutput'
 *       400:
 *         description: Bad Request
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const repo = getRepository(User);
  const roleRepo = getRepository(Role);
  try {
    const user = repo.create(req.body as Partial<User>);
    const role = await roleRepo.findOne({ where: { name: 'user' } });
    if (role) {
      user.roles = [role];
    }
    await repo.save(user);
    const token = jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: '15m' });
    res.status(200).json({ access_token: token, user: { id: user.id, active: user.active, type: user.roles?.[0]?.name } });
    return;
  } catch (e) {
    res.status(400).json({ error: 'User already exists' });
    return;
  }
});

/**
 * @openapi
 * /auth/register_airline:
 *   post:
 *     summary: Register airline
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 */
router.post('/register_airline', (_req: Request, res: Response): void => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
