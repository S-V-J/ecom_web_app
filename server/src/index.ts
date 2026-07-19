import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3001', 10);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.listen(PORT, () => {
  console.log(`✅ [SERVER] Express server is running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('⚠️  [SERVER] Shutting down gracefully...');
  process.exit(0);
});