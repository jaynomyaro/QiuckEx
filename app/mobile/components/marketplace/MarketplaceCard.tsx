import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MarketplaceListing } from '../../types/marketplace';

const { width } = Dimensions.get('window');

interface Props {
  listing: MarketplaceListing;
  onBid: (listing: MarketplaceListing) => void;
  onWatchlistToggle: (listing: MarketplaceListing) => void;
  isWatched: boolean;
}

const CATEGORY_COLORS: Record<MarketplaceListing["category"], { bg: string; text: string; border: string }> = {
  trending: { bg: '#FED7AA', text: '#EA580C', border: '#EA580C20' },
  short: { bg: '#FEF3C7', text: '#D97706', border: '#D9770620' },
  og: { bg: '#EDE9FE', text: '#7C3AED', border: '#7C3AED20' },
  crypto: { bg: '#DBEAFE', text: '#2563EB', border: '#2563EB20' },
  brand: { bg: '#CCFBF1', text: '#059669', border: '#05966920' },
};

const CATEGORY_LABELS: Record<MarketplaceListing["category"], string> = {
  trending: "🔥 Trending",
  short: "⚡ Short",
  og: "💎 OG",
  crypto: "₿ Crypto",
  brand: "✦ Brand",
};

function UrgencyBar({ endsAt }: { endsAt: Date }) {
  const total = 7 * 24 * 3600 * 1000; // 7 day auction window
  const remaining = Math.max(0, endsAt.getTime() - Date.now());
  const pct = Math.min(100, Math.round((remaining / total) * 100));
  const color = pct < 15 ? '#EF4444' : pct < 40 ? '#F59E0B' : '#6366F1';

  return (
    <View style={styles.urgencyBarContainer}>
      <View style={[styles.urgencyBar, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

export function MarketplaceCard({ listing, onBid, onWatchlistToggle, isWatched }: Props) {
  const catColor = CATEGORY_COLORS[listing.category];
  const catLabel = CATEGORY_LABELS[listing.category];
  const timeLeft = formatCountdown(listing.endsAt);
  const isUrgent = listing.endsAt.getTime() - Date.now() < 1000 * 60 * 90;

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={() => onBid(listing)}
    >
      {/* Top gradient strip */}
      <View style={styles.topStrip} />

      <View style={styles.content}>
        {/* Header: Category + Watchlist */}
        <View style={styles.header}>
          <View style={[styles.categoryBadge, { backgroundColor: catColor.bg, borderColor: catColor.border }]}>
            <Text style={[styles.categoryText, { color: catColor.text }]}>
              {catLabel}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => onWatchlistToggle(listing)}
            style={styles.watchlistButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons 
              name={isWatched ? "heart" : "heart-outline"} 
              size={20} 
              color={isWatched ? "#EF4444" : "#6B7280"} 
            />
          </TouchableOpacity>
        </View>

        {/* Username */}
        <View style={styles.usernameSection}>
          <Text style={styles.prefix}>quickex.to/</Text>
          <Text style={styles.username}>{listing.username}</Text>
        </View>

        {listing.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#059669" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Current Bid</Text>
            <Text style={styles.statValue}>
              {listing.currentBid.toLocaleString()}
              <Text style={styles.statUnit}> USDC</Text>
            </Text>
          </View>
          
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Ends In</Text>
            <Text style={[styles.statValue, isUrgent && styles.urgentText]}>
              {timeLeft}
            </Text>
          </View>
        </View>

        <UrgencyBar endsAt={listing.endsAt} />

        {/* Bottom Info */}
        <View style={styles.bottomInfo}>
          <Text style={styles.ownerAddress}>
            {listing.ownerAddress}
          </Text>
          <Text style={styles.activity}>
            {listing.bidCount} bids · {listing.watchers} watching
          </Text>
        </View>

        {/* Buy Now Price */}
        {listing.buyNowPrice && (
          <View style={styles.buyNowContainer}>
            <Text style={styles.buyNowLabel}>
              Buy Now:{' '}
              <Text style={styles.buyNowPrice}>
                {listing.buyNowPrice.toLocaleString()} USDC
              </Text>
            </Text>
          </View>
        )}

        {/* CTA Button */}
        <TouchableOpacity 
          style={styles.bidButton} 
          onPress={() => onBid(listing)}
          activeOpacity={0.8}
        >
          <Ionicons name="trending-up" size={16} color="#fff" />
          <Text style={styles.bidButtonText}>Place Bid</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function formatCountdown(date: Date): string {
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const styles = StyleSheet.create({
  card: {
    width: (width - 48) / 2, // 2 columns with padding
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  topStrip: {
    height: 2,
    backgroundColor: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #6366F1 100%)',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  watchlistButton: {
    padding: 4,
  },
  usernameSection: {
    marginBottom: 8,
  },
  prefix: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  username: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 28,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
  },
  statUnit: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
  },
  urgentText: {
    color: '#EF4444',
  },
  urgencyBarContainer: {
    width: '100%',
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  urgencyBar: {
    height: '100%',
    borderRadius: 2,
  },
  bottomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ownerAddress: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: 'monospace',
    flex: 1,
  },
  activity: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  buyNowContainer: {
    marginBottom: 12,
  },
  buyNowLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  buyNowPrice: {
    color: '#111827',
    fontWeight: '600',
  },
  bidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  bidButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
