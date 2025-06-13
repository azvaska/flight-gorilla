import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { v4 as uuidv4 } from 'uuid';
import { 
  SeatSessionResponseSchema,
  AddSeatRequestSchema,
  SeatSessionParamsSchema,
  MessageResponseSchema,
  type AddSeatRequest,
  type SeatSessionParams
} from '../schemas/seat_session';
import { registry } from '../config/openapi';
import { ErrorResponseSchema } from '../config/openapi';
import { validateBody, validateParams } from '../utils/validation';
import { authenticateToken, requireRoles } from '../middleware/auth';

const prisma = new PrismaClient();
export const seatSessionRouter = Router();


const SESSION_GRAY_TIME = 2 * 60 * 1000; // 2 minutes in milliseconds
const SESSION_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds


registry.registerPath({
  method: 'get',
  path: '/seat_session',
  description: 'Get current seat session',
  summary: 'Get the current active seat reservation session for the user',
  tags: ['Seat Session'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Current seat session',
      content: {
        'application/json': {
          schema: SeatSessionResponseSchema,
        },
      },
    },
    404: {
      description: 'No active session found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/seat_session',
  description: 'Create seat session',
  summary: 'Create a new seat reservation session',
  tags: ['Seat Session'],
  security: [{ bearerAuth: [] }],
  responses: {
    201: {
      description: 'New seat session created',
      content: {
        'application/json': {
          schema: SeatSessionResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/seat_session/{session_id}',
  description: 'Get seat session by ID',
  summary: 'Fetch a specific seat session',
  tags: ['Seat Session'],
  security: [{ bearerAuth: [] }],
  request: {
    params: SeatSessionParamsSchema,
  },
  responses: {
    200: {
      description: 'Seat session found',
      content: {
        'application/json': {
          schema: SeatSessionResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Session not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/seat_session/{session_id}',
  description: 'Add seat to session',
  summary: 'Add a seat to an existing seat session',
  tags: ['Seat Session'],
  security: [{ bearerAuth: [] }],
  request: {
    params: SeatSessionParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: AddSeatRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Seat added successfully',
      content: {
        'application/json': {
          schema: MessageResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad request or session expired',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Session, flight, or seat not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    409: {
      description: 'Seat already booked or in use',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/seat_session/{session_id}',
  description: 'Delete seat session',
  summary: 'Delete (release) a seat session',
  tags: ['Seat Session'],
  security: [{ bearerAuth: [] }],
  request: {
    params: SeatSessionParamsSchema,
  },
  responses: {
    200: {
      description: 'Session deleted successfully',
      content: {
        'application/json': {
          schema: MessageResponseSchema,
        },
      },
    },
    400: {
      description: 'Session not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});


const formatSeatSession = (session: any) => {
  return {
    id: session.id,
    seats: session.seat.map((seat: any) => ({
      seat_number: seat.seat_number,
      flight_id: seat.flight_id,
    })),
    session_start_time: session.session_start_time.toISOString(),
    session_end_time: session.session_end_time.toISOString(),
  };
};


seatSessionRouter.get('/', 
  authenticateToken,
  requireRoles(['user']),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const now = new Date();
      const grayTime = new Date(now.getTime() + SESSION_GRAY_TIME);

      const activeSession = await prisma.seat_session.findFirst({
        where: {
          user_id: userId,
          session_end_time: {
            gt: grayTime,
          },
        },
        include: {
          seat: true,
        },
      });

      if (!activeSession) {
        res.status(404).json({ error: 'You do not have a session', code: 404 });
        return;
      }

      res.json(formatSeatSession(activeSession));
    } catch (error) {
      console.error('Get seat session error:', error);
      next(error);
    }
  }
);

seatSessionRouter.post('/', 
  authenticateToken,
  requireRoles(['user']),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const now = new Date();
      const sessionEnd = new Date(now.getTime() + SESSION_DURATION);

      // Check for existing active session and delete it
      const existingSession = await prisma.seat_session.findFirst({
        where: {
          user_id: userId,
          session_end_time: {
            gt: now,
          },
        },
      });

      if (existingSession) {
        await prisma.seat_session.delete({
          where: { id: existingSession.id },
        });
      }

      // Create new seat session
      const newSession = await prisma.seat_session.create({
        data: {
          id: uuidv4(),
          user_id: userId,
          session_start_time: now,
          session_end_time: sessionEnd,
        },
        include: {
          seat: true,
        },
      });

      res.status(201).json(formatSeatSession(newSession));
    } catch (error) {
      console.error('Create seat session error:', error);
      next(error);
    }
  }
);

seatSessionRouter.get('/:session_id', 
  authenticateToken,
  requireRoles(['user']),
  validateParams(SeatSessionParamsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { session_id } = req.validatedParams as SeatSessionParams;
      const userId = req.user!.id;

      const session = await prisma.seat_session.findUnique({
        where: { id: session_id },
        include: {
          seat: true,
        },
      });

      if (!session) {
        res.status(400).json({ error: 'Seat session not found', code: 400 });
        return;
      }

      // Check if the user owns this session
      if (session.user_id !== userId) {
        res.status(403).json({ error: 'You do not have permission to view this session', code: 403 });
        return;
      }

      res.json(formatSeatSession(session));
    } catch (error) {
      console.error('Get seat session by ID error:', error);
      next(error);
    }
  }
);

seatSessionRouter.post('/:session_id', 
  authenticateToken,
  requireRoles(['user']),
  validateParams(SeatSessionParamsSchema),
  validateBody(AddSeatRequestSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { session_id } = req.validatedParams as SeatSessionParams;
      const { flight_id, seat_number } = req.validatedBody as AddSeatRequest;
      const userId = req.user!.id;

      // Use transaction for seat reservation
      const result = await prisma.$transaction(async (tx) => {
        // Get session with lock
        const session = await tx.seat_session.findUnique({
          where: { id: session_id },
        });

        if (!session) {
          throw new Error('SESSION_NOT_FOUND');
        }

        // Check if the user owns this session
        if (session.user_id !== userId) {
          throw new Error('FORBIDDEN');
        }

        // Check if session is expired (with gray time)
        const now = new Date();
        const grayTime = new Date(now.getTime() - SESSION_GRAY_TIME);
        if (session.session_end_time < grayTime) {
          throw new Error('SESSION_EXPIRED');
        }

        // Check if flight exists
        const flight = await tx.flight.findUnique({
          where: { id: flight_id },
        });

        if (!flight) {
          throw new Error('FLIGHT_NOT_FOUND');
        }

        // Check if seat is already booked
        const bookedSeats = (flight as any).booked_seats as string[] || [];
        if (bookedSeats.includes(seat_number)) {
          throw new Error('SEAT_ALREADY_BOOKED');
        }

        // Get seat class information
        const seatClass = await tx.airline_aircraft_seat.findFirst({
          where: {
            airline_aircraft_id: flight.aircraft_id,
            seat_number: seat_number,
          },
        });

        if (!seatClass) {
          throw new Error('SEAT_NOT_FOUND');
        }

        // Create new seat reservation
        await tx.seat.create({
          data: {
            session_id: session_id,
            seat_number: seat_number,
            class_type: seatClass.class_type,
            flight_id: flight_id,
          },
        });

        return { success: true };
      });

      res.status(201).json({ message: 'Ok', code: 201 });
    } catch (error: any) {
      console.error('Add seat to session error:', error);
      
      // Handle specific transaction errors
      if (error.message === 'SESSION_NOT_FOUND') {
        res.status(404).json({ error: 'Seat session not found', code: 404 });
        return;
      }
      if (error.message === 'FORBIDDEN') {
        res.status(403).json({ error: 'You do not have permission to update this session', code: 403 });
        return;
      }
      if (error.message === 'SESSION_EXPIRED') {
        res.status(400).json({ error: 'Session expired', code: 400 });
        return;
      }
      if (error.message === 'FLIGHT_NOT_FOUND') {
        res.status(404).json({ error: 'Flight not found', code: 404 });
        return;
      }
      if (error.message === 'SEAT_ALREADY_BOOKED') {
        res.status(409).json({ error: 'Seat is already in use', code: 409 });
        return;
      }
      if (error.message === 'SEAT_NOT_FOUND') {
        res.status(404).json({ error: 'Seat not found in aircraft', code: 404 });
        return;
      }
      
      // Handle Prisma unique constraint violations
      if (error.code === 'P2002') {
        res.status(409).json({ error: 'Seat is already in use or seat already selected', code: 409 });
        return;
      }
      
      next(error);
    }
  }
);

seatSessionRouter.delete('/:session_id', 
  authenticateToken,
  requireRoles(['user']),
  validateParams(SeatSessionParamsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { session_id } = req.validatedParams as SeatSessionParams;
      const userId = req.user!.id;

      const session = await prisma.seat_session.findUnique({
        where: { id: session_id },
      });

      if (!session) {
        res.status(400).json({ error: 'Seat session not found', code: 400 });
        return;
      }

      // Check if the user owns this session
      if (session.user_id !== userId) {
        res.status(403).json({ error: 'You do not have permission to delete this session' });
        return;
      }

      await prisma.seat_session.delete({
        where: { id: session_id },
      });

      res.json({ message: 'Ok', code: 200 });
    } catch (error) {
      console.error('Delete seat session error:', error);
      next(error);
    }
  }
); 
