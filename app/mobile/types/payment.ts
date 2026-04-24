/**
 * Payment link consumption types for enhanced UX
 */

export type PaymentState = 
  | 'idle'
  | 'validating'
  | 'ready'
  | 'connecting'
  | 'processing'
  | 'confirming'
  | 'success'
  | 'failed'
  | 'retrying';

export type PaymentError = 
  | 'invalid_link'
  | 'network_error'
  | 'wallet_not_found'
  | 'wallet_rejected'
  | 'insufficient_balance'
  | 'transaction_failed'
  | 'timeout'
  | 'offline'
  | 'unknown';

export interface PaymentDetails {
  username: string;
  amount: string;
  asset: string;
  memo?: string;
  privacy: boolean;
  recipientAddress?: string;
}

export interface TransactionResult {
  hash: string;
  amount: string;
  asset: string;
  recipient: string;
  timestamp: Date;
  network: 'testnet' | 'mainnet';
  memo?: string;
}

export interface PaymentProgress {
  state: PaymentState;
  error?: PaymentError;
  errorMessage?: string;
  transaction?: TransactionResult;
  retryCount?: number;
  maxRetries?: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

export const PAYMENT_ERROR_MESSAGES: Record<PaymentError, string> = {
  invalid_link: 'This payment link is invalid or missing required information.',
  network_error: 'Network connection failed. Please check your internet connection.',
  wallet_not_found: 'No Stellar wallet found. Please install a compatible wallet.',
  wallet_rejected: 'Payment was rejected by your wallet.',
  insufficient_balance: 'Insufficient balance to complete this payment.',
  transaction_failed: 'Transaction failed. Please try again.',
  timeout: 'Payment timed out. Please try again.',
  offline: 'You are currently offline. Please check your connection.',
  unknown: 'An unexpected error occurred. Please try again.',
};

export const PAYMENT_STATE_DESCRIPTIONS: Record<PaymentState, string> = {
  idle: 'Ready to process payment',
  validating: 'Validating payment link...',
  ready: 'Payment link validated',
  connecting: 'Connecting to wallet...',
  processing: 'Processing payment...',
  confirming: 'Confirming transaction...',
  success: 'Payment completed successfully',
  failed: 'Payment failed',
  retrying: 'Retrying payment...',
};
