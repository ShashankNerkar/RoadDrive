
import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { connectDB } from './server/config/db.js';
import authRoutes from './server/routes/authRoutes.js';
import courseRoutes from './server/routes/courseRoutes.js';
import lessonRoutes from './server/routes/lessonRoutes.js';
import bookingRoutes from './server/routes/bookingRoutes.js';
import reviewRoutes from './server/routes/reviewRoutes.js';
import userRoutes from './server/routes/userRoutes.js';
import paymentRoutes from './server/routes/paymentRoutes.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  await connectDB();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  const clientUrl = process.env.CLIENT_URL;
  const allowedOrigins = clientUrl
    ? [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000']
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production' || !clientUrl) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    })
  );

  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'RoadDrive API is running',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/lessons', lessonRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/payment', paymentRoutes);

  app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: 'API route not found' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Server Error]', err.message);
    res.status(err.status || 500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'Internal server error'),
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[RoadDrive] Server running on port ${PORT}`);
  });
}

startServer();

