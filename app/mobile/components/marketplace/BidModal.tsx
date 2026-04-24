import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { MarketplaceListing, BidResult } from '../../types/marketplace';

const { width } = Dimensions.get('window');

type Props = {
  listing: MarketplaceListing | null;
  visible: boolean;
  onClose: () => void;
  onBidSuccess: (username: string, amount: number) => void;
  placeBid: (username: string, amount: number) => Promise<BidResult>;
};

type BidState = "idle" | "loading" | "success" | "error";

export function BidModal({ listing, visible, onClose, onBidSuccess, placeBid }: Props) {
  const [amount, setAmount] = useState('');
  const [bidState, setBidState] = useState<BidState>("idle");
  const [errorMsg, setErrorMsg] = useState('');

  const minBid = listing ? listing.currentBid + 1 : 1;
  const parsedAmount = parseFloat(amount);
  const isValid = !isNaN(parsedAmount) && parsedAmount >= minBid;

  const handleConfirm = async () => {
    if (!listing || !isValid) return;
    
    setBidState("loading");
    setErrorMsg("");

    try {
      const result = await placeBid(listing.username, parsedAmount);
      if (result.success) {
        setBidState("success");
        onBidSuccess(listing.username, parsedAmount);
      } else {
        setBidState("error");
        setErrorMsg(result.reason);
      }
    } catch (error) {
      setBidState("error");
      setErrorMsg("An unexpected error occurred. Please try again.");
    }
  };

  const handleClose = () => {
    if (bidState === "loading") return;
    setBidState("idle");
    setAmount("");
    setErrorMsg("");
    onClose();
  };

  const formatCountdown = (date: Date): string => {
    const diff = date.getTime() - Date.now();
    if (diff <= 0) return "Ended";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  if (!listing) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Place Bid</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Success State */}
          {bidState === "success" && (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={48} color="#059669" />
              </View>
              <Text style={styles.successTitle}>Bid Placed!</Text>
              <Text style={styles.successMessage}>
                You're leading with{' '}
                <Text style={styles.successAmount}>{parsedAmount} USDC</Text> on{' '}
                <Text style={styles.successUsername}>@{listing.username}</Text>
              </Text>
              
              <View style={styles.transactionInfo}>
                <View style={styles.transactionRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.transactionText}>Transaction signed & broadcast</Text>
                </View>
                <Text style={styles.transactionDetail}>Network: Stellar Testnet</Text>
                <Text style={styles.transactionDetail}>Asset: USDC</Text>
                <Text style={styles.transactionDetail}>Amount: {parsedAmount}.00 USDC</Text>
                <Text style={styles.transactionDetail}>Ledger: ~2s settlement</Text>
              </View>

              <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Idle / Loading / Error States */}
          {bidState !== "success" && (
            <>
              {/* Username Display */}
              <View style={styles.usernameSection}>
                <Text style={styles.quickexPrefix}>quickex.to/</Text>
                <Text style={styles.username}>{listing.username}</Text>
                {listing.verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#059669" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Current Bid</Text>
                  <Text style={styles.statValue}>{listing.currentBid} USDC</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Bids</Text>
                  <Text style={styles.statValue}>{listing.bidCount}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Ends In</Text>
                  <Text style={styles.statValue}>{formatCountdown(listing.endsAt)}</Text>
                </View>
              </View>

              {/* Bid Input */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Your Bid (USDC)</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder={`Min ${minBid} USDC`}
                    keyboardType="numeric"
                    editable={bidState !== "loading"}
                    autoFocus
                  />
                  <Text style={styles.inputSuffix}>USDC</Text>
                </View>
                
                {amount && !isValid && (
                  <Text style={styles.validationError}>
                    Bid must be at least {minBid} USDC
                  </Text>
                )}
              </View>

              {/* Error Message */}
              {bidState === "error" && (
                <View style={styles.errorContainer}>
                  <Ionicons name="warning" size={20} color="#EF4444" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Wallet Warning */}
              <View style={styles.warningContainer}>
                <Ionicons name="key" size={20} color="#F59E0B" />
                <Text style={styles.warningText}>
                  Confirming will request a signature from your Stellar wallet (Freighter/Lobstr). 
                  No funds will be deducted until auction ends.
                </Text>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  bidState === "loading" && styles.actionButtonDisabled,
                  isValid && styles.actionButtonActive,
                ]}
                onPress={handleConfirm}
                disabled={!isValid || bidState === "loading"}
              >
                {bidState === "loading" ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="trending-up" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Confirm Bid</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  successAmount: {
    color: '#059669',
    fontWeight: '600',
  },
  successUsername: {
    color: '#111827',
    fontWeight: '600',
  },
  transactionInfo: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  transactionText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  transactionDetail: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  doneButton: {
    width: '100%',
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  usernameSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  quickexPrefix: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  username: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    paddingVertical: 16,
  },
  inputSuffix: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    textTransform: 'uppercase',
  },
  validationError: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
    marginTop: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E5E7EB',
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  actionButtonActive: {
    backgroundColor: '#111827',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
