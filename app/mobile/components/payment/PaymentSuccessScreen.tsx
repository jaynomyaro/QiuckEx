import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { TransactionResult } from '../../types/payment';

interface Props {
  transaction: TransactionResult;
  onViewDetails?: () => void;
  onNewPayment?: () => void;
  onGoHome?: () => void;
}

export function PaymentSuccessScreen({ 
  transaction, 
  onViewDetails, 
  onNewPayment, 
  onGoHome 
}: Props) {
  const handleShareTransaction = async () => {
    const shareContent = `
Payment Completed Successfully
============================
Amount: ${transaction.amount} ${transaction.asset}
Recipient: ${transaction.recipient}
Network: ${transaction.network}
Hash: ${transaction.hash}
Date: ${transaction.timestamp.toLocaleString()}
${transaction.memo ? `Memo: ${transaction.memo}` : ''}

View on Stellar Explorer: https://stellar.expert/explorer/public/tx/${transaction.hash}
    `.trim();

    try {
      await Share.share({
        message: shareContent,
        title: 'Payment Confirmation',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share transaction details');
    }
  };

  const formatAmount = (amount: string, asset: string) => {
    return `${parseFloat(amount).toLocaleString()} ${asset}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Success Animation Area */}
        <View style={styles.successHeader}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successDescription}>
            Your payment has been processed and confirmed on the Stellar network.
          </Text>
        </View>

        {/* Transaction Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Payment Summary</Text>
            <View style={styles.networkBadge}>
              <Text style={styles.networkText}>{transaction.network.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.amountSection}>
            <Text style={styles.amount}>{formatAmount(transaction.amount, transaction.asset)}</Text>
            <Text style={styles.recipient}>to {transaction.recipient}</Text>
          </View>

          {transaction.memo && (
            <View style={styles.memoSection}>
              <Text style={styles.memoLabel}>Memo</Text>
              <Text style={styles.memoText}>{transaction.memo}</Text>
            </View>
          )}
        </View>

        {/* Transaction Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Transaction Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction Hash</Text>
            <TouchableOpacity 
              style={styles.copyableRow}
              onPress={() => handleCopyTransactionHash(transaction.hash)}
            >
              <Text style={styles.detailValue} numberOfLines={1}>
                {transaction.hash.slice(0, 10)}…{transaction.hash.slice(-8)}
              </Text>
              <Ionicons name="copy-outline" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>{formatDate(transaction.timestamp)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Network</Text>
            <Text style={styles.detailValue}>{transaction.network}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#10B981" />
              <Text style={styles.statusText}>Confirmed</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={onViewDetails}>
            <Ionicons name="list" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>View Transaction Details</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleShareTransaction}>
            <Ionicons name="share-outline" size={20} color="#6B7280" />
            <Text style={styles.secondaryButtonText}>Share Receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tertiaryButton} onPress={onNewPayment}>
            <Ionicons name="add-circle-outline" size={20} color="#6366F1" />
            <Text style={styles.tertiaryButtonText}>Make Another Payment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.goBackButton} onPress={onGoHome}>
            <Ionicons name="home" size={20} color="#6B7280" />
            <Text style={styles.goBackButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={20} color="#10B981" />
          <Text style={styles.securityText}>
            This transaction is permanently recorded on the Stellar blockchain and cannot be altered.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function handleCopyTransactionHash(hash: string) {
  // In a real app, this would use Clipboard.setString
  Alert.alert('Copied!', 'Transaction hash copied to clipboard');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  successHeader: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  successDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  networkBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  networkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  amount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  recipient: {
    fontSize: 16,
    color: '#6B7280',
  },
  memoSection: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  memoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  memoText: {
    fontSize: 14,
    color: '#374151',
  },
  detailsCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  copyableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  tertiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  tertiaryButtonText: {
    color: '#6366F1',
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
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: '#065F46',
    lineHeight: 18,
  },
});
