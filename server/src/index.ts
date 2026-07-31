/**
 * @file index.ts
 * @description Main entry point for the Express.js backend server.
 */
import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes'; // <-- ADDED

dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3001', 10);

// ==========================================
// GLOBAL MIDDLEWARE
// ==========================================
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==========================================
// ROUTES
// ==========================================
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/auth', authRoutes);
app.use('/admin/users', adminRoutes); // <-- ADDED

// ==========================================
// SERVER INITIALIZATION
// ==========================================
app.listen(PORT, () => {
  console.log(`✅ [SERVER] Express server is running on http://localhost:${PORT}`);
  console.log(`✅ [SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGINT', () => {
  console.log('⚠️  [SERVER] Shutting down gracefully...');
  process.exit(0);
});