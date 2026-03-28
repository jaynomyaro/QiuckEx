import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { DateRange } from "../common/types/date-range.type";

@ApiTags("analytics")
@Controller("analytics")
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @ApiOperation({
    summary: "Get analytics data",
    description: "Returns comprehensive analytics data including volume, transactions, user growth, and performance metrics",
  })
  @ApiQuery({
    name: "range",
    required: false,
    enum: ["24h", "7d", "30d", "all"],
    description: "Date range for analytics data",
  })
  @ApiResponse({
    status: 200,
    description: "Analytics data retrieved successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid date range provided",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized access",
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error",
  })
  async getAnalytics(@Query("range") range: DateRange = "30d") {
    try {
      this.logger.log(`Fetching analytics for range: ${range}`);
      
      // Validate date range
      const validRanges: DateRange[] = ["24h", "7d", "30d", "all"];
      if (!validRanges.includes(range)) {
        throw new BadRequestException(`Invalid date range: ${range}`);
      }

      const analyticsData = await this.analyticsService.getAnalytics(range);
      return analyticsData;
    } catch (error) {
      this.logger.error(`Failed to fetch analytics: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException("Failed to retrieve analytics data");
    }
  }

  @Get("summary")
  @ApiOperation({
    summary: "Get analytics summary",
    description: "Returns a summary of key analytics metrics",
  })
  @ApiQuery({
    name: "range",
    required: false,
    enum: ["24h", "7d", "30d", "all"],
    description: "Date range for summary data",
  })
  @ApiResponse({
    status: 200,
    description: "Analytics summary retrieved successfully",
  })
  async getAnalyticsSummary(@Query("range") range: DateRange = "30d") {
    try {
      this.logger.log(`Fetching analytics summary for range: ${range}`);
      
      const validRanges: DateRange[] = ["24h", "7d", "30d", "all"];
      if (!validRanges.includes(range)) {
        throw new BadRequestException(`Invalid date range: ${range}`);
      }

      const summary = await this.analyticsService.getAnalyticsSummary(range);
      return summary;
    } catch (error) {
      this.logger.error(`Failed to fetch analytics summary: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException("Failed to retrieve analytics summary");
    }
  }

  @Get("real-time")
  @ApiOperation({
    summary: "Get real-time analytics",
    description: "Returns real-time analytics data for live dashboard updates",
  })
  @ApiResponse({
    status: 200,
    description: "Real-time analytics retrieved successfully",
  })
  async getRealTimeAnalytics() {
    try {
      this.logger.log("Fetching real-time analytics");
      
      const realTimeData = await this.analyticsService.getRealTimeAnalytics();
      return realTimeData;
    } catch (error) {
      this.logger.error(`Failed to fetch real-time analytics: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to retrieve real-time analytics");
    }
  }

  @Get("export")
  @ApiOperation({
    summary: "Export analytics data",
    description: "Exports analytics data in specified format",
  })
  @ApiQuery({
    name: "format",
    required: true,
    enum: ["csv", "json", "pdf"],
    description: "Export format",
  })
  @ApiQuery({
    name: "range",
    required: false,
    enum: ["24h", "7d", "30d", "all"],
    description: "Date range for export data",
  })
  @ApiResponse({
    status: 200,
    description: "Analytics data exported successfully",
  })
  async exportAnalytics(
    @Query("format") format: "csv" | "json" | "pdf",
    @Query("range") range: DateRange = "30d"
  ) {
    try {
      this.logger.log(`Exporting analytics data in ${format} format for range: ${range}`);
      
      const validFormats = ["csv", "json", "pdf"];
      if (!validFormats.includes(format)) {
        throw new BadRequestException(`Invalid export format: ${format}`);
      }

      const validRanges: DateRange[] = ["24h", "7d", "30d", "all"];
      if (!validRanges.includes(range)) {
        throw new BadRequestException(`Invalid date range: ${range}`);
      }

      const exportData = await this.analyticsService.exportAnalytics(format, range);
      return exportData;
    } catch (error) {
      this.logger.error(`Failed to export analytics: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException("Failed to export analytics data");
    }
  }
}
