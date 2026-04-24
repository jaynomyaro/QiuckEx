import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WatchlistItem, MarketplaceListing } from '../types/marketplace';

const WATCHLIST_STORAGE_KEY = '@quickex_watchlist';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load watchlist from AsyncStorage
  const loadWatchlist = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const watchlistWithDates = parsed.map((item: WatchlistItem) => ({
          ...item,
          addedAt: new Date(item.addedAt),
          endsAt: new Date(item.endsAt),
        }));
        setWatchlist(watchlistWithDates);
      }
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save watchlist to AsyncStorage
  const saveWatchlist = useCallback(async (items: WatchlistItem[]) => {
    try {
      await AsyncStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save watchlist:', error);
    }
  }, []);

  // Add item to watchlist
  const addToWatchlist = useCallback((listing: MarketplaceListing) => {
    const watchlistItem: WatchlistItem = {
      id: listing.id,
      username: listing.username,
      currentBid: listing.currentBid,
      endsAt: listing.endsAt,
      category: listing.category,
      addedAt: new Date(),
    };

    setWatchlist((prev: WatchlistItem[]) => {
      const exists = prev.some((item) => item.id === listing.id);
      if (exists) return prev;
      
      const newWatchlist = [...prev, watchlistItem];
      saveWatchlist(newWatchlist);
      return newWatchlist;
    });
  }, [saveWatchlist]);

  // Remove item from watchlist
  const removeFromWatchlist = useCallback((listingId: string) => {
    setWatchlist((prev: WatchlistItem[]) => {
      const newWatchlist = prev.filter((item) => item.id !== listingId);
      saveWatchlist(newWatchlist);
      return newWatchlist;
    });
  }, [saveWatchlist]);

  // Toggle watchlist status
  const toggleWatchlist = useCallback((listing: MarketplaceListing) => {
    const isWatched = watchlist.some((item) => item.id === listing.id);
    if (isWatched) {
      removeFromWatchlist(listing.id);
    } else {
      addToWatchlist(listing);
    }
  }, [watchlist, addToWatchlist, removeFromWatchlist]);

  // Check if item is in watchlist
  const isWatched = useCallback((listingId: string) => {
    return watchlist.some((item) => item.id === listingId);
  }, [watchlist]);

  // Update watchlist item data (for real-time updates)
  const updateWatchlistItem = useCallback((listingId: string, updates: Partial<WatchlistItem>) => {
    setWatchlist((prev: WatchlistItem[]) => {
      const newWatchlist = prev.map((item) =>
        item.id === listingId ? { ...item, ...updates } : item
      );
      saveWatchlist(newWatchlist);
      return newWatchlist;
    });
  }, [saveWatchlist]);

  // Clear expired items from watchlist
  const clearExpired = useCallback(() => {
    setWatchlist((prev: WatchlistItem[]) => {
      const now = new Date();
      const newWatchlist = prev.filter((item) => item.endsAt > now);
      saveWatchlist(newWatchlist);
      return newWatchlist;
    });
  }, [saveWatchlist]);

  // Initialize on mount
  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  // Clean up expired items periodically
  useEffect(() => {
    const interval = setInterval(clearExpired, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [clearExpired]);

  return {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isWatched,
    updateWatchlistItem,
    clearExpired,
    loadWatchlist,
  };
}
