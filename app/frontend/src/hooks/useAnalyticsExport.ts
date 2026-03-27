"use client";

import { useCallback } from "react";
import type { AnalyticsData } from "./analyticsApi";

export function useAnalyticsExport() {
  const exportToCSV = useCallback((data: AnalyticsData, filename?: string) => {
    const csvContent = generateCSV(data);
    downloadFile(csvContent, filename || `analytics-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  }, []);

  const exportToJSON = useCallback((data: AnalyticsData, filename?: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, filename || `analytics-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  }, []);

  const exportToPDF = useCallback(async (data: AnalyticsData, filename?: string) => {
    // Note: For PDF export, you'd typically use a library like jsPDF or puppeteer
    // This is a simplified version that creates a text-based report
    const reportContent = generateTextReport(data);
    downloadFile(reportContent, filename || `analytics-report-${new Date().toISOString().split('T')[0]}.txt`, 'text/plain');
  }, []);

  return {
    exportToCSV,
    exportToJSON,
    exportToPDF,
  };
}

function generateCSV(data: AnalyticsData): string {
  const headers = [
    'Date',
    'USDC Volume',
    'XLM Volume',
    'Total Volume',
    'Transaction Count',
    'New Users',
    'Active Users',
    'Link Views',
    'Payment Attempts',
    'Completed Payments',
    'Conversion Rate (%)'
  ];

  const rows = data.volume.map((volumeItem, index) => {
    const txCount = data.txCount[index];
    const userGrowth = data.userGrowth[index];
    const conversion = data.conversionMetrics[index];

    return [
      volumeItem.date,
      volumeItem.volumeUSDC,
      volumeItem.volumeXLM,
      volumeItem.total,
      txCount?.count || 0,
      userGrowth?.newUsers || 0,
      userGrowth?.activeUsers || 0,
      conversion?.linkViews || 0,
      conversion?.paymentAttempts || 0,
      conversion?.completedPayments || 0,
      conversion?.conversionRate || 0
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

function generateTextReport(data: AnalyticsData): string {
  const report = `
QUICKEX ANALYTICS REPORT
Generated: ${new Date().toLocaleString()}

=== SUMMARY ===
Total Volume: $${data.summary.totalVolume.toLocaleString()}
Total Transactions: ${data.summary.totalTx.toLocaleString()}
Average Transaction Size: $${data.summary.avgTxSize}
Volume Change: ${data.summary.changeVolumePercent}%
Total Users: ${data.summary.totalUsers.toLocaleString()}
Active Users: ${data.summary.activeUsers.toLocaleString()}
Conversion Rate: ${data.summary.conversionRate}%
Success Rate: ${data.summary.successRate}%

=== PERFORMANCE METRICS ===
Average Processing Time: ${data.performance.avgProcessingTime}ms
Success Rate: ${data.performance.successRate}%
Error Rate: ${data.performance.errorRate}%
Uptime: ${data.performance.uptime}%

=== TOP PERFORMERS ===
${data.topPerformers.slice(0, 10).map((performer, index) => 
  `${index + 1}. ${performer.username}: $${performer.volume.toLocaleString()} (${performer.transactions} transactions)`
).join('\n')}

=== GEOGRAPHIC DISTRIBUTION ===
${data.geographicData.map(geo => 
  `${geo.country}: $${geo.volume.toLocaleString()} (${geo.transactions} transactions, ${geo.users} users)`
).join('\n')}

=== ASSET DISTRIBUTION ===
${data.assetDist.map(asset => 
  `${asset.name}: ${asset.value}%`
).join('\n')}
`;

  return report.trim();
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function generateScheduledReport(data: AnalyticsData, format: 'csv' | 'json' | 'pdf' = 'csv'): string {
  switch (format) {
    case 'csv':
      return generateCSV(data);
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'pdf':
      return generateTextReport(data);
    default:
      return generateCSV(data);
  }
}
