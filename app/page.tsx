'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { DashboardStats } from './shared/types';

// Dynamic import with SSR disabled for Recharts compatibility
const DashboardAdmin = dynamic(() => import('./blocks/ui/dashboard-admin'), {
  ssr: false,
  loading: () => (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="skeleton h-8 w-64 mb-2"></div>
        <div className="skeleton h-4 w-96"></div>
      </div>
    </div>
  ),
});

// API base URL - allow override via env, otherwise use same-origin
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

export default function Home() {
  const isMockEnv = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/dashboard/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogHours = async (staffName: string, hours: number, date: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/hours/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffName, hours, date }),
      });
      if (!response.ok) {
        throw new Error('Failed to log hours');
      }
      // Refresh stats after logging
      await fetchDashboardStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log hours');
    }
  };

  const handleSyncData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/data/sync`);
      if (!response.ok) {
        throw new Error('Failed to sync data');
      }
      // Refresh stats after sync
      await fetchDashboardStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync data');
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      {(isMockEnv || stats?.mock) && (
        <div className="mock-indicator">Mock mode enabled</div>
      )}
      <DashboardAdmin
        stats={stats}
        loading={loading}
        error={error}
        onLogHours={handleLogHours}
        onSyncData={handleSyncData}
        onRefresh={fetchDashboardStats}
      />
    </main>
  );
}
