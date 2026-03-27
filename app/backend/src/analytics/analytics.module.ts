import { Module } from "@nestjs/common";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsGateway } from "./analytics.gateway";
import { TransactionsModule } from "../transactions/transactions.module";
import { UsernamesModule } from "../usernames/usernames.module";
import { MetricsModule } from "../metrics/metrics.module";

@Module({
  imports: [TransactionsModule, UsernamesModule, MetricsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsGateway],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
