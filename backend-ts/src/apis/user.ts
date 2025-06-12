import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { 
  UserOutputSchema,
  UserUpdateSchema,
  UpdatePasswordSchema,
  PaymentCardInputSchema,
  PaymentCardOutputSchema,
  PaymentCardListResponseSchema,
  MessageResponseSchema,
  UserParamsSchema,
  CardParamsSchema,
  type UserUpdate,
  type UpdatePassword,
  type PaymentCardInput,
  type UserParams,
  type CardParams
} from '../schemas/user';
import { registry } from '../config/openapi';
import { ErrorResponseSchema, ValidationErrorResponseSchema } from '../config/openapi';
import { validateBody, validateParams } from '../utils/validation';
import { hashPassword, verifyPassword } from '../utils/password';
import { authenticateToken } from '../middleware/auth';

const prisma = new PrismaClient();
export const userRouter = Router();

// Helper function to format user data for response
const formatUserResponse = (user: any) => {
  const userType = user.roles_users?.some((ru: any) => ru.role.name.includes('airline')) ? 'airline' : 'user';
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    surname: user.surname,
    address: user.address,
    zip: user.zip,
    nation: user.nation,
    airline_id: user.airline_id,
    active: user.active,
    cards: user.payement_card || [],
    type: userType
  };
};

// Register OpenAPI paths
registry.registerPath({
  method: 'get',
  path: '/user/{user_id}',
  description: 'Get user by ID',
  summary: 'Fetch a user given its identifier',
  tags: ['User'],
  security: [{ bearerAuth: [] }],
  request: {
    params: UserParamsSchema,
  },
  responses: {
    200: {
      description: 'User found',
      content: {
        'application/json': {
          schema: UserOutputSchema,
        },
      },
    },
    403: {
      description: 'Permission denied',
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
  },
});

registry.registerPath({
  method: 'put',
  path: '/user/{user_id}',
  description: 'Update user by ID',
  summary: 'Update a user given its identifier',
  tags: ['User'],
  security: [{ bearerAuth: [] }],
  request: {
    params: UserParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: UserUpdateSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'User updated successfully',
      content: {
        'application/json': {
          schema: UserOutputSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ValidationErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Permission denied',
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
  },
});

registry.registerPath({
  method: 'get',
  path: '/user/me',
  description: 'Get current user profile',
  summary: 'Get current user profile',
  tags: ['User'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Current user profile',
      content: {
        'application/json': {
          schema: UserOutputSchema,
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
  },
});

registry.registerPath({
  method: 'post',
  path: '/user/update_password',
  description: 'Update user password',
  summary: 'Update user password',
  tags: ['User'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: UpdatePasswordSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password updated successfully',
      content: {
        'application/json': {
          schema: MessageResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ValidationErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Old password is incorrect',
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
  },
});

registry.registerPath({
  method: 'get',
  path: '/user/cards',
  description: 'Get user payment cards',
  summary: 'Get all payment cards for the current user',
  tags: ['User', 'Payment Cards'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of payment cards',
      content: {
        'application/json': {
          schema: PaymentCardListResponseSchema,
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
  },
});

registry.registerPath({
  method: 'post',
  path: '/user/cards',
  description: 'Add payment card',
  summary: 'Add a new payment card for the current user',
  tags: ['User', 'Payment Cards'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: PaymentCardInputSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Payment card created',
      content: {
        'application/json': {
          schema: PaymentCardOutputSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ValidationErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/user/cards/{card_id}',
  description: 'Get payment card by ID',
  summary: 'Get a specific payment card',
  tags: ['User', 'Payment Cards'],
  security: [{ bearerAuth: [] }],
  request: {
    params: CardParamsSchema,
  },
  responses: {
    200: {
      description: 'Payment card found',
      content: {
        'application/json': {
          schema: PaymentCardOutputSchema,
        },
      },
    },
    404: {
      description: 'Payment card not found',
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
  path: '/user/cards/{card_id}',
  description: 'Delete payment card',
  summary: 'Delete a payment card',
  tags: ['User', 'Payment Cards'],
  security: [{ bearerAuth: [] }],
  request: {
    params: CardParamsSchema,
  },
  responses: {
    200: {
      description: 'Payment card deleted',
      content: {
        'application/json': {
          schema: MessageResponseSchema,
        },
      },
    },
    404: {
      description: 'Payment card not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    409: {
      description: 'Card cannot be deleted due to existing dependencies',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// Routes
// Note: More specific routes must come before parameterized routes
userRouter.get('/me', 
  authenticateToken, 
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user!;

      const user = await prisma.user.findUnique({
        where: { id: currentUser.id },
        include: {
          nation: true,
          payement_card: true,
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

      res.json(formatUserResponse(user));
    } catch (error) {
      console.error('Get current user error:', error);
      next(error);
    }
  }
);

// Specific routes must come before parameterized routes
userRouter.post('/update_password', 
  authenticateToken, 
  validateBody(UpdatePasswordSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { old_password, new_password } = req.body as UpdatePassword;
      const currentUser = req.user!;

      const user = await prisma.user.findUnique({
        where: { id: currentUser.id }
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Verify old password
      const isValidPassword = await verifyPassword(old_password, user.password);
      if (!isValidPassword) {
        res.status(403).json({ error: 'Old password is incorrect' });
        return;
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(new_password);

      // Update password and set confirmed_at
      const updateData: any = {
        password: hashedNewPassword,
        confirmed_at: new Date(),
      };

      // If user has airline_id, check if airline profile is complete to activate user
      if (user.airline_id) {
        const airline = await prisma.airline.findUnique({
          where: { id: user.airline_id }
        });

        if (!airline) {
          res.status(404).json({ error: 'Associated airline not found' });
          return;
        }

        // Check if all required fields are present and not null
        const requiredFields = [
          'name', 'nation_id', 'address', 'email', 'website', 'zip',
          'first_class_description', 'business_class_description', 'economy_class_description'
        ];

        const allFieldsComplete = requiredFields.every(field => {
          const value = (airline as any)[field];
          return value !== null && value !== undefined && value !== '';
        });

        if (allFieldsComplete) {
          updateData.active = true;
        }
      }

      await prisma.user.update({
        where: { id: currentUser.id },
        data: updateData
      });

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Update password error:', error);
      next(error);
    }
  }
);

userRouter.get('/cards', 
  authenticateToken, 
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user!;

      const user = await prisma.user.findUnique({
        where: { id: currentUser.id },
        include: {
          payement_card: true
        }
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(user.payement_card);
    } catch (error) {
      console.error('Get user cards error:', error);
      next(error);
    }
  }
);

userRouter.post('/cards', 
  authenticateToken, 
  validateBody(PaymentCardInputSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cardData = req.body as PaymentCardInput;
      const currentUser = req.user!;

      const newCard = await prisma.payement_card.create({
        data: {
          user_id: currentUser.id,
          card_name: cardData.card_name,
          holder_name: cardData.holder_name,
          last_4_digits: cardData.last_4_digits,
          expiration_date: cardData.expiration_date,
          circuit: cardData.circuit,
          card_type: cardData.card_type,
        }
      });

      res.status(201).json(newCard);
    } catch (error) {
      console.error('Create card error:', error);
      next(error);
    }
  }
);

userRouter.get('/cards/:card_id', 
  authenticateToken, 
  validateParams(CardParamsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { card_id } = req.validatedParams as CardParams;
      const currentUser = req.user!;

      const card = await prisma.payement_card.findFirst({
        where: {
          id: card_id,
          user_id: currentUser.id
        }
      });

      if (!card) {
        res.status(404).json({ error: 'Payment card not found' });
        return;
      }

      res.json(card);
    } catch (error) {
      console.error('Get card error:', error);
      next(error);
    }
  }
);

userRouter.delete('/cards/:card_id', 
  authenticateToken, 
  validateParams(CardParamsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { card_id } = req.validatedParams as CardParams;
      const currentUser = req.user!;

      const card = await prisma.payement_card.findFirst({
        where: {
          id: card_id,
          user_id: currentUser.id
        }
      });

      if (!card) {
        res.status(404).json({ error: 'Payment card not found' });
        return;
      }

      try {
        await prisma.payement_card.delete({
          where: { id: card_id }
        });

        res.json({ message: 'Card deleted successfully' });
      } catch (deleteError: any) {
        if (deleteError.code === 'P2003') { // Foreign key constraint violation
          res.status(409).json({ error: 'Card cannot be deleted due to existing dependencies' });
          return;
        }
        throw deleteError;
      }
    } catch (error) {
      console.error('Delete card error:', error);
      next(error);
    }
  }
);


userRouter.get('/:user_id', 
  authenticateToken, 
  validateParams(UserParamsSchema), 
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user_id } = req.validatedParams as UserParams;
      const currentUser = req.user!;

      // Only allow users to see their own profile or admins to see anyone
      if (user_id !== currentUser.id && !currentUser.roles.includes('admin')) {
        res.status(403).json({ error: 'You do not have permission to view this user' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: user_id },
        include: {
          nation: true,
          payement_card: true,
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

      res.json(formatUserResponse(user));
    } catch (error) {
      console.error('Get user error:', error);
      next(error);
    }
  }
);

userRouter.put('/:user_id', 
  authenticateToken, 
  validateParams(UserParamsSchema),
  validateBody(UserUpdateSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user_id } = req.validatedParams as UserParams;
      const updateData = req.body as UserUpdate;
      const currentUser = req.user!;

      // Only allow users to update their own profile or admins to update anyone
      if (user_id !== currentUser.id && !currentUser.roles.includes('admin')) {
        res.status(403).json({ error: 'You do not have permission to update this user' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: user_id }
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Don't allow changing email to an existing one
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: updateData.email }
        });
        if (existingUser) {
          res.status(400).json({ error: 'Email already in use' });
          return;
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: user_id },
        data: {
          email: updateData.email,
          name: updateData.name,
          surname: updateData.surname,
          address: updateData.address,
          zip: updateData.zip,
          nation_id: updateData.nation_id,
        },
        include: {
          nation: true,
          payement_card: true,
          roles_users: {
            include: {
              role: true
            }
          }
        }
      });

      res.json(formatUserResponse(updatedUser));
    } catch (error: any) {
      console.error('Update user error:', error);
      
      if (error.code === 'P2002') { // Prisma unique constraint violation
        res.status(400).json({ error: 'Email already in use' });
        return;
      }
      
      next(error);
    }
  }
);

// Cleanup on app termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
}); 


