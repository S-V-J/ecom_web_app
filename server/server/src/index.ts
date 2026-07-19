/**
 * @file index.ts
 * @description Main entry point for the Express.js backend server.
 * @systemic_role Initializes the Express application, configures global middleware 
 * (CORS, JSON parsing), defines core health-check routes, and starts the HTTP listener.
 */

import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file into process.env
dotenv.config();

// Initialize Express application
const app: Application = express();

// Define port from environment variable, fallback to 3001
const PORT: number = parseInt(process.env.PORT || '3001', 10);

// ==========================================
// GLOBAL MIDDLEWARE
// ==========================================

// Enable CORS for all origins (will be restricted in production)
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Parse incoming JSON requests
app.use(express.json());

// Parse incoming URL-encoded requests (e.g., form submissions)
app.use(express.urlencoded({ extended: true }));

// ==========================================
// ROUTES
// ==========================================

/**
 * @route GET /health
 * @description Health check endpoint to verify server is running and responsive.
 * Used by load balancers, deployment pipelines, and the frontend to confirm backend availability.
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ==========================================
// SERVER INITIALIZATION
// ==========================================

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`✅ [SERVER] Express server is running on http://localhost:${PORT}`);
  console.log(`✅ [SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ [SERVER] Health check available at: http://localhost:${PORT}/health`);
});

// Graceful shutdown handling (Best Practice)
process.on('SIGTERM', () => {
  console.log('⚠️  [SERVER] SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️  [SERVER] SIGINT received. Shutting down gracefully...');
  process.exit(0);
});