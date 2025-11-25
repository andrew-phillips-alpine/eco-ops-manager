// server.js
// The Custom Node Server - serves static files AND handles all API routes
// This block belongs to the Server runtime ONLY

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import environment config (relative imports for Node runtime)
import { env, assertEnv } from './app/config/env.js';

// Import blocks (relative imports for Node runtime)
import { sendErrorAlert } from './app/blocks/communication/error-alert.js';
import logger from './app/blocks/communication/logger.js';
import storageMongodb from './app/blocks/storage/mongodb.js';
import apiMultiFetch from './app/blocks/api/multi-fetch.js';
import logicDataAggregator from './app/blocks/logic/data-aggregator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = env.PORT;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from any origin (including same-origin and dev ports)
    callback(null, origin || '*');
  },
  credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Initialize blocks
async function initializeBlocks() {
  try {
    // Assert required env vars only when not in mock mode
    if (!env.USE_MOCK_DATA) {
      assertEnv(['DATABASE_URL', 'FORM_ENDPOINT', 'OPENWEATHER_API_KEY']);
    }

    // Initialize storage
    await storageMongodb.init({ collection_prefix: 'eco_ops_' });
    logger.info('Storage block initialized');

    // Initialize API fetcher
    apiMultiFetch.init({ endpoints: ['openweather', 'utility_api'] });
    logger.info('API block initialized');

    // Initialize logic aggregator
    logicDataAggregator.init({ formula: 'efficiency_calc' });
    logger.info('Logic block initialized');

    // Initialize logger
    logger.init({ prefix: env.APP_NAME });

    logger.info('All blocks initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize blocks', error);
    await sendErrorAlert(error, 'Block initialization');
    throw error;
  }
}

// =============================================================================
// API ROUTES
// =============================================================================

// GET /api/dashboard/stats - Aggregated dashboard statistics
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = await logicDataAggregator.run({
      location: req.query.location || 'London,UK',
    });
    res.json(stats);
  } catch (error) {
    logger.error('Dashboard stats error', error);
    await sendErrorAlert(error, 'GET /api/dashboard/stats');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch dashboard stats',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/data/sync - Sync external data (weather, utility)
app.get('/api/data/sync', async (req, res) => {
  try {
    const result = await apiMultiFetch.run({
      location: req.query.location || 'London,UK',
      period: req.query.period,
    });
    res.json(result);
  } catch (error) {
    logger.error('Data sync error', error);
    await sendErrorAlert(error, 'GET /api/data/sync');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to sync external data',
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/hours/log - Log staff hours
app.post('/api/hours/log', async (req, res) => {
  try {
    const { staffName, hours, date } = req.body;

    // Validate input
    if (!staffName || typeof hours !== 'number' || !date) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'staffName, hours (number), and date are required',
        timestamp: new Date().toISOString(),
      });
    }

    if (hours < 0 || hours > 24) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Hours must be between 0 and 24',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await storageMongodb.run({
      action: 'logHours',
      data: { staffName, hours, date },
    });

    res.status(201).json(result);
  } catch (error) {
    logger.error('Log hours error', error);
    await sendErrorAlert(error, 'POST /api/hours/log');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to log hours',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/hours - Get logged hours
app.get('/api/hours', async (req, res) => {
  try {
    const filters = {
      staffName: req.query.staffName,
      date: req.query.date,
    };

    const result = await storageMongodb.run({
      action: 'getHours',
      data: filters,
    });

    res.json(result);
  } catch (error) {
    logger.error('Get hours error', error);
    await sendErrorAlert(error, 'GET /api/hours');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch hours',
      timestamp: new Date().toISOString(),
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: env.APP_NAME,
    environment: env.NODE_ENV,
    mockMode: env.USE_MOCK_DATA,
    timestamp: new Date().toISOString(),
  });
});

// =============================================================================
// STATIC FILE SERVING
// =============================================================================

// Serve static files from Next.js build output
const staticPath = path.join(__dirname, 'out');
app.use(express.static(staticPath));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'Not Found',
      message: `API endpoint ${req.path} not found`,
      timestamp: new Date().toISOString(),
    });
  }

  res.sendFile(path.join(staticPath, 'index.html'));
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// Global error handler
app.use(async (err, req, res, next) => {
  logger.error('Unhandled error', err);
  await sendErrorAlert(err, `${req.method} ${req.path}`);

  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  logger.error('Uncaught exception', error);
  await sendErrorAlert(error, 'Uncaught exception');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  logger.error('Unhandled rejection', reason);
  await sendErrorAlert(reason, 'Unhandled rejection');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await storageMongodb.close();
  process.exit(0);
});

// =============================================================================
// START SERVER
// =============================================================================

async function start() {
  try {
    await initializeBlocks();

    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
      logger.info(`Mock mode: ${env.USE_MOCK_DATA ? 'ENABLED' : 'DISABLED'}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

start();
