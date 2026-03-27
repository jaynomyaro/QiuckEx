"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { fetchAnalytics, type DateRange, type AnalyticsData } from "./analyticsApi";

interface RealTimeAnalyticsOptions {
  range: DateRange;
  updateInterval?: number; // in milliseconds
  enabled?: boolean;
}

export function useRealTimeAnalytics({ 
  range, 
  updateInterval = 30000, // 30 seconds default
  enabled = true 
}: RealTimeAnalyticsOptions) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchAnalytics(range);
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch analytics";
      setError(message);
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  const startRealTimeUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (enabled) {
      intervalRef.current = setInterval(loadData, updateInterval);
    }
  }, [loadData, updateInterval, enabled]);

  const stopRealTimeUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
    startRealTimeUpdates();

    return () => {
      stopRealTimeUpdates();
    };
  }, [loadData, startRealTimeUpdates, stopRealTimeUpdates]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    isRealTime: enabled && intervalRef.current !== null,
  };
}

export function useWebSocketAnalytics({ enabled = true }: { enabled?: boolean } = {}) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (!enabled || socketRef.current?.connected) {
      return;
    }

    try {
      setConnectionStatus('connecting');
      // In production, this would be your WebSocket endpoint
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
      socketRef.current = io(wsUrl, {
        transports: ['websocket', 'polling'],
      });

      socketRef.current.on('connect', () => {
        setConnectionStatus('connected');
        console.log('Socket.IO connected for real-time analytics');
      });

      socketRef.current.on('analytics-update', (event) => {
        try {
          const analyticsData = event.data as AnalyticsData;
          setData(analyticsData);
        } catch (error) {
          console.error('Failed to parse Socket.IO message:', error);
        }
      });

      socketRef.current.on('real-time-metrics', (event) => {
        console.log('Real-time metrics received:', event.data);
      });

      socketRef.current.on('disconnect', () => {
        setConnectionStatus('disconnected');
        console.log('Socket.IO disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(connect, 5000);
      });

      socketRef.current.on('connect_error', () => {
        setConnectionStatus('error');
        console.error('Socket.IO connection error');
      });

    } catch (error) {
      setConnectionStatus('error');
      console.error('Failed to create Socket.IO connection:', error);
    }
  }, [enabled]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, enabled]);

  return {
    data,
    connectionStatus,
    connect,
    disconnect,
  };
}
