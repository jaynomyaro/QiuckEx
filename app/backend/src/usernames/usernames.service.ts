import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseUniqueConstraintError } from '../supabase/supabase.errors';
import { AppConfigService } from '../config';
import {
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_PATTERN,
} from './constants';
import {
  UsernameConflictError,
  UsernameLimitExceededError,
  UsernameValidationError,
  UsernameErrorCode,
} from './errors';

export interface UsernameRow {
  id: string;
  username: string;
  public_key: string;
  created_at: string;
}

@Injectable()
export class UsernamesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: AppConfigService,
  ) { }

  /**
   * Normalize username for storage (lowercase). Validation (length, pattern) is done by DTO.
   */
  normalizeUsername(username: string): string {
    return username.trim().toLowerCase();
  }

  /**
   * Validate format server-side (length and pattern). DTO already validates; this is a safeguard.
   */
  validateFormat(username: string): void {
    const normalized = this.normalizeUsername(username);
    if (normalized.length < USERNAME_MIN_LENGTH || normalized.length > USERNAME_MAX_LENGTH) {
      throw new UsernameValidationError(
        UsernameErrorCode.INVALID_FORMAT,
        `Username must be between ${USERNAME_MIN_LENGTH} and ${USERNAME_MAX_LENGTH} characters`,
        'username',
      );
    }
    if (!USERNAME_PATTERN.test(normalized)) {
      throw new UsernameValidationError(
        UsernameErrorCode.INVALID_FORMAT,
        `Username must contain only lowercase letters, numbers, and underscores`,
        'username',
      );
    }
  }

  async create(username: string, publicKey: string): Promise<{ ok: true }> {
    const normalized = this.normalizeUsername(username);
    this.validateFormat(username);

    const maxPerWallet = this.config.maxUsernamesPerWallet;
    if (typeof maxPerWallet === 'number' && maxPerWallet > 0) {
      const count = await this.countByPublicKey(publicKey);
      if (count >= maxPerWallet) {
        throw new UsernameLimitExceededError(publicKey, maxPerWallet);
      }
    }

    try {
      await this.supabase.insertUsername(normalized, publicKey);
    } catch (error) {
      if (error instanceof SupabaseUniqueConstraintError) {
        throw new UsernameConflictError(normalized);
      }
      throw error;
    }

    return { ok: true };
  }

  /**
   * Count usernames registered for a wallet (for limit enforcement).
   */
  async countByPublicKey(publicKey: string): Promise<number> {
    return this.supabase.countUsernamesByPublicKey(publicKey);
  }

  /**
   * List usernames for a wallet.
   */
  async listByPublicKey(publicKey: string): Promise<UsernameRow[]> {
    return this.supabase.listUsernamesByPublicKey(publicKey) as Promise<UsernameRow[]>;
  }

  /**
   * Get analytics data for user growth
   */
  async getUserGrowthData(startDate: Date, endDate: Date, interval: string): Promise<any[]> {
    // This would typically query the database for user registration data
    // For now, returning mock data structure
    const points = this.getDataPointCount(interval);
    return Array.from({ length: points }, (_, i) => {
      const date = this.getDateForIndex(startDate, i, interval);
      const newUsers = Math.floor(Math.random() * 50) + 5;
      const totalUsers = 1000 + (i * newUsers);
      const activeUsers = Math.floor(totalUsers * (Math.random() * 0.4 + 0.3));
      
      return {
        date,
        newUsers,
        activeUsers,
        totalUsers,
      };
    });
  }

  /**
   * Get active user count for a date range
   */
  async getActiveUserCount(startDate: Date, endDate: Date): Promise<number> {
    // This would typically query for active users based on transactions or logins
    // For now, returning a reasonable mock value
    return Math.floor(Math.random() * 500) + 100;
  }

  private getDataPointCount(interval: string): number {
    switch (interval) {
      case "hour": return 24;
      case "day": return 30;
      case "month": return 12;
      default: return 30;
    }
  }

  private getDateForIndex(startDate: Date, index: number, interval: string): string {
    const date = new Date(startDate);
    
    switch (interval) {
      case "hour":
        date.setHours(date.getHours() + index);
        return date.toISOString().slice(0, 13) + ":00";
      case "day":
        date.setDate(date.getDate() + index);
        return date.toISOString().slice(0, 10);
      case "month":
        date.setMonth(date.getMonth() + index);
        return date.toISOString().slice(0, 7);
      default:
        return date.toISOString().slice(0, 10);
    }
  }
}
