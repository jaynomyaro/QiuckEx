import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PaymentState, PaymentProgress } from '../../types/payment';

const { width } = Dimensions.get('window');

interface Props {
  progress: PaymentProgress;
}

const STATE_CONFIGS: Record<PaymentState, {
  icon: string;
  color: string;
  bgColor: string;
  title: string;
  description: string;
}> = {
  idle: {
    icon: 'wallet-outline',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    title: 'Ready to Pay',
    description: 'Payment link is ready for processing',
  },
  validating: {
    icon: 'search-outline',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    title: 'Validating',
    description: 'Checking payment link details...',
  },
  ready: {
    icon: 'checkmark-circle-outline',
    color: '#10B981',
    bgColor: '#ECFDF5',
    title: 'Ready to Pay',
    description: 'Payment link is valid and ready',
  },
  connecting: {
    icon: 'link-outline',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    title: 'Connecting',
    description: 'Connecting to your wallet...',
  },
  processing: {
    icon: 'refresh-outline',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    title: 'Processing',
    description: 'Processing your payment...',
  },
  confirming: {
    icon: 'lock-closed-outline',
    color: '#8B5CF6',
    bgColor: '#F3E8FF',
    title: 'Confirming',
    description: 'Waiting for wallet confirmation...',
  },
  success: {
    icon: 'checkmark-circle',
    color: '#10B981',
    bgColor: '#ECFDF5',
    title: 'Payment Successful',
    description: 'Payment completed successfully',
  },
  failed: {
    icon: 'close-circle',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    title: 'Payment Failed',
    description: 'Payment could not be completed',
  },
  retrying: {
    icon: 'refresh',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    title: 'Retrying',
    description: 'Attempting payment again...',
  },
};

export function PaymentProgressIndicator({ progress }: Props) {
  const config = STATE_CONFIGS[progress.state];
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress.state, animatedValue]);

  const isProcessing = ['validating', 'connecting', 'processing', 'confirming', 'retrying'].includes(progress.state);

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <Animated.View 
          style={[
            styles.progressBar,
            {
              backgroundColor: config.color,
              width: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }
          ]} 
        />
      </View>

      {/* Status Card */}
      <View style={[styles.statusCard, { backgroundColor: config.bgColor }]}>
        <View style={styles.statusHeader}>
          <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
            {isProcessing ? (
              <Animated.View>
                <Ionicons 
                  name={config.icon as any} 
                  size={24} 
                  color="#fff"
                  style={{
                    transform: [{
                      rotate: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      })
                    }]
                  }}
                />
              </Animated.View>
            ) : (
              <Ionicons name={config.icon as any} size={24} color="#fff" />
            )}
          </View>
          
          <View style={styles.statusText}>
            <Text style={[styles.statusTitle, { color: config.color }]}>
              {config.title}
            </Text>
            <Text style={styles.statusDescription}>
              {config.description}
            </Text>
          </View>
        </View>

        {/* Retry Information */}
        {progress.state === 'retrying' && progress.retryCount && (
          <View style={styles.retryInfo}>
            <Text style={styles.retryText}>
              Attempt {progress.retryCount} of {progress.maxRetries}
            </Text>
          </View>
        )}

        {/* Error Message */}
        {progress.error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={16} color="#EF4444" />
            <Text style={styles.errorText}>
              {progress.errorMessage}
            </Text>
          </View>
        )}

        {/* Transaction Details */}
        {progress.transaction && (
          <View style={styles.transactionContainer}>
            <Text style={styles.transactionTitle}>Transaction Details</Text>
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Hash:</Text>
              <Text style={styles.transactionValue} numberOfLines={1}>
                {progress.transaction.hash}
              </Text>
            </View>
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Amount:</Text>
              <Text style={styles.transactionValue}>
                {progress.transaction.amount} {progress.transaction.asset}
              </Text>
            </View>
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Network:</Text>
              <Text style={styles.transactionValue}>
                {progress.transaction.network}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 24,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  retryInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  retryText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
  },
  transactionContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  transactionValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
});
