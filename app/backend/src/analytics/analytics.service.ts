import { Injectable, Logger } from "@nestjs/common";
import { DateRange } from "../common/types/date-range.type";
import { TransactionsService } from "../transactions/transactions.service";
import { UsernamesService } from "../usernames/usernames.service";
import { MetricsService } from "../metrics/metrics.service";

export interface VolumeDataPoint {
  date: string;
  volumeUSDC: number;
  volumeXLM: number;
  total: number;
}

export interface TxCountDataPoint {
  date: string;
  count: number;
}

export interface AssetSlice {
  name: string;
  value: number;
  color: string;
}

export interface UserGrowthDataPoint {
  date: string;
  newUsers: number;
  activeUsers: number;
  totalUsers: number;
}

export interface ConversionDataPoint {
  date: string;
  linkViews: number;
  paymentAttempts: number;
  completedPayments: number;
  conversionRate: number;
}

export interface GeographicData {
  country: string;
  code: string;
  volume: number;
  transactions: number;
  users: number;
}

export interface TopPerformer {
  username: string;
  volume: number;
  transactions: number;
  avgTransactionSize: number;
}

export interface PerformanceMetrics {
  avgProcessingTime: number;
  successRate: number;
  errorRate: number;
  uptime: number;
}

export interface AnalyticsData {
  volume: VolumeDataPoint[];
  txCount: TxCountDataPoint[];
  assetDist: AssetSlice[];
  userGrowth: UserGrowthDataPoint[];
  conversionMetrics: ConversionDataPoint[];
  geographicData: GeographicData[];
  topPerformers: TopPerformer[];
  performance: PerformanceMetrics;
  summary: {
    totalVolume: number;
    totalTx: number;
    avgTxSize: number;
    changeVolumePercent: number;
    totalUsers: number;
    activeUsers: number;
    conversionRate: number;
    successRate: number;
  };
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly usernamesService: UsernamesService,
    private readonly metricsService: MetricsService,
  ) {}

  async getAnalytics(range: DateRange): Promise<AnalyticsData> {
    this.logger.log(`Generating analytics for range: ${range}`);
    
    try {
      const [volume, txCount, userGrowth, conversionMetrics, geographicData, topPerformers, performance] = await Promise.all([
        this.getVolumeData(range),
        this.getTransactionCountData(range),
        this.getUserGrowthData(range),
        this.getConversionMetrics(range),
        this.getGeographicData(),
        this.getTopPerformers(range),
        this.getPerformanceMetrics(),
      ]);

      const summary = this.calculateSummary(volume, txCount, userGrowth, conversionMetrics, performance);

      return {
        volume,
        txCount,
        assetDist: await this.getAssetDistribution(range),
        userGrowth,
        conversionMetrics,
        geographicData,
        topPerformers,
        performance,
        summary,
      };
    } catch (error) {
      this.logger.error(`Error generating analytics: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAnalyticsSummary(range: DateRange) {
    const analytics = await this.getAnalytics(range);
    return {
      summary: analytics.summary,
      performance: analytics.performance,
      topPerformers: analytics.topPerformers.slice(0, 5),
    };
  }

  async getRealTimeAnalytics() {
    // For real-time data, we would typically use Redis or a similar fast cache
    // This is a simplified implementation
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [recentVolume, recentTxCount] = await Promise.all([
      this.transactionsService.getVolumeData(last24h, now),
      this.transactionsService.getTransactionCount(last24h, now),
    ]);

    return {
      timestamp: now.toISOString(),
      volume24h: recentVolume,
      transactions24h: recentTxCount,
      activeUsers: await this.usernamesService.getActiveUserCount(last24h, now),
      performance: await this.getPerformanceMetrics(),
    };
  }

  async exportAnalytics(format: "csv" | "json" | "pdf", range: DateRange) {
    const analytics = await this.getAnalytics(range);
    
    switch (format) {
      case "csv":
        return this.generateCSV(analytics);
      case "json":
        return analytics;
      case "pdf":
        return this.generatePDFReport(analytics);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private async getVolumeData(range: DateRange): Promise<VolumeDataPoint[]> {
    const { startDate, endDate, interval } = this.getDateRange(range);
    return this.transactionsService.getVolumeData(startDate, endDate, interval);
  }

  private async getTransactionCountData(range: DateRange): Promise<TxCountDataPoint[]> {
    const { startDate, endDate, interval } = this.getDateRange(range);
    return this.transactionsService.getTransactionCountData(startDate, endDate, interval);
  }

  private async getUserGrowthData(range: DateRange): Promise<UserGrowthDataPoint[]> {
    const { startDate, endDate, interval } = this.getDateRange(range);
    return this.usernamesService.getUserGrowthData(startDate, endDate, interval);
  }

  private async getConversionMetrics(range: DateRange): Promise<ConversionDataPoint[]> {
    const { startDate, endDate, interval } = this.getDateRange(range);
    // This would typically track link views -> payment attempts -> completed payments
    // For now, returning mock data structure
    return this.mockConversionMetrics(range);
  }

  private async getGeographicData(): Promise<GeographicData[]> {
    // This would typically use IP geolocation or user-provided location data
    return this.mockGeographicData();
  }

  private async getTopPerformers(range: DateRange): Promise<TopPerformer[]> {
    const { startDate, endDate } = this.getDateRange(range);
    return this.transactionsService.getTopPerformers(startDate, endDate);
  }

  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return {
      avgProcessingTime: await this.metricsService.getAverageProcessingTime(),
      successRate: await this.metricsService.getSuccessRate(),
      errorRate: await this.metricsService.getErrorRate(),
      uptime: await this.metricsService.getUptime(),
    };
  }

  private async getAssetDistribution(range: DateRange): Promise<AssetSlice[]> {
    const { startDate, endDate } = this.getDateRange(range);
    return this.transactionsService.getAssetDistribution(startDate, endDate);
  }

  private calculateSummary(
    volume: VolumeDataPoint[],
    txCount: TxCountDataPoint[],
    userGrowth: UserGrowthDataPoint[],
    conversionMetrics: ConversionDataPoint[],
    performance: PerformanceMetrics
  ) {
    const totalVolume = volume.reduce((sum, v) => sum + v.total, 0);
    const totalTx = txCount.reduce((sum, t) => sum + t.count, 0);
    const avgTxSize = totalTx > 0 ? totalVolume / totalTx : 0;
    
    const latestUserGrowth = userGrowth[userGrowth.length - 1];
    const totalUsers = latestUserGrowth?.totalUsers || 0;
    const activeUsers = latestUserGrowth?.activeUsers || 0;
    
    const avgConversionRate = conversionMetrics.length > 0
      ? conversionMetrics.reduce((sum, c) => sum + c.conversionRate, 0) / conversionMetrics.length
      : 0;

    return {
      totalVolume,
      totalTx,
      avgTxSize: Math.round(avgTxSize),
      changeVolumePercent: this.calculateVolumeChange(volume),
      totalUsers,
      activeUsers,
      conversionRate: parseFloat(avgConversionRate.toFixed(2)),
      successRate: performance.successRate,
    };
  }

  private calculateVolumeChange(volume: VolumeDataPoint[]): number {
    if (volume.length < 2) return 0;
    
    const recentPeriod = volume.slice(-Math.floor(volume.length / 2));
    const previousPeriod = volume.slice(0, Math.floor(volume.length / 2));
    
    const recentTotal = recentPeriod.reduce((sum, v) => sum + v.total, 0);
    const previousTotal = previousPeriod.reduce((sum, v) => sum + v.total, 0);
    
    return previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal) * 100 : 0;
  }

  private getDateRange(range: DateRange) {
    const now = new Date();
    let startDate: Date;
    let endDate = now;
    let interval: string;

    switch (range) {
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        interval = "hour";
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        interval = "day";
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        interval = "day";
        break;
      case "all":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year
        interval = "month";
        break;
      default:
        throw new Error(`Invalid date range: ${range}`);
    }

    return { startDate, endDate, interval };
  }

  private generateCSV(analytics: AnalyticsData): string {
    const headers = [
      "Date",
      "USDC Volume",
      "XLM Volume", 
      "Total Volume",
      "Transaction Count",
      "New Users",
      "Active Users",
      "Link Views",
      "Payment Attempts",
      "Completed Payments",
      "Conversion Rate (%)"
    ];

    const rows = analytics.volume.map((volumeItem, index) => {
      const txCount = analytics.txCount[index];
      const userGrowth = analytics.userGrowth[index];
      const conversion = analytics.conversionMetrics[index];

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
      ].join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  }

  private generatePDFReport(analytics: AnalyticsData): string {
    // In a real implementation, you would use a library like puppeteer or jsPDF
    // For now, returning a text-based report
    return `
QUICKEX ANALYTICS REPORT
Generated: ${new Date().toLocaleString()}

SUMMARY
Total Volume: $${analytics.summary.totalVolume.toLocaleString()}
Total Transactions: ${analytics.summary.totalTx.toLocaleString()}
Average Transaction Size: $${analytics.summary.avgTxSize}
Volume Change: ${analytics.summary.changeVolumePercent}%
Total Users: ${analytics.summary.totalUsers.toLocaleString()}
Active Users: ${analytics.summary.activeUsers.toLocaleString()}
Conversion Rate: ${analytics.summary.conversionRate}%
Success Rate: ${analytics.summary.successRate}%

PERFORMANCE METRICS
Average Processing Time: ${analytics.performance.avgProcessingTime}ms
Success Rate: ${analytics.performance.successRate}%
Error Rate: ${analytics.performance.errorRate}%
Uptime: ${analytics.performance.uptime}%

TOP PERFORMERS
${analytics.topPerformers.slice(0, 10).map((performer, index) => 
  `${index + 1}. ${performer.username}: $${performer.volume.toLocaleString()} (${performer.transactions} transactions)`
).join("\n")}
    `.trim();
  }

  // Mock data methods - replace with real implementations
  private async mockConversionMetrics(range: DateRange): Promise<ConversionDataPoint[]> {
    const { startDate, endDate, interval } = this.getDateRange(range);
    const points = this.getDataPointCount(range);
    
    return Array.from({ length: points }, (_, i) => {
      const date = this.getDateForIndex(startDate, i, interval);
      const linkViews = Math.floor(Math.random() * 500) + 100;
      const paymentAttempts = Math.floor(linkViews * (Math.random() * 0.2 + 0.1));
      const completedPayments = Math.floor(paymentAttempts * (Math.random() * 0.3 + 0.7));
      const conversionRate = parseFloat(((completedPayments / linkViews) * 100).toFixed(2));

      return {
        date,
        linkViews,
        paymentAttempts,
        completedPayments,
        conversionRate,
      };
    });
  }

  private async mockGeographicData(): Promise<GeographicData[]> {
    const countries = [
      { name: "United States", code: "US" },
      { name: "United Kingdom", code: "GB" },
      { name: "Germany", code: "DE" },
      { name: "France", code: "FR" },
      { name: "Canada", code: "CA" },
      { name: "Australia", code: "AU" },
      { name: "Japan", code: "JP" },
      { name: "Singapore", code: "SG" },
    ];

    return countries.map(country => ({
      country: country.name,
      code: country.code,
      volume: Math.floor(Math.random() * 5000) + 500,
      transactions: Math.floor(Math.random() * 200) + 20,
      users: Math.floor(Math.random() * 100) + 10,
    }));
  }

  private getDataPointCount(range: DateRange): number {
    switch (range) {
      case "24h": return 24;
      case "7d": return 7;
      case "30d": return 30;
      case "all": return 12;
      default: return 30;
    }
  }

  private getDateForIndex(startDate: Date, index: number, interval: string): string {
    const date = new Date(startDate);
    
    switch (interval) {
      case "hour":
        date.setHours(date.getHours() + index);
        return date.toISOString().slice(0, 13) + ":00";
      case "day":
        date.setDate(date.getDate() + index);
        return date.toISOString().slice(0, 10);
      case "month":
        date.setMonth(date.getMonth() + index);
        return date.toISOString().slice(0, 7);
      default:
        return date.toISOString().slice(0, 10);
    }
  }
}
