import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { PaymentError, PaymentProgress } from '../../types/payment';

const { width } = Dimensions.get('window');

interface Props {
  progress: PaymentProgress;
  onRetry?: () => void;
  onCancel?: () => void;
  onGoBack?: () => void;
}

const ERROR_CONFIGS: Record<PaymentError, {
  icon: string;
  title: string;
  description: string;
  suggestions: string[];
  canRetry: boolean;
}> = {
  invalid_link: {
    icon: 'document-text-outline',
    title: 'Invalid Payment Link',
    description: 'The payment link is not valid or missing required information.',
    suggestions: [
      'Check the link for typos',
      'Make sure the link is complete',
      'Try scanning the QR code again',
    ],
    canRetry: false,
  },
  network_error: {
    icon: 'wifi-outline',
    title: 'Network Error',
    description: 'Unable to connect to the network. Please check your internet connection.',
    suggestions: [
      'Check your Wi-Fi or mobile data',
      'Try moving to a location with better signal',
      'Wait a moment and try again',
    ],
    canRetry: true,
  },
  wallet_not_found: {
    icon: 'wallet-outline',
    title: 'No Wallet Found',
    description: 'No compatible Stellar wallet was found on your device.',
    suggestions: [
      'Install a Stellar-compatible wallet',
      'Try Freighter, Lobstr, or StellarTerm',
      'Ensure your wallet app is properly installed',
    ],
    canRetry: false,
  },
  wallet_rejected: {
    icon: 'close-circle-outline',
    title: 'Payment Rejected',
    description: 'The payment was rejected by your wallet.',
    suggestions: [
      'Check your wallet balance',
      'Verify the payment details',
      'Try approving the payment in your wallet',
    ],
    canRetry: true,
  },
  insufficient_balance: {
    icon: 'alert-circle-outline',
    title: 'Insufficient Balance',
    description: 'You don\'t have enough balance to complete this payment.',
    suggestions: [
      'Add funds to your wallet',
      'Check your wallet balance',
      'Try a smaller amount',
    ],
    canRetry: false,
  },
  transaction_failed: {
    icon: 'warning-outline',
    title: 'Transaction Failed',
    description: 'The transaction could not be completed.',
    suggestions: [
      'Try again in a few moments',
      'Check network status',
      'Contact support if the issue persists',
    ],
    canRetry: true,
  },
  timeout: {
    icon: 'time-outline',
    title: 'Payment Timeout',
    description: 'The payment timed out. Please try again.',
    suggestions: [
      'Check your internet connection',
      'Try again quickly',
      'Ensure your wallet app is running',
    ],
    canRetry: true,
  },
  offline: {
    icon: 'cloud-offline-outline',
    title: 'Offline',
    description: 'You are currently offline. Please check your internet connection.',
    suggestions: [
      'Check your Wi-Fi or mobile data',
      'Wait for connection to be restored',
      'Try moving to a better location',
    ],
    canRetry: true,
  },
  unknown: {
    icon: 'help-circle-outline',
    title: 'Unknown Error',
    description: 'An unexpected error occurred. Please try again.',
    suggestions: [
      'Try again in a few moments',
      'Restart the app',
      'Contact support if the issue persists',
    ],
    canRetry: true,
  },
};

export function PaymentErrorScreen({ progress, onRetry, onCancel, onGoBack }: Props) {
  if (!progress.error) return null;

  const config = ERROR_CONFIGS[progress.error];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Error Icon and Title */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name={config.icon as any} size={48} color="#EF4444" />
          </View>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.description}>{config.description}</Text>
        </View>

        {/* Error Details */}
        {progress.errorMessage && (
          <View style={styles.errorDetails}>
            <Text style={styles.errorDetailsTitle}>Error Details</Text>
            <Text style={styles.errorDetailsText}>{progress.errorMessage}</Text>
          </View>
        )}

        {/* Suggestions */}
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>What you can try:</Text>
          {config.suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View>

        {/* Retry Information */}
        {progress.retryCount && progress.retryCount > 0 && (
          <View style={styles.retryInfo}>
            <Text style={styles.retryInfoText}>
              You have tried {progress.retryCount} time{progress.retryCount > 1 ? 's' : ''} 
              {progress.maxRetries && ` out of ${progress.maxRetries} allowed attempts.`}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {config.canRetry && onRetry && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}

          {onCancel && (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}

          {onGoBack && (
            <TouchableOpacity style={styles.goBackButton} onPress={onGoBack}>
              <Ionicons name="arrow-back" size={20} color="#6B7280" />
              <Text style={styles.goBackButtonText}>Go Back</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Help Section */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpText}>
            If you continue to experience issues, please contact our support team for assistance.
          </Text>
          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  errorDetails: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  errorDetailsText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  retryInfo: {
    backgroundColor: '#FEF3C7',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  retryInfoText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  goBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  goBackButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  helpContainer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  helpButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  helpButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
});
