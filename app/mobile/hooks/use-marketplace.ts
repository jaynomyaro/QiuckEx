import { useState, useEffect, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import type { 
  MarketplaceListing, 
  UserBid, 
  UserListing, 
  BidResult, 
  RealTimeUpdate,
  SortOption,
  Category 
} from '../types/marketplace';

// Mock data - same as frontend for consistency
const MOCK_LISTINGS: MarketplaceListing[] = [
  {
    id: "1",
    username: "pay",
    currentBid: 5800,
    buyNowPrice: 12000,
    ownerAddress: "GDRH...4T9F",
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 2.5),
    status: "auction",
    category: "og",
    bidCount: 34,
    watchers: 210,
    verified: true,
  },
  {
    id: "2",
    username: "sol",
    currentBid: 3200,
    buyNowPrice: 8500,
    ownerAddress: "GCXY...8K3J",
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 5),
    status: "auction",
    category: "crypto",
    bidCount: 19,
    watchers: 98,
    verified: true,
  },
  {
    id: "3",
    username: "nova",
    currentBid: 1400,
    buyNowPrice: 4000,
    ownerAddress: "GBXT...2R7K",
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    status: "auction",
    category: "brand",
    bidCount: 8,
    watchers: 54,
    verified: false,
  },
  {
    id: "4",
    username: "satoshi",
    currentBid: 9900,
    buyNowPrice: null,
    ownerAddress: "GDKL...5W1M",
    endsAt: new Date(Date.now() + 1000 * 60 * 47),
    status: "auction",
    category: "trending",
    bidCount: 62,
    watchers: 445,
    verified: true,
  },
  {
    id: "5",
    username: "alex",
    currentBid: 780,
    buyNowPrice: 2000,
    ownerAddress: "GCMQ...9P2N",
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 36),
    status: "auction",
    category: "short",
    bidCount: 5,
    watchers: 31,
    verified: false,
  },
  {
    id: "6",
    username: "defi",
    currentBid: 4100,
    buyNowPrice: null,
    ownerAddress: "GBKR...1Q0C",
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 12),
    status: "auction",
    category: "crypto",
    bidCount: 27,
    watchers: 182,
    verified: true,
  },
  {
    id: "7",
    username: "lux",
    currentBid: 620,
    buyNowPrice: 1500,
    ownerAddress: "GDXP...3F4G",
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 48),
    status: "listed",
    category: "brand",
    bidCount: 3,
    watchers: 22,
    verified: false,
  },
  {
    id: "8",
    username: "web3",
    currentBid: 2700,
    buyNowPrice: 6000,
    ownerAddress: "GBNH...7T5Q",
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 8),
    status: "auction",
    category: "trending",
    bidCount: 15,
    watchers: 113,
    verified: true,
  },
];

interface UseMarketplaceState {
  listings: MarketplaceListing[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  realTimeUpdates: boolean;
}

interface UseMarketplaceReturn extends UseMarketplaceState {
  refresh: () => void;
  placeBid: (username: string, amount: number) => Promise<BidResult>;
  sortListings: (listings: MarketplaceListing[], sortBy: SortOption) => MarketplaceListing[];
  filterListings: (listings: MarketplaceListing[], category: Category, search: string) => MarketplaceListing[];
  formatCountdown: (date: Date) => string;
}

export function useMarketplace(): UseMarketplaceReturn {
  const [state, setState] = useState<UseMarketplaceState>({
    listings: [],
    loading: true,
    refreshing: false,
    error: null,
    realTimeUpdates: true,
  });

  const isFetchingRef = useRef(false);
  const realTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate real-time updates
  const startRealTimeUpdates = useCallback(() => {
    if (realTimeIntervalRef.current) return;

    realTimeIntervalRef.current = setInterval(() => {
      setState((prev: UseMarketplaceState) => {
        // Randomly update some listings to simulate real-time activity
        const updatedListings = prev.listings.map((listing: MarketplaceListing) => {
          const shouldUpdate = Math.random() < 0.1; // 10% chance per update
          if (!shouldUpdate) return listing;

          const updateType = Math.random();
          if (updateType < 0.4) {
            // New bid
            return {
              ...listing,
              currentBid: listing.currentBid + Math.floor(Math.random() * 500) + 100,
              bidCount: listing.bidCount + 1,
            };
          } else if (updateType < 0.7) {
            // New watcher
            return {
              ...listing,
              watchers: listing.watchers + 1,
            };
          } else {
            // Status change
            const isEndingSoon = listing.endsAt.getTime() - Date.now() < 1000 * 60 * 30;
            return {
              ...listing,
              status: isEndingSoon ? 'auction' : listing.status,
            };
          }
        });

        return { ...prev, listings: updatedListings };
      });
    }, 5000); // Update every 5 seconds
  }, []);

  const stopRealTimeUpdates = useCallback(() => {
    if (realTimeIntervalRef.current) {
      clearInterval(realTimeIntervalRef.current);
      realTimeIntervalRef.current = null;
    }
  }, []);

  const load = useCallback(
    async (opts: { reset?: boolean; isRefreshing?: boolean } = {}) => {
      const { reset = false, isRefreshing = false } = opts;

      if (isFetchingRef.current) return;

      // Fast check for connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        setState((prev: UseMarketplaceState) => ({
          ...prev,
          loading: false,
          refreshing: false,
          error: 'You are currently offline. Please check your connection and try again.',
        }));
        return;
      }

      isFetchingRef.current = true;

      setState((prev: UseMarketplaceState) => ({
        ...prev,
        loading: reset && !isRefreshing,
        refreshing: isRefreshing,
        error: null,
      }));

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 900));
        
        setState((prev: UseMarketplaceState) => ({
          ...prev,
          listings: MOCK_LISTINGS,
          loading: false,
          refreshing: false,
          error: null,
        } as UseMarketplaceState));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'An unexpected error occurred.';
        setState((prev: UseMarketplaceState) => ({
          ...prev,
          loading: false,
          refreshing: false,
          error: message,
        }));
      } finally {
        isFetchingRef.current = false;
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    void load({ reset: true });
  }, [load]);

  // Start real-time updates after initial load
  useEffect(() => {
    if (!state.loading && state.realTimeUpdates) {
      startRealTimeUpdates();
    }

    return () => {
      stopRealTimeUpdates();
    };
  }, [state.loading, state.realTimeUpdates, startRealTimeUpdates, stopRealTimeUpdates]);

  const refresh = useCallback(() => {
    void load({ reset: true, isRefreshing: true });
  }, [load]);

  const placeBid = useCallback(async (username: string, amount: number): Promise<BidResult> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2200));
    
    // Simulate ~10% chance of wallet rejection
    if (Math.random() < 0.1) {
      const result: BidResult = { success: false, reason: "User rejected the transaction in wallet." };
      return result;
    }
    
    // Update local state with new bid
    setState((prev: UseMarketplaceState) => ({
      ...prev,
      listings: prev.listings.map((listing: MarketplaceListing) =>
        listing.username === username
          ? { ...listing, currentBid: amount, bidCount: listing.bidCount + 1 }
          : listing
      ),
    }));

    return { success: true, transactionHash: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
  }, []);

  const sortListings = useCallback((listings: MarketplaceListing[], sortBy: SortOption): MarketplaceListing[] => {
    const sorted = [...listings];
    
    switch (sortBy) {
      case "ending":
        return sorted.sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime());
      case "bid_desc":
        return sorted.sort((a, b) => b.currentBid - a.currentBid);
      case "bid_asc":
        return sorted.sort((a, b) => a.currentBid - b.currentBid);
      case "bids":
        return sorted.sort((a, b) => b.bidCount - a.bidCount);
      case "watchers":
        return sorted.sort((a, b) => b.watchers - a.watchers);
      default:
        return sorted;
    }
  }, []);

  const filterListings = useCallback((
    listings: MarketplaceListing[], 
    category: Category, 
    search: string
  ): MarketplaceListing[] => {
    let filtered = listings;

    if (category !== "all") {
      filtered = filtered.filter((l) => l.category === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter((l) => l.username.includes(q));
    }

    return filtered;
  }, []);

  const formatCountdown = useCallback((date: Date): string => {
    const diff = date.getTime() - Date.now();
    if (diff <= 0) return "Ended";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }, []);

  return {
    ...state,
    refresh,
    placeBid,
    sortListings,
    filterListings,
    formatCountdown,
  };
}
