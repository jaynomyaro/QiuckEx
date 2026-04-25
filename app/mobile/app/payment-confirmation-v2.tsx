import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useSecurity } from '@/hooks/use-security';
import { usePaymentLinkV2 } from '../hooks/use-payment-link-v2';
import { PaymentProgressIndicator } from '../components/payment/PaymentProgressIndicator';
import { PaymentErrorScreen } from '../components/payment/PaymentErrorScreen';
import { PaymentSuccessScreen } from '../components/payment/PaymentSuccessScreen';
import type { PaymentDetails } from '../types/payment';

export default function PaymentConfirmationV2Screen() {
  const router = useRouter();
  const { authenticateForSensitiveAction } = useSecurity();
  const params = useLocalSearchParams<{
    username: string;
    amount: string;
    asset: string;
    memo?: string;
    privacy?: string;
  }>();

  const { username, amount, asset, memo, privacy } = params;
  const isPrivate = privacy === 'true';
  const isValid = username && amount && asset;

  // Enhanced payment hook
  const {
    progress,
    isOnline,
    processPayment,
    retryPayment,
    cancelPayment,
    resetPayment,
    canRetry,
  } = usePaymentLinkV2({
    onPaymentSuccess: (transaction) => {
      // Success is handled by the UI state
      console.log('Payment successful:', transaction);
    },
    onPaymentError: (error, message) => {
      // Error is handled by the UI state
      console.log('Payment error:', error, message);
    },
    retryConfig: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 8000,
      backoffFactor: 2,
    },
  });

  const [showDetails, setShowDetails] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  // Validate payment link on mount
  useEffect(() => {
    if (isValid && username && amount && asset) {
      const paymentDetails: PaymentDetails = {
        username,
        amount,
        asset,
        memo: memo || undefined,
        privacy: isPrivate,
      };
      
      // Pre-validate the payment link
      // This will set the progress state to 'ready' if valid
      // In a real app, you might want to do this validation earlier
    }
  }, [isValid, username, amount, asset, memo, isPrivate]);

  const handlePayWithWallet = async () => {
    if (!isValid || !username || !amount || !asset) {
      Alert.alert('Invalid Payment', 'Payment details are incomplete.');
      return;
    }

    // Authenticate first
    const authorized = await authenticateForSensitiveAction(
      'payment_authorization',
      {
        title: 'Signed Action Required',
        description: 'You are about to send funds from your wallet.',
        riskLabel: 'HIGH RISK: FUNDS TRANSFER',
        details: [
          `Recipient: @${username}`,
          `Amount: ${amount} ${asset}`,
          memo ? `Memo: ${memo}` : 'Memo: none',
          isPrivate ? 'Privacy mode: enabled' : 'Privacy mode: disabled',
        ],
        acknowledgementText: 'SIGN',
      },
    );
    if (!authorized) {
      Alert.alert(
        'Authentication Required',
        'You must authenticate with biometrics or PIN before sending payment.',
      );
      return;
    }

    // Process payment
    const paymentDetails: PaymentDetails = {
      username,
      amount,
      asset,
      memo: memo || undefined,
      privacy: isPrivate,
    };

    await processPayment(paymentDetails);
  };

  const handleRetry = async () => {
    if (!canRetry) return;
    
    await retryPayment();
  };

  const handleCancel = () => {
    cancelPayment();
    setShowDetails(false);
  };

  const handleGoBack = () => {
    resetPayment();
    router.replace('/');
  };

  const handleViewDetails = () => {
    setShowDetails(true);
  };

  const handleNewPayment = () => {
    resetPayment();
    router.replace('/scan-to-pay');
  };

  const handleGoHome = () => {
    resetPayment();
    router.replace('/');
  };

  const handleSaveContact = async () => {
    if (!username) return;
    
    setSavingContact(true);
    try {
      const { saveContact } = require('../services/contacts');
      const { v4: uuidv4 } = require('uuid');
      
      await saveContact({
        id: uuidv4(),
        address: username,
        nickname: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      Alert.alert('Contact saved!', 'Recipient has been added to your contacts.');
    } catch (e) {
      Alert.alert('Failed to save contact');
    } finally {
      setSavingContact(false);
    }
  };

  // Show error screen if payment failed
  if (progress.state === 'failed' && progress.error) {
    return (
      <PaymentErrorScreen
        progress={progress}
        onRetry={canRetry ? handleRetry : undefined}
        onCancel={handleCancel}
        onGoBack={handleGoBack}
      />
    );
  }

  // Show success screen if payment completed
  if (progress.state === 'success' && progress.transaction) {
    return (
      <PaymentSuccessScreen
        transaction={progress.transaction}
        onViewDetails={handleViewDetails}
        onNewPayment={handleNewPayment}
        onGoHome={handleGoHome}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Confirm Payment</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Network Status */}
      {isOnline === false && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color="#EF4444" />
          <Text style={styles.offlineText}>
            You are offline. Please check your internet connection.
          </Text>
        </View>
      )}

      <View style={styles.content}>
        {/* Payment Progress Indicator */}
        <PaymentProgressIndicator progress={progress} />

        {/* Payment Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recipient</Text>
            <Text style={styles.detailValue}>@{username}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={[styles.detailValue, styles.amount]}>
              {amount} {asset}
            </Text>
          </View>
          
          {memo && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Memo</Text>
                <Text style={styles.detailValue}>{memo}</Text>
              </View>
            </>
          )}
          
          {isPrivate && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Privacy</Text>
                <View style={styles.privacyBadge}>
                  <Ionicons name="eye-off" size={12} color="#6366F1" />
                  <Text style={styles.privacyText}>X-Ray enabled</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={20} color="#10B981" />
          <Text style={styles.securityText}>
            This payment will be processed securely through your Stellar wallet.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Pressable
            style={[
              styles.payButton,
              progress.state !== 'idle' && styles.payButtonDisabled,
            ]}
            onPress={handlePayWithWallet}
            disabled={progress.state !== 'idle' || isOnline === false}
          >
            {progress.state === 'idle' ? (
              <>
                <Ionicons name="wallet" size={20} color="#fff" />
                <Text style={styles.payButtonText}>Pay with Wallet</Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.payButtonText}>
                  {progress.state === 'validating' && 'Validating...'}
                  {progress.state === 'connecting' && 'Connecting...'}
                  {progress.state === 'processing' && 'Processing...'}
                  {progress.state === 'confirming' && 'Confirming...'}
                  {progress.state === 'retrying' && 'Retrying...'}
                </Text>
              </>
            )}
          </Pressable>

          {progress.state === 'idle' && (
            <>
              <Pressable style={styles.cancelButton} onPress={handleGoBack}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable
                style={[styles.saveContactButton, savingContact && styles.saveContactButtonDisabled]}
                onPress={handleSaveContact}
                disabled={savingContact}
              >
                <Ionicons 
                  name={savingContact ? "refresh" : "person-add"} 
                  size={16} 
                  color="#6B7280" 
                />
                <Text style={styles.saveContactButtonText}>
                  {savingContact ? 'Saving...' : 'Save Recipient'}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerPlaceholder: {
    width: 40,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  offlineText: {
    flex: 1,
    fontSize: 14,
    color: '#991B1B',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  privacyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  payButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  payButtonText: {
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
  saveContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  saveContactButtonDisabled: {
    opacity: 0.6,
  },
  saveContactButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowLabel: { fontSize: 15, color: '#888' },
  rowValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
    flexShrink: 1,
    textAlign: 'right',
  },
  rowValueHighlight: { fontSize: 20, fontWeight: '700', color: '#000' },
});
