// /app/blocks/api/multi-fetch.js
// This block belongs to the Server runtime ONLY

import { env } from '../../config/env.js';
import logger from '../communication/logger.js';

// Mock data for development
const mockWeatherData = {
  temperature: 18,
  humidity: 65,
  description: 'Partly cloudy',
  timestamp: new Date().toISOString(),
};

const mockUtilityData = {
  costPerKwh: 0.15,
  totalKwh: 1250,
  totalCost: 187.5,
  period: '2025-11',
};

const apiMultiFetch = {
  init(config = {}) {
    this.config = config;
    this.endpoints = config.endpoints || ['openweather', 'utility_api'];
    this.fallback = {
      weather: mockWeatherData,
      utility: mockUtilityData,
    };
    return this;
  },

  async run(input = {}) {
    let usedFallback = false;

    if (env.USE_MOCK_DATA) {
      logger.mock('/api/data/sync');
      return {
        weather: mockWeatherData,
        utility: mockUtilityData,
        syncedAt: new Date().toISOString(),
        mock: true,
      };
    }

    const location = input.location || 'London,UK';
    const period = input.period || new Date().toISOString().slice(0, 7);

    const results = {};

    for (const endpoint of this.endpoints) {
      try {
        switch (endpoint) {
          case 'openweather':
            results.weather = await this.fetchWeather(location);
            break;
          case 'utility_api':
            results.utility = await this.fetchUtility(period);
            break;
          default:
            logger.warn(`Unknown endpoint: ${endpoint}`);
        }
      } catch (error) {
        logger.error(`Failed to fetch from ${endpoint}`, error);
        usedFallback = true;
        if (endpoint === 'openweather') {
          results.weather = this.fallback.weather;
        } else if (endpoint === 'utility_api') {
          results.utility = this.fallback.utility;
        }
      }
    }

    return {
      weather: results.weather || this.fallback.weather,
      utility: results.utility || this.fallback.utility,
      syncedAt: new Date().toISOString(),
      mock: usedFallback,
    };
  },

  async fetchWeather(location = 'London,UK') {
    if (!env.OPENWEATHER_API_KEY) {
      throw new Error('OPENWEATHER_API_KEY is required for weather sync');
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${env.OPENWEATHER_API_KEY}&units=metric`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenWeather API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      description: data.weather[0]?.description || 'Unknown',
      timestamp: new Date().toISOString(),
    };
  },

  async fetchUtility(period) {
    const resolvedPeriod = period || new Date().toISOString().slice(0, 7);

    if (!env.UTILITY_API_URL) {
      logger.warn('UTILITY_API_URL not configured - returning fallback utility metrics');
      return this.fallback.utility;
    }

    const url = `${env.UTILITY_API_URL}?period=${encodeURIComponent(resolvedPeriod)}`;
    const headers = env.UTILITY_API_TOKEN
      ? { Authorization: `Bearer ${env.UTILITY_API_TOKEN}` }
      : {};

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Utility API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      costPerKwh: data.costPerKwh ?? 0,
      totalKwh: data.totalKwh ?? 0,
      totalCost: data.totalCost ?? 0,
      period: data.period || resolvedPeriod,
    };
  },
};

export default apiMultiFetch;
