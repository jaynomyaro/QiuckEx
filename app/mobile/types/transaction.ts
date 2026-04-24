/**
 * Path payment asset information
 */
export interface PathPaymentAsset {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}

/**
 * Mirrors TransactionItemDto from the backend.
 * Keep in sync with app/backend/src/transactions/dto/transaction.dto.ts
 */
export interface TransactionItem {
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

/**
 * Mirrors TransactionResponseDto from the backend.
 */
export interface TransactionResponse {
  items: TransactionItem[];
  nextCursor?: string;
}
