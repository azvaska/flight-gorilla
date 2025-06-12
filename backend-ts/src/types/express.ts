import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: any;
      validatedParams?: any;
      validatedBody?: any;
    }
  }
}

export {}; 
