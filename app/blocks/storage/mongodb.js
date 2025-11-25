// /app/blocks/storage/mongodb.js
// This block belongs to the Server runtime ONLY

import { MongoClient } from 'mongodb';
import { env } from '../../config/env.js';
import logger from '../communication/logger.js';

// Mock data for development
const mockHoursData = [
  { id: '1', staffName: 'John Smith', hours: 8, date: '2025-11-22', createdAt: '2025-11-22T09:00:00Z' },
  { id: '2', staffName: 'Jane Doe', hours: 7.5, date: '2025-11-22', createdAt: '2025-11-22T09:30:00Z' },
  { id: '3', staffName: 'Bob Wilson', hours: 8, date: '2025-11-21', createdAt: '2025-11-21T09:00:00Z' },
  { id: '4', staffName: 'John Smith', hours: 6, date: '2025-11-21', createdAt: '2025-11-21T09:00:00Z' },
  { id: '5', staffName: 'Jane Doe', hours: 8, date: '2025-11-20', createdAt: '2025-11-20T09:00:00Z' },
];

let mockDataStore = [...mockHoursData];

const storageMongodb = {
  client: null,
  db: null,

  async init(config = {}) {
    this.config = config;
    this.collectionPrefix = config.collection_prefix || 'eco_ops_';

    if (env.USE_MOCK_DATA) {
      logger.mock('storage-mongodb init');
      mockDataStore = [...mockHoursData];
      return this;
    }

    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for storage-mongodb');
    }

    try {
      this.client = new MongoClient(env.DATABASE_URL);
      await this.client.connect();
      this.db = this.client.db();

      // Ensure collections and indexes exist
      const hoursCollection = this.db.collection(`${this.collectionPrefix}hours`);
      await hoursCollection.createIndex({ date: -1 });
      await hoursCollection.createIndex({ staffName: 1 });
      await hoursCollection.createIndex({ createdAt: -1 });

      logger.info('MongoDB connected and indexes created');
      return this;
    } catch (error) {
      logger.error('Failed to connect to MongoDB', error);
      throw error;
    }
  },

  async run(operation) {
    const { action, data } = operation;

    switch (action) {
      case 'logHours':
        return this.logHours(data);
      case 'getHours':
        return this.getHours(data);
      case 'getHoursByDateRange':
        return this.getHoursByDateRange(data);
      default:
        throw new Error(`Unknown storage action: ${action}`);
    }
  },

  async logHours(data) {
    const { staffName, hours, date } = data;

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      staffName,
      hours,
      date,
      createdAt: new Date().toISOString(),
    };

    if (env.USE_MOCK_DATA) {
      logger.mock('/api/hours/log');
      mockDataStore.push(entry);
      return entry;
    }

    const collection = this.db.collection(`${this.collectionPrefix}hours`);
    await collection.insertOne(entry);
    return entry;
  },

  async getHours(filters = {}) {
    if (env.USE_MOCK_DATA) {
      logger.mock('/api/hours');
      let result = [...mockDataStore];

      if (filters.staffName) {
        result = result.filter(h => h.staffName === filters.staffName);
      }
      if (filters.date) {
        result = result.filter(h => h.date === filters.date);
      }

      return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const collection = this.db.collection(`${this.collectionPrefix}hours`);
    const query = {};

    if (filters.staffName) query.staffName = filters.staffName;
    if (filters.date) query.date = filters.date;

    return collection.find(query).sort({ createdAt: -1 }).toArray();
  },

  async getHoursByDateRange(data) {
    const { startDate, endDate } = data;

    if (env.USE_MOCK_DATA) {
      logger.mock('/api/hours (date range)');
      return mockDataStore.filter(h => h.date >= startDate && h.date <= endDate);
    }

    const collection = this.db.collection(`${this.collectionPrefix}hours`);
    return collection
      .find({
        date: { $gte: startDate, $lte: endDate },
      })
      .sort({ date: -1 })
      .toArray();
  },

  // Fallback data for error scenarios
  fallback: {
    hours: mockHoursData,
  },

  async close() {
    if (this.client) {
      await this.client.close();
      logger.info('MongoDB connection closed');
    }
  },
};

export default storageMongodb;
