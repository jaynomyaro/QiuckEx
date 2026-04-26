# Path Payment Utils API Documentation (Mobile)

## Overview

The `PathPaymentUtils` class provides comprehensive utility functions for handling path payment transactions in the mobile app. It offers methods for detecting, formatting, and displaying path payment operations with enhanced user experience features.

## Class Definition

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

## Dependencies

```typescript
import { PathPaymentAsset, TransactionItem } from '../types/transaction';
```

## Methods

### assetToString()

Converts a path payment asset object to a string format for display.

#### Signature
```typescript
static assetToString(asset: PathPaymentAsset): string
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `asset` | `PathPaymentAsset` | Yes | Path payment asset object |

#### Returns
- `string`: String representation of the asset

#### Behavior
- **Native Assets**: Returns "XLM" for `asset_type: 'native'`
- **Credit Assets**: Returns "CODE:ISSUER" format for credit assets
- **Incomplete Data**: Returns "Unknown" for malformed asset data

#### Examples
```typescript
// Native asset
const nativeAsset = { asset_type: 'native' };
console.log(PathPaymentUtils.assetToString(nativeAsset)); // "XLM"

// Credit asset
const creditAsset = {
  asset_type: 'credit_alphanum4',
  asset_code: 'USDC',
  asset_issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335XOP3IA2M65BZDCCXN2YRC2TH'
};
console.log(PathPaymentUtils.assetToString(creditAsset)); // "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335XOP3IA2M65BZDCCXN2YRC2TH"

// Incomplete asset
const incompleteAsset = { asset_type: 'credit_alphanum4' };
console.log(PathPaymentUtils.assetToString(incompleteAsset)); // "Unknown"
```

### isPathPayment()

Determines if a transaction is a path payment operation.

#### Signature
```typescript
static isPathPayment(transaction: TransactionItem): boolean
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transaction` | `TransactionItem` | Yes | Transaction item object |

#### Returns
- `boolean`: `true` if transaction is a path payment, `false` otherwise

#### Logic
```typescript
return transaction.operation_type === 'path_payment_strict_send' || 
       transaction.operation_type === 'path_payment_strict_receive';
```

#### Examples
```typescript
const pathPayment = {
  operation_type: 'path_payment_strict_send',
  // ... other fields
};
console.log(PathPaymentUtils.isPathPayment(pathPayment)); // true

const regularPayment = {
  operation_type: 'payment',
  // ... other fields
};
console.log(PathPaymentUtils.isPathPayment(regularPayment)); // false
```

### getPrimaryAsset()

Determines the primary asset for display based on operation type.

#### Signature
```typescript
static getPrimaryAsset(transaction: TransactionItem): string
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transaction` | `TransactionItem` | Yes | Transaction item object |

#### Returns
- `string`: Primary asset string for display

#### Logic
- **Path Payment Strict Send**: Returns source asset (what user sends)
- **Path Payment Strict Receive**: Returns destination asset (what user receives)
- **Regular Payments**: Returns the standard asset field
- **Default**: Returns "XLM" for unknown types

#### Examples
```typescript
// Strict send - primary is source asset
const strictSend = {
  operation_type: 'path_payment_strict_send',
  asset: 'USDC',
  source_asset: { asset_type: 'native' },
  destination_asset: { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GA123' }
};
console.log(PathPaymentUtils.getPrimaryAsset(strictSend)); // "XLM"

// Strict receive - primary is destination asset
const strictReceive = {
  operation_type: 'path_payment_strict_receive',
  asset: 'XLM',
  source_asset: { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GA123' },
  destination_asset: { asset_type: 'native' }
};
console.log(PathPaymentUtils.getPrimaryAsset(strictReceive)); // "XLM"
```

### getPrimaryAmount()

Determines the primary amount based on operation type.

#### Signature
```typescript
static getPrimaryAmount(transaction: TransactionItem): string
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transaction` | `TransactionItem` | Yes | Transaction item object |

#### Returns
- `string`: Primary amount string

#### Logic
- **Path Payment Strict Send**: Returns source amount (fixed amount being sent)
- **Path Payment Strict Receive**: Returns destination amount (fixed amount being received)
- **Regular Payments**: Returns the standard amount field
- **Default**: Returns "0" for missing data

#### Examples
```typescript
// Strict send - primary is source amount
const strictSend = {
  operation_type: 'path_payment_strict_send',
  amount: '100.0000000',
  source_amount: '50.0000000'
};
console.log(PathPaymentUtils.getPrimaryAmount(strictSend)); // "50.0000000"

// Strict receive - primary is destination amount
const strictReceive = {
  operation_type: 'path_payment_strict_receive',
  amount: '100.0000000',
  source_amount: '50.0000000'
};
console.log(PathPaymentUtils.getPrimaryAmount(strictReceive)); // "100.0000000"
```

### getSecondaryAsset()

Gets the secondary asset for display (the other side of the conversion).

#### Signature
```typescript
static getSecondaryAsset(transaction: TransactionItem): string
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transaction` | `TransactionItem` | Yes | Transaction item object |

#### Returns
- `string`: Secondary asset string or empty string for non-path payments

#### Logic
- **Path Payment Strict Send**: Returns destination asset
- **Path Payment Strict Receive**: Returns source asset
- **Regular Payments**: Returns empty string

#### Examples
```typescript
const pathPayment = {
  operation_type: 'path_payment_strict_send',
  source_asset: { asset_type: 'native' },
  destination_asset: { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GA123' }
};
console.log(PathPaymentUtils.getSecondaryAsset(pathPayment)); // "USDC:GA123"

const regularPayment = { operation_type: 'payment' };
console.log(PathPaymentUtils.getSecondaryAsset(regularPayment)); // ""
```

### getSecondaryAmount()

Gets the secondary amount for display.

#### Signature
```typescript
static getSecondaryAmount(transaction: TransactionItem): string
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transaction` | `TransactionItem` | Yes | Transaction item object |

#### Returns
- `string`: Secondary amount string or empty string for non-path payments

#### Logic
- **Path Payment Strict Send**: Returns destination amount
- **Path Payment Strict Receive**: Returns source amount
- **Regular Payments**: Returns empty string

#### Examples
```typescript
const strictSend = {
  operation_type: 'path_payment_strict_send',
  amount: '100.0000000',
  source_amount: '50.0000000'
};
console.log(PathPaymentUtils.getSecondaryAmount(strictSend)); // "100.0000000"

const regularPayment = { operation_type: 'payment', amount: '50.0000000' };
console.log(PathPaymentUtils.getSecondaryAmount(regularPayment)); // ""
```

### createPathDescription()

Creates a human-readable description of the path payment conversion.

#### Signature
```typescript
static createPathDescription(transaction: TransactionItem): string
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transaction` | `TransactionItem` | Yes | Transaction item object |

#### Returns
- `string`: Human-readable path description

#### Behavior
- **Direct Conversions**: "Direct conversion: SOURCE → DESTINATION"
- **Multi-hop Paths**: "Path: SOURCE → INTERMEDIATE1 → INTERMEDIATE2 → DESTINATION"
- **Regular Payments**: "Direct payment"

#### Examples
```typescript
// Direct conversion
const directPath = {
  operation_type: 'path_payment_strict_send',
  source_asset: { asset_type: 'native' },
  destination_asset: { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GA123' },
  path: []
};
console.log(PathPaymentUtils.createPathDescription(directPath));
// "Direct conversion: XLM → USDC:GA123"

// Multi-hop path
const multiHopPath = {
  operation_type: 'path_payment_strict_send',
  source_asset: { asset_type: 'native' },
  destination_asset: { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GA123' },
  path: [
    { asset_type: 'credit_alphanum4', asset_code: 'EURT', asset_issuer: 'GDEUR' }
  ]
};
console.log(PathPaymentUtils.createPathDescription(multiHopPath));
// "Path: XLM → EURT:GDEUR → USDC:GA123"

// Regular payment
const regularPayment = { operation_type: 'payment' };
console.log(PathPaymentUtils.createPathDescription(regularPayment));
// "Direct payment"
```

### getOperationTypeLabel()

Gets a user-friendly operation type label.

#### Signature
```typescript
static getOperationTypeLabel(transaction: TransactionItem): string
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transaction` | `TransactionItem` | Yes | Transaction item object |

#### Returns
- `string`: User-friendly operation type label

#### Labels
| Operation Type | Label |
|----------------|-------|
| `path_payment_strict_send` | "Path Payment (Send)" |
| `path_payment_strict_receive` | "Path Payment (Receive)" |
| `payment` | "Payment" |
| Other | "Transaction" |

#### Examples
```typescript
const strictSend = { operation_type: 'path_payment_strict_send' };
console.log(PathPaymentUtils.getOperationTypeLabel(strictSend)); // "Path Payment (Send)"

const strictReceive = { operation_type: 'path_payment_strict_receive' };
console.log(PathPaymentUtils.getOperationTypeLabel(strictReceive)); // "Path Payment (Receive)"

const payment = { operation_type: 'payment' };
console.log(PathPaymentUtils.getOperationTypeLabel(payment)); // "Payment"
```

### formatAmountWithContext()

Formats the transaction amount with appropriate context for path payments.

#### Signature
```typescript
static formatAmountWithContext(transaction: TransactionItem): string
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transaction` | `TransactionItem` | Yes | Transaction item object |

#### Returns
- `string`: Formatted amount string with conversion context

#### Behavior
- **Regular Payments**: "AMOUNT ASSET"
- **Path Payments**: "PRIMARY_AMOUNT PRIMARY_ASSET → SECONDARY_AMOUNT SECONDARY_ASSET"

#### Examples
```typescript
// Regular payment
const regularPayment = {
  operation_type: 'payment',
  amount: '100.5000000',
  asset: 'XLM'
};
console.log(PathPaymentUtils.formatAmountWithContext(regularPayment));
// "100.50 XLM"

// Path payment
const pathPayment = {
  operation_type: 'path_payment_strict_send',
  amount: '100.0000000',
  asset: 'USDC',
  source_amount: '50.0000000',
  source_asset: { asset_type: 'native' },
  destination_asset: { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GA123' }
};
console.log(PathPaymentUtils.formatAmountWithContext(pathPayment));
// "50.00 XLM → 100.00 USDC"
```

### getPathAssets()

Extracts the path assets as strings for display.

#### Signature
```typescript
static getPathAssets(transaction: TransactionItem): string[]
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transaction` | `TransactionItem` | Yes | Transaction item object |

#### Returns
- `string[]`: Array of asset strings in the conversion path

#### Behavior
- **Empty Path**: Returns empty array
- **Valid Path**: Returns array of asset strings using `assetToString()`
- **No Path Field**: Returns empty array

#### Examples
```typescript
const pathPayment = {
  path: [
    { asset_type: 'credit_alphanum4', asset_code: 'EURT', asset_issuer: 'GDEUR' },
    { asset_type: 'credit_alphanum4', asset_code: 'BTC', asset_issuer: 'GDBTC' }
  ]
};
console.log(PathPaymentUtils.getPathAssets(pathPayment));
// ["EURT:GDEUR", "BTC:GDBTC"]

const noPath = { path: [] };
console.log(PathPaymentUtils.getPathAssets(noPath));
// []
```

### isIncomingPayment()

Determines if the transaction represents an incoming payment to the user.

#### Signature
```typescript
static isIncomingPayment(transaction: TransactionItem, userAccountId: string): boolean
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transaction` | `TransactionItem` | Yes | Transaction item object |
| `userAccountId` | `string` | Yes | User's Stellar account ID |

#### Returns
- `boolean`: `true` if payment is incoming to the user

#### Logic
- **Regular Payments**: Checks if `to` field matches user account
- **Path Payments**: Checks if `to` field matches user account

#### Examples
```typescript
const incomingPayment = {
  operation_type: 'payment',
  to: 'GUSER1234567890ABCDEF'
};
console.log(PathPaymentUtils.isIncomingPayment(incomingPayment, 'GUSER1234567890ABCDEF')); // true

const outgoingPayment = {
  operation_type: 'payment',
  from: 'GUSER1234567890ABCDEF',
  to: 'GOTHER1234567890ABCDEF'
};
console.log(PathPaymentUtils.isIncomingPayment(outgoingPayment, 'GUSER1234567890ABCDEF')); // false
```

### isOutgoingPayment()

Determines if the transaction represents an outgoing payment from the user.

#### Signature
```typescript
static isOutgoingPayment(transaction: TransactionItem, userAccountId: string): boolean
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transaction` | `TransactionItem` | Yes | Transaction item object |
| `userAccountId` | `string` | Yes | User's Stellar account ID |

#### Returns
- `boolean`: `true` if payment is outgoing from the user

#### Logic
- **Regular Payments**: Checks if `from` field matches user account
- **Path Payments**: Checks if `from` field matches user account

#### Examples
```typescript
const outgoingPayment = {
  operation_type: 'payment',
  from: 'GUSER1234567890ABCDEF',
  to: 'GOTHER1234567890ABCDEF'
};
console.log(PathPaymentUtils.isOutgoingPayment(outgoingPayment, 'GUSER1234567890ABCDEF')); // true

const incomingPayment = {
  operation_type: 'payment',
  to: 'GUSER1234567890ABCDEF'
};
console.log(PathPaymentUtils.isOutgoingPayment(incomingPayment, 'GUSER1234567890ABCDEF')); // false
```

## Usage Examples

### React Native Component Integration

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  const isIncoming = PathPaymentUtils.isIncomingPayment(item, accountId);
  const isOutgoing = PathPaymentUtils.isOutgoingPayment(item, accountId);

  return (
    <View style={styles.container}>
      {/* Primary amount and asset */}
      <View style={styles.amountRow}>
        <Text style={styles.amount}>
          {parseFloat(primaryAmount).toFixed(2)}
        </Text>
        <Text style={styles.asset}>{primaryAsset}</Text>
      </View>

      {/* Path payment specific information */}
      {isPathPayment && (
        <View style={styles.pathPaymentSection}>
          <Text style={styles.operationType}>{operationTypeLabel}</Text>
          
          <Text style={styles.conversion}>
            → {parseFloat(PathPaymentUtils.getSecondaryAmount(item)).toFixed(2)} {PathPaymentUtils.getSecondaryAsset(item)}
          </Text>
          
          <Text style={styles.pathDescription}>
            {PathPaymentUtils.createPathDescription(item)}
          </Text>
        </View>
      )}

      {/* Transaction metadata */}
      <View style={styles.metadata}>
        <Text style={styles.hash}>{item.txHash.slice(0, 10)}...</Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
        <Text style={[
          styles.direction,
          isIncoming && styles.incoming,
          isOutgoing && styles.outgoing
        ]}>
          {isIncoming ? 'Incoming' : isOutgoing ? 'Outgoing' : 'Unknown'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  asset: {
    fontSize: 14,
    color: '#666',
  },
  pathPaymentSection: {
    marginBottom: 8,
  },
  operationType: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  conversion: {
    fontSize: 14,
    color: '#34C759',
    marginBottom: 4,
  },
  pathDescription: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hash: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  direction: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  incoming: {
    backgroundColor: '#E8F5E8',
    color: '#34C759',
  },
  outgoing: {
    backgroundColor: '#FFEBEE',
    color: '#FF3B30',
  },
});

export default TransactionItemComponent;
```

### Transaction Detail Screen

```typescript
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { PathPaymentUtils } from '../utils/path-payment-utils';
import { TransactionItem } from '../types/transaction';

interface TransactionDetailProps {
  transaction: TransactionItem;
  accountId: string;
}

const TransactionDetailScreen: React.FC<TransactionDetailProps> = ({ transaction, accountId }) => {
  const isPathPayment = PathPaymentUtils.isPathPayment(transaction);
  const operationTypeLabel = PathPaymentUtils.getOperationTypeLabel(transaction);
  const isIncoming = PathPaymentUtils.isIncomingPayment(transaction, accountId);
  const isOutgoing = PathPaymentUtils.isOutgoingPayment(transaction, accountId);

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
${transaction.to ? `To: ${transaction.to}` : ''}
Direction: ${isIncoming ? 'Incoming' : isOutgoing ? 'Outgoing' : 'Unknown'}

View on Stellar Explorer: https://stellar.expert/explorer/public/tx/${transaction.txHash}`;

    await Share.share({ message: shareContent.trim() });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Amount Section */}
      <View style={styles.amountSection}>
        <Text style={styles.primaryAmount}>
          {parseFloat(PathPaymentUtils.getPrimaryAmount(transaction)).toFixed(2)}
        </Text>
        <Text style={styles.primaryAsset}>
          {PathPaymentUtils.getPrimaryAsset(transaction)}
        </Text>
        
        {isPathPayment && (
          <View style={styles.conversionRow}>
            <Text style={styles.conversionArrow}>↓</Text>
            <Text style={styles.secondaryAmount}>
              {parseFloat(PathPaymentUtils.getSecondaryAmount(transaction)).toFixed(2)} {PathPaymentUtils.getSecondaryAsset(transaction)}
            </Text>
          </View>
        )}
        
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{operationTypeLabel}</Text>
        </View>
      </View>

      {/* Transaction Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction Information</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Transaction Hash</Text>
          <Text style={styles.value} selectable>
            {transaction.txHash}
          </Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>
            {new Date(transaction.timestamp).toLocaleString()}
          </Text>
        </View>
        
        {transaction.memo && (
          <View style={styles.row}>
            <Text style={styles.label}>Memo</Text>
            <Text style={styles.value}>{transaction.memo}</Text>
          </View>
        )}
        
        <View style={styles.row}>
          <Text style={styles.label}>Direction</Text>
          <Text style={[
            styles.value,
            isIncoming && styles.incomingText,
            isOutgoing && styles.outgoingText
          ]}>
            {isIncoming ? 'Incoming' : isOutgoing ? 'Outgoing' : 'Unknown'}
          </Text>
        </View>
      </View>

      {/* Path Payment Details */}
      {isPathPayment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Path Payment Details</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Operation Type</Text>
            <Text style={styles.value}>{operationTypeLabel}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Source Amount</Text>
            <Text style={styles.value}>
              {parseFloat(transaction.source_amount || '0').toFixed(2)} {transaction.source_asset ? PathPaymentUtils.assetToString(transaction.source_asset) : 'N/A'}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Destination Amount</Text>
            <Text style={styles.value}>
              {parseFloat(transaction.amount).toFixed(2)} {transaction.destination_asset ? PathPaymentUtils.assetToString(transaction.destination_asset) : 'N/A'}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Path Description</Text>
            <Text style={styles.value}>
              {PathPaymentUtils.createPathDescription(transaction)}
            </Text>
          </View>

          {transaction.path && transaction.path.length > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Path Assets</Text>
              <View style={styles.pathAssets}>
                {transaction.path.map((asset, index) => (
                  <View key={index} style={styles.pathAssetItem}>
                    <Text style={styles.pathAssetText}>
                      {PathPaymentUtils.assetToString(asset)}
                    </Text>
                    {index < transaction.path!.length - 1 && (
                      <Text style={styles.pathArrow}>→</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Share Button */}
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareButtonText}>Share Transaction</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  amountSection: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  primaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  primaryAsset: {
    fontSize: 18,
    color: '#666',
    marginTop: 4,
  },
  conversionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  conversionArrow: {
    fontSize: 16,
    color: '#34C759',
    marginRight: 8,
  },
  secondaryAmount: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '600',
  },
  statusBadge: {
    marginTop: 12,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#000',
    flex: 2,
    textAlign: 'right',
  },
  incomingText: {
    color: '#34C759',
  },
  outgoingText: {
    color: '#FF3B30',
  },
  pathAssets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  pathAssetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pathAssetText: {
    fontSize: 12,
    color: '#000',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pathArrow: {
    fontSize: 12,
    color: '#666',
  },
  shareButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TransactionDetailScreen;
```

### Transaction List Hook

```typescript
import { useState, useEffect } from 'react';
import { PathPaymentUtils } from '../utils/path-payment-utils';
import { TransactionItem } from '../types/transaction';

interface UseTransactionsOptions {
  accountId: string;
  asset?: string;
  limit?: number;
}

interface UseTransactionsReturn {
  transactions: TransactionItem[];
  pathPayments: TransactionItem[];
  regularPayments: TransactionItem[];
  incomingPayments: TransactionItem[];
  outgoingPayments: TransactionItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useTransactions = (options: UseTransactionsOptions): UseTransactionsReturn => {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // API call to fetch transactions
      const response = await fetch(`/api/transactions?accountId=${options.accountId}&asset=${options.asset || ''}&limit=${options.limit || 20}`);
      const data = await response.json();
      
      setTransactions(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [options.accountId, options.asset, options.limit]);

  // Derived states using PathPaymentUtils
  const pathPayments = transactions.filter(PathPaymentUtils.isPathPayment);
  const regularPayments = transactions.filter(t => t.operation_type === 'payment');
  const incomingPayments = transactions.filter(t => 
    PathPaymentUtils.isIncomingPayment(t, options.accountId)
  );
  const outgoingPayments = transactions.filter(t => 
    PathPaymentUtils.isOutgoingPayment(t, options.accountId)
  );

  return {
    transactions,
    pathPayments,
    regularPayments,
    incomingPayments,
    outgoingPayments,
    loading,
    error,
    refresh: fetchTransactions,
  };
};
```

## Error Handling

### Safe Property Access

The utility functions are designed to handle missing or malformed data gracefully:

```typescript
// Safe asset string conversion
static assetToString(asset: PathPaymentAsset): string {
  if (asset.asset_type === 'native') {
    return 'XLM';
  }

  if (!asset.asset_code || !asset.asset_issuer) {
    return 'Unknown';
  }

  return `${asset.asset_code}:${asset.asset_issuer}`;
}

// Safe primary asset determination
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

### Component Error Handling

```typescript
const TransactionItem = ({ item }: { item: TransactionItem }) => {
  try {
    const isPathPayment = PathPaymentUtils.isPathPayment(item);
    const primaryAmount = PathPaymentUtils.getPrimaryAmount(item);
    
    return (
      <View>
        <Text>{parseFloat(primaryAmount).toFixed(2)}</Text>
        {isPathPayment && (
          <Text>{PathPaymentUtils.createPathDescription(item)}</Text>
        )}
      </View>
    );
  } catch (error) {
    // Fallback UI for corrupted data
    return (
      <View>
        <Text>Transaction details unavailable</Text>
        <Text>{item.txHash}</Text>
      </View>
    );
  }
};
```

## Performance Considerations

### Memoization

For performance-critical components, consider memoizing utility function results:

```typescript
import React, { useMemo } from 'react';
import { PathPaymentUtils } from '../utils/path-payment-utils';

const TransactionItem = ({ item }: { item: TransactionItem }) => {
  const pathPaymentInfo = useMemo(() => {
    if (!PathPaymentUtils.isPathPayment(item)) {
      return null;
    }

    return {
      primaryAsset: PathPaymentUtils.getPrimaryAsset(item),
      primaryAmount: PathPaymentUtils.getPrimaryAmount(item),
      secondaryAsset: PathPaymentUtils.getSecondaryAsset(item),
      secondaryAmount: PathPaymentUtils.getSecondaryAmount(item),
      description: PathPaymentUtils.createPathDescription(item),
      operationLabel: PathPaymentUtils.getOperationTypeLabel(item),
    };
  }, [item]);

  return (
    <View>
      {pathPaymentInfo ? (
        <>
          <Text>{pathPaymentInfo.primaryAmount} {pathPaymentInfo.primaryAsset}</Text>
          <Text>{pathPaymentInfo.operationLabel}</Text>
          <Text>{pathPaymentInfo.description}</Text>
        </>
      ) : (
        <Text>{parseFloat(item.amount).toFixed(2)} {item.asset}</Text>
      )}
    </View>
  );
};
```

### Lazy Loading

For large transaction lists, consider lazy loading path payment details:

```typescript
const TransactionItem = ({ item }: { item: TransactionItem }) => {
  const [showDetails, setShowDetails] = useState(false);
  const isPathPayment = PathPaymentUtils.isPathPayment(item);

  return (
    <TouchableOpacity onPress={() => setShowDetails(!showDetails)}>
      <Text>{parseFloat(item.amount).toFixed(2)} {item.asset}</Text>
      
      {isPathPayment && showDetails && (
        <View>
          <Text>{PathPaymentUtils.getOperationTypeLabel(item)}</Text>
          <Text>{PathPaymentUtils.createPathDescription(item)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
```

## Testing

### Unit Tests

```typescript
import { PathPaymentUtils } from '../utils/path-payment-utils';
import { TransactionItem } from '../types/transaction';

describe('PathPaymentUtils', () => {
  const mockTransaction: TransactionItem = {
    amount: '100.0000000',
    asset: 'XLM',
    timestamp: '2023-01-01T00:00:00Z',
    txHash: 'abc123',
    pagingToken: '123',
    operation_type: 'path_payment_strict_send',
    from: 'GFROM123',
    to: 'GTO123',
    source_amount: '50.0000000',
    source_asset: { asset_type: 'native' },
    destination_asset: { 
      asset_type: 'credit_alphanum4', 
      asset_code: 'USDC', 
      asset_issuer: 'GA123' 
    },
    path: []
  };

  describe('isPathPayment', () => {
    it('should return true for path payment strict send', () => {
      expect(PathPaymentUtils.isPathPayment(mockTransaction)).toBe(true);
    });

    it('should return true for path payment strict receive', () => {
      const transaction = { ...mockTransaction, operation_type: 'path_payment_strict_receive' };
      expect(PathPaymentUtils.isPathPayment(transaction)).toBe(true);
    });

    it('should return false for regular payment', () => {
      const transaction = { ...mockTransaction, operation_type: 'payment' };
      expect(PathPaymentUtils.isPathPayment(transaction)).toBe(false);
    });
  });

  describe('assetToString', () => {
    it('should convert native asset to XLM', () => {
      const asset = { asset_type: 'native' };
      expect(PathPaymentUtils.assetToString(asset)).toBe('XLM');
    });

    it('should convert credit asset to CODE:ISSUER format', () => {
      const asset = {
        asset_type: 'credit_alphanum4',
        asset_code: 'USDC',
        asset_issuer: 'GA123'
      };
      expect(PathPaymentUtils.assetToString(asset)).toBe('USDC:GA123');
    });

    it('should return Unknown for incomplete asset', () => {
      const asset = { asset_type: 'credit_alphanum4' };
      expect(PathPaymentUtils.assetToString(asset)).toBe('Unknown');
    });
  });

  describe('getPrimaryAsset', () => {
    it('should return source asset for strict send', () => {
      expect(PathPaymentUtils.getPrimaryAsset(mockTransaction)).toBe('XLM');
    });

    it('should return destination asset for strict receive', () => {
      const transaction = { 
        ...mockTransaction, 
        operation_type: 'path_payment_strict_receive',
        source_asset: { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GA123' },
        destination_asset: { asset_type: 'native' }
      };
      expect(PathPaymentUtils.getPrimaryAsset(transaction)).toBe('XLM');
    });
  });

  describe('createPathDescription', () => {
    it('should create direct conversion description', () => {
      expect(PathPaymentUtils.createPathDescription(mockTransaction))
        .toBe('Direct conversion: XLM → USDC:GA123');
    });

    it('should create multi-hop path description', () => {
      const transaction = {
        ...mockTransaction,
        path: [
          { asset_type: 'credit_alphanum4', asset_code: 'EURT', asset_issuer: 'GDEUR' }
        ]
      };
      expect(PathPaymentUtils.createPathDescription(transaction))
        .toBe('Path: XLM → EURT:GDEUR → USDC:GA123');
    });
  });

  describe('isIncomingPayment', () => {
    it('should identify incoming payments', () => {
      const transaction = { ...mockTransaction, to: 'GUSER123' };
      expect(PathPaymentUtils.isIncomingPayment(transaction, 'GUSER123')).toBe(true);
    });

    it('should not identify outgoing payments as incoming', () => {
      const transaction = { ...mockTransaction, from: 'GUSER123' };
      expect(PathPaymentUtils.isIncomingPayment(transaction, 'GUSER123')).toBe(false);
    });
  });
});
```

---

This comprehensive documentation covers all aspects of the PathPaymentUtils class, including detailed method descriptions, usage examples, integration patterns, error handling, performance considerations, and testing strategies. The utilities provide a robust foundation for handling path payment transactions in the mobile app with enhanced user experience features.
