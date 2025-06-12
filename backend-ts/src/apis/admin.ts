import { Router, Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { registry } from '../config/openapi';
import { 
  AdminUserSchema,
  AirlineWithUsersSchema,
  AdminAirlineUpdateSchema,
  AdminUserListQuerySchema,
  AdminAirlineParamsSchema,
  AdminUserParamsSchema,
  AdminAirlineListResponseSchema,
  AdminUserListResponseSchema,
  AdminMessageResponseSchema,
  AdminErrorResponseSchema,
  type AdminUserListQuery,
  type AdminAirlineUpdate,
  type AdminAirlineParams,
  type AdminUserParams
} from '../schemas/admin';
import { ErrorResponseSchema } from '../config/openapi';
import { validateBody, validateParams, validateQuery } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

// Helper function to format user data for admin response
const formatAdminUserResponse = (user: any) => {
  const userType = user.roles_users?.[0]?.role?.name || 'user';
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    surname: user.surname,
    address: user.address,
    zip: user.zip,
    nation: user.nation,
    active: user.active,
    type: userType === 'admin' ? 'user' : userType // Map admin to user for consistency
  };
};

// Helper function to format airline with user data
const formatAirlineWithUserResponse = (airline: any, user: any) => {
  return {
    id: airline.id,
    name: airline.name,
    nation: airline.nation,
    address: airline.address,
    zip: airline.zip,
    email: airline.email,
    website: airline.website,
    first_class_description: airline.first_class_description,
    business_class_description: airline.business_class_description,
    economy_class_description: airline.economy_class_description,
    user: user ? formatAdminUserResponse(user) : null
  };
};

// Register OpenAPI routes
registry.registerPath({
  method: 'get',
  path: '/admin/airlines',
  description: 'List all airlines with their associated user (admin only)',
  summary: 'Get all airlines with users',
  tags: ['Admin'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of airlines with their associated users',
      content: {
        'application/json': {
          schema: AdminAirlineListResponseSchema,
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
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'put',
  path: '/admin/airlines/{airline_id}',
  description: 'Update an airline given its identifier',
  summary: 'Update airline (admin only)',
  tags: ['Admin'],
  security: [{ bearerAuth: [] }],
  request: {
    params: AdminAirlineParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: AdminAirlineUpdateSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated airline',
      content: {
        'application/json': {
          schema: AirlineWithUsersSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: AdminErrorResponseSchema,
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
      description: 'Not Found',
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
  path: '/admin/airlines/{airline_id}',
  description: 'Delete an airline given its identifier',
  summary: 'Delete airline (admin only)',
  tags: ['Admin'],
  security: [{ bearerAuth: [] }],
  request: {
    params: AdminAirlineParamsSchema,
  },
  responses: {
    200: {
      description: 'Airline deleted successfully',
      content: {
        'application/json': {
          schema: AdminMessageResponseSchema,
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    409: {
      description: 'Conflict - Airline has dependencies',
      content: {
        'application/json': {
          schema: AdminErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/admin/users',
  description: 'List all users with optional filtering (admin only)',
  summary: 'Get all users',
  tags: ['Admin'],
  security: [{ bearerAuth: [] }],
  request: {
    query: AdminUserListQuerySchema,
  },
  responses: {
    200: {
      description: 'List of users',
      content: {
        'application/json': {
          schema: AdminUserListResponseSchema,
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
    500: {
      description: 'Internal Server Error',
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
  path: '/admin/users/{user_id}',
  description: 'Delete a user given its identifier (admin only)',
  summary: 'Delete user (admin only)',
  tags: ['Admin'],
  security: [{ bearerAuth: [] }],
  request: {
    params: AdminUserParamsSchema,
  },
  responses: {
    200: {
      description: 'User deleted successfully',
      content: {
        'application/json': {
          schema: AdminMessageResponseSchema,
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    409: {
      description: 'Conflict - Cannot delete user',
      content: {
        'application/json': {
          schema: AdminErrorResponseSchema,
        },
      },
    },
  },
});

// GET /admin/airlines - List all airlines with their associated user
router.get('/airlines', 
  authenticateToken, 
  requireRoles(['admin']), 
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Query all airlines with necessary relations
      const airlines = await prisma.airline.findMany({
        include: {
          nation: true
        }
      });

      const result = [];
      
      for (const airline of airlines) {
        // For each airline, find the first associated user
        const user = await prisma.user.findFirst({
          where: { airline_id: airline.id },
          include: {
            nation: true,
            roles_users: {
              include: {
                role: true
              }
            }
          }
        });

        // Combine the data
        const airlineWithUser = formatAirlineWithUserResponse(airline, user);
        result.push(airlineWithUser);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching airlines:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /admin/airlines/:airline_id - Update an airline
router.put('/airlines/:airline_id',
  authenticateToken,
  requireRoles(['admin']),
  validateParams(AdminAirlineParamsSchema),
  validateBody(AdminAirlineUpdateSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { airline_id } = req.params as AdminAirlineParams;
      const updateData = req.body as AdminAirlineUpdate;

      // Check if airline exists
      const existingAirline = await prisma.airline.findUnique({
        where: { id: airline_id },
        include: { nation: true }
      });

      if (!existingAirline) {
        res.status(404).json({ error: 'Airline not found' });
        return;
      }

      // Update the airline
      const updatedAirline = await prisma.airline.update({
        where: { id: airline_id },
        data: updateData,
        include: { nation: true }
      });

      // Get associated user
      const user = await prisma.user.findFirst({
        where: { airline_id: airline_id },
        include: {
          nation: true,
          roles_users: {
            include: {
              role: true
            }
          }
        }
      });

      const result = formatAirlineWithUserResponse(updatedAirline, user);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error updating airline:', error);
      if (error instanceof Error && error.message.includes('validation')) {
        res.status(400).json({ error: error.message, code: 400 });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// DELETE /admin/airlines/:airline_id - Delete an airline
router.delete('/airlines/:airline_id',
  authenticateToken,
  requireRoles(['admin']),
  validateParams(AdminAirlineParamsSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { airline_id } = req.params as AdminAirlineParams;

      // Check if airline exists
      const airline = await prisma.airline.findUnique({
        where: { id: airline_id }
      });

      if (!airline) {
        res.status(404).json({ error: 'Airline not found' });
        return;
      }

      // Delete all users associated with the airline first
      const users = await prisma.user.findMany({
        where: { airline_id: airline_id }
      });

      try {
        // Use transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
          // Delete users first
          for (const user of users) {
            await tx.user.delete({
              where: { id: user.id }
            });
          }
          
          // Then delete the airline
          await tx.airline.delete({
            where: { id: airline_id }
          });
        });

        res.status(200).json({ message: 'Ok' });
      } catch (error) {
        console.error('Error deleting airline:', error);
        res.status(409).json({ error: 'The airline has still some dependency' });
      }
    } catch (error) {
      console.error('Error in delete airline:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /admin/users - List all users with optional filtering
router.get('/users',
  authenticateToken,
  requireRoles(['admin']),
  validateQuery(AdminUserListQuerySchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const query = req.query as AdminUserListQuery;

      // Build where clause
      const whereClause: any = {
        id: { not: currentUserId } // Exclude current user
      };

      if (query.email) {
        whereClause.email = { contains: query.email, mode: 'insensitive' };
      }

      if (query.name) {
        whereClause.name = { contains: query.name, mode: 'insensitive' };
      }

      if (query.active !== undefined) {
        whereClause.active = query.active;
      }

      // Handle role filtering
      if (query.role) {
        whereClause.roles_users = {
          some: {
            role: {
              name: query.role
            }
          }
        };
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        include: {
          nation: true,
          roles_users: {
            include: {
              role: true
            }
          }
        }
      });

      const result = users.map(user => formatAdminUserResponse(user));
      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /admin/users/:user_id - Delete a user
router.delete('/users/:user_id',
  authenticateToken,
  requireRoles(['admin']),
  validateParams(AdminUserParamsSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.params as AdminUserParams;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: user_id },
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

      // Check if user has admin role
      const hasAdminRole = user.roles_users.some(ru => ru.role.name === 'admin');
      
      if (hasAdminRole) {
        // Count total admin users
        const adminCount = await prisma.user.count({
          where: {
            roles_users: {
              some: {
                role: {
                  name: 'admin'
                }
              }
            }
          }
        });

        if (adminCount <= 1) {
          res.status(409).json({ 
            error: 'Cannot delete the last admin user', 
            code: 409 
          });
          return;
        }
      }

      // Do not delete if an airline is associated to the user
      if (user.airline_id) {
        res.status(409).json({ 
          error: 'Cannot delete a user with an associated airline', 
          code: 409 
        });
        return;
      }

      // Delete the user
      await prisma.user.delete({
        where: { id: user_id }
      });

      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export const adminRouter = router; 
