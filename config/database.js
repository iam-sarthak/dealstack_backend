import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import pg from "pg";

dotenv.config();



const sequelize = new Sequelize(
  process.env.DB_NAME || 'postgres',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    // Explicitly specify pg module for Vercel/serverless compatibility
    dialectModule: pg,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    // SSL configuration for Supabase and other cloud providers
    dialectOptions: {
      ssl: process.env.DB_SSL !== 'false' ? {
        require: true,
        rejectUnauthorized: false // Supabase uses self-signed certificates
      } : false
    },
    // Optimized pool settings for serverless/Vercel
    pool: {
      max: process.env.NODE_ENV === 'production' ? 2 : 5, // Lower for serverless
      min: 0,
      acquire: 30000,
      idle: 10000,
      // For serverless: close idle connections quickly
      evict: 1000
    },
    // Additional options for better serverless compatibility
    retry: {
      max: 3
    }
  }
);

export default sequelize;

