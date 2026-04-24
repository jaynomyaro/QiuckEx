import { PathPaymentAsset, TransactionItem } from '../types/transaction';

/**
 * Utility functions for handling path payment transactions in the mobile app
 */
export class PathPaymentUtils {
    /**
     * Converts asset object to string format for display
     */
    static assetToString(asset: PathPaymentAsset): string {
        if (asset.asset_type === 'native') {
            return 'XLM';
        }

        if (!asset.asset_code || !asset.asset_issuer) {
            return 'Unknown';
        }

        return `${asset.asset_code}:${asset.asset_issuer}`;
    }

    /**
     * Determines if a transaction is a path payment
     */
    static isPathPayment(transaction: TransactionItem): boolean {
        return transaction.operation_type === 'path_payment_strict_send' || 
               transaction.operation_type === 'path_payment_strict_receive';
    }

    /**
     * Gets the primary asset for display based on operation type
     */
    static getPrimaryAsset(transaction: TransactionItem): string {
        if (!this.isPathPayment(transaction)) {
            return transaction.asset;
        }

        switch (transaction.operation_type) {
            case 'path_payment_strict_send':
                // For strict send, the source asset is primary
                return transaction.source_asset ? this.assetToString(transaction.source_asset) : 'XLM';
            
            case 'path_payment_strict_receive':
                // For strict receive, the destination asset is primary
                return transaction.destination_asset ? this.assetToString(transaction.destination_asset) : 'XLM';
            
            default:
                return transaction.asset;
        }
    }

    /**
     * Gets the primary amount based on operation type
     */
    static getPrimaryAmount(transaction: TransactionItem): string {
        if (!this.isPathPayment(transaction)) {
            return transaction.amount;
        }

        switch (transaction.operation_type) {
            case 'path_payment_strict_send':
                // For strict send, the source amount is primary
                return transaction.source_amount || transaction.amount;
            
            case 'path_payment_strict_receive':
                // For strict receive, the destination amount is primary
                return transaction.amount;
            
            default:
                return transaction.amount;
        }
    }

    /**
     * Gets the secondary asset for display (the other side of the conversion)
     */
    static getSecondaryAsset(transaction: TransactionItem): string {
        if (!this.isPathPayment(transaction)) {
            return '';
        }

        switch (transaction.operation_type) {
            case 'path_payment_strict_send':
                // For strict send, the destination asset is secondary
                return transaction.destination_asset ? this.assetToString(transaction.destination_asset) : 'XLM';
            
            case 'path_payment_strict_receive':
                // For strict receive, the source asset is secondary
                return transaction.source_asset ? this.assetToString(transaction.source_asset) : 'XLM';
            
            default:
                return '';
        }
    }

    /**
     * Gets the secondary amount for display
     */
    static getSecondaryAmount(transaction: TransactionItem): string {
        if (!this.isPathPayment(transaction)) {
            return '';
        }

        switch (transaction.operation_type) {
            case 'path_payment_strict_send':
                // For strict send, the destination amount is secondary
                return transaction.amount;
            
            case 'path_payment_strict_receive':
                // For strict receive, the source amount is secondary
                return transaction.source_amount || '';
            
            default:
                return '';
        }
    }

    /**
     * Creates a human-readable description of the path payment
     */
    static createPathDescription(transaction: TransactionItem): string {
        if (!this.isPathPayment(transaction)) {
            return 'Direct payment';
        }

        const primaryAsset = this.getPrimaryAsset(transaction);
        const secondaryAsset = this.getSecondaryAsset(transaction);
        
        if (!transaction.path || transaction.path.length === 0) {
            return `Direct conversion: ${primaryAsset} → ${secondaryAsset}`;
        }

        const pathStr = transaction.path.map(asset => this.assetToString(asset)).join(' → ');
        return `Path: ${primaryAsset} → ${pathStr} → ${secondaryAsset}`;
    }

    /**
     * Gets a user-friendly operation type label
     */
    static getOperationTypeLabel(transaction: TransactionItem): string {
        switch (transaction.operation_type) {
            case 'path_payment_strict_send':
                return 'Path Payment (Send)';
            case 'path_payment_strict_receive':
                return 'Path Payment (Receive)';
            case 'payment':
                return 'Payment';
            default:
                return 'Transaction';
        }
    }

    /**
     * Formats the transaction amount with appropriate context
     */
    static formatAmountWithContext(transaction: TransactionItem): string {
        if (!this.isPathPayment(transaction)) {
            return `${parseFloat(transaction.amount).toFixed(2)} ${transaction.asset}`;
        }

        const primaryAmount = this.getPrimaryAmount(transaction);
        const primaryAsset = this.getPrimaryAsset(transaction);
        const secondaryAmount = this.getSecondaryAmount(transaction);
        const secondaryAsset = this.getSecondaryAsset(transaction);

        return `${parseFloat(primaryAmount).toFixed(2)} ${primaryAsset} → ${parseFloat(secondaryAmount).toFixed(2)} ${secondaryAsset}`;
    }

    /**
     * Extracts the path assets as strings for display
     */
    static getPathAssets(transaction: TransactionItem): string[] {
        if (!transaction.path || transaction.path.length === 0) {
            return [];
        }

        return transaction.path.map(asset => this.assetToString(asset));
    }

    /**
     * Determines if the transaction represents an incoming payment to the user
     */
    static isIncomingPayment(transaction: TransactionItem, userAccountId: string): boolean {
        // For regular payments, check if the user is the recipient
        if (transaction.operation_type === 'payment') {
            return transaction.to === userAccountId;
        }

        // For path payments, check if the user is the destination
        return transaction.to === userAccountId;
    }

    /**
     * Determines if the transaction represents an outgoing payment from the user
     */
    static isOutgoingPayment(transaction: TransactionItem, userAccountId: string): boolean {
        // For regular payments, check if the user is the sender
        if (transaction.operation_type === 'payment') {
            return transaction.from === userAccountId;
        }

        // For path payments, check if the user is the source
        return transaction.from === userAccountId;
    }
}
