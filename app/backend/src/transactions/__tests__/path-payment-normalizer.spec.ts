import { PathPaymentNormalizer } from '../path-payment-normalizer';
import { Horizon } from 'stellar-sdk';

describe('PathPaymentNormalizer', () => {
    describe('normalizePathPaymentStrictSend', () => {
        it('should normalize path payment strict send operation correctly', () => {
            const mockOperation = {
                id: '123',
                type: 'path_payment_strict_send',
                from: 'GDFROM123456789',
                to: 'GDTO123456789',
                amount: '100.0000000',
                asset_type: 'credit_alphanum4',
                asset_code: 'USDC',
                asset_issuer: 'GDUSDCISSUER123',
                source_amount: '50.0000000',
                source_asset_type: 'native',
                source_asset_code: undefined,
                source_asset_issuer: undefined,
                destination_min: '95.0000000',
                path: [
                    {
                        asset_type: 'credit_alphanum4',
                        asset_code: 'EURT',
                        asset_issuer: 'GDEURT123456789'
                    }
                ],
                created_at: '2023-01-01T00:00:00Z',
                transaction_hash: 'abc123',
                paging_token: '456'
            } as Horizon.ServerApi.PathPaymentStrictSendOperationRecord;

            const normalized = PathPaymentNormalizer.normalizePathPaymentStrictSend(mockOperation);

            expect(normalized.type).toBe('payment');
            expect(normalized.source_asset).toEqual({
                asset_type: 'native'
            });
            expect(normalized.source_amount).toBe('50.0000000');
            expect(normalized.destination_asset).toEqual({
                asset_type: 'credit_alphanum4',
                asset_code: 'USDC',
                asset_issuer: 'GDUSDCISSUER123'
            });
            expect(normalized.destination_min).toBe('95.0000000');
            expect(normalized.path).toEqual([{
                asset_type: 'credit_alphanum4',
                asset_code: 'EURT',
                asset_issuer: 'GDEURT123456789'
            }]);
        });
    });

    describe('normalizePathPaymentStrictReceive', () => {
        it('should normalize path payment strict receive operation correctly', () => {
            const mockOperation = {
                id: '123',
                type: 'path_payment_strict_receive',
                from: 'GDFROM123456789',
                to: 'GDTO123456789',
                amount: '100.0000000',
                asset_type: 'credit_alphanum4',
                asset_code: 'USDC',
                asset_issuer: 'GDUSDCISSUER123',
                source_max: '50.0000000',
                source_asset_type: 'native',
                source_asset_code: undefined,
                source_asset_issuer: undefined,
                destination_min: '95.0000000',
                path: [
                    {
                        asset_type: 'credit_alphanum4',
                        asset_code: 'EURT',
                        asset_issuer: 'GDEURT123456789'
                    }
                ],
                created_at: '2023-01-01T00:00:00Z',
                transaction_hash: 'abc123',
                paging_token: '456'
            } as Horizon.ServerApi.PathPaymentOperationRecord;

            const normalized = PathPaymentNormalizer.normalizePathPaymentStrictReceive(mockOperation);

            expect(normalized.type).toBe('payment');
            expect(normalized.source_asset).toEqual({
                asset_type: 'native'
            });
            expect(normalized.source_amount).toBe('50.0000000');
            expect(normalized.destination_asset).toEqual({
                asset_type: 'credit_alphanum4',
                asset_code: 'USDC',
                asset_issuer: 'GDUSDCISSUER123'
            });
            expect(normalized.destination_min).toBe('95.0000000');
        });
    });

    describe('assetToString', () => {
        it('should convert native asset to XLM', () => {
            const asset = { asset_type: 'native' };
            expect(PathPaymentNormalizer.assetToString(asset)).toBe('XLM');
        });

        it('should convert credit asset to CODE:ISSUER format', () => {
            const asset = {
                asset_type: 'credit_alphanum4',
                asset_code: 'USDC',
                asset_issuer: 'GDUSDCISSUER123'
            };
            expect(PathPaymentNormalizer.assetToString(asset)).toBe('USDC:GDUSDCISSUER123');
        });

        it('should handle incomplete asset information', () => {
            const asset = { asset_type: 'credit_alphanum4' };
            expect(PathPaymentNormalizer.assetToString(asset)).toBe('Unknown');
        });
    });

    describe('getPrimaryAsset', () => {
        it('should return source asset for strict send', () => {
            const sourceAsset = { asset_type: 'native' };
            const destAsset = { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GD123' };
            
            const result = PathPaymentNormalizer.getPrimaryAsset('path_payment_strict_send', sourceAsset, destAsset);
            expect(result).toBe('XLM');
        });

        it('should return destination asset for strict receive', () => {
            const sourceAsset = { asset_type: 'native' };
            const destAsset = { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GD123' };
            
            const result = PathPaymentNormalizer.getPrimaryAsset('path_payment_strict_receive', sourceAsset, destAsset);
            expect(result).toBe('USDC:GD123');
        });
    });

    describe('getPrimaryAmount', () => {
        it('should return source amount for strict send', () => {
            const result = PathPaymentNormalizer.getPrimaryAmount('path_payment_strict_send', '50.0', '100.0');
            expect(result).toBe('50.0');
        });

        it('should return destination amount for strict receive', () => {
            const result = PathPaymentNormalizer.getPrimaryAmount('path_payment_strict_receive', '50.0', '100.0');
            expect(result).toBe('100.0');
        });
    });

    describe('createPathDescription', () => {
        it('should create direct conversion description for empty path', () => {
            const sourceAsset = { asset_type: 'native' };
            const destAsset = { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GD123' };
            
            const result = PathPaymentNormalizer.createPathDescription('path_payment_strict_send', sourceAsset, destAsset, []);
            expect(result).toBe('Direct conversion: XLM → USDC:GD123');
        });

        it('should create path description with intermediate assets', () => {
            const sourceAsset = { asset_type: 'native' };
            const destAsset = { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GD123' };
            const path = [
                { asset_type: 'credit_alphanum4', asset_code: 'EURT', asset_issuer: 'GDEUR' }
            ];
            
            const result = PathPaymentNormalizer.createPathDescription('path_payment_strict_send', sourceAsset, destAsset, path);
            expect(result).toBe('Path: XLM → EURT:GDEUR → USDC:GD123');
        });
    });
});
