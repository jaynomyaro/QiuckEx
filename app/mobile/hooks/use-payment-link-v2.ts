import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import NetInfo from '@react-native-community/netinfo';
import type { 
  PaymentState, 
  PaymentError, 
  PaymentDetails, 
  TransactionResult,
  PaymentProgress,
  RetryConfig,
  DEFAULT_RETRY_CONFIG 
} from '../types/payment';

interface UsePaymentLinkV2Options {
  onPaymentSuccess?: (result: TransactionResult) => void;
  onPaymentError?: (error: PaymentError, message: string) => void;
  retryConfig?: Partial<RetryConfig>;
}

export function usePaymentLinkV2(options: UsePaymentLinkV2Options = {}) {
  const { onPaymentSuccess, onPaymentError, retryConfig: userRetryConfig } = options;
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...userRetryConfig };

  const [progress, setProgress] = useState<PaymentProgress>({
    state: 'idle',
    retryCount: 0,
    maxRetries: retryConfig.maxRetries,
  });

  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Network status monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    // Initial check
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected);
    });

    return unsubscribe;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const calculateRetryDelay = (attempt: number): number => {
    const delay = retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, attempt);
    return Math.min(delay, retryConfig.maxDelay);
  };

  const updateProgress = useCallback((updates: Partial<PaymentProgress>) => {
    setProgress(prev => ({ ...prev, ...updates }));
  }, []);

  const handleError = useCallback((error: PaymentError, customMessage?: string) => {
    updateProgress({
      state: 'failed',
      error,
      errorMessage: customMessage,
    });

    if (onPaymentError) {
      onPaymentError(error, customMessage || getErrorMessage(error));
    }
  }, [onPaymentError, updateProgress]);

  const handleSuccess = useCallback((transaction: TransactionResult) => {
    updateProgress({
      state: 'success',
      transaction,
    });

    if (onPaymentSuccess) {
      onPaymentSuccess(transaction);
    }
  }, [onPaymentSuccess, updateProgress]);

  const validatePaymentLink = useCallback(async (paymentDetails: PaymentDetails): Promise<boolean> => {
    updateProgress({ state: 'validating' });

    try {
      // Simulate validation delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Basic validation
      if (!paymentDetails.username || !paymentDetails.amount || !paymentDetails.asset) {
        handleError('invalid_link');
        return false;
      }

      // Validate amount format
      const amount = parseFloat(paymentDetails.amount);
      if (isNaN(amount) || amount <= 0) {
        handleError('invalid_link', 'Invalid amount specified');
        return false;
      }

      updateProgress({ state: 'ready' });
      return true;
    } catch (error) {
      handleError('unknown', 'Validation failed');
      return false;
    }
  }, [updateProgress, handleError]);

  const checkWalletAvailability = useCallback(async (): Promise<boolean> => {
    updateProgress({ state: 'connecting' });

    try {
      // Check if any Stellar wallet is available
      const stellarUri = 'web+stellar:pay?destination=test&amount=1&asset_code=XLM';
      const canOpen = await Linking.canOpenURL(stellarUri);
      
      if (!canOpen) {
        handleError('wallet_not_found');
        return false;
      }

      return true;
    } catch (error) {
      handleError('wallet_rejected');
      return false;
    }
  }, [updateProgress, handleError]);

  const executePayment = useCallback(async (paymentDetails: PaymentDetails): Promise<TransactionResult | null> => {
    updateProgress({ state: 'processing' });

    try {
      // Build Stellar payment URI
      const stellarUri = `web+stellar:pay?destination=${paymentDetails.username}&amount=${paymentDetails.amount}&asset_code=${paymentDetails.asset}${paymentDetails.memo ? `&memo=${encodeURIComponent(paymentDetails.memo)}` : ""}`;

      updateProgress({ state: 'confirming' });

      // Open wallet app
      const canOpen = await Linking.canOpenURL(stellarUri);
      if (!canOpen) {
        handleError('wallet_not_found');
        return null;
      }

      await Linking.openURL(stellarUri);

      // Simulate transaction processing (in real app, this would listen for transaction completion)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock successful transaction
      const transaction: TransactionResult = {
        hash: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: paymentDetails.amount,
        asset: paymentDetails.asset,
        recipient: paymentDetails.username,
        timestamp: new Date(),
        network: 'testnet', // Would be determined from wallet connection
        memo: paymentDetails.memo,
      };

      return transaction;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          handleError('timeout');
        } else if (error.message.includes('network')) {
          handleError('network_error');
        } else {
          handleError('transaction_failed', error.message);
        }
      } else {
        handleError('unknown');
      }
      return null;
    }
  }, [updateProgress, handleError]);

  const processPaymentWithRetry = useCallback(async (
    paymentDetails: PaymentDetails,
    attempt: number = 0
  ): Promise<boolean> => {
    if (attempt > 0) {
      updateProgress({ 
        state: 'retrying',
        retryCount: attempt,
      });
    }

    try {
      // Check network connectivity
      if (isOnline === false) {
        handleError('offline');
        return false;
      }

      // Validate payment link
      const isValid = await validatePaymentLink(paymentDetails);
      if (!isValid) return false;

      // Check wallet availability
      const hasWallet = await checkWalletAvailability();
      if (!hasWallet) return false;

      // Execute payment
      const transaction = await executePayment(paymentDetails);
      if (!transaction) return false;

      // Success
      handleSuccess(transaction);
      return true;

    } catch (error) {
      // Retry logic
      if (attempt < retryConfig.maxRetries) {
        const delay = calculateRetryDelay(attempt);
        
        await new Promise(resolve => {
          timeoutRef.current = setTimeout(resolve, delay);
        });

        return processPaymentWithRetry(paymentDetails, attempt + 1);
      }

      // Max retries exceeded
      handleError('transaction_failed', `Payment failed after ${retryConfig.maxRetries} attempts`);
      return false;
    }
  }, [
    isOnline,
    retryConfig.maxRetries,
    validatePaymentLink,
    checkWalletAvailability,
    executePayment,
    handleSuccess,
    handleError,
    updateProgress,
  ]);

  const processPayment = useCallback(async (paymentDetails: PaymentDetails): Promise<boolean> => {
    // Reset progress
    updateProgress({
      state: 'idle',
      error: undefined,
      errorMessage: undefined,
      transaction: undefined,
      retryCount: 0,
    });

    return processPaymentWithRetry(paymentDetails);
  }, [updateProgress, processPaymentWithRetry]);

  const retryPayment = useCallback(async (): Promise<boolean> => {
    if (!progress.error) return false;

    // Reset error state but keep retry count
    updateProgress({
      state: 'idle',
      error: undefined,
      errorMessage: undefined,
    });

    // This would need the original payment details - in real implementation, store them
    // For now, just show retry UI
    return false;
  }, [progress.error, updateProgress]);

  const cancelPayment = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    updateProgress({
      state: 'idle',
      error: undefined,
      errorMessage: undefined,
    });
  }, [updateProgress]);

  const resetPayment = useCallback(() => {
    setProgress({
      state: 'idle',
      retryCount: 0,
      maxRetries: retryConfig.maxRetries,
    });
  }, [retryConfig.maxRetries]);

  return {
    progress,
    isOnline,
    processPayment,
    retryPayment,
    cancelPayment,
    resetPayment,
    canRetry: progress.state === 'failed' && (progress.retryCount || 0) < retryConfig.maxRetries,
  };
}

function getErrorMessage(error: PaymentError): string {
  const messages: Record<PaymentError, string> = {
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

  return messages[error];
}
