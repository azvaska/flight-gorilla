import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 5000,
  databaseUrl: process.env.DATABASE_URI || '',
  jwtSecret: process.env.JWT_SECRET_KEY || 'change-this-jwt-secret',
};
