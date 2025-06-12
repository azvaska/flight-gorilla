import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { Airline } from '../models/Airline';
import { config } from '../config';

const router = Router();

function generateToken(user: User, res: Response) {
  const access = jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: '15m' });
  const refresh = jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: '7d' });
  res.cookie('refresh_token', refresh, { httpOnly: true });
  return { access_token: access, user: { id: user.id, active: user.active, type: user.type } };
}

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
 *       403:
 *         description: Forbidden
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };
  const repo = getRepository(User);
  try {
    const user = await repo.findOne({ where: { email }, relations: ['roles'] });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    if (!user.active && !user.airline_id) {
      res.status(403).json({ error: 'User is not active' });
      return;
    }
    res.json(generateToken(user, res));
  } catch {
    res.status(500).json({ error: 'Login Error' });
  }
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 *       403:
 *         description: Forbidden
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refresh_token;
  if (!token) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    const repo = getRepository(User);
    const user = await repo.findOne({ where: { id: decoded.sub }, relations: ['roles'] });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (!user.active && !user.airline_id) {
      res.status(403).json({ error: 'User is not active' });
      return;
    }
    res.json(generateToken(user, res));
  } catch {
    res.status(500).json({ error: 'Token refresh failed' });
  }
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
  res.clearCookie('refresh_token');
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
    const { password, ...data } = req.body as any;
    const hashed = await bcrypt.hash(password, 12);
    const user = repo.create({ ...data, password: hashed, active: true }) as unknown as User;
    const role = await roleRepo.findOne({ where: { name: 'user' } });
    if (role) user.roles = [role];
    await repo.save(user);
    res.json(generateToken(user, res));
  } catch {
    res.status(400).json({ error: 'User already exists' });
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
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 credentials:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     password:
 *                       type: string
 *       400:
 *         description: Bad Request
 *       403:
 *         description: Forbidden
 */
router.post('/register_airline', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    const userRepo = getRepository(User);
    const roleRepo = getRepository(Role);
    const airlineRepo = getRepository(Airline);
    const admin = await userRepo.findOne({ where: { id: decoded.sub }, relations: ['roles'] });
    if (!admin || !admin.roles.some((r) => r.name === 'admin')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const data = req.body as { email: string; name: string; surname: string; airline_name: string };
    const airline = airlineRepo.create({ name: data.airline_name });
    await airlineRepo.save(airline);
    const tmpPass = crypto.randomBytes(8).toString('hex');
    const hashed = await bcrypt.hash(tmpPass, 12);
    const role = await roleRepo.findOne({ where: { name: 'airline-admin' } });
    const user = userRepo.create({
      email: data.email,
      password: hashed,
      name: data.name,
      surname: data.surname,
      airline_id: airline.id,
      active: false,
      roles: role ? [role] : [],
    });
    await userRepo.save(user);
    res.status(201).json({
      message: 'Airline registered successfully',
      credentials: { email: user.email, password: tmpPass },
    });
  } catch {
    res.status(500).json({ error: 'Error during airline registration' });
  }
});

export default router;
