import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRouter } from './api/authRoutes.js';
import { routingRouter } from './api/routingRoutes.js';
import { telemetryRouter } from './api/telemetryRoutes.js';
import { initDatabase } from './db/index.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { validateEnv } from './utils/env.js';
import { Logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Startup Environment Validation (Fail-Fast)
const config = validateEnv();

const app = express();
const PORT = config.PORT;

// 2. Security & Header Hardening
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for local inline scripts & SPA loading
}));

// 3. Response Compression & Parsing
app.use(compression());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// 4. Database & Knowledge Graph DAG Bootstrapper
Logger.info('⚡ Initializing Database & Knowledge Graph DAG...');
initDatabase();
Logger.info('✅ Database initialized and seed graph validated.');

// 5. Cloud Run / Knative Health Check Probes
app.get(['/', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'alis-backend',
    environment: config.NODE_ENV,
    region: config.GCP_REGION,
    timestamp: new Date().toISOString(),
  });
});

// 6. Modular API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/telemetry', telemetryRouter);
app.use('/api/v1/routing', routingRouter);

// 7. Single-Container SPA Static Asset Serving
const publicDir = path.resolve(__dirname, '../public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.resolve(publicDir, 'index.html'));
  });
}

// 8. Resilience & Error Handling Middlewares
app.use(notFoundHandler);
app.use(globalErrorHandler);

// 9. Server Initialization
if (config.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    Logger.info(`🚀 ALIS Enterprise Backend running on port ${PORT}`, {
      port: PORT,
      region: config.GCP_REGION,
      project: config.GCP_PROJECT_ID,
    });
  });
}

export default app;
