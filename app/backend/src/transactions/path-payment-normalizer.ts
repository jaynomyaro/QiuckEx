import { Horizon } from 'stellar-sdk';
import { PathPaymentAssetDto } from './dto/transaction.dto';

/**
 * Normalizes path payment operations to a consistent format
 */
export class PathPaymentNormalizer {
    /**
     * Converts a path payment strict send operation to normalized transaction item
     */
    static normalizePathPaymentStrictSend(
        operation: Horizon.ServerApi.PathPaymentStrictSendOperationRecord
    ): Omit<Horizon.ServerApi.PaymentOperationRecord, 'type'> & {
        type: 'payment';
        source_asset: PathPaymentAssetDto;
        source_amount: string;
        destination_asset: PathPaymentAssetDto;
        destination_min: string;
        path: PathPaymentAssetDto[];
        from: string;
        to: string;
    } {
        const sourceAsset = this.normalizeAsset(
            operation.source_asset_type,
            operation.source_asset_code,
            operation.source_asset_issuer
        );

        const destinationAsset = this.normalizeAsset(
            operation.asset_type,
            operation.asset_code,
            operation.asset_issuer
        );

        const normalizedPath = operation.path?.map(asset =>
            this.normalizeAsset(asset.asset_type, asset.asset_code, asset.asset_issuer)
        ) || [];

        return {
            ...operation,
            type: 'payment' as const,
            source_asset: sourceAsset,
            source_amount: operation.source_amount,
            destination_asset: destinationAsset,
            destination_min: operation.destination_min,
            path: normalizedPath,
            from: operation.from,
            to: operation.to,
        };
    }

    /**
     * Converts a path payment strict receive operation to normalized transaction item
     */
    static normalizePathPaymentStrictReceive(
        operation: Horizon.ServerApi.PathPaymentOperationRecord
    ): Omit<Horizon.ServerApi.PaymentOperationRecord, 'type'> & {
        type: 'payment';
        source_asset: PathPaymentAssetDto;
        source_amount: string;
        destination_asset: PathPaymentAssetDto;
        destination_min: string;
        path: PathPaymentAssetDto[];
        from: string;
        to: string;
    } {
        const sourceAsset = this.normalizeAsset(
            operation.source_asset_type,
            operation.source_asset_code,
            operation.source_asset_issuer
        );

        const destinationAsset = this.normalizeAsset(
            operation.asset_type,
            operation.asset_code,
            operation.asset_issuer
        );

        const normalizedPath = operation.path?.map(asset =>
            this.normalizeAsset(asset.asset_type, asset.asset_code, asset.asset_issuer)
        ) || [];

        return {
            ...operation,
            type: 'payment' as const,
            source_asset: sourceAsset,
            source_amount: operation.source_max,
            destination_asset: destinationAsset,
            destination_min: operation.destination_min,
            path: normalizedPath,
            from: operation.from,
            to: operation.to,
        };
    }

    /**
     * Normalizes asset information to a consistent format
     */
    private static normalizeAsset(
        assetType: string,
        assetCode?: string,
        assetIssuer?: string
    ): PathPaymentAssetDto {
        const normalized: PathPaymentAssetDto = {
            asset_type: assetType,
        };

        if (assetType !== 'native' && assetCode) {
            normalized.asset_code = assetCode;
        }

        if (assetType !== 'native' && assetIssuer) {
            normalized.asset_issuer = assetIssuer;
        }

        return normalized;
    }

    /**
     * Converts asset DTO to string format for display
     */
    static assetToString(asset: PathPaymentAssetDto): string {
        if (asset.asset_type === 'native') {
            return 'XLM';
        }

        if (!asset.asset_code || !asset.asset_issuer) {
            return 'Unknown';
        }

        return `${asset.asset_code}:${asset.asset_issuer}`;
    }

    /**
     * Determines the primary asset for display based on operation type
     */
    static getPrimaryAsset(
        operationType: string,
        sourceAsset?: PathPaymentAssetDto,
        destinationAsset?: PathPaymentAssetDto
    ): string {
        switch (operationType) {
            case 'path_payment_strict_send':
                // For strict send, the source asset is primary
                return sourceAsset ? this.assetToString(sourceAsset) : 'XLM';
            
            case 'path_payment_strict_receive':
                // For strict receive, the destination asset is primary
                return destinationAsset ? this.assetToString(destinationAsset) : 'XLM';
            
            default:
                return 'XLM';
        }
    }

    /**
     * Determines the primary amount based on operation type
     */
    static getPrimaryAmount(
        operationType: string,
        sourceAmount?: string,
        destinationAmount?: string
    ): string {
        switch (operationType) {
            case 'path_payment_strict_send':
                // For strict send, the source amount is primary
                return sourceAmount || '0';
            
            case 'path_payment_strict_receive':
                // For strict receive, the destination amount is primary
                return destinationAmount || '0';
            
            default:
                return destinationAmount || '0';
        }
    }

    /**
     * Creates a human-readable description of the path payment
     */
    static createPathDescription(
        operationType: string,
        sourceAsset?: PathPaymentAssetDto,
        destinationAsset?: PathPaymentAssetDto,
        path?: PathPaymentAssetDto[]
    ): string {
        const sourceStr = sourceAsset ? this.assetToString(sourceAsset) : 'Unknown';
        const destStr = destinationAsset ? this.assetToString(destinationAsset) : 'Unknown';
        
        if (!path || path.length === 0) {
            return `Direct conversion: ${sourceStr} → ${destStr}`;
        }

        const pathStr = path.map(asset => this.assetToString(asset)).join(' → ');
        return `Path: ${sourceStr} → ${pathStr} → ${destStr}`;
    }
}
