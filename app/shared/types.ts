import { z } from 'zod';

// Staff Hours Entry
export const StaffHoursSchema = z.object({
  id: z.string(),
  staffName: z.string(),
  hours: z.number().min(0),
  date: z.string(), // ISO date string
  createdAt: z.string(),
});

export type StaffHours = z.infer<typeof StaffHoursSchema>;

// Weather Data
export const WeatherDataSchema = z.object({
  temperature: z.number(),
  humidity: z.number(),
  description: z.string(),
  timestamp: z.string(),
});

export type WeatherData = z.infer<typeof WeatherDataSchema>;

// Utility Cost Data
export const UtilityCostSchema = z.object({
  costPerKwh: z.number(),
  totalKwh: z.number(),
  totalCost: z.number(),
  period: z.string(),
});

export type UtilityCost = z.infer<typeof UtilityCostSchema>;

// Dashboard Stats Response
export const DashboardStatsSchema = z.object({
  totalHours: z.number(),
  averageHoursPerDay: z.number(),
  currentTemperature: z.number(),
  electricityCost: z.number(),
  efficiencyScore: z.number(),
  costPerHour: z.number(),
  chartData: z.object({
    efficiencyVsTemp: z.array(
      z.object({
        date: z.string(),
        temperature: z.number(),
        efficiency: z.number(),
      })
    ),
    costPerHour: z.array(
      z.object({
        date: z.string(),
        cost: z.number(),
        hours: z.number(),
      })
    ),
  }),
  mock: z.boolean().optional(),
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

// API Sync Response
export const DataSyncResponseSchema = z.object({
  weather: WeatherDataSchema,
  utility: UtilityCostSchema,
  syncedAt: z.string(),
  mock: z.boolean().optional(),
});

export type DataSyncResponse = z.infer<typeof DataSyncResponseSchema>;

// Log Hours Request
export const LogHoursRequestSchema = z.object({
  staffName: z.string().min(1),
  hours: z.number().min(0).max(24),
  date: z.string(),
});

export type LogHoursRequest = z.infer<typeof LogHoursRequestSchema>;

// API Error Response
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  timestamp: z.string(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
