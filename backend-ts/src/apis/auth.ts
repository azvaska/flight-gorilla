import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { 
  LoginInputSchema,
  LoginOutputSchema,
  RegisterInputSchema,
  AirlineRegisterInputSchema,
  AirlineRegisterOutputSchema,
  LogoutResponseSchema,
  type LoginInput,
  type RegisterInput,
  type AirlineRegisterInput
} from '../schemas/auth';
import { registry } from '../config/openapi';
import { ErrorResponseSchema, ValidationErrorResponseSchema } from '../config/openapi';
import { validateBody } from '../utils/validation';
import { hashPassword, verifyPassword, generateSecurePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, setRefreshTokenCookie, clearRefreshTokenCookie } from '../utils/jwt';
import { authenticateToken, authenticateRefreshToken, requireRoles } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const prisma = new PrismaClient();
export const authRouter = Router();


const generateTokenResponse = async (user: any) => {
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Get user type from roles
  const userType = user.roles_users[0].role.name

  return {
    accessToken,
    refreshToken,
    userData: {
      id: user.id,
      active: user.active,
      type: userType
    }
  };
};


registry.registerPath({
  method: 'post',
  path: '/auth/login',
  description: 'User login',
  summary: 'Authenticate user and return JWT token',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginInputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: LoginOutputSchema,
        },
      },
    },
    401: {
      description: 'Invalid credentials',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'User not active',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
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
  path: '/auth/register',
  description: 'User registration',
  summary: 'Register a new user',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: RegisterInputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Registration successful',
      content: {
        'application/json': {
          schema: LoginOutputSchema,
        },
      },
    },
    400: {
      description: 'Validation error or user already exists',
      content: {
        'application/json': {
          schema: ValidationErrorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
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
  path: '/auth/refresh',
  description: 'Refresh access token',
  summary: 'Get new access token using refresh token',
  tags: ['Authentication'],
  responses: {
    200: {
      description: 'Token refreshed successfully',
      content: {
        'application/json': {
          schema: LoginOutputSchema,
        },
      },
    },
    401: {
      description: 'Invalid refresh token',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'User not active',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'User not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
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
  path: '/auth/logout',
  description: 'User logout',
  summary: 'Logout and clear refresh token',
  tags: ['Authentication'],
  responses: {
    200: {
      description: 'Logout successful',
      content: {
        'application/json': {
          schema: LogoutResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/register_airline',
  description: 'Airline registration (Admin only)',
  summary: 'Register a new airline',
  tags: ['Authentication'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: AirlineRegisterInputSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Airline registered successfully',
      content: {
        'application/json': {
          schema: AirlineRegisterOutputSchema,
        },
      },
    },
    400: {
      description: 'Validation error or airline already exists',
      content: {
        'application/json': {
          schema: ValidationErrorResponseSchema,
        },
      },
    },
    401: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Admin role required',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});


authRouter.post('/login', validateBody(LoginInputSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as LoginInput;

    // Find user with roles
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles_users: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check if user is active (unless they're an airline user)
    if (!user.active && !user.airline_id) {
      res.status(403).json({ error: 'User is not active' });
      return;
    }

    // Generate tokens and response
    const { accessToken, refreshToken, userData } = await generateTokenResponse(user);

    // Set refresh token cookie
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      access_token: accessToken,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
});

authRouter.post('/register', validateBody(RegisterInputSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userData = req.body as RegisterInput;

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Generate unique identifier
    const fsUniquifier = crypto.randomBytes(32).toString('hex');

    // Create user with transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          id: uuidv4(),
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          surname: userData.surname,
          address: userData.address,
          zip: userData.zip,
          nation_id: userData.nation_id,
          active: true,
          fs_uniquifier: fsUniquifier,
        }
      });

      // Get or create user role
      let userRole = await tx.role.findUnique({
        where: { name: 'user' }
      });

      if (!userRole) {
        userRole = await tx.role.create({
          data: {
            name: 'user',
            description: 'Regular user role'
          }
        });
      }

      // Assign role to user
      await tx.roles_users.create({
        data: {
          user_id: newUser.id,
          role_id: userRole.id
        }
      });

      // Return user with roles
      return tx.user.findUnique({
        where: { id: newUser.id },
        include: {
          roles_users: {
            include: {
              role: true
            }
          }
        }
      });
    });

    if (!user) {
      throw new Error('Failed to create user');
    }

    // Generate tokens and response
    const { accessToken, refreshToken, userData: responseData } = await generateTokenResponse(user);

    // Set refresh token cookie
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      access_token: accessToken,
      user: responseData
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.code === 'P2002') { // Prisma unique constraint violation
      res.status(400).json({ error: 'User already exists' });
      return;
    }
    
    next(error);
  }
});

authRouter.post('/refresh', authenticateRefreshToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Get user with roles from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        roles_users: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!user.active && !user.airline_id) {
      res.status(403).json({ error: 'User is not active' });
      return;
    }

    // Generate new tokens
    const { accessToken, refreshToken, userData } = await generateTokenResponse(user);

    // Set new refresh token cookie
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      access_token: accessToken,
      user: userData
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    next(error);
  }
});

authRouter.post('/logout', (req: Request, res: Response): void => {
  clearRefreshTokenCookie(res);
  res.json({ message: 'Successfully logged out' });
});

authRouter.post('/register_airline', 
  authenticateToken, 
  requireRoles(['admin']), 
  validateBody(AirlineRegisterInputSchema), 
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, name, surname, airline_name } = req.body as AirlineRegisterInput;

      // Generate temporary password
      const tempPassword = generateSecurePassword();
      const hashedPassword = await hashPassword(tempPassword);

      // Generate unique identifier
      const fsUniquifier = crypto.randomBytes(32).toString('hex');

      // Create airline and user with transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create airline
        const airline = await tx.airline.create({
          data: {
            id: uuidv4(),
            name: airline_name,
          }
        });

        // Get or create airline-admin role
        let airlineRole = await tx.role.findUnique({
          where: { name: 'airline-admin' }
        });

        if (!airlineRole) {
          airlineRole = await tx.role.create({
            data: {
              name: 'airline-admin',
              description: 'Airline administrator role'
            }
          });
        }

        // Create user
        const user = await tx.user.create({
          data: {
            id: uuidv4(),
            email,
            password: hashedPassword,
            name,
            surname,
            airline_id: airline.id,
            active: false, // Airline users start inactive
            fs_uniquifier: fsUniquifier,
          }
        });

        // Assign role to user
        await tx.roles_users.create({
          data: {
            user_id: user.id,
            role_id: airlineRole.id
          }
        });

        return { user, airline, tempPassword };
      });

      res.status(201).json({
        message: 'Airline registered successfully',
        credentials: {
          email: result.user.email,
          password: result.tempPassword
        }
      });
    } catch (error: any) {
      console.error('Airline registration error:', error);
      
      if (error.code === 'P2002') { // Prisma unique constraint violation
        res.status(400).json({ error: 'User or Airline already exists' });
        return;
      }
      
      next(error);
    }
  }
);


process.on('beforeExit', async () => {
  await prisma.$disconnect();
}); 
