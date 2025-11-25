'use client';

// /app/blocks/ui/dashboard-admin.tsx
// This block belongs to the Client runtime ONLY

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import type { DashboardStats } from '../../shared/types';

// Export utilities
const exportToCSV = (stats: DashboardStats) => {
  // Create CSV content
  let csv = 'Eco-Ops Manager Report\n\n';
  csv += 'Summary Statistics\n';
  csv += `Total Hours (7 days),${stats.totalHours}\n`;
  csv += `Average Hours/Day,${stats.averageHoursPerDay}\n`;
  csv += `Current Temperature,${stats.currentTemperature}°C\n`;
  csv += `Electricity Cost,$${stats.electricityCost}\n`;
  csv += `Efficiency Score,${stats.efficiencyScore}%\n`;
  csv += `Cost per Hour,$${stats.costPerHour}\n\n`;

  csv += 'Efficiency vs Temperature\n';
  csv += 'Date,Temperature (°C),Efficiency (%)\n';
  stats.chartData.efficiencyVsTemp.forEach(row => {
    csv += `${row.date},${row.temperature},${row.efficiency}\n`;
  });

  csv += '\nCost per Hour\n';
  csv += 'Date,Cost ($),Hours\n';
  stats.chartData.costPerHour.forEach(row => {
    csv += `${row.date},${row.cost},${row.hours}\n`;
  });

  // Download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `eco-ops-report-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const exportToPDF = (stats: DashboardStats) => {
  // Create a printable HTML document
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Eco-Ops Manager Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { color: #16a34a; border-bottom: 3px solid #eab308; padding-bottom: 10px; }
        h2 { color: #166534; margin-top: 30px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .stat-box { background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0; }
        .stat-value { font-size: 24px; font-weight: bold; color: #166534; }
        .stat-label { font-size: 12px; color: #16a34a; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #16a34a; color: white; }
        tr:nth-child(even) { background: #f0fdf4; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <h1>Eco-Ops Manager Report</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>

      <h2>Summary Statistics</h2>
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-value">${stats.totalHours}</div>
          <div class="stat-label">Total Hours (7 days)</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${stats.averageHoursPerDay}</div>
          <div class="stat-label">Avg Hours/Day</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${stats.currentTemperature}°C</div>
          <div class="stat-label">Current Temperature</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">$${stats.electricityCost}</div>
          <div class="stat-label">Electricity Cost</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${stats.efficiencyScore}%</div>
          <div class="stat-label">Efficiency Score</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">$${stats.costPerHour}</div>
          <div class="stat-label">Cost per Hour</div>
        </div>
      </div>

      <h2>Efficiency vs Temperature</h2>
      <table>
        <tr><th>Date</th><th>Temperature (°C)</th><th>Efficiency (%)</th></tr>
        ${stats.chartData.efficiencyVsTemp.map(row =>
          `<tr><td>${row.date}</td><td>${row.temperature}</td><td>${row.efficiency}</td></tr>`
        ).join('')}
      </table>

      <h2>Cost per Hour</h2>
      <table>
        <tr><th>Date</th><th>Cost ($)</th><th>Hours</th></tr>
        ${stats.chartData.costPerHour.map(row =>
          `<tr><td>${row.date}</td><td>${row.cost}</td><td>${row.hours}</td></tr>`
        ).join('')}
      </table>

      <div class="footer">
        <p>Eco-Ops Manager - Operations Dashboard</p>
      </div>
    </body>
    </html>
  `;

  // Open print dialog
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  }
};

interface DashboardAdminProps {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  onLogHours: (staffName: string, hours: number, date: string) => Promise<void>;
  onSyncData: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

export default function DashboardAdmin({
  stats,
  loading,
  error,
  onLogHours,
  onSyncData,
  onRefresh,
}: DashboardAdminProps) {
  const [staffName, setStaffName] = useState('');
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !hours) return;

    setSubmitting(true);
    try {
      await onLogHours(staffName, parseFloat(hours), date);
      setStaffName('');
      setHours('');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="skeleton h-8 w-64 mb-2"></div>
          <div className="skeleton h-4 w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-8 w-20 mb-2"></div>
              <div className="skeleton h-4 w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="app-header">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1>Eco-Ops Manager</h1>
            <p>
              Operations dashboard cross-referencing staff hours, outdoor temp, and electricity costs.
            </p>
          </div>
          {stats && (
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={() => exportToPDF(stats)}
                className="btn-export"
              >
                Export PDF
              </button>
              <button
                onClick={() => exportToCSV(stats)}
                className="btn-export"
              >
                Export CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message mb-6">
          <p>{error}</p>
          <button onClick={onRefresh} className="text-sm underline mt-2">
            Try again
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        <button onClick={onSyncData} className="btn-primary">
          Sync External Data
        </button>
        <button onClick={onRefresh} className="btn-secondary">
          Refresh Stats
        </button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="stat-card">
              <span className="stat-value">{stats.totalHours}</span>
              <span className="stat-label">Total Hours (7 days)</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.averageHoursPerDay}</span>
              <span className="stat-label">Avg Hours/Day</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.currentTemperature}°C</span>
              <span className="stat-label">Current Temperature</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">${stats.electricityCost}</span>
              <span className="stat-label">Electricity Cost</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.efficiencyScore}%</span>
              <span className="stat-label">Efficiency Score</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">${stats.costPerHour}</span>
              <span className="stat-label">Cost per Hour</span>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Efficiency vs Temperature Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Efficiency vs Temperature</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.chartData.efficiencyVsTemp}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="efficiency"
                      stroke="#16a34a"
                      name="Efficiency %"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="temperature"
                      stroke="#2563eb"
                      name="Temp °C"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost per Hour Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Cost per Hour</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData.costPerHour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cost" fill="#16a34a" name="Cost ($)" />
                    <Bar dataKey="hours" fill="#94a3b8" name="Hours" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Log Hours Form */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Log Staff Hours</h3>
        <form onSubmit={handleSubmitHours} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="staffName" className="label">
                Staff Name
              </label>
              <input
                type="text"
                id="staffName"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="input"
                placeholder="Enter name"
                required
              />
            </div>
            <div>
              <label htmlFor="hours" className="label">
                Hours
              </label>
              <input
                type="number"
                id="hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="input"
                placeholder="0"
                min="0"
                max="24"
                step="0.5"
                required
              />
            </div>
            <div>
              <label htmlFor="date" className="label">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Logging...' : 'Log Hours'}
          </button>
        </form>
      </div>
    </div>
  );
}
