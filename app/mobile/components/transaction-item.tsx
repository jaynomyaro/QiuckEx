import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { TransactionItem as TransactionItemType } from '../types/transaction';
import { PathPaymentUtils } from '../utils/path-payment-utils';

interface Props {
    item: TransactionItemType;
    /** The connected account ID used to determine payment direction */
    accountId: string;
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

function formatAsset(asset: string): string {
    // If asset is "CODE:ISSUER" → show "CODE"
    const colonIdx = asset.indexOf(':');
    return colonIdx === -1 ? asset : asset.slice(0, colonIdx);
}

function shortenHash(hash: string): string {
    return `${hash.slice(0, 6)}…${hash.slice(-6)}`;
}

export default function TransactionItem({ item, accountId }: Props) {
    const router = useRouter();
    const isPathPayment = PathPaymentUtils.isPathPayment(item);
    const primaryAsset = isPathPayment ? PathPaymentUtils.getPrimaryAsset(item) : formatAsset(item.asset);
    const primaryAmount = isPathPayment ? PathPaymentUtils.getPrimaryAmount(item) : item.amount;
    const operationTypeLabel = PathPaymentUtils.getOperationTypeLabel(item);

    const handleCopyHash = () => {
        Clipboard.setString(item.txHash);
    };

    const handlePress = () => {
        router.push({
            pathname: '/transaction-detail',
            params: {
                accountId,
                txHash: item.txHash,
                pagingToken: item.pagingToken,
            },
        });
    };

    return (
        <TouchableOpacity style={styles.row} onPress={handlePress} activeOpacity={0.7}>
            {/* Left: icon + asset */}
            <View style={styles.iconWrap}>
                <Text style={styles.assetIcon}>{primaryAsset.slice(0, 3)}</Text>
            </View>

            {/* Middle: asset name, memo, date */}
            <View style={styles.middle}>
                <View style={styles.assetRow}>
                    <Text style={styles.assetName}>
                        {primaryAsset}
                    </Text>
                    {isPathPayment && (
                        <Text style={styles.operationType}>{operationTypeLabel}</Text>
                    )}
                </View>
                {item.memo ? (
                    <Text style={styles.memo} numberOfLines={1}>
                        {item.memo}
                    </Text>
                ) : null}
                {isPathPayment && (
                    <Text style={styles.pathDescription} numberOfLines={1}>
                        {PathPaymentUtils.createPathDescription(item)}
                    </Text>
                )}
                <TouchableOpacity onPress={handleCopyHash} activeOpacity={0.6}>
                    <Text style={styles.txHash}>{shortenHash(item.txHash)}</Text>
                </TouchableOpacity>
                <Text style={styles.date}>{formatDate(item.timestamp)}</Text>
            </View>

            {/* Right: amount */}
            <View style={styles.right}>
                <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
                    {parseFloat(primaryAmount).toFixed(2)}
                </Text>
                <Text style={styles.assetCode}>{primaryAsset}</Text>
                {isPathPayment && (
                    <Text style={styles.secondaryAmount}>
                        → {parseFloat(PathPaymentUtils.getSecondaryAmount(item)).toFixed(2)} {PathPaymentUtils.getSecondaryAsset(item)}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    assetIcon: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
        letterSpacing: -0.5,
    },
    middle: {
        flex: 1,
        gap: 2,
    },
    assetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    assetName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    operationType: {
        fontSize: 11,
        fontWeight: '600',
        color: '#3B82F6',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    memo: {
        fontSize: 13,
        color: '#6B7280',
    },
    pathDescription: {
        fontSize: 12,
        color: '#059669',
        fontStyle: 'italic',
    },
    txHash: {
        fontSize: 11,
        color: '#9CA3AF',
        fontFamily: 'monospace',
    },
    date: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 1,
    },
    right: {
        alignItems: 'flex-end',
        marginLeft: 8,
        maxWidth: 110,
    },
    amount: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    assetCode: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    secondaryAmount: {
        fontSize: 11,
        color: '#059669',
        marginTop: 2,
        textAlign: 'right',
    },
});
