"use client";

/**
 * AdvancedAnalyticsDashboard.tsx
 *
 * Feature-rich analytics dashboard with real-time updates, export functionality,
 * customizable widgets, and advanced visualization options.
 */

import { useState, useCallback, useEffect } from "react";
import { useRealTimeAnalytics, useWebSocketAnalytics } from "@/hooks/useRealTimeAnalytics";
import { useAnalyticsExport } from "@/hooks/useAnalyticsExport";
import { type DateRange, type AnalyticsData } from "@/hooks/analyticsApi";
import EnhancedAnalyticsDashboard from "./EnhancedAnalyticsDashboard";

interface DashboardWidget {
  id: string;
  title: string;
  type: 'summary' | 'chart' | 'table' | 'performance';
  visible: boolean;
  order: number;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'summary', title: 'Summary Stats', type: 'summary', visible: true, order: 1 },
  { id: 'userGrowth', title: 'User Growth', type: 'chart', visible: true, order: 2 },
  { id: 'conversion', title: 'Conversion Funnel', type: 'chart', visible: true, order: 3 },
  { id: 'performance', title: 'Performance Metrics', type: 'performance', visible: true, order: 4 },
  { id: 'geographic', title: 'Geographic Distribution', type: 'chart', visible: true, order: 5 },
  { id: 'topPerformers', title: 'Top Performers', type: 'table', visible: true, order: 6 },
];

function ExportMenu({ data, onExport }: { data: AnalyticsData | null; onExport: (format: 'csv' | 'json' | 'pdf') => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-black text-neutral-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
      >
        <span>📊</span>
        Export
        <span className="text-xs">▼</span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-black/90 border border-white/10 rounded-lg shadow-xl z-50">
          <button
            onClick={() => { onExport('csv'); setIsOpen(false); }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <span>📈</span> Export as CSV
          </button>
          <button
            onClick={() => { onExport('json'); setIsOpen(false); }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <span>📄</span> Export as JSON
          </button>
          <button
            onClick={() => { onExport('pdf'); setIsOpen(false); }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <span>📋</span> Export Report
          </button>
        </div>
      )}
    </div>
  );
}

function RealTimeIndicator({ 
  isActive, 
  lastUpdated, 
  onToggle 
}: { 
  isActive: boolean; 
  lastUpdated: Date | null; 
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onToggle}
        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
          isActive 
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
            : "bg-white/5 text-neutral-500 border border-white/10 hover:text-white"
        }`}
      >
        <div className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"}`} />
        {isActive ? "Live" : "Paused"}
      </button>
      
      {lastUpdated && (
        <span className="text-xs text-neutral-500">
          Last: {lastUpdated.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

function WidgetCustomizer({ 
  widgets, 
  onWidgetToggle, 
  onWidgetReorder 
}: { 
  widgets: DashboardWidget[];
  onWidgetToggle: (id: string) => void;
  onWidgetReorder: (fromIndex: number, toIndex: number) => void;
}) {
  const [isCustomizing, setIsCustomizing] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsCustomizing(!isCustomizing)}
        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-black text-neutral-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
      >
        <span>⚙️</span>
        Customize
      </button>
      
      {isCustomizing && (
        <div className="absolute right-0 mt-2 w-64 bg-black/90 border border-white/10 rounded-lg shadow-xl z-50 p-4">
          <h3 className="text-sm font-black mb-3">Dashboard Widgets</h3>
          <div className="space-y-2">
            {widgets
              .sort((a, b) => a.order - b.order)
              .map((widget) => (
                <div key={widget.id} className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={widget.visible}
                      onChange={() => onWidgetToggle(widget.id)}
                      className="rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                    />
                    <span className="text-sm">{widget.title}</span>
                  </label>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdvancedAnalyticsDashboard() {
  const [range, setRange] = useState<DateRange>("30d");
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);

  // Real-time analytics hook
  const { data, loading, error, lastUpdated, refresh, isRealTime } = useRealTimeAnalytics({
    range,
    updateInterval: 30000, // 30 seconds
    enabled: realTimeEnabled,
  });

  // WebSocket analytics for truly real-time updates
  const { data: wsData, connectionStatus } = useWebSocketAnalytics({ 
    enabled: false // Set to true when WebSocket endpoint is available
  });

  // Export functionality
  const { exportToCSV, exportToJSON, exportToPDF } = useAnalyticsExport();

  // Use WebSocket data if available, otherwise fall back to polling data
  const analyticsData = wsData || data;

  const handleExport = useCallback((format: 'csv' | 'json' | 'pdf') => {
    if (!analyticsData) return;

    switch (format) {
      case 'csv':
        exportToCSV(analyticsData);
        break;
      case 'json':
        exportToJSON(analyticsData);
        break;
      case 'pdf':
        exportToPDF(analyticsData);
        break;
    }
  }, [analyticsData, exportToCSV, exportToJSON, exportToPDF]);

  const toggleRealTime = useCallback(() => {
    setRealTimeEnabled(!realTimeEnabled);
  }, [realTimeEnabled]);

  const toggleWidget = useCallback((widgetId: string) => {
    setWidgets(prev => 
      prev.map(w => 
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      )
    );
  }, []);

  const reorderWidgets = useCallback((fromIndex: number, toIndex: number) => {
    setWidgets(prev => {
      const newWidgets = [...prev];
      const [moved] = newWidgets.splice(fromIndex, 1);
      newWidgets.splice(toIndex, 0, moved);
      return newWidgets.map((w, i) => ({ ...w, order: i }));
    });
  }, []);

  // Auto-refresh on range change
  useEffect(() => {
    refresh();
  }, [range, refresh]);

  return (
    <section className="rounded-3xl bg-black/40 border border-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden">
      {/* Enhanced Header with Controls */}
      <div className="p-6 sm:p-10 border-b border-white/5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black mb-1">
              Advanced Analytics Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500">
              Real-time insights with customizable widgets and export options
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Filter */}
            <div className="inline-flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
              {[
                { label: "24h", value: "24h" as DateRange },
                { label: "7d", value: "7d" as DateRange },
                { label: "30d", value: "30d" as DateRange },
                { label: "All Time", value: "all" as DateRange },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                    range === r.value
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                      : "text-neutral-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Real-time Toggle */}
            <RealTimeIndicator
              isActive={isRealTime}
              lastUpdated={lastUpdated}
              onToggle={toggleRealTime}
            />

            {/* Export Menu */}
            <ExportMenu data={analyticsData} onExport={handleExport} />

            {/* Widget Customizer */}
            <WidgetCustomizer
              widgets={widgets}
              onWidgetToggle={toggleWidget}
              onWidgetReorder={reorderWidgets}
            />

            {/* Manual Refresh */}
            <button
              onClick={refresh}
              disabled={loading}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-black text-neutral-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
            >
              {loading ? "..." : "🔄"}
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
          {connectionStatus && (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-400' : 
                connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 
                'bg-red-400'
              }`} />
              <span className="text-neutral-500">
                WS: {connectionStatus}
              </span>
            </div>
          )}
          
          {error && (
            <div className="flex items-center gap-2 text-red-400">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-6 sm:p-10">
        {analyticsData ? (
          <EnhancedAnalyticsDashboard 
            data={analyticsData} 
            widgets={widgets.filter(w => w.visible)}
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-neutral-500">Loading analytics data...</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
