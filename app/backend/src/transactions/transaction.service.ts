import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import * as StellarSdk from "@stellar/stellar-sdk";
import { rpc as SorobanRpc } from "@stellar/stellar-sdk";
import { ComposeTransactionDto } from "./dto/compose-transaction.dto";
import {
  ComposeTransactionResponse,
  ComposeTransactionError,
  ResourceEstimate,
  FeeEstimate,
} from "./dto/compose-transaction-response.dto";
import { buildScVal } from "./utils/param-builder";
import { SorobanRpcService } from "./soroban-rpc.service";
import { mapSimulationError } from "./simulation-error.mapper";

const STROOPS_PER_XLM = 10_000_000;
const BASE_FEE = 100; // stroops

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(private readonly sorobanRpcService: SorobanRpcService) {}

  async composeTransaction(
    dto: ComposeTransactionDto,
  ): Promise<ComposeTransactionResponse | ComposeTransactionError> {
    const startTime = Date.now();

    // 1. Resolve network passphrase
    const networkPassphrase =
      dto.networkPassphrase ??
      (await this.sorobanRpcService.getNetworkPassphrase());

    // 2. Load source account from network (gets current sequence number)
    let account: StellarSdk.Account;
    try {
      account = await this.sorobanRpcService.getAccount(dto.sourceAccount);
    } catch (err) {
      return {
        success: false,
        error: err.message,
        userMessage: `Source account not found: ${err.message}`,
      };
    }

    // 3. Build ScVal params
    let scParams: StellarSdk.xdr.ScVal[];
    try {
      scParams = dto.params.map(buildScVal);
    } catch (err) {
      throw new BadRequestException(`Invalid parameter: ${err.message}`);
    }

    // 4. Build the contract invocation operation
    const contract = new StellarSdk.Contract(dto.contractId);
    const operation = contract.call(dto.method, ...scParams);

    // 5. Build transaction envelope (no private key — unsigned)
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: String(BASE_FEE),
      networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(StellarSdk.TimeoutInfinite)
      .build();

    // 6. Simulate (preflight)
    this.logger.debug(
      `Simulating transaction: ${dto.contractId}::${dto.method}`,
    );

    let simulationResult: SorobanRpc.Api.SimulateTransactionResponse;
    try {
      simulationResult = await this.sorobanRpcService.simulateTransaction(tx);
    } catch (err) {
      this.logger.error("RPC simulation request failed", err);
      throw new InternalServerErrorException(
        "Failed to reach Soroban RPC provider.",
      );
    }

    const simulationLatencyMs = Date.now() - startTime;

    // 7. Handle simulation failure
    if (SorobanRpc.Api.isSimulationError(simulationResult)) {
      const mapped = mapSimulationError(simulationResult.error);
      this.logger.warn(`Simulation failed: ${simulationResult.error}`);
      return {
        success: false,
        error: mapped.technicalError,
        userMessage: mapped.userMessage,
        details: mapped.details,
      };
    }

    // 8. Handle restoration needed
    if (SorobanRpc.Api.isSimulationRestore(simulationResult)) {
      return {
        success: false,
        error: "RESTORE_REQUIRED",
        userMessage:
          "Some contract state entries have expired and must be restored before this transaction can proceed. Please run a restore operation first.",
        details: {
          restorePreamble: simulationResult.restorePreamble,
        },
      } as ComposeTransactionError;
    }

    // 9. Assemble transaction with simulation results (sets soroban data & resource fee)
    const assembledTx = SorobanRpc.assembleTransaction(
      tx,
      simulationResult,
    ).build();

    // 10. Extract resource estimates  ← REPLACE FROM HERE
    const sorobanData = simulationResult.transactionData.build();
    const resources = sorobanData.resources();

    const resourceEstimate: ResourceEstimate = {
      cpuInstructions: Number(resources.instructions()),
      memoryBytes: 0, // not exposed by Soroban RPC simulate response
      ledgerReads:
        resources.footprint().readOnly().length +
        resources.footprint().readWrite().length,
      ledgerWrites: resources.footprint().readWrite().length,
      eventBytes: Number(resources.writeBytes() ?? 0),
      returnValueBytes: simulationResult.result?.retval
        ? simulationResult.result.retval.toXDR().length
        : 0,
    };

    // 11. Fee breakdown
    const minResourceFee = simulationResult.minResourceFee ?? "0";
    const totalFeeStroops = BASE_FEE + Number(minResourceFee);

    const feeEstimate: FeeEstimate = {
      baseFee: String(BASE_FEE),
      inclusionFee: minResourceFee,
      totalFee: String(totalFeeStroops),
      totalFeeXLM: (totalFeeStroops / STROOPS_PER_XLM).toFixed(7),
    };

    // 12. Return unsigned XDR
    const unsignedXdr = assembledTx.toEnvelope().toXDR("base64");

    this.logger.log(
      `Transaction composed successfully in ${simulationLatencyMs}ms — ` +
        `${dto.contractId}::${dto.method}, fee: ${totalFeeStroops} stroops`,
    );

    return {
      success: true,
      unsignedXdr,
      resourceEstimate,
      feeEstimate,
      minResourceFee,
      simulationLatencyMs,
    };
  }

  // Analytics-specific methods
  async getVolumeData(startDate: Date, endDate: Date, interval: string): Promise<any[]> {
    // This would typically query the database for transaction volume data
    // For now, returning mock data structure
    const points = this.getDataPointCount(interval);
    return Array.from({ length: points }, (_, i) => {
      const date = this.getDateForIndex(startDate, i, interval);
      const volumeUSDC = Math.floor(Math.random() * 1800) + 200;
      const volumeXLM = Math.floor(Math.random() * 600) + 80;
      
      return {
        date,
        volumeUSDC,
        volumeXLM,
        total: volumeUSDC + volumeXLM,
      };
    });
  }

  async getTransactionCountData(startDate: Date, endDate: Date, interval: string): Promise<any[]> {
    // This would typically query the database for transaction count data
    const points = this.getDataPointCount(interval);
    return Array.from({ length: points }, (_, i) => {
      const date = this.getDateForIndex(startDate, i, interval);
      const count = Math.floor(Math.random() * 42) + 4;
      
      return {
        date,
        count,
      };
    });
  }

  async getAssetDistribution(startDate: Date, endDate: Date): Promise<any[]> {
    // This would typically query the database for asset distribution
    return [
      { name: "USDC", value: Math.floor(Math.random() * 15) + 48, color: "#6366f1" },
      { name: "XLM", value: Math.floor(Math.random() * 10) + 25, color: "#8b5cf6" },
      { name: "Other", value: Math.floor(Math.random() * 10) + 5, color: "#334155" },
    ];
  }

  async getTopPerformers(startDate: Date, endDate: Date): Promise<any[]> {
    // This would typically query the database for top performing users
    const usernames = ["alice", "bob", "charlie", "diana", "eve"];
    return usernames.map(username => ({
      username,
      volume: Math.floor(Math.random() * 9000) + 1000,
      transactions: Math.floor(Math.random() * 90) + 10,
      avgTransactionSize: Math.floor(Math.random() * 450) + 50,
    })).sort((a, b) => b.volume - a.volume);
  }

  async getVolume(startDate: Date, endDate: Date): Promise<number> {
    // This would typically sum up all transaction volumes in the date range
    return Math.floor(Math.random() * 50000) + 10000;
  }

  async getTransactionCount(startDate: Date, endDate: Date): Promise<number> {
    // This would typically count all transactions in the date range
    return Math.floor(Math.random() * 500) + 100;
  }

  private getDataPointCount(interval: string): number {
    switch (interval) {
      case "hour": return 24;
      case "day": return 30;
      case "month": return 12;
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
