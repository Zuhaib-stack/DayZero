import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'dayzero_discipline_over_motivation_secret_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'dayzero.pglite'),
  databaseUrl: process.env.DATABASE_URL || '',
  nodeEnv: process.env.NODE_ENV || 'development'
};

