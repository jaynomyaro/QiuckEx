import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Share,
    Clipboard,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '../hooks/use-transactions';
import type { TransactionItem } from '../types/transaction';
import { ErrorState } from '../components/resilience/error-state';
import { PathPaymentUtils } from '../utils/path-payment-utils';

const { width } = Dimensions.get('window');

interface TimelineEvent {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: 'initiated' | 'processing' | 'completed' | 'failed';
}

function formatAsset(asset: string): string {
    const colonIdx = asset.indexOf(':');
    return colonIdx === -1 ? asset : asset.slice(0, colonIdx);
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatFullDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

function generateTimeline(transaction: TransactionItem): TimelineEvent[] {
    const baseTime = new Date(transaction.timestamp);
    const events: TimelineEvent[] = [
        {
            id: '1',
            title: 'Transaction Initiated',
            description: `Payment of ${parseFloat(transaction.amount).toFixed(2)} ${formatAsset(transaction.asset)} started`,
            timestamp: new Date(baseTime.getTime() - 30000).toISOString(),
            type: 'initiated',
        },
        {
            id: '2',
            title: 'Processing',
            description: 'Transaction is being validated on the Stellar network',
            timestamp: new Date(baseTime.getTime() - 15000).toISOString(),
            type: 'processing',
        },
        {
            id: '3',
            title: 'Completed',
            description: 'Transaction successfully confirmed on the blockchain',
            timestamp: transaction.timestamp,
            type: 'completed',
        },
    ];
    return events;
}

export default function TransactionDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ 
        accountId?: string; 
        txHash?: string;
        pagingToken?: string;
    }>();
    
    const accountId = params.accountId?.trim() || '';
    const txHash = params.txHash?.trim() || '';
    const pagingToken = params.pagingToken?.trim() || '';

    const { transactions, loading, error } = useTransactions(accountId);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Find the specific transaction
    const transaction = transactions.find(tx => 
        tx.txHash === txHash || tx.pagingToken === pagingToken
    );

    const timeline = transaction ? generateTimeline(transaction) : [];

    const handleCopy = async (text: string, fieldName: string) => {
        try {
            await Clipboard.setString(text);
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (error) {
            Alert.alert('Error', 'Failed to copy to clipboard');
        }
    };

    const handleShare = async () => {
        if (!transaction) return;

        const isPathPayment = PathPaymentUtils.isPathPayment(transaction);
        const primaryAsset = isPathPayment ? PathPaymentUtils.getPrimaryAsset(transaction) : formatAsset(transaction.asset);
        const primaryAmount = isPathPayment ? PathPaymentUtils.getPrimaryAmount(transaction) : transaction.amount;
        const operationTypeLabel = PathPaymentUtils.getOperationTypeLabel(transaction);

        let shareContent = `
Transaction Details
==================
Operation: ${operationTypeLabel}
Amount: ${parseFloat(primaryAmount).toFixed(2)} ${primaryAsset}`;

        if (isPathPayment) {
            const secondaryAmount = PathPaymentUtils.getSecondaryAmount(transaction);
            const secondaryAsset = PathPaymentUtils.getSecondaryAsset(transaction);
            shareContent += `
Converted to: ${parseFloat(secondaryAmount).toFixed(2)} ${secondaryAsset}
Path: ${PathPaymentUtils.createPathDescription(transaction)}`;
        }

        shareContent += `
Hash: ${transaction.txHash}
Date: ${formatFullDate(transaction.timestamp)}
${transaction.memo ? `Memo: ${transaction.memo}` : ''}
${transaction.from ? `From: ${transaction.from}` : ''}
${transaction.to ? `To: ${transaction.to}` : ''}
${transaction.asset.includes(':') ? `Asset: ${transaction.asset}` : ''}

View on Stellar Explorer: https://stellar.expert/explorer/public/tx/${transaction.txHash}
        `.trim();

        try {
            await Share.share({
                message: shareContent,
                title: 'Transaction Details',
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to share transaction details');
        }
    };

    const TimelineItem = ({ event, isLast }: { event: TimelineEvent; isLast: boolean }) => {
        const getEventColor = (type: TimelineEvent['type']) => {
            switch (type) {
                case 'initiated': return '#3B82F6';
                case 'processing': return '#F59E0B';
                case 'completed': return '#10B981';
                case 'failed': return '#EF4444';
                default: return '#6B7280';
            }
        };

        const getEventIcon = (type: TimelineEvent['type']) => {
            switch (type) {
                case 'initiated': return 'play-circle';
                case 'processing': return 'time';
                case 'completed': return 'checkmark-circle';
                case 'failed': return 'close-circle';
                default: return 'help-circle';
            }
        };

        return (
            <View style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, { backgroundColor: getEventColor(event.type) }]}>
                        <Ionicons 
                            name={getEventIcon(event.type)} 
                            size={16} 
                            color="#fff" 
                        />
                    </View>
                    {!isLast && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>{event.title}</Text>
                    <Text style={styles.timelineDescription}>{event.description}</Text>
                    <Text style={styles.timelineTime}>{formatDate(event.timestamp)}</Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6B7280" />
                    <Text style={styles.loadingText}>Loading transaction details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <ErrorState
                    message={error}
                    onRetry={() => router.back()}
                />
            </SafeAreaView>
        );
    }

    if (!transaction) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.notFoundContainer}>
                    <Ionicons name="document-outline" size={48} color="#6B7280" />
                    <Text style={styles.notFoundTitle}>Transaction Not Found</Text>
                    <Text style={styles.notFoundDescription}>
                        The transaction you're looking for could not be found.
                    </Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const isPathPayment = PathPaymentUtils.isPathPayment(transaction);
    const primaryAsset = isPathPayment ? PathPaymentUtils.getPrimaryAsset(transaction) : formatAsset(transaction.asset);
    const primaryAmount = isPathPayment ? PathPaymentUtils.getPrimaryAmount(transaction) : transaction.amount;
    const operationTypeLabel = PathPaymentUtils.getOperationTypeLabel(transaction);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backBtn}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Ionicons name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transaction Details</Text>
                <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
                    <Ionicons name="share-outline" size={24} color="#111827" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Amount Card */}
                <View style={styles.amountCard}>
                    <Text style={styles.amount}>{parseFloat(primaryAmount).toFixed(2)}</Text>
                    <Text style={styles.assetCode}>{primaryAsset}</Text>
                    {isPathPayment && (
                        <View style={styles.conversionRow}>
                            <Ionicons name="arrow-down" size={16} color="#059669" />
                            <Text style={styles.conversionText}>
                                {parseFloat(PathPaymentUtils.getSecondaryAmount(transaction)).toFixed(2)} {PathPaymentUtils.getSecondaryAsset(transaction)}
                            </Text>
                        </View>
                    )}
                    <View style={styles.statusBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.statusText}>{operationTypeLabel}</Text>
                    </View>
                </View>

                {/* Transaction Info */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Transaction Information</Text>
                    
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Transaction Hash</Text>
                        <TouchableOpacity 
                            onPress={() => handleCopy(transaction.txHash, 'hash')}
                            style={styles.copyableRow}
                        >
                            <Text style={styles.infoValue} numberOfLines={1}>
                                {transaction.txHash.slice(0, 10)}…{transaction.txHash.slice(-8)}
                            </Text>
                            <Ionicons 
                                name={copiedField === 'hash' ? 'checkmark' : 'copy-outline'} 
                                size={16} 
                                color={copiedField === 'hash' ? '#10B981' : '#6B7280'} 
                            />
                        </TouchableOpacity>
                    </View>

                    {transaction.memo && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Memo</Text>
                            <TouchableOpacity 
                                onPress={() => handleCopy(transaction.memo!, 'memo')}
                                style={styles.copyableRow}
                            >
                                <Text style={styles.infoValue} numberOfLines={2}>
                                    {transaction.memo}
                                </Text>
                                <Ionicons 
                                    name={copiedField === 'memo' ? 'checkmark' : 'copy-outline'} 
                                    size={16} 
                                    color={copiedField === 'memo' ? '#10B981' : '#6B7280'} 
                                />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Date & Time</Text>
                        <TouchableOpacity 
                            onPress={() => handleCopy(formatFullDate(transaction.timestamp), 'date')}
                            style={styles.copyableRow}
                        >
                            <Text style={styles.infoValue}>{formatDate(transaction.timestamp)}</Text>
                            <Ionicons 
                                name={copiedField === 'date' ? 'checkmark' : 'copy-outline'} 
                                size={16} 
                                color={copiedField === 'date' ? '#10B981' : '#6B7280'} 
                            />
                        </TouchableOpacity>
                    </View>

                    {transaction.asset.includes(':') && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Full Asset</Text>
                            <TouchableOpacity 
                                onPress={() => handleCopy(transaction.asset, 'asset')}
                                style={styles.copyableRow}
                            >
                                <Text style={styles.infoValue} numberOfLines={2}>
                                    {transaction.asset}
                                </Text>
                                <Ionicons 
                                    name={copiedField === 'asset' ? 'checkmark' : 'copy-outline'} 
                                    size={16} 
                                    color={copiedField === 'asset' ? '#10B981' : '#6B7280'} 
                                />
                            </TouchableOpacity>
                        </View>
                    )}

                    {transaction.from && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>From</Text>
                            <TouchableOpacity 
                                onPress={() => handleCopy(transaction.from!, 'from')}
                                style={styles.copyableRow}
                            >
                                <Text style={styles.infoValue} numberOfLines={1}>
                                    {transaction.from.slice(0, 10)}…{transaction.from.slice(-8)}
                                </Text>
                                <Ionicons 
                                    name={copiedField === 'from' ? 'checkmark' : 'copy-outline'} 
                                    size={16} 
                                    color={copiedField === 'from' ? '#10B981' : '#6B7280'} 
                                />
                            </TouchableOpacity>
                        </View>
                    )}

                    {transaction.to && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>To</Text>
                            <TouchableOpacity 
                                onPress={() => handleCopy(transaction.to!, 'to')}
                                style={styles.copyableRow}
                            >
                                <Text style={styles.infoValue} numberOfLines={1}>
                                    {transaction.to.slice(0, 10)}…{transaction.to.slice(-8)}
                                </Text>
                                <Ionicons 
                                    name={copiedField === 'to' ? 'checkmark' : 'copy-outline'} 
                                    size={16} 
                                    color={copiedField === 'to' ? '#10B981' : '#6B7280'} 
                                />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Path Payment Details */}
                {isPathPayment && (
                    <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>Path Payment Details</Text>
                        
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Operation Type</Text>
                            <Text style={styles.infoValue}>{operationTypeLabel}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Source Amount</Text>
                            <TouchableOpacity 
                                onPress={() => handleCopy(transaction.source_amount || '', 'sourceAmount')}
                                style={styles.copyableRow}
                            >
                                <Text style={styles.infoValue}>
                                    {parseFloat(transaction.source_amount || '0').toFixed(2)} {transaction.source_asset ? PathPaymentUtils.assetToString(transaction.source_asset) : 'N/A'}
                                </Text>
                                <Ionicons 
                                    name={copiedField === 'sourceAmount' ? 'checkmark' : 'copy-outline'} 
                                    size={16} 
                                    color={copiedField === 'sourceAmount' ? '#10B981' : '#6B7280'} 
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Destination Amount</Text>
                            <TouchableOpacity 
                                onPress={() => handleCopy(transaction.amount, 'destAmount')}
                                style={styles.copyableRow}
                            >
                                <Text style={styles.infoValue}>
                                    {parseFloat(transaction.amount).toFixed(2)} {transaction.destination_asset ? PathPaymentUtils.assetToString(transaction.destination_asset) : 'N/A'}
                                </Text>
                                <Ionicons 
                                    name={copiedField === 'destAmount' ? 'checkmark' : 'copy-outline'} 
                                    size={16} 
                                    color={copiedField === 'destAmount' ? '#10B981' : '#6B7280'} 
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Path Description</Text>
                            <TouchableOpacity 
                                onPress={() => handleCopy(PathPaymentUtils.createPathDescription(transaction), 'pathDesc')}
                                style={styles.copyableRow}
                            >
                                <Text style={styles.infoValue} numberOfLines={2}>
                                    {PathPaymentUtils.createPathDescription(transaction)}
                                </Text>
                                <Ionicons 
                                    name={copiedField === 'pathDesc' ? 'checkmark' : 'copy-outline'} 
                                    size={16} 
                                    color={copiedField === 'pathDesc' ? '#10B981' : '#6B7280'} 
                                />
                            </TouchableOpacity>
                        </View>

                        {transaction.path && transaction.path.length > 0 && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Path Assets</Text>
                                <View style={styles.pathAssetsList}>
                                    {transaction.path.map((asset, index) => (
                                        <View key={index} style={styles.pathAssetItem}>
                                            <Text style={styles.pathAssetText}>
                                                {PathPaymentUtils.assetToString(asset)}
                                            </Text>
                                            {index < transaction.path!.length - 1 && (
                                                <Ionicons name="arrow-forward" size={12} color="#6B7280" />
                                            )}
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Timeline */}
                <View style={styles.timelineSection}>
                    <Text style={styles.sectionTitle}>Transaction Timeline</Text>
                    {timeline.map((event, index) => (
                        <TimelineItem 
                            key={event.id} 
                            event={event} 
                            isLast={index === timeline.length - 1} 
                        />
                    ))}
                </View>

                {/* Actions */}
                <View style={styles.actionsSection}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                        <Ionicons name="share-outline" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Share Details</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.secondaryButton]} 
                        onPress={() => handleCopy(transaction.txHash, 'hash')}
                    >
                        <Ionicons name="copy-outline" size={20} color="#111827" />
                        <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Copy Hash</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: '#6B7280',
    },
    notFoundContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        gap: 16,
    },
    notFoundTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
    },
    notFoundDescription: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    backButton: {
        backgroundColor: '#111827',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#111827',
    },
    backBtn: {
        width: 36,
        alignItems: 'center',
    },
    shareBtn: {
        width: 36,
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    amountCard: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    amount: {
        fontSize: 36,
        fontWeight: '700',
        color: '#111827',
    },
    assetCode: {
        fontSize: 18,
        color: '#6B7280',
        marginTop: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 12,
        gap: 6,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10B981',
    },
    infoSection: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    infoRow: {
        marginBottom: 16,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
    },
    copyableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    timelineSection: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    timelineLeft: {
        alignItems: 'center',
        marginRight: 16,
    },
    timelineDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB',
        marginTop: 4,
    },
    timelineContent: {
        flex: 1,
        paddingTop: 4,
    },
    timelineTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    timelineDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 4,
    },
    timelineTime: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    actionsSection: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 16,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111827',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    secondaryButton: {
        backgroundColor: '#F3F4F6',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButtonText: {
        color: '#111827',
    },
    bottomSpacer: {
        height: 20,
    },
    conversionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 6,
    },
    conversionText: {
        fontSize: 14,
        color: '#059669',
        fontWeight: '500',
    },
    pathAssetsList: {
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
        color: '#374151',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
});
