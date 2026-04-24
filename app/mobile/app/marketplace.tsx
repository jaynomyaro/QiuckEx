import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMarketplace } from '../hooks/use-marketplace';
import { useWatchlist } from '../hooks/use-watchlist';
import { MarketplaceCard } from '../components/marketplace/MarketplaceCard';
import { BidModal } from '../components/marketplace/BidModal';
import { CATEGORIES, SORT_OPTIONS, type Category, type SortOption, type MarketplaceListing } from '../types/marketplace';
import { ErrorState } from '../components/resilience/error-state';

const { width } = Dimensions.get('window');

export default function MarketplaceScreen() {
  const {
    listings,
    loading,
    refreshing,
    error,
    refresh,
    placeBid,
    sortListings,
    filterListings,
    formatCountdown,
  } = useMarketplace();

  const {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isWatched,
    updateWatchlistItem,
  } = useWatchlist();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [sortBy, setSortBy] = useState<SortOption>('ending');
  const [selectedListing, setSelectedListing] = useState(null);

  // Filter and sort listings
  const processedListings = useMemo(() => {
    let filtered = filterListings(listings, activeCategory, search);
    return sortListings(filtered, sortBy);
  }, [listings, activeCategory, search, sortBy, filterListings, sortListings]);

  // Update listings with watchlist status
  const listingsWithWatchlist = useMemo(() => {
    return processedListings.map((listing: MarketplaceListing) => ({
      ...listing,
      isWatched: isWatched(listing.id),
    }));
  }, [processedListings, isWatched]);

  // Calculate marketplace stats
  const stats = useMemo(() => {
    const totalVolume = listingsWithWatchlist.reduce((sum: number, listing: MarketplaceListing) => sum + listing.currentBid, 0);
    const totalBids = listingsWithWatchlist.reduce((sum: number, listing: MarketplaceListing) => sum + listing.bidCount, 0);
    const totalWatchers = listingsWithWatchlist.reduce((sum: number, listing: MarketplaceListing) => sum + listing.watchers, 0);
    
    return {
      totalVolume,
      totalBids,
      totalWatchers,
    };
  }, [listingsWithWatchlist]);

  const handleBid = (listing: MarketplaceListing) => {
    setSelectedListing(listing);
  };

  const handleBidSuccess = (username: string, amount: number) => {
    // Update watchlist if this listing is watched
    const listing = listings.find(l => l.username === username);
    if (listing && isWatched(listing.id)) {
      updateWatchlistItem(listing.id, { currentBid: amount });
    }
    
    setSelectedListing(null);
    
    // Show success message
    Alert.alert(
      'Bid Placed Successfully!',
      `Your bid of ${amount} USDC on @${username} has been placed.`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleWatchlistToggle = (listing: MarketplaceListing) => {
    toggleWatchlist(listing);
  };

  const clearFilters = () => {
    setSearch('');
    setActiveCategory('all');
    setSortBy('ending');
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          message={error}
          onRetry={refresh}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <TouchableOpacity onPress={refresh} style={styles.refreshButton}>
          <Ionicons 
            name={refreshing ? "refresh" : "refresh-outline"} 
            size={24} 
            color="#111827" 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        {!loading && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="trending-up" size={20} color="#059669" />
              </View>
              <View>
                <Text style={styles.statLabel}>Total Volume</Text>
                <Text style={styles.statValue}>{stats.totalVolume.toLocaleString()} USDC</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="flash" size={20} color="#6366F1" />
              </View>
              <View>
                <Text style={styles.statLabel}>Active Bids</Text>
                <Text style={styles.statValue}>{stats.totalBids}</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="eye" size={20} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.statLabel}>Watchers</Text>
                <Text style={styles.statValue}>{stats.totalWatchers}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search usernames..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#9CA3AF"
            />
            {search && (
              <TouchableOpacity onPress={() => setSearch('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Pills */}
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.key}
                  onPress={() => setActiveCategory(category.key)}
                  style={[
                    styles.categoryPill,
                    activeCategory === category.key && styles.categoryPillActive,
                  ]}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[
                    styles.categoryText,
                    activeCategory === category.key && styles.categoryTextActive,
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.sortRow}>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => setSortBy(option.key)}
                  style={[
                    styles.sortPill,
                    sortBy === option.key && styles.sortPillActive,
                  ]}
                >
                  <Text style={[
                    styles.sortText,
                    sortBy === option.key && styles.sortTextActive,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Results Count */}
        {!loading && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsText}>
              {listingsWithWatchlist.length} listing{listingsWithWatchlist.length !== 1 ? 's' : ''} found
              {search && ` for "${search}"`}
            </Text>
            {(search || activeCategory !== 'all') && (
              <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Listings Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={index} style={[styles.skeletonCard, { width: (width - 48) / 2 }]} />
            ))}
          </View>
        ) : listingsWithWatchlist.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyDescription}>
              Try adjusting your search or filters
            </Text>
            <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButtonLarge}>
              <Text style={styles.clearFiltersTextLarge}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listingsContainer}>
            {listingsWithWatchlist.map((listing) => (
              <MarketplaceCard
                key={listing.id}
                listing={listing}
                onBid={handleBid}
                onWatchlistToggle={handleWatchlistToggle}
                isWatched={listing.isWatched}
              />
            ))}
          </View>
        )}

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bid Modal */}
      <BidModal
        listing={selectedListing}
        visible={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        onBidSuccess={handleBidSuccess}
        placeBid={placeBid}
      />
    </SafeAreaView>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  refreshButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 16,
  },
  clearButton: {
    padding: 4,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  categoryPillActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#fff',
  },
  sortContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sortPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortPillActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  sortTextActive: {
    color: '#fff',
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  loadingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 16,
  },
  skeletonCard: {
    height: 280,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  clearFiltersButtonLarge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6366F1',
    borderRadius: 12,
  },
  clearFiltersTextLarge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  listingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  bottomPadding: {
    height: 20,
  },
});
