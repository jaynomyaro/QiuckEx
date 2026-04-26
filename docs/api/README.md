# QuickEx API Documentation

## Overview

This directory contains comprehensive API documentation for the QuickEx application, covering both backend services and mobile app utilities.

## Documentation Structure

### Core API Documentation

- **[Path Payment Normalization](./path-payment-normalization.md)** - Complete documentation for path payment normalization system
- **[Horizon Service](./horizon-service.md)** - Stellar Horizon API integration documentation
- **[Transaction API](./transaction-api.md)** - Transaction processing and data structures

### Mobile App Documentation

- **[Path Payment Utils](./mobile/path-payment-utils.md)** - Mobile utility functions documentation
- **[Transaction Components](./mobile/transaction-components.md)** - React Native component documentation
- **[Type Definitions](./mobile/type-definitions.md)** - TypeScript interfaces and types

### Integration Guides

- **[Backend Integration](./guides/backend-integration.md)** - Backend service integration guide
- **[Mobile Integration](./guides/mobile-integration.md)** - Mobile app integration guide
- **[Testing Guide](./guides/testing.md)** - Testing strategies and examples

### Reference Documentation

- **[Data Models](./reference/data-models.md)** - Complete data model reference
- **[Error Handling](./reference/error-handling.md)** - Error codes and handling strategies
- **[Configuration](./reference/configuration.md)** - Configuration options and environment setup

## Quick Start

### Backend Integration

1. **Install Dependencies**
   ```bash
   npm install @nestjs/swagger stellar-sdk lru-cache
   ```

2. **Import Path Payment Normalizer**
   ```typescript
   import { PathPaymentNormalizer } from './transactions/path-payment-normalizer';
   ```

3. **Use in Transaction Processing**
   ```typescript
   if (payment.type === 'path_payment_strict_send') {
     const normalized = PathPaymentNormalizer.normalizePathPaymentStrictSend(payment);
     // Process normalized transaction
   }
   ```

### Mobile App Integration

1. **Import Path Payment Utils**
   ```typescript
   import { PathPaymentUtils } from '../utils/path-payment-utils';
   ```

2. **Update Transaction Components**
   ```typescript
   const isPathPayment = PathPaymentUtils.isPathPayment(transaction);
   if (isPathPayment) {
     // Display path payment specific UI
   }
   ```

## Key Features

### Path Payment Normalization
- **Strict Send Support**: Normalize path_payment_strict_send operations
- **Strict Receive Support**: Normalize path_payment_strict_receive operations
- **Asset Standardization**: Convert assets to consistent string format
- **Path Visualization**: Human-readable conversion paths

### Enhanced Transaction Display
- **Operation Type Labels**: Clear identification of payment types
- **Conversion Display**: Show source → destination amounts
- **Path Information**: Display intermediate conversion assets
- **Copy/Share Support**: Complete transaction details sharing

### Type Safety
- **Comprehensive TypeScript**: Full type coverage for all components
- **Validation**: Input validation and error handling
- **Interface Consistency**: Aligned backend and mobile types

## API Endpoints

### Transactions

#### Get Transactions
```http
GET /api/transactions
```

**Query Parameters:**
- `accountId` (required): Stellar account ID
- `asset` (optional): Asset filter (e.g., "XLM" or "USDC:GA...")
- `limit` (optional): Maximum number of transactions (1-200, default: 20)
- `cursor` (optional): Pagination cursor

**Response:**
```json
{
  "items": [
    {
      "amount": "100.5000000",
      "asset": "XLM",
      "memo": "Payment for services",
      "timestamp": "2026-02-21T08:00:00Z",
      "txHash": "6852...a341",
      "pagingToken": "1234567890",
      "operation_type": "path_payment_strict_send",
      "from": "GD...FROM",
      "to": "GD...TO",
      "source_asset": {
        "asset_type": "native"
      },
      "source_amount": "50.0000000",
      "destination_asset": {
        "asset_type": "credit_alphanum4",
        "asset_code": "USDC",
        "asset_issuer": "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335XOP3IA2M65BZDCCXN2YRC2TH"
      },
      "destination_min": "95.0000000",
      "path": []
    }
  ],
  "nextCursor": "1234567891"
}
```

## Data Models

### TransactionItemDto

```typescript
interface TransactionItemDto {
  amount: string;                    // Transaction amount
  asset: string;                     // Asset code for display
  memo?: string;                     // Transaction memo
  timestamp: string;                 // ISO timestamp
  txHash: string;                    // Transaction hash
  pagingToken: string;               // Pagination token
  operation_type?: string;           // Operation type
  from?: string;                     // Sender account ID
  to?: string;                       // Recipient account ID
  source_asset?: PathPaymentAssetDto; // Source asset (path payments)
  source_amount?: string;            // Source amount (path payments)
  destination_asset?: PathPaymentAssetDto; // Destination asset (path payments)
  destination_min?: string;           // Minimum destination amount
  path?: PathPaymentAssetDto[];      // Conversion path assets
}
```

### PathPaymentAssetDto

```typescript
interface PathPaymentAssetDto {
  asset_type: string;    // "native" or "credit_alphanum4" / "credit_alphanum12"
  asset_code?: string;   // Asset code (credit assets only)
  asset_issuer?: string; // Asset issuer (credit assets only)
}
```

## Error Handling

### HTTP Status Codes

- **200 OK**: Successful request
- **400 Bad Request**: Invalid parameters
- **404 Not Found**: Account not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **502/503/504 Service Unavailable**: Horizon service unavailable

### Error Response Format

```json
{
  "statusCode": 400,
  "error": "Invalid Stellar account ID format",
  "message": "Invalid Stellar account ID format"
}
```

### Rate Limiting

The API implements rate limiting with exponential backoff:

- **Initial Delay**: 50ms
- **Maximum Delay**: 30 seconds
- **Maximum Retries**: 3 attempts
- **Backoff Cache**: Tracks failed requests for retry timing

## Testing

### Backend Tests

```bash
# Run all tests
npm test

# Run path payment tests
npm test -- --testNamePattern="PathPaymentNormalizer"

# Run with coverage
npm test -- --coverage
```

### Mobile App Tests

```bash
# Run mobile app tests
cd app/mobile
npm test

# Run path payment utils tests
npm test -- --testNamePattern="PathPaymentUtils"
```

## Configuration

### Environment Variables

```bash
# Backend Configuration
NODE_ENV=development
PORT=3000
NETWORK=testnet
CACHE_MAX_ITEMS=500
CACHE_TTL_MS=60000

# Stellar Configuration
HORIZON_MAINNET_URL=https://horizon.stellar.org
HORIZON_TESTNET_URL=https://horizon-testnet.stellar.org
```

### Mobile Configuration

```typescript
// app/mobile/config/app.config.ts
export const config = {
  horizonUrl: 'https://horizon-testnet.stellar.org',
  cacheConfig: {
    maxItems: 500,
    ttl: 60000,
  },
  rateLimit: {
    maxRetries: 3,
    baseDelay: 50,
    maxDelay: 30000,
  },
};
```

## Contributing

### Adding New Features

1. **Update Data Models**: Add new fields to DTOs and interfaces
2. **Implement Backend Logic**: Add normalization or processing logic
3. **Update Mobile Utils**: Add corresponding utility functions
4. **Write Tests**: Add comprehensive test coverage
5. **Update Documentation**: Document new features

### Documentation Standards

- **API Methods**: Document all parameters, return types, and examples
- **Data Models**: Document all fields with types and examples
- **Error Handling**: Document error codes and handling strategies
- **Usage Examples**: Provide practical code examples

## Support

### Getting Help

- **Documentation**: Refer to specific API documentation files
- **Examples**: Check integration guides for practical examples
- **Tests**: Review test files for usage patterns
- **Issues**: Report issues with detailed reproduction steps

### Contact

- **Development Team**: Available for technical questions
- **Documentation**: Maintained by the development team
- **Updates**: Documentation updated with each release

---

This API documentation provides comprehensive coverage of the QuickEx application's backend services and mobile app utilities. For specific feature documentation, refer to the individual documentation files linked above.
