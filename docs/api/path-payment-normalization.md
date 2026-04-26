# Path Payment Normalization API Documentation

## Overview

This document provides comprehensive API documentation for the path payment normalization system that handles `path_payment_strict_send` and `path_payment_strict_receive` operations in the Stellar blockchain integration.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend API Documentation](#backend-api-documentation)
   - [PathPaymentNormalizer](#pathpaymentnormalizer)
   - [TransactionItemDto](#transactionitemdto)
   - [PathPaymentAssetDto](#pathpaymentassetdto)
   - [HorizonService Integration](#horizonservice-integration)
3. [Mobile App API Documentation](#mobile-app-api-documentation)
   - [PathPaymentUtils](#pathpaymentutils)
   - [TransactionItem Interface](#transactionitem-interface)
4. [Usage Examples](#usage-examples)
5. [Error Handling](#error-handling)
6. [Integration Guide](#integration-guide)

## Architecture Overview

The path payment normalization system follows a layered architecture:

```
Stellar Horizon API
    ↓
PathPaymentNormalizer (Backend)
    ↓
TransactionItemDto (Standardized)
    ↓
Mobile App Processing
    ↓
Enhanced UI Display
```

### Key Components

- **PathPaymentNormalizer**: Backend service for normalizing path payment operations
- **TransactionItemDto**: Enhanced data transfer object with path payment fields
- **PathPaymentUtils**: Mobile utility functions for display and formatting
- **HorizonService**: Integration layer with Stellar Horizon API

## Backend API Documentation

### PathPaymentNormalizer

The `PathPaymentNormalizer` class provides static methods for normalizing Stellar path payment operations to a consistent format.

#### Class Definition

```typescript
export class PathPaymentNormalizer {
  static normalizePathPaymentStrictSend(operation: Horizon.ServerApi.PathPaymentStrictSendOperationRecord): NormalizedPayment
  static normalizePathPaymentStrictReceive(operation: Horizon.ServerApi.PathPaymentOperationRecord): NormalizedPayment
  static assetToString(asset: PathPaymentAssetDto): string
  static getPrimaryAsset(operationType: string, sourceAsset?: PathPaymentAssetDto, destinationAsset?: PathPaymentAssetDto): string
  static getPrimaryAmount(operationType: string, sourceAmount?: string, destinationAmount?: string): string
  static createPathDescription(operationType: string, sourceAsset?: PathPaymentAssetDto, destinationAsset?: PathPaymentAssetDto, path?: PathPaymentAssetDto[]): string
}
```

#### Methods

##### normalizePathPaymentStrictSend()

Normalizes a path payment strict send operation to a consistent format.

**Signature:**
```typescript
static normalizePathPaymentStrictSend(
  operation: Horizon.ServerApi.PathPaymentStrictSendOperationRecord
): Omit<Horizon.ServerApi.PaymentOperationRecord, 'type'> & {
  type: 'payment';
  source_asset: PathPaymentAssetDto;
  source_amount: string;
  destination_asset: PathPaymentAssetDto;
  destination_min: string;
  path: PathPaymentAssetDto[];
  from: string;
  to: string;
}
```

**Parameters:**
- `operation`: Stellar Horizon path payment strict send operation record

**Returns:**
- Normalized payment operation with standardized structure

**Example:**
```typescript
const strictSendOp = {
  type: 'path_payment_strict_send',
  from: 'GDFROM123456789',
  to: 'GDTO123456789',
  amount: '100.0000000',
  source_amount: '50.0000000',
  source_asset_type: 'native',
  asset_type: 'credit_alphanum4',
  asset_code: 'USDC',
  asset_issuer: 'GDUSDCISSUER123',
  destination_min: '95.0000000',
  path: []
};

const normalized = PathPaymentNormalizer.normalizePathPaymentStrictSend(strictSendOp);
console.log(normalized.source_asset); // { asset_type: 'native' }
console.log(normalized.destination_asset); // { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GDUSDCISSUER123' }
```

##### normalizePathPaymentStrictReceive()

Normalizes a path payment strict receive operation to a consistent format.

**Signature:**
```typescript
static normalizePathPaymentStrictReceive(
  operation: Horizon.ServerApi.PathPaymentOperationRecord
): Omit<Horizon.ServerApi.PaymentOperationRecord, 'type'> & {
  type: 'payment';
  source_asset: PathPaymentAssetDto;
  source_amount: string;
  destination_asset: PathPaymentAssetDto;
  destination_min: string;
  path: PathPaymentAssetDto[];
  from: string;
  to: string;
}
```

**Parameters:**
- `operation`: Stellar Horizon path payment strict receive operation record

**Returns:**
- Normalized payment operation with standardized structure

**Example:**
```typescript
const strictReceiveOp = {
  type: 'path_payment_strict_receive',
  from: 'GDFROM123456789',
  to: 'GDTO123456789',
  amount: '100.0000000',
  source_max: '50.0000000',
  source_asset_type: 'native',
  asset_type: 'credit_alphanum4',
  asset_code: 'USDC',
  asset_issuer: 'GDUSDCISSUER123',
  destination_min: '95.0000000',
  path: []
};

const normalized = PathPaymentNormalizer.normalizePathPaymentStrictReceive(strictReceiveOp);
console.log(normalized.source_amount); // '50.0000000'
```

##### assetToString()

Converts a path payment asset DTO to a string representation for display.

**Signature:**
```typescript
static assetToString(asset: PathPaymentAssetDto): string
```

**Parameters:**
- `asset`: Path payment asset DTO

**Returns:**
- String representation ("XLM" for native assets, "CODE:ISSUER" for credit assets)

**Example:**
```typescript
const nativeAsset = { asset_type: 'native' };
console.log(PathPaymentNormalizer.assetToString(nativeAsset)); // 'XLM'

const creditAsset = {
  asset_type: 'credit_alphanum4',
  asset_code: 'USDC',
  asset_issuer: 'GDUSDCISSUER123'
};
console.log(PathPaymentNormalizer.assetToString(creditAsset)); // 'USDC:GDUSDCISSUER123'
```

##### getPrimaryAsset()

Determines the primary asset for display based on operation type.

**Signature:**
```typescript
static getPrimaryAsset(
  operationType: string,
  sourceAsset?: PathPaymentAssetDto,
  destinationAsset?: PathPaymentAssetDto
): string
```

**Parameters:**
- `operationType`: Type of operation ('path_payment_strict_send' or 'path_payment_strict_receive')
- `sourceAsset`: Source asset DTO (optional)
- `destinationAsset`: Destination asset DTO (optional)

**Returns:**
- String representation of the primary asset

**Logic:**
- For strict send: Returns source asset (what user sends)
- For strict receive: Returns destination asset (what user receives)
- Default: Returns 'XLM'

##### getPrimaryAmount()

Determines the primary amount based on operation type.

**Signature:**
```typescript
static getPrimaryAmount(
  operationType: string,
  sourceAmount?: string,
  destinationAmount?: string
): string
```

**Parameters:**
- `operationType`: Type of operation
- `sourceAmount`: Source amount string (optional)
- `destinationAmount`: Destination amount string (optional)

**Returns:**
- Primary amount as string

**Logic:**
- For strict send: Returns source amount (fixed amount being sent)
- For strict receive: Returns destination amount (fixed amount being received)
- Default: Returns destination amount or '0'

##### createPathDescription()

Creates a human-readable description of the path payment conversion.

**Signature:**
```typescript
static createPathDescription(
  operationType: string,
  sourceAsset?: PathPaymentAssetDto,
  destinationAsset?: PathPaymentAssetDto,
  path?: PathPaymentAssetDto[]
): string
```

**Parameters:**
- `operationType`: Type of operation
- `sourceAsset`: Source asset DTO (optional)
- `destinationAsset`: Destination asset DTO (optional)
- `path`: Array of intermediate assets (optional)

**Returns:**
- Human-readable path description

**Examples:**
```typescript
// Direct conversion
const description = PathPaymentNormalizer.createPathDescription(
  'path_payment_strict_send',
  { asset_type: 'native' },
  { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GD123' },
  []
);
// Returns: "Direct conversion: XLM → USDC:GD123"

// Multi-hop path
const pathAssets = [
  { asset_type: 'credit_alphanum4', asset_code: 'EURT', asset_issuer: 'GDEUR' }
];
const description = PathPaymentNormalizer.createPathDescription(
  'path_payment_strict_send',
  { asset_type: 'native' },
  { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GD123' },
  pathAssets
);
// Returns: "Path: XLM → EURT:GDEUR → USDC:GD123"
```

### TransactionItemDto

Enhanced data transfer object for transaction items with path payment support.

#### Class Definition

```typescript
export class TransactionItemDto {
  amount: string;
  asset: string;
  memo?: string;
  timestamp: string;
  txHash: string;
  pagingToken: string;
  operation_type?: string;
  from?: string;
  to?: string;
  source_asset?: PathPaymentAssetDto;
  source_amount?: string;
  destination_asset?: PathPaymentAssetDto;
  destination_min?: string;
  path?: PathPaymentAssetDto[];
}
```

#### Properties

| Property | Type | Required | Description | Example |
|----------|------|----------|-------------|---------|
| `amount` | `string` | Yes | Transaction amount | `"100.5000000"` |
| `asset` | `string` | Yes | Asset code for display | `"XLM"` |
| `memo` | `string` | No | Transaction memo | `"Payment for services"` |
| `timestamp` | `string` | Yes | ISO timestamp | `"2026-02-21T08:00:00Z"` |
| `txHash` | `string` | Yes | Transaction hash | `"6852...a341"` |
| `pagingToken` | `string` | Yes | Pagination token | `"1234567890"` |
| `operation_type` | `string` | No | Operation type | `"path_payment_strict_send"` |
| `from` | `string` | No | Sender account ID | `"GD...FROM"` |
| `to` | `string` | No | Recipient account ID | `"GD...TO"` |
| `source_asset` | `PathPaymentAssetDto` | No | Source asset information | See below |
| `source_amount` | `string` | No | Source amount | `"50.0000000"` |
| `destination_asset` | `PathPaymentAssetDto` | No | Destination asset information | See below |
| `destination_min` | `string` | No | Minimum destination amount | `"0.0000000"` |
| `path` | `PathPaymentAssetDto[]` | No | Conversion path assets | See below |

#### Path Payment Specific Properties

**Operation Types:**
- `"payment"` - Regular payment
- `"path_payment_strict_send"` - Path payment with fixed source amount
- `"path_payment_strict_receive"` - Path payment with fixed destination amount

**Asset Information:**
```typescript
interface PathPaymentAssetDto {
  asset_type: string;           // "native" or "credit_alphanum4" / "credit_alphanum12"
  asset_code?: string;          // Asset code for credit assets
  asset_issuer?: string;        // Asset issuer for credit assets
}
```

### PathPaymentAssetDto

Data transfer object for path payment asset information.

#### Class Definition

```typescript
export class PathPaymentAssetDto {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}
```

#### Properties

| Property | Type | Required | Description | Example |
|----------|------|----------|-------------|---------|
| `asset_type` | `string` | Yes | Asset type | `"native"` |
| `asset_code` | `string` | No | Asset code (credit assets only) | `"USDC"` |
| `asset_issuer` | `string` | No | Asset issuer (credit assets only) | `"GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335XOP3IA2M65BZDCCXN2YRC2TH"` |

#### Asset Type Values

- `"native"` - Stellar native asset (XLM)
- `"credit_alphanum4"` - 4-character alphanumeric code
- `"credit_alphanum12"` - 12-character alphanumeric code

### HorizonService Integration

The HorizonService has been enhanced to integrate path payment normalization into the transaction processing pipeline.

#### Enhanced getPayments Method

The `getPayments` method now includes path payment normalization:

```typescript
async getPayments(
  accountId: string,
  asset?: string,
  limit: number = 20,
  cursor?: string,
): Promise<TransactionResponseDto>
```

#### Processing Flow

1. **Fetch Operations**: Retrieve operations from Stellar Horizon API
2. **Filter Payments**: Filter for 'payment', 'path_payment_strict_receive', 'path_payment_strict_send'
3. **Normalize Path Payments**: Apply PathPaymentNormalizer for path payment operations
4. **Create Transaction Items**: Generate TransactionItemDto with path payment details
5. **Apply Asset Filter**: Filter by asset if specified
6. **Return Results**: Return standardized transaction response

#### Integration Code Example

```typescript
// Inside HorizonService.fetchFromHorizonWithRetry()
const payments = records.filter(record =>
  record.type === 'payment' ||
  record.type === 'path_payment_strict_receive' ||
  record.type === 'path_payment_strict_send'
) as (
  | Horizon.ServerApi.PaymentOperationRecord
  | Horizon.ServerApi.PathPaymentOperationRecord
  | Horizon.ServerApi.PathPaymentStrictSendOperationRecord
)[];

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

## Mobile App API Documentation

### PathPaymentUtils

Utility class for handling path payment transactions in the mobile app.

#### Class Definition

```typescript
export class PathPaymentUtils {
  static assetToString(asset: PathPaymentAsset): string
  static isPathPayment(transaction: TransactionItem): boolean
  static getPrimaryAsset(transaction: TransactionItem): string
  static getPrimaryAmount(transaction: TransactionItem): string
  static getSecondaryAsset(transaction: TransactionItem): string
  static getSecondaryAmount(transaction: TransactionItem): string
  static createPathDescription(transaction: TransactionItem): string
  static getOperationTypeLabel(transaction: TransactionItem): string
  static formatAmountWithContext(transaction: TransactionItem): string
  static getPathAssets(transaction: TransactionItem): string[]
  static isIncomingPayment(transaction: TransactionItem, userAccountId: string): boolean
  static isOutgoingPayment(transaction: TransactionItem, userAccountId: string): boolean
}
```

#### Methods

##### assetToString()

Converts asset object to string format for display.

**Signature:**
```typescript
static assetToString(asset: PathPaymentAsset): string
```

**Parameters:**
- `asset`: Path payment asset object

**Returns:**
- String representation ("XLM" or "CODE:ISSUER")

##### isPathPayment()

Determines if a transaction is a path payment.

**Signature:**
```typescript
static isPathPayment(transaction: TransactionItem): boolean
```

**Parameters:**
- `transaction`: Transaction item object

**Returns:**
- `true` if transaction is a path payment, `false` otherwise

##### getPrimaryAsset()

Gets the primary asset for display based on operation type.

**Signature:**
```typescript
static getPrimaryAsset(transaction: TransactionItem): string
```

**Parameters:**
- `transaction`: Transaction item object

**Returns:**
- Primary asset string for display

##### getPrimaryAmount()

Gets the primary amount based on operation type.

**Signature:**
```typescript
static getPrimaryAmount(transaction: TransactionItem): string
```

**Parameters:**
- `transaction`: Transaction item object

**Returns:**
- Primary amount string

##### getSecondaryAsset()

Gets the secondary asset for display (the other side of the conversion).

**Signature:**
```typescript
static getSecondaryAsset(transaction: TransactionItem): string
```

**Parameters:**
- `transaction`: Transaction item object

**Returns:**
- Secondary asset string or empty string for non-path payments

##### getSecondaryAmount()

Gets the secondary amount for display.

**Signature:**
```typescript
static getSecondaryAmount(transaction: TransactionItem): string
```

**Parameters:**
- `transaction`: Transaction item object

**Returns:**
- Secondary amount string or empty string for non-path payments

##### createPathDescription()

Creates a human-readable description of the path payment.

**Signature:**
```typescript
static createPathDescription(transaction: TransactionItem): string
```

**Parameters:**
- `transaction`: Transaction item object

**Returns:**
- Human-readable path description

##### getOperationTypeLabel()

Gets a user-friendly operation type label.

**Signature:**
```typescript
static getOperationTypeLabel(transaction: TransactionItem): string
```

**Parameters:**
- `transaction`: Transaction item object

**Returns:**
- User-friendly operation type label

**Labels:**
- `"Path Payment (Send)"` for `path_payment_strict_send`
- `"Path Payment (Receive)"` for `path_payment_strict_receive`
- `"Payment"` for regular payments
- `"Transaction"` for unknown types

##### formatAmountWithContext()

Formats the transaction amount with appropriate context.

**Signature:**
```typescript
static formatAmountWithContext(transaction: TransactionItem): string
```

**Parameters:**
- `transaction`: Transaction item object

**Returns:**
- Formatted amount string with conversion context

**Examples:**
```typescript
// Regular payment
PathPaymentUtils.formatAmountWithContext(regularPayment);
// Returns: "100.50 XLM"

// Path payment
PathPaymentUtils.formatAmountWithContext(pathPayment);
// Returns: "50.00 XLM → 100.50 USDC"
```

##### getPathAssets()

Extracts the path assets as strings for display.

**Signature:**
```typescript
static getPathAssets(transaction: TransactionItem): string[]
```

**Parameters:**
- `transaction`: Transaction item object

**Returns:**
- Array of asset strings in the conversion path

##### isIncomingPayment()

Determines if the transaction represents an incoming payment to the user.

**Signature:**
```typescript
static isIncomingPayment(transaction: TransactionItem, userAccountId: string): boolean
```

**Parameters:**
- `transaction`: Transaction item object
- `userAccountId`: User's Stellar account ID

**Returns:**
- `true` if payment is incoming to the user

##### isOutgoingPayment()

Determines if the transaction represents an outgoing payment from the user.

**Signature:**
```typescript
static isOutgoingPayment(transaction: TransactionItem, userAccountId: string): boolean
```

**Parameters:**
- `transaction`: Transaction item object
- `userAccountId`: User's Stellar account ID

**Returns:**
- `true` if payment is outgoing from the user

### TransactionItem Interface

Mobile app interface for transaction items with path payment support.

#### Interface Definition

```typescript
interface TransactionItem {
  amount: string;
  asset: string;
  memo?: string;
  timestamp: string;
  txHash: string;
  pagingToken: string;
  operation_type?: string;
  from?: string;
  to?: string;
  source_asset?: PathPaymentAsset;
  source_amount?: string;
  destination_asset?: PathPaymentAsset;
  destination_min?: string;
  path?: PathPaymentAsset[];
}
```

#### PathPaymentAsset Interface

```typescript
interface PathPaymentAsset {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}
```

## Usage Examples

### Backend Usage

#### Normalizing Path Payments

```typescript
import { PathPaymentNormalizer } from './path-payment-normalizer';
import { Horizon } from 'stellar-sdk';

// Process path payment strict send
const strictSendOperation = await horizonServer.operations()
  .forAccount(accountId)
  .call()
  .then(response => response.records
    .find(record => record.type === 'path_payment_strict_send'));

if (strictSendOperation) {
  const normalized = PathPaymentNormalizer.normalizePathPaymentStrictSend(
    strictSendOperation as Horizon.ServerApi.PathPaymentStrictSendOperationRecord
  );
  
  console.log('Source Asset:', PathPaymentNormalizer.assetToString(normalized.source_asset));
  console.log('Destination Asset:', PathPaymentNormalizer.assetToString(normalized.destination_asset));
  console.log('Path Description:', PathPaymentNormalizer.createPathDescription(
    'path_payment_strict_send',
    normalized.source_asset,
    normalized.destination_asset,
    normalized.path
  ));
}
```

#### Horizon Service Integration

```typescript
import { HorizonService } from './horizon.service';

const horizonService = new HorizonService(configService);

// Get transactions with path payment normalization
const transactions = await horizonService.getPayments(
  'GD1234567890ABCDEF',
  undefined, // All assets
  20,        // Limit
  undefined  // No cursor
);

// Transactions now include path payment details
transactions.items.forEach(item => {
  if (item.operation_type?.includes('path_payment')) {
    console.log('Path Payment Detected:', item.operation_type);
    console.log('Source Amount:', item.source_amount);
    console.log('Destination Amount:', item.amount);
    console.log('Path Assets:', item.path?.map(asset => 
      PathPaymentNormalizer.assetToString(asset)
    ));
  }
});
```

### Mobile App Usage

#### Displaying Path Payments in Transaction List

```typescript
import React from 'react';
import { PathPaymentUtils } from '../utils/path-payment-utils';
import { TransactionItem } from '../types/transaction';

interface TransactionItemProps {
  item: TransactionItem;
  accountId: string;
}

const TransactionItemComponent: React.FC<TransactionItemProps> = ({ item, accountId }) => {
  const isPathPayment = PathPaymentUtils.isPathPayment(item);
  const primaryAsset = isPathPayment ? PathPaymentUtils.getPrimaryAsset(item) : item.asset;
  const primaryAmount = isPathPayment ? PathPaymentUtils.getPrimaryAmount(item) : item.amount;
  const operationTypeLabel = PathPaymentUtils.getOperationTypeLabel(item);

  return (
    <View>
      <Text>{primaryAsset}</Text>
      <Text>{parseFloat(primaryAmount).toFixed(2)}</Text>
      
      {isPathPayment && (
        <>
          <Text style={styles.operationType}>{operationTypeLabel}</Text>
          <Text style={styles.pathDescription}>
            {PathPaymentUtils.createPathDescription(item)}
          </Text>
          <Text style={styles.secondaryAmount}>
            → {parseFloat(PathPaymentUtils.getSecondaryAmount(item)).toFixed(2)} {PathPaymentUtils.getSecondaryAsset(item)}
          </Text>
        </>
      )}
      
      <Text>{item.txHash}</Text>
      <Text>{new Date(item.timestamp).toLocaleString()}</Text>
    </View>
  );
};
```

#### Transaction Detail Screen

```typescript
import React from 'react';
import { PathPaymentUtils } from '../utils/path-payment-utils';
import { TransactionItem } from '../types/transaction';

interface TransactionDetailProps {
  transaction: TransactionItem;
  accountId: string;
}

const TransactionDetailScreen: React.FC<TransactionDetailProps> = ({ transaction, accountId }) => {
  const isPathPayment = PathPaymentUtils.isPathPayment(transaction);
  const operationTypeLabel = PathPaymentUtils.getOperationTypeLabel(transaction);

  const handleShare = async () => {
    let shareContent = `
Transaction Details
==================
Operation: ${operationTypeLabel}
Amount: ${parseFloat(PathPaymentUtils.getPrimaryAmount(transaction)).toFixed(2)} ${PathPaymentUtils.getPrimaryAsset(transaction)}`;

    if (isPathPayment) {
      const secondaryAmount = PathPaymentUtils.getSecondaryAmount(transaction);
      const secondaryAsset = PathPaymentUtils.getSecondaryAsset(transaction);
      shareContent += `
Converted to: ${parseFloat(secondaryAmount).toFixed(2)} ${secondaryAsset}
Path: ${PathPaymentUtils.createPathDescription(transaction)}`;
    }

    shareContent += `
Hash: ${transaction.txHash}
Date: ${new Date(transaction.timestamp).toLocaleString()}
${transaction.memo ? `Memo: ${transaction.memo}` : ''}
${transaction.from ? `From: ${transaction.from}` : ''}
${transaction.to ? `To: ${transaction.to}` : ''}`;

    await Share.share({ message: shareContent });
  };

  return (
    <ScrollView>
      <Text>{parseFloat(PathPaymentUtils.getPrimaryAmount(transaction)).toFixed(2)} {PathPaymentUtils.getPrimaryAsset(transaction)}</Text>
      
      {isPathPayment && (
        <View>
          <Text>→ {parseFloat(PathPaymentUtils.getSecondaryAmount(transaction)).toFixed(2)} {PathPaymentUtils.getSecondaryAsset(transaction)}</Text>
          <Text>{operationTypeLabel}</Text>
          
          <View>
            <Text>Source Amount:</Text>
            <Text>{parseFloat(transaction.source_amount || '0').toFixed(2)} {transaction.source_asset ? PathPaymentUtils.assetToString(transaction.source_asset) : 'N/A'}</Text>
          </View>
          
          <View>
            <Text>Destination Amount:</Text>
            <Text>{parseFloat(transaction.amount).toFixed(2)} {transaction.destination_asset ? PathPaymentUtils.assetToString(transaction.destination_asset) : 'N/A'}</Text>
          </View>
          
          <View>
            <Text>Path Description:</Text>
            <Text>{PathPaymentUtils.createPathDescription(transaction)}</Text>
          </View>
          
          {transaction.path && transaction.path.length > 0 && (
            <View>
              <Text>Path Assets:</Text>
              {transaction.path.map((asset, index) => (
                <Text key={index}>
                  {PathPaymentUtils.assetToString(asset)}
                  {index < transaction.path!.length - 1 && ' → '}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
      
      <Button title="Share" onPress={handleShare} />
    </ScrollView>
  );
};
```

## Error Handling

### Backend Error Handling

#### Invalid Asset Data

```typescript
// PathPaymentNormalizer handles incomplete asset data gracefully
static assetToString(asset: PathPaymentAssetDto): string {
  if (asset.asset_type === 'native') {
    return 'XLM';
  }

  if (!asset.asset_code || !asset.asset_issuer) {
    return 'Unknown';
  }

  return `${asset.asset_code}:${asset.asset_issuer}`;
}
```

#### Missing Path Information

```typescript
// Empty or undefined paths are handled gracefully
static createPathDescription(
  operationType: string,
  sourceAsset?: PathPaymentAssetDto,
  destinationAsset?: PathPaymentAssetDto,
  path?: PathPaymentAssetDto[]
): string {
  const sourceStr = sourceAsset ? this.assetToString(sourceAsset) : 'Unknown';
  const destStr = destinationAsset ? this.assetToString(destinationAsset) : 'Unknown';
  
  if (!path || path.length === 0) {
    return `Direct conversion: ${sourceStr} → ${destStr}`;
  }

  const pathStr = path.map(asset => this.assetToString(asset)).join(' → ');
  return `Path: ${sourceStr} → ${pathStr} → ${destStr}`;
}
```

### Mobile App Error Handling

#### Safe Property Access

```typescript
// Mobile utilities handle missing data gracefully
static getPrimaryAsset(transaction: TransactionItem): string {
  if (!this.isPathPayment(transaction)) {
    return transaction.asset;
  }

  switch (transaction.operation_type) {
    case 'path_payment_strict_send':
      return transaction.source_asset ? this.assetToString(transaction.source_asset) : 'XLM';
    
    case 'path_payment_strict_receive':
      return transaction.destination_asset ? this.assetToString(transaction.destination_asset) : 'XLM';
    
    default:
      return transaction.asset;
  }
}
```

#### Fallback Display

```typescript
// Components should handle missing data with fallbacks
const TransactionItem = ({ item }: { item: TransactionItem }) => {
  const primaryAsset = PathPaymentUtils.getPrimaryAsset(item);
  const primaryAmount = PathPaymentUtils.getPrimaryAmount(item);
  
  return (
    <View>
      <Text>{primaryAsset}</Text>
      <Text>{parseFloat(primaryAmount).toFixed(2)}</Text>
      
      {PathPaymentUtils.isPathPayment(item) && (
        <Text>
          {PathPaymentUtils.createPathDescription(item) || 'Path payment details unavailable'}
        </Text>
      )}
    </View>
  );
};
```

## Integration Guide

### Backend Integration

#### 1. Import PathPaymentNormalizer

```typescript
import { PathPaymentNormalizer } from './path-payment-normalizer';
```

#### 2. Update Transaction Processing

```typescript
// In your transaction processing logic
if (payment.type === 'path_payment_strict_send') {
  normalizedPayment = PathPaymentNormalizer.normalizePathPaymentStrictSend(payment);
  // Use normalized data for display and processing
} else if (payment.type === 'path_payment_strict_receive') {
  normalizedPayment = PathPaymentNormalizer.normalizePathPaymentStrictReceive(payment);
  // Use normalized data for display and processing
}
```

#### 3. Update DTOs

```typescript
// Ensure your TransactionItemDto includes path payment fields
interface TransactionItemDto {
  // ... existing fields
  operation_type?: string;
  source_asset?: PathPaymentAssetDto;
  source_amount?: string;
  destination_asset?: PathPaymentAssetDto;
  destination_min?: string;
  path?: PathPaymentAssetDto[];
}
```

### Mobile App Integration

#### 1. Import PathPaymentUtils

```typescript
import { PathPaymentUtils } from '../utils/path-payment-utils';
```

#### 2. Update Transaction Types

```typescript
// Ensure your TransactionItem interface includes path payment fields
interface TransactionItem {
  // ... existing fields
  operation_type?: string;
  source_asset?: PathPaymentAsset;
  source_amount?: string;
  destination_asset?: PathPaymentAsset;
  destination_min?: string;
  path?: PathPaymentAsset[];
}
```

#### 3. Update UI Components

```typescript
// Update transaction list component
const TransactionItem = ({ item }: { item: TransactionItem }) => {
  const isPathPayment = PathPaymentUtils.isPathPayment(item);
  
  if (isPathPayment) {
    // Display path payment specific information
    return <PathPaymentTransactionItem item={item} />;
  }
  
  return <RegularTransactionItem item={item} />;
};
```

#### 4. Update Detail Screen

```typescript
// Update transaction detail screen to show path payment information
const TransactionDetail = ({ transaction }: { transaction: TransactionItem }) => {
  const isPathPayment = PathPaymentUtils.isPathPayment(transaction);
  
  return (
    <ScrollView>
      <AmountDisplay transaction={transaction} />
      
      {isPathPayment && (
        <PathPaymentDetails transaction={transaction} />
      )}
      
      <TransactionMetadata transaction={transaction} />
    </ScrollView>
  );
};
```

### Testing Integration

#### Backend Tests

```typescript
import { PathPaymentNormalizer } from '../path-payment-normalizer';

describe('PathPaymentNormalizer', () => {
  it('should normalize path payment strict send', () => {
    const mockOperation = {
      type: 'path_payment_strict_send',
      // ... mock data
    };
    
    const result = PathPaymentNormalizer.normalizePathPaymentStrictSend(mockOperation);
    
    expect(result.type).toBe('payment');
    expect(result.source_asset).toBeDefined();
    expect(result.destination_asset).toBeDefined();
  });
});
```

#### Mobile App Tests

```typescript
import { PathPaymentUtils } from '../utils/path-payment-utils';

describe('PathPaymentUtils', () => {
  it('should detect path payments', () => {
    const transaction = {
      operation_type: 'path_payment_strict_send',
      // ... other fields
    };
    
    expect(PathPaymentUtils.isPathPayment(transaction)).toBe(true);
  });
});
```

---

This comprehensive API documentation provides complete coverage of the path payment normalization system, including backend services, mobile utilities, usage examples, and integration guides. The documentation is designed to be both a reference for developers and a guide for implementing the path payment features in applications.
