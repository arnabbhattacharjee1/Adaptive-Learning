import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { authRouter } from './api/authRoutes.js';
import { routingRouter } from './api/routingRoutes.js';
import { telemetryRouter } from './api/telemetryRoutes.js';
import { initDatabase } from './db/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Initialize Database & Seed DAG
console.log('⚡ Initializing SQLite Database & Knowledge Graph DAG...');
initDatabase();
console.log('✅ Database initialized and seed graph validated.');

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/telemetry', telemetryRouter);
app.use('/api/v1/routing', routingRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 ALIS Backend Server running on http://localhost:${PORT}`);
  });
}

export default app;
