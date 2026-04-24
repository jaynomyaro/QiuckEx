/**
 * Marketplace types for mobile app
 * Based on frontend marketplace implementation with mobile enhancements
 */

declare global {
  namespace NodeJS {
    interface Timeout {
      ref(): void;
      unref(): void;
    }
  }
}

export type UsernameStatus = "auction" | "buyNow" | "sold" | "listed";

export type Category = "all" | "trending" | "short" | "og" | "crypto" | "brand";

export type SortOption = "ending" | "bid_desc" | "bid_asc" | "bids" | "watchers";

export interface MarketplaceListing {
  id: string;
  username: string;
  currentBid: number;
  buyNowPrice: number | null;
  ownerAddress: string;
  endsAt: Date;
  status: UsernameStatus;
  category: Exclude<Category, "all">;
  bidCount: number;
  watchers: number;
  verified: boolean;
  isWatched?: boolean; // Mobile-specific for watchlist
}

export interface UserBid {
  username: string;
  myBid: number;
  currentBid: number;
  endsAt: Date;
  isWinning: boolean;
}

export interface UserListing {
  username: string;
  minBid: number;
  currentBid: number;
  bidCount: number;
  endsAt: Date;
}

export interface WatchlistItem {
  id: string;
  username: string;
  currentBid: number;
  endsAt: Date;
  category: Exclude<Category, "all">;
  addedAt: Date;
}

export interface MarketplaceStats {
  totalVolume: number;
  activeBids: number;
  totalWatchers: number;
}

export type BidResult = 
  | { success: true; transactionHash?: string }
  | { success: false; reason: string };

export interface RealTimeUpdate {
  type: 'bid' | 'watcher' | 'status';
  listingId: string;
  data: Partial<MarketplaceListing>;
}

// Category configuration
export const CATEGORIES = [
  { key: "all" as Category, label: "All", icon: "◈" },
  { key: "trending" as Category, label: "Trending", icon: "🔥" },
  { key: "og" as Category, label: "OG", icon: "💎" },
  { key: "short" as Category, label: "Short", icon: "⚡" },
  { key: "crypto" as Category, label: "Crypto", icon: "₿" },
  { key: "brand" as Category, label: "Brand", icon: "✦" },
];

// Sort options configuration
export const SORT_OPTIONS = [
  { key: "ending" as SortOption, label: "Ending Soon" },
  { key: "bid_desc" as SortOption, label: "Highest Bid" },
  { key: "bid_asc" as SortOption, label: "Lowest Bid" },
  { key: "bids" as SortOption, label: "Most Bids" },
  { key: "watchers" as SortOption, label: "Most Watched" },
];
