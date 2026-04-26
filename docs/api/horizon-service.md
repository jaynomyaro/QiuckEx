# Horizon Service API Documentation

## Overview

The HorizonService provides a robust interface to the Stellar Horizon API with built-in caching, rate limiting, and path payment normalization capabilities.

## Class Definition

```typescript
@Injectable()
export class HorizonService {
  constructor(private readonly configService: AppConfigService)
  
  async getPayments(
    accountId: string,
    asset?: string,
    limit?: number,
    cursor?: string
  ): Promise<TransactionResponseDto>
  
  getCacheStats(): CacheStats
  clearCache(): void
}
```

## Configuration

### Constructor Dependencies

The HorizonService requires an `AppConfigService` instance with the following configuration:

```typescript
interface AppConfigService {
  network: 'mainnet' | 'testnet';
  cacheMaxItems?: number;     // Default: 500
  cacheTtlMs?: number;        // Default: 60000 (1 minute)
}
```

### Horizon URLs

- **Mainnet**: `https://horizon.stellar.org`
- **Testnet**: `https://horizon-testnet.stellar.org`

## Methods

### getPayments()

Retrieves payments for a specified Stellar account with optional filtering and pagination.

#### Signature

```typescript
async getPayments(
  accountId: string,
  asset?: string,
  limit: number = 20,
  cursor?: string
): Promise<TransactionResponseDto>
```

#### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `accountId` | `string` | Yes | Stellar account ID (public key) | `"GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN"` |
| `asset` | `string` | No | Asset filter (XLM or CODE:ISSUER) | `"USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335XOP3IA2M65BZDCCXN2YRC2TH"` |
| `limit` | `number` | No | Maximum transactions to return (1-200) | `20` |
| `cursor` | `string` | No | Pagination cursor (paging_token) | `"1234567890"` |

#### Returns

```typescript
interface TransactionResponseDto {
  items: TransactionItemDto[];
  nextCursor?: string;
}
```

#### Behavior

1. **Cache Check**: Checks cache for existing results
2. **Backoff Check**: Implements rate limiting with exponential backoff
3. **Horizon Query**: Fetches operations from Stellar Horizon API
4. **Payment Filtering**: Filters for payment and path payment operations
5. **Path Payment Normalization**: Applies normalization to path payments
6. **Asset Filtering**: Filters results by specified asset if provided
7. **Cache Storage**: Caches successful results
8. **Return**: Returns paginated results

#### Example Usage

```typescript
import { HorizonService } from './transactions/horizon.service';
import { AppConfigService } from '../config/app-config.service';

const configService = new AppConfigService();
configService.network = 'testnet';

const horizonService = new HorizonService(configService);

// Get all transactions
const allTransactions = await horizonService.getPayments(
  'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN'
);

// Get USDC transactions only
const usdcTransactions = await horizonService.getPayments(
  'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
  'USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335XOP3IA2M65BZDCCXN2YRC2TH'
);

// Get paginated results
const firstPage = await horizonService.getPayments(
  'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
  undefined,
  50
);

const secondPage = await horizonService.getPayments(
  'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
  undefined,
  50,
  firstPage.nextCursor
);
```

### getCacheStats()

Returns current cache statistics for monitoring and debugging.

#### Signature

```typescript
getCacheStats(): CacheStats
```

#### Returns

```typescript
interface CacheStats {
  entries: number;        // Number of cached entries
  maxEntries: number;     // Maximum cache capacity
  ttl: number;           // Cache TTL in milliseconds
  backoffEntries: number; // Number of backoff entries
}
```

#### Example

```typescript
const stats = horizonService.getCacheStats();
console.log(`Cache entries: ${stats.entries}/${stats.maxEntries}`);
console.log(`Cache TTL: ${stats.ttl}ms`);
console.log(`Backoff entries: ${stats.backoffEntries}`);
```

### clearCache()

Clears all cached data and backoff entries.

#### Signature

```typescript
clearCache(): void
```

#### Example

```typescript
horizonService.clearCache();
console.log('Cache cleared');
```

## Internal Methods

### fetchFromHorizonWithRetry()

Internal method that handles Horizon API requests with retry logic.

#### Signature

```typescript
private async fetchFromHorizonWithRetry(
  accountId: string,
  asset: string | undefined,
  limit: number,
  cursor: string | undefined,
  cacheKey: string
): Promise<TransactionResponseDto>
```

#### Retry Logic

- **Maximum Retries**: 3 attempts
- **Retry Conditions**: 5xx errors only (4xx errors are not retried)
- **Delay Calculation**: Exponential backoff with base delay of 50ms
- **Maximum Delay**: 30 seconds

#### Rate Limiting

The service implements sophisticated rate limiting:

```typescript
private calculateDelay(attempt: number): number {
  return Math.min(this.baseDelay * Math.pow(2, attempt - 1), this.maxDelay);
}
```

**Delay Examples:**
- Attempt 1: 50ms
- Attempt 2: 100ms
- Attempt 3: 200ms
- Attempt 4: 400ms (capped at 30s max)

### Path Payment Processing

The service automatically processes path payment operations:

```typescript
// Filter operations
const payments = records.filter(record =>
  record.type === 'payment' ||
  record.type === 'path_payment_strict_receive' ||
  record.type === 'path_payment_strict_send'
) as (
  | Horizon.ServerApi.PaymentOperationRecord
  | Horizon.ServerApi.PathPaymentOperationRecord
  | Horizon.ServerApi.PathPaymentStrictSendOperationRecord
)[];

// Process each payment
const items: TransactionItemDto[] = await Promise.all(
  payments.map(async (payment) => {
    // Handle different payment types with normalization
    let normalizedPayment: any = payment;
    let operationType = payment.type;
    let assetString = 'XLM';
    let amount = payment.amount;

    if (payment.type === 'path_payment_strict_send') {
      normalizedPayment = PathPaymentNormalizer.normalizePathPaymentStrictSend(
        payment as Horizon.ServerApi.PathPaymentStrictSendOperationRecord
      );
      operationType = 'path_payment_strict_send';
      assetString = PathPaymentNormalizer.assetToString(normalizedPayment.source_asset);
      amount = PathPaymentNormalizer.getPrimaryAmount(operationType, normalizedPayment.source_amount, normalizedPayment.amount);
    } else if (payment.type === 'path_payment_strict_receive') {
      normalizedPayment = PathPaymentNormalizer.normalizePathPaymentStrictReceive(
        payment as Horizon.ServerApi.PathPaymentOperationRecord
      );
      operationType = 'path_payment_strict_receive';
      assetString = PathPaymentNormalizer.assetToString(normalizedPayment.destination_asset);
      amount = PathPaymentNormalizer.getPrimaryAmount(operationType, normalizedPayment.source_amount, normalizedPayment.amount);
    }

    // Create transaction item with path payment details
    const baseItem: TransactionItemDto = {
      amount,
      asset: assetString,
      memo,
      timestamp: payment.created_at,
      txHash: payment.transaction_hash,
      pagingToken: payment.paging_token,
      operation_type: operationType,
    };

    // Add path payment specific fields
    if (operationType === 'path_payment_strict_send' || operationType === 'path_payment_strict_receive') {
      return {
        ...baseItem,
        from: normalizedPayment.from,
        to: normalizedPayment.to,
        source_asset: normalizedPayment.source_asset,
        source_amount: normalizedPayment.source_amount,
        destination_asset: normalizedPayment.destination_asset,
        destination_min: normalizedPayment.destination_min,
        path: normalizedPayment.path,
      };
    }

    return baseItem;
  }),
);
```

## Caching Strategy

### Cache Keys

Cache keys are constructed using the following format:

```
{network}:{accountId}:{asset}:{limit}:{cursor}
```

**Examples:**
- `testnet:GAAZI...:any:20:start`
- `mainnet:GAAZI...:USDC:GA123:50:1234567890`

### Cache Configuration

```typescript
// Transaction cache
const transactionCache = new LRUCache<string, TransactionResponseDto>({
  max: configService.cacheMaxItems || 500,
  ttl: configService.cacheTtlMs || 60000, // 1 minute
  updateAgeOnGet: true,
});

// Backoff cache for rate limiting
const backoffCache = new LRUCache<string, { attempts: number; lastAttempt: number }>({
  max: 1000,
  ttl: 300000, // 5 minutes
});
```

### Cache Behavior

1. **Cache Hit**: Returns cached result immediately
2. **Cache Miss**: Fetches from Horizon API
3. **Cache Store**: Stores successful results (except after backoff recovery)
4. **Cache Update**: Updates access time on retrieval
5. **Cache Eviction**: LRU eviction when capacity exceeded

## Error Handling

### HTTP Status Code Handling

```typescript
private handleHorizonError(error: unknown): never {
  const err = error as { response?: { status: number; data: unknown }; message?: string };

  if (err.response) {
    const status = err.response.status;

    switch (status) {
      case 429:
        throw new HttpException(
          'Horizon service rate limit exceeded. Please try again later.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );

      case 502:
      case 503:
      case 504:
        throw new HttpException(
          'Horizon service temporarily unavailable. Please try again later.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );

      case 500:
        throw new HttpException(
          'Horizon service encountered an internal error.',
          HttpStatus.BAD_GATEWAY,
        );

      default:
        throw new HttpException(
          'Invalid request to Horizon service',
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  throw new HttpException(
    'Internal server error while fetching transactions',
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
}
```

### Rate Limiting Errors

When rate limits are exceeded, the service returns a detailed error response:

```typescript
{
  "statusCode": 503,
  "error": "Service temporarily unavailable due to rate limiting. Please try again in 2.500 seconds."
}
```

### Backoff Recovery

The service tracks failed requests and implements exponential backoff:

```typescript
private updateBackoff(cacheKey: string): void {
  const existing = this.backoffCache.get(cacheKey);
  const attempts = existing ? Math.min(existing.attempts + 1, this.maxRetries) : 1;
  this.backoffCache.set(cacheKey, { attempts, lastAttempt: Date.now() });
}
```

## Performance Considerations

### Memory Usage

- **Cache Size**: Configurable maximum entries (default: 500)
- **Backoff Cache**: Separate cache for rate limiting (max: 1000 entries)
- **TTL**: Configurable cache TTL (default: 1 minute)

### Network Optimization

- **Batch Processing**: Processes multiple operations in parallel
- **Connection Reuse**: Reuses Horizon server connection
- **Request Optimization**: Minimizes unnecessary API calls

### Caching Benefits

- **Reduced Latency**: Cached responses served immediately
- **Rate Limit Protection**: Reduces API call frequency
- **Cost Efficiency**: Fewer API calls to Horizon service

## Monitoring and Debugging

### Cache Statistics

Monitor cache performance with `getCacheStats()`:

```typescript
const stats = horizonService.getCacheStats();
const hitRate = (stats.entries / stats.maxEntries) * 100;
console.log(`Cache utilization: ${hitRate.toFixed(2)}%`);
```

### Logging

The service includes comprehensive logging:

```typescript
this.logger.log(`HorizonService initialized for ${this.configService.network} network`);
this.logger.log(`Cache configured: max=${this.cache.max}, ttl=${this.cache.ttl}ms`);
this.logger.debug(`Cache hit for key: ${cacheKey}`);
this.logger.warn(`Backoff in effect for key: ${cacheKey}. Delay: ${delay}ms`);
```

### Debug Mode

Enable debug logging for detailed operation information:

```typescript
// In your logger configuration
const logger = new Logger(HorizonService.name);
logger.debug('Debug mode enabled');
```

## Integration Examples

### NestJS Controller Integration

```typescript
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly horizonService: HorizonService) {}

  @Get()
  async getTransactions(@Query() query: GetTransactionsQueryDto) {
    return this.horizonService.getPayments(
      query.accountId,
      query.asset,
      query.limit,
      query.cursor
    );
  }

  @Get('cache-stats')
  getCacheStats() {
    return this.horizonService.getCacheStats();
  }

  @Delete('cache')
  clearCache() {
    this.horizonService.clearCache();
    return { message: 'Cache cleared successfully' };
  }
}
```

### Custom Service Integration

```typescript
@Injectable()
export class CustomTransactionService {
  constructor(private readonly horizonService: HorizonService) {}

  async getAccountSummary(accountId: string) {
    const transactions = await this.horizonService.getPayments(accountId);
    
    const summary = {
      totalTransactions: transactions.items.length,
      pathPayments: transactions.items.filter(t => 
        t.operation_type?.includes('path_payment')
      ).length,
      regularPayments: transactions.items.filter(t => 
        t.operation_type === 'payment'
      ).length,
      assets: [...new Set(transactions.items.map(t => t.asset))],
    };

    return summary;
  }

  async getPathPayments(accountId: string) {
    const transactions = await this.horizonService.getPayments(accountId);
    
    return transactions.items.filter(transaction => 
      transaction.operation_type?.includes('path_payment')
    );
  }
}
```

## Testing

### Unit Tests

```typescript
describe('HorizonService', () => {
  let service: HorizonService;
  let configService: AppConfigService;

  beforeEach(async () => {
    configService = {
      network: 'testnet',
      cacheMaxItems: 100,
      cacheTtlMs: 1000,
    };

    service = new HorizonService(configService);
  });

  describe('getPayments', () => {
    it('should return transactions for valid account', async () => {
      const result = await service.getPayments(
        'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN'
      );

      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should filter by asset', async () => {
      const result = await service.getPayments(
        'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
        'XLM'
      );

      expect(result.items.every(item => item.asset === 'XLM')).toBe(true);
    });

    it('should respect pagination', async () => {
      const result = await service.getPayments(
        'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
        undefined,
        5
      );

      expect(result.items.length).toBeLessThanOrEqual(5);
    });
  });

  describe('cache operations', () => {
    it('should return cache stats', () => {
      const stats = service.getCacheStats();
      expect(stats).toHaveProperty('entries');
      expect(stats).toHaveProperty('maxEntries');
      expect(stats).toHaveProperty('ttl');
    });

    it('should clear cache', () => {
      expect(() => service.clearCache()).not.toThrow();
    });
  });
});
```

### Integration Tests

```typescript
describe('HorizonService Integration', () => {
  let service: HorizonService;

  beforeAll(() => {
    const configService = {
      network: 'testnet',
      cacheMaxItems: 50,
      cacheTtlMs: 5000,
    };
    service = new HorizonService(configService);
  });

  it('should handle real Horizon API calls', async () => {
    const result = await service.getPayments(
      'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
      undefined,
      10
    );

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0]).toHaveProperty('txHash');
    expect(result.items[0]).toHaveProperty('amount');
    expect(result.items[0]).toHaveProperty('asset');
  });

  it('should normalize path payments', async () => {
    const result = await service.getPayments(
      'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN'
    );

    const pathPayments = result.items.filter(item => 
      item.operation_type?.includes('path_payment')
    );

    pathPayments.forEach(payment => {
      expect(payment).toHaveProperty('source_asset');
      expect(payment).toHaveProperty('destination_asset');
      expect(payment).toHaveProperty('source_amount');
    });
  });
});
```

## Best Practices

### Configuration

1. **Environment-Specific Config**: Use different configurations for development and production
2. **Cache Sizing**: Adjust cache size based on expected usage patterns
3. **TTL Optimization**: Balance cache freshness with performance

### Error Handling

1. **Graceful Degradation**: Handle Horizon service unavailability gracefully
2. **User Feedback**: Provide clear error messages to users
3. **Retry Logic**: Implement appropriate retry strategies for different error types

### Performance

1. **Cache Warming**: Pre-populate cache for frequently accessed accounts
2. **Batch Operations**: Process multiple requests efficiently
3. **Monitoring**: Track cache hit rates and response times

### Security

1. **Input Validation**: Validate account IDs and asset formats
2. **Rate Limiting**: Respect Horizon API rate limits
3. **Error Information**: Avoid exposing sensitive information in error messages

---

This comprehensive documentation covers all aspects of the HorizonService, including configuration, usage, error handling, performance considerations, and integration examples. The service provides a robust foundation for Stellar transaction processing with built-in optimization and reliability features.
