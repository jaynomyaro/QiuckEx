"use client";

/**
 * EnhancedAnalyticsDashboard.tsx
 *
 * Advanced analytics dashboard with comprehensive metrics for QuickEx.
 * Features user growth, conversion funnels, geographic distribution,
 * top performers, and real-time performance monitoring.
 */

import { useEffect, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";
import { fetchAnalytics, type DateRange, type AnalyticsData } from "@/hooks/analyticsApi";

interface DashboardWidget {
  id: string;
  title: string;
  type: 'summary' | 'chart' | 'table' | 'performance';
  visible: boolean;
  order: number;
}

const RANGES: { label: string; value: DateRange }[] = [
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "All Time", value: "all" },
];

function DateRangeFilter({
  active,
  onChange,
}: {
  active: DateRange;
  onChange: (r: DateRange) => void;
}) {
  return (
    <div className="inline-flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
            active === r.value
              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
              : "text-neutral-500 hover:text-white hover:bg-white/5"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: "rgba(10,10,20,0.9)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  labelStyle: { color: "#6366f1", fontWeight: 800 },
};

function ChartSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-3 h-full">
      <div className="h-4 bg-white/5 rounded w-1/3" />
      <div className="flex-1 bg-white/[0.03] rounded-2xl" />
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  icon,
}: {
  label: string;
  value: string;
  change?: number;
  icon?: string;
}) {
  const positive = (change ?? 0) >= 0;
  return (
    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
          {label}
        </p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p className="text-2xl font-black">{value}</p>
      {change !== undefined && (
        <span
          className={`text-[11px] font-black px-2 py-0.5 w-fit rounded-lg ${
            positive
              ? "text-emerald-400 bg-emerald-400/10"
              : "text-red-400 bg-red-400/10"
          }`}
        >
          {positive ? "+" : ""}
          {change}%
        </span>
      )}
    </div>
  );
}

function PerformanceGauge({
  label,
  value,
  max,
  unit,
  color,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
}) {
  const percentage = (value / max) * 100;
  return (
    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
        {label}
      </p>
      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-lg font-black mt-2">
        {value}
        <span className="text-xs text-neutral-500 ml-1">{unit}</span>
      </p>
    </div>
  );
}

function TopPerformersTable({ performers }: { performers: AnalyticsData["topPerformers"] }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">
          Top Performers
        </h3>
      </div>
      <div className="divide-y divide-white/5">
        {performers.slice(0, 5).map((performer, index) => (
          <div key={performer.username} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <span className="text-xs font-black text-indigo-400">#{index + 1}</span>
              </div>
              <div>
                <p className="text-sm font-black">{performer.username}</p>
                <p className="text-xs text-neutral-500">
                  {performer.transactions} transactions
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black">${performer.volume.toLocaleString()}</p>
              <p className="text-xs text-neutral-500">
                Avg: ${performer.avgTransactionSize}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EnhancedAnalyticsDashboard({ 
  data, 
  widgets 
}: { 
  data?: AnalyticsData; 
  widgets?: DashboardWidget[] 
}) {
  const [range, setRange] = useState<DateRange>("30d");
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(data || null);

  const load = useCallback((r: DateRange) => {
    if (data) {
      // If data is provided via props, use it
      setAnalyticsData(data);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    fetchAnalytics(r).then((d) => {
      setAnalyticsData(d);
      setLoading(false);
    });
  }, [data]);

  useEffect(() => {
    load(range);
  }, [range, load]);

  const { summary, volume, txCount, assetDist, userGrowth, conversionMetrics, geographicData, topPerformers, performance } = analyticsData ?? {
    summary: null,
    volume: [],
    txCount: [],
    assetDist: [],
    userGrowth: [],
    conversionMetrics: [],
    geographicData: [],
    topPerformers: [],
    performance: null,
  };

  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;

  return (
    <section className="rounded-3xl bg-black/40 border border-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 sm:p-10 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black mb-1">
            Enhanced Analytics
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500">
            Comprehensive insights into user growth, conversions, and performance
          </p>
        </div>
        <DateRangeFilter active={range} onChange={setRange} />
      </div>

      <div className="p-6 sm:p-10 space-y-10">
        {/* Enhanced Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading || !summary ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse h-24 rounded-2xl bg-white/[0.03]" />
            ))
          ) : (
            <>
              <StatCard
                label="Total Revenue"
                value={fmt(summary.totalVolume)}
                change={summary.changeVolumePercent}
                icon="💰"
              />
              <StatCard
                label="Active Users"
                value={summary.activeUsers.toLocaleString()}
                icon="👥"
              />
              <StatCard
                label="Conversion Rate"
                value={`${summary.conversionRate}%`}
                icon="📈"
              />
              <StatCard
                label="Success Rate"
                value={`${summary.successRate}%`}
                icon="✅"
              />
            </>
          )}
        </div>

        {/* User Growth Chart */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-5">
            User Growth
          </h3>
          <div className="h-64">
            {loading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gNewUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gActiveUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#525252", fontSize: 10, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "#525252", fontSize: 10, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip {...tooltipStyle} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, fontWeight: 800, paddingTop: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#gNewUsers)"
                    name="New Users"
                  />
                  <Area
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#gActiveUsers)"
                    name="Active Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Conversion Funnel & Performance Metrics */}
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Conversion Funnel */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-5">
              Conversion Funnel
            </h3>
            <div className="h-56">
              {loading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionMetrics.slice(-7)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#525252", fontSize: 10, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#525252", fontSize: 10, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 800 }} />
                    <Bar dataKey="linkViews" fill="#6366f1" name="Link Views" />
                    <Bar dataKey="paymentAttempts" fill="#8b5cf6" name="Payment Attempts" />
                    <Bar dataKey="completedPayments" fill="#10b981" name="Completed Payments" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-5">
              Performance Metrics
            </h3>
            <div className="space-y-3">
              {loading || !performance ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse h-16 rounded-2xl bg-white/[0.03]" />
                ))
              ) : (
                <>
                  <PerformanceGauge
                    label="Avg Processing Time"
                    value={performance.avgProcessingTime}
                    max={1000}
                    unit="ms"
                    color="#6366f1"
                  />
                  <PerformanceGauge
                    label="Success Rate"
                    value={performance.successRate}
                    max={100}
                    unit="%"
                    color="#10b981"
                  />
                  <PerformanceGauge
                    label="Uptime"
                    value={performance.uptime}
                    max={100}
                    unit="%"
                    color="#8b5cf6"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Geographic Distribution & Top Performers */}
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Geographic Distribution */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-5">
              Geographic Distribution
            </h3>
            <div className="h-56">
              {loading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={geographicData}
                      cx="50%"
                      cy="50%"
                      innerRadius="40%"
                      outerRadius="70%"
                      dataKey="volume"
                      paddingAngle={2}
                      labelLine={false}
                    >
                      {geographicData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v?: ValueType) => [`$${Number(v ?? 0).toLocaleString()}`, "Volume"]} />
                    <Legend
                      wrapperStyle={{ fontSize: 11, fontWeight: 800 }}
                      formatter={(value) => {
                        const found = geographicData.find((d) => d.country === value);
                        return found ? `${found.code} ($${(found.volume / 1000).toFixed(1)}k)` : value;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top Performers */}
          <div>
            <TopPerformersTable performers={topPerformers} />
          </div>
        </div>
      </div>
    </section>
  );
}
