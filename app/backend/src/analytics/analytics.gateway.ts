import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
  namespace: "/analytics",
})
export class AnalyticsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AnalyticsGateway.name);
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(private readonly analyticsService: AnalyticsService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Send initial data
    this.sendAnalyticsUpdate(client);
    
    // Set up periodic updates for this client
    const interval = setInterval(() => {
      this.sendAnalyticsUpdate(client);
    }, 30000); // Update every 30 seconds
    
    this.intervals.set(client.id, interval);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Clear interval for this client
    const interval = this.intervals.get(client.id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(client.id);
    }
  }

  @SubscribeMessage("subscribe-analytics")
  async handleSubscribeAnalytics(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { range?: "24h" | "7d" | "30d" | "all" },
  ) {
    this.logger.log(`Client ${client.id} subscribed to analytics with range: ${data.range || "30d"}`);
    
    // Store client preference
    client.data.range = data.range || "30d";
    
    // Send immediate update
    await this.sendAnalyticsUpdate(client);
  }

  @SubscribeMessage("get-real-time-metrics")
  async handleGetRealTimeMetrics(@ConnectedSocket() client: Socket) {
    try {
      const realTimeData = await this.analyticsService.getRealTimeAnalytics();
      client.emit("real-time-metrics", realTimeData);
    } catch (error) {
      this.logger.error(`Error sending real-time metrics: ${error.message}`);
      client.emit("error", { message: "Failed to fetch real-time metrics" });
    }
  }

  private async sendAnalyticsUpdate(client: Socket) {
    try {
      const range = client.data.range || "30d";
      const analyticsData = await this.analyticsService.getAnalytics(range);
      
      client.emit("analytics-update", {
        data: analyticsData,
        timestamp: new Date().toISOString(),
        range,
      });
    } catch (error) {
      this.logger.error(`Error sending analytics update: ${error.message}`);
      client.emit("error", { message: "Failed to fetch analytics data" });
    }
  }

  // Method to broadcast updates to all connected clients
  async broadcastAnalyticsUpdate(range: "24h" | "7d" | "30d" | "all" = "30d") {
    try {
      const analyticsData = await this.analyticsService.getAnalytics(range);
      
      this.server.emit("analytics-update", {
        data: analyticsData,
        timestamp: new Date().toISOString(),
        range,
      });
    } catch (error) {
      this.logger.error(`Error broadcasting analytics update: ${error.message}`);
    }
  }

  // Method to broadcast real-time metrics
  async broadcastRealTimeMetrics() {
    try {
      const realTimeData = await this.analyticsService.getRealTimeAnalytics();
      
      this.server.emit("real-time-metrics", {
        data: realTimeData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Error broadcasting real-time metrics: ${error.message}`);
    }
  }
}
