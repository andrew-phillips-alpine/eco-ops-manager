// /app/blocks/logic/data-aggregator.js
// This block belongs to the Server runtime ONLY

import { env } from '../../config/env.js';
import logger from '../communication/logger.js';
import { sendErrorAlert } from '../communication/error-alert.js';
import storageMongodb from '../storage/mongodb.js';
import apiMultiFetch from '../api/multi-fetch.js';

// Mock dashboard stats for development and fallback
const mockDashboardStats = {
  totalHours: 37.5,
  averageHoursPerDay: 7.5,
  currentTemperature: 18,
  electricityCost: 187.5,
  efficiencyScore: 85,
  costPerHour: 5.0,
  chartData: {
    efficiencyVsTemp: [
      { date: '2025-11-18', temperature: 15, efficiency: 82 },
      { date: '2025-11-19', temperature: 17, efficiency: 84 },
      { date: '2025-11-20', temperature: 16, efficiency: 83 },
      { date: '2025-11-21', temperature: 19, efficiency: 86 },
      { date: '2025-11-22', temperature: 18, efficiency: 85 },
    ],
    costPerHour: [
      { date: '2025-11-18', cost: 4.8, hours: 16 },
      { date: '2025-11-19', cost: 5.1, hours: 15.5 },
      { date: '2025-11-20', cost: 4.9, hours: 8 },
      { date: '2025-11-21', cost: 5.2, hours: 14 },
      { date: '2025-11-22', cost: 5.0, hours: 15.5 },
    ],
  },
};

const logicDataAggregator = {
  init(config = {}) {
    this.config = config;
    this.formula = config.formula || 'efficiency_calc';
    this.fallback = { ...mockDashboardStats, mock: true };
    return this;
  },

  async run(input = {}) {
    if (env.USE_MOCK_DATA) {
      logger.mock('/api/dashboard/stats');
      return this.fallback;
    }

    try {
      // Get date range for last 7 days
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch hours data
      const hoursData = await storageMongodb.run({
        action: 'getHoursByDateRange',
        data: { startDate, endDate },
      });

      // Fetch external data (weather, utility)
      const externalData = await apiMultiFetch.run({
        location: input.location || 'London,UK',
        period: endDate.slice(0, 7),
      });

      // Calculate aggregations
      const stats = this.calculateStats(hoursData, externalData);

      return { ...stats, mock: false };
    } catch (error) {
      logger.error('Failed to aggregate dashboard data', error);
      await sendErrorAlert(error, 'logic-data-aggregator');
      return this.fallback;
    }
  },

  calculateStats(hoursData, externalData) {
    // Calculate total hours
    const totalHours = hoursData.reduce((sum, entry) => sum + entry.hours, 0);

    // Group hours by date
    const hoursByDate = {};
    hoursData.forEach(entry => {
      if (!hoursByDate[entry.date]) {
        hoursByDate[entry.date] = 0;
      }
      hoursByDate[entry.date] += entry.hours;
    });

    const daysWithData = Object.keys(hoursByDate).length || 1;
    const averageHoursPerDay = totalHours / daysWithData;

    // Get current weather
    const currentTemperature = externalData.weather?.temperature || 18;

    // Get utility costs
    const electricityCost = externalData.utility?.totalCost || 0;

    // Calculate efficiency score (simplified formula)
    // Higher temp = lower efficiency needs, optimal around 20C
    const tempDiff = Math.abs(20 - currentTemperature);
    const baseEfficiency = 90 - tempDiff;
    const efficiencyScore = Math.max(60, Math.min(100, baseEfficiency));

    // Calculate cost per hour
    const costPerHour = totalHours > 0 ? electricityCost / totalHours : 0;

    // Generate chart data
    const chartData = this.generateChartData(hoursByDate, currentTemperature, electricityCost);

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      averageHoursPerDay: Math.round(averageHoursPerDay * 10) / 10,
      currentTemperature,
      electricityCost: Math.round(electricityCost * 100) / 100,
      efficiencyScore: Math.round(efficiencyScore),
      costPerHour: Math.round(costPerHour * 100) / 100,
      chartData,
    };
  },

  generateChartData(hoursByDate, currentTemp, totalCost) {
    const dates = Object.keys(hoursByDate).sort();
    const hoursPerDay = dates.map(date => hoursByDate[date]);
    const avgCostPerDay = dates.length > 0 ? totalCost / dates.length : 0;

    // Efficiency vs Temperature (simulated variation around current temp)
    const efficiencyVsTemp = dates.map(date => {
      const tempVariation = (Math.random() - 0.5) * 6;
      const temp = Math.round(currentTemp + tempVariation);
      const tempDiff = Math.abs(20 - temp);
      const efficiency = Math.round(90 - tempDiff + (Math.random() - 0.5) * 4);
      return { date, temperature: temp, efficiency };
    });

    // Cost per Hour
    const costPerHour = dates.map(date => {
      const hours = hoursByDate[date];
      const cost = hours > 0 ? Math.round((avgCostPerDay / hours) * 100) / 100 : 0;
      return { date, cost, hours };
    });

    return { efficiencyVsTemp, costPerHour };
  },
};

export default logicDataAggregator;
