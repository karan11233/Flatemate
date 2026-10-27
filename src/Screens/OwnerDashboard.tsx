import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Shadows } from '../Theme/colors';
import { Fonts } from '../Theme/Fonts';
import { dummyListings, Listing } from '../utils/dummyData';
import { useAuth } from '../Context/AuthContext';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../utils/firebase';

const { height } = Dimensions.get('window');

type ListingStatus = 'active' | 'paused' | 'rented';
type BoostDuration = 1 | 3 | 7;

interface ManagedListing extends Listing {
  status: ListingStatus;
  viewCount: number;
  inquiryCount: number;
  saveCount: number;
  boostedUntil?: string;
}

const BOOST_PRICES: Record<BoostDuration, number> = { 1: 49, 3: 99, 7: 199 };

export default function OwnerDashboard({ navigation }: any) {
  const { user, verifyPropertyListing } = useAuth();
  const [listings, setListings] = useState<ManagedListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [boostTarget, setBoostTarget] = useState<ManagedListing | null>(null);
  const [selectedBoost, setSelectedBoost] = useState<BoostDuration>(3);
  const [boostLoading, setBoostLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load owner's listings
  useEffect(() => {
    const enrichListings = (raw: Listing[]): ManagedListing[] => {
      return raw
        .filter(l =>
          l.landlordId === user?.id ||
          l.landlordPhone === user?.phone ||
          l.landlordName === user?.name
        )
        .map((l, idx) => ({
          ...l,
          status: 'active' as ListingStatus,
          viewCount: 45 + idx * 17 + Math.floor(Math.random() * 30),
          inquiryCount: 3 + idx * 2,
          saveCount: 8 + idx * 3,
        }));
    };

    const load = async () => {
      try {
        const cached = await AsyncStorage.getItem('@flatemate_listings');
        const source: Listing[] = cached ? JSON.parse(cached) : dummyListings;
        setListings(enrichListings(source));
      } catch {
        setListings(enrichListings(dummyListings));
      } finally {
        setIsLoading(false);
      }
    };

    if (isFirebaseConfigured && db) {
      const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, snapshot => {
        const live: Listing[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
        const merged = live.length > 0
          ? [...live, ...dummyListings.filter(d => !live.some(l => l.id === d.id))]
          : dummyListings;
        setListings(enrichListings(merged));
        setIsLoading(false);
      }, () => load());
      return () => unsub();
    } else {
      load();
    }
  }, [user?.id]);

  // Boost sheet animation
  const openBoostSheet = (listing: ManagedListing) => {
    setBoostTarget(listing);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0.55, duration: 280, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const closeBoostSheet = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: height, duration: 260, useNativeDriver: true }),
    ]).start(() => setBoostTarget(null));
  };

  const handleBoost = () => {
    if (!boostTarget) return;
    setBoostLoading(true);
    setTimeout(() => {
      const until = new Date();
      until.setDate(until.getDate() + selectedBoost);
      setListings(prev =>
        prev.map(l =>
          l.id === boostTarget.id
            ? { ...l, boostedUntil: until.toISOString() }
            : l
        )
      );
      setBoostLoading(false);
      closeBoostSheet();
      Alert.alert(
        '🚀 Listing Boosted!',
        `Your listing "${boostTarget.title}" is now featured for ${selectedBoost} day${selectedBoost > 1 ? 's' : ''}. More tenants will see it first.`
      );
    }, 1200);
  };

  const handleStatusChange = (listing: ManagedListing, newStatus: ListingStatus) => {
    const labels: Record<ListingStatus, string> = {
      active: 'Activate',
      paused: 'Pause',
      rented: 'Mark as Rented',
    };
    Alert.alert(
      `${labels[newStatus]} Listing?`,
      newStatus === 'rented'
        ? 'This will mark the flat as rented and hide it from search results.'
        : newStatus === 'paused'
        ? 'This listing will be hidden temporarily. You can reactivate it anytime.'
        : 'This listing will be visible to all tenants again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: labels[newStatus],
          style: newStatus === 'rented' ? 'destructive' : 'default',
          onPress: () =>
            setListings(prev =>
              prev.map(l => (l.id === listing.id ? { ...l, status: newStatus } : l))
            ),
        },
      ]
    );
  };

  const handleDelete = (listing: ManagedListing) => {
    Alert.alert(
      'Delete Listing?',
      `Are you sure you want to permanently delete "${listing.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setListings(prev => prev.filter(l => l.id !== listing.id)),
        },
      ]
    );
  };

  const isBoosted = (l: ManagedListing) =>
    !!l.boostedUntil && new Date(l.boostedUntil) > new Date();

  // Aggregated stats
  const totalActive = listings.filter(l => l.status === 'active').length;
  const totalPaused = listings.filter(l => l.status === 'paused').length;
  const totalRented = listings.filter(l => l.status === 'rented').length;
  const totalViews = listings.reduce((s, l) => s + l.viewCount, 0);
  const totalInquiries = listings.reduce((s, l) => s + l.inquiryCount, 0);

  const statusColor: Record<ListingStatus, string> = {
    active: '#15803D',
    paused: '#D97706',
    rented: '#0754C0',
  };
  const statusBg: Record<ListingStatus, string> = {
    active: '#ECFDF5',
    paused: '#FEF3C7',
    rented: '#EFF6FF',
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Landlord Dashboard</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddListing')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Analytics Overview Card */}
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsTitle}>Portfolio Overview</Text>
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsStat}>
              <Text style={[styles.analyticsValue, { color: Colors.Success }]}>{totalActive}</Text>
              <Text style={styles.analyticsLabel}>Active</Text>
            </View>
            <View style={styles.analyticsDivider} />
            <View style={styles.analyticsStat}>
              <Text style={[styles.analyticsValue, { color: Colors.Warning }]}>{totalPaused}</Text>
              <Text style={styles.analyticsLabel}>Paused</Text>
            </View>
            <View style={styles.analyticsDivider} />
            <View style={styles.analyticsStat}>
              <Text style={[styles.analyticsValue, { color: '#6366F1' }]}>{totalRented}</Text>
              <Text style={styles.analyticsLabel}>Rented</Text>
            </View>
            <View style={styles.analyticsDivider} />
            <View style={styles.analyticsStat}>
              <Text style={[styles.analyticsValue, { color: Colors.Primary }]}>{totalViews}</Text>
              <Text style={styles.analyticsLabel}>Views</Text>
            </View>
          </View>

          {/* Weekly Performance Strip */}
          <View style={styles.performanceStrip}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="trending-up" size={15} color={Colors.Success} />
              <Text style={styles.performanceText}>
                {totalInquiries} new tenant inquiries this week
              </Text>
            </View>
            <View style={styles.growthBadge}>
              <Text style={styles.growthBadgeText}>↑ 23%</Text>
            </View>
          </View>
        </View>

        {/* Section Heading */}
        <View style={styles.listingsHeaderRow}>
          <Text style={styles.listingsSectionTitle}>Managed Properties ({listings.length})</Text>
        </View>

        {/* Listing Cards */}
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.Primary} style={{ marginTop: 40 }} />
        ) : listings.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="home-outline" size={38} color={Colors.Primary} />
            </View>
            <Text style={styles.emptyTitle}>No listings yet</Text>
            <Text style={styles.emptySub}>Tap "Add" above to list your property with zero brokerage fee</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('AddListing')}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyBtnText}>List a Property</Text>
            </TouchableOpacity>
          </View>
        ) : (
          listings.map((listing) => {
            const imgSrc = listing.photos && listing.photos.length > 0
              ? (typeof listing.photos[0] === 'number' ? listing.photos[0] : { uri: listing.photos[0] })
              : require('../Assets/Images/Banner.png');
            const boosted = isBoosted(listing);

            return (
              <View key={listing.id} style={styles.listingCard}>
                {/* Boost Banner */}
                {boosted && (
                  <View style={styles.boostBanner}>
                    <Ionicons name="rocket" size={12} color="#ffffff" />
                    <Text style={styles.boostBannerText}>FEATURED IN SEARCH RESULTS</Text>
                  </View>
                )}

                {/* Card Top: Image + Info */}
                <View style={styles.cardTop}>
                  <Image source={imgSrc} style={styles.listingThumb} />
                  <View style={styles.listingInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={styles.listingTitle} numberOfLines={1}>{listing.title}</Text>
                      {listing.isVerified && (
                        <Ionicons name="shield-checkmark" size={14} color={Colors.Success} />
                      )}
                    </View>
                    <Text style={styles.listingLocation} numberOfLines={1}>
                      📍 {listing.area}, {listing.city}
                    </Text>
                    <Text style={styles.listingRent}>
                      ₹{listing.rent.toLocaleString('en-IN')}
                      <Text style={styles.listingRentSub}>/mo</Text>
                    </Text>

                    {/* Status Badge */}
                    <View style={[styles.statusPill, { backgroundColor: statusBg[listing.status] }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor[listing.status] }]} />
                      <Text style={[styles.statusText, { color: statusColor[listing.status] }]}>
                        {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="eye-outline" size={13} color="#64748B" />
                    <Text style={styles.statValue}>{listing.viewCount}</Text>
                    <Text style={styles.statLabel}>Views</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Ionicons name="call-outline" size={13} color="#64748B" />
                    <Text style={styles.statValue}>{listing.inquiryCount}</Text>
                    <Text style={styles.statLabel}>Contacts</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Ionicons name="heart-outline" size={13} color="#64748B" />
                    <Text style={styles.statValue}>{listing.saveCount}</Text>
                    <Text style={styles.statLabel}>Saved</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Ionicons name="calendar-outline" size={13} color="#64748B" />
                    <Text style={styles.statValue}>{listing.availableFrom?.split(' ')[1] || 'Now'}</Text>
                    <Text style={styles.statLabel}>Move-in</Text>
                  </View>
                </View>

                {/* Verification Banner */}
                {!listing.isVerified && listing.verificationStatus === 'pending' && (
                  <View style={styles.pendingBanner}>
                    <Ionicons name="time" size={14} color="#1D4ED8" />
                    <Text style={styles.pendingBannerText}>Ownership Proof Under Review</Text>
                  </View>
                )}

                {!listing.isVerified && !listing.verificationStatus && (
                  <View style={styles.verificationBanner}>
                    <Ionicons name="shield-outline" size={14} color={Colors.WarningDark} style={{ marginRight: 6 }} />
                    <Text style={styles.verificationBannerText} numberOfLines={1}>Unverified Listing</Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        Alert.alert(
                          'Verify Property',
                          'Upload property ownership document (electricity bill, property tax receipt, or deed) to activate the 100% Verified Owner shield.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Upload Proof',
                              onPress: async () => {
                                await verifyPropertyListing(listing.id, 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23');
                                setListings(prev => prev.map(l => l.id === listing.id ? { ...l, isVerified: false, verificationStatus: 'pending' } : l));
                                Alert.alert('Submitted', 'Verification document submitted! Under review.');
                              }
                            }
                          ]
                        );
                      }}
                      style={styles.verifyActionBtn}
                    >
                      <Text style={styles.verifyActionBtnText}>Verify Now</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionsRow}>
                  {/* Boost Button */}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.boostBtn, boosted && styles.boostedBtn]}
                    onPress={() => openBoostSheet(listing)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="rocket-outline" size={13} color={boosted ? '#7C3AED' : Colors.Primary} />
                    <Text style={[styles.actionBtnText, { color: boosted ? '#7C3AED' : Colors.Primary }]}>
                      {boosted ? 'Boosted' : 'Boost'}
                    </Text>
                  </TouchableOpacity>

                  {/* Pause / Activate */}
                  {listing.status === 'active' ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.pauseBtn]}
                      onPress={() => handleStatusChange(listing, 'paused')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="pause-circle-outline" size={13} color={Colors.Warning} />
                      <Text style={[styles.actionBtnText, { color: Colors.Warning }]}>Pause</Text>
                    </TouchableOpacity>
                  ) : listing.status === 'paused' ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.activateBtn]}
                      onPress={() => handleStatusChange(listing, 'active')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="play-circle-outline" size={13} color={Colors.Success} />
                      <Text style={[styles.actionBtnText, { color: Colors.Success }]}>Activate</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.activateBtn]}
                      onPress={() => handleStatusChange(listing, 'active')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="refresh-outline" size={13} color={Colors.Success} />
                      <Text style={[styles.actionBtnText, { color: Colors.Success }]}>Relist</Text>
                    </TouchableOpacity>
                  )}

                  {/* Mark Rented */}
                  {listing.status !== 'rented' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rentedBtn]}
                      onPress={() => handleStatusChange(listing, 'rented')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark-circle-outline" size={13} color="#6366F1" />
                      <Text style={[styles.actionBtnText, { color: '#6366F1' }]}>Mark Rented</Text>
                    </TouchableOpacity>
                  )}

                  {/* Delete */}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(listing)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={13} color={Colors.Danger} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* Tips Card */}
        {listings.length > 0 && (
          <View style={styles.tipsCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Ionicons name="bulb" size={18} color={Colors.Warning} />
              <Text style={styles.tipsTitle}>
                Owner Pro Tips
              </Text>
            </View>
            {[
              'Add 5+ high-quality photos — properties with photos get 3x more views',
              'Respond to inquiries within 2 hours to earn the "Fast Responder" trust badge',
              'Boost your listing for ₹49 to place it at the very top of tenant searches',
              'Keep rent competitive using local market rates for Satellite & Ahmedabad',
            ].map((tip, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <Text style={{ color: Colors.Primary, fontFamily: Fonts.bold, fontSize: 13 }}>•</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Boost Bottom Sheet */}
      <Modal visible={!!boostTarget} transparent animationType="none" onRequestClose={closeBoostSheet}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#0F172A', opacity: fadeAnim }]} />
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeBoostSheet} />
          <Animated.View style={[styles.boostSheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.dragHandle} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.sheetTitle}>🚀 Boost Listing</Text>
              <TouchableOpacity onPress={closeBoostSheet}>
                <Ionicons name="close" size={24} color={Colors.Gray300} />
              </TouchableOpacity>
            </View>

            {boostTarget && (
              <View style={styles.boostPropertyRow}>
                <Image
                  source={boostTarget.photos?.length > 0
                    ? (typeof boostTarget.photos[0] === 'number' ? boostTarget.photos[0] : { uri: boostTarget.photos[0] })
                    : require('../Assets/Images/Banner.png')}
                  style={styles.boostThumb}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.boostPropertyTitle} numberOfLines={1}>{boostTarget.title}</Text>
                  <Text style={styles.boostPropertySub}>{boostTarget.area}, {boostTarget.city}</Text>
                </View>
              </View>
            )}

            <Text style={styles.boostSectionLabel}>Choose boost duration</Text>
            <View style={styles.boostOptions}>
              {([1, 3, 7] as BoostDuration[]).map(days => (
                <TouchableOpacity
                  key={days}
                  style={[styles.boostOption, selectedBoost === days && styles.boostOptionSelected]}
                  onPress={() => setSelectedBoost(days)}
                  activeOpacity={0.8}
                >
                  {days === 3 && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>POPULAR</Text>
                    </View>
                  )}
                  <Text style={[styles.boostDays, selectedBoost === days && styles.boostSelectedText]}>
                    {days} {days === 1 ? 'Day' : 'Days'}
                  </Text>
                  <Text style={[styles.boostPrice, selectedBoost === days && styles.boostSelectedText]}>
                    ₹{BOOST_PRICES[days]}
                  </Text>
                  {selectedBoost === days && (
                    <Ionicons name="checkmark-circle" size={16} color={Colors.Primary} style={{ marginTop: 4 }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.boostBenefits}>
              {['Appear at the top of search results', 'Get a "Featured" badge on your listing', `~${selectedBoost * 40}+ additional verified tenant views`].map((b, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.Success} />
                  <Text style={{ fontSize: 12, color: Colors.Gray300, fontFamily: Fonts.regular }}>{b}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.boostPayBtn}
              onPress={handleBoost}
              activeOpacity={0.85}
              disabled={boostLoading}
            >
              {boostLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.boostPayBtnText}>Pay ₹{BOOST_PRICES[selectedBoost]} · Boost Now</Text>
              }
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontFamily: Fonts.bold, color: '#0F172A' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    ...Shadows.primary,
  },
  addBtnText: { fontSize: 13, fontFamily: Fonts.bold, color: '#FFFFFF' },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

  // Analytics
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.subtle,
  },
  analyticsTitle: { fontSize: 13, fontFamily: Fonts.bold, color: '#0F172A', marginBottom: 14 },
  analyticsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  analyticsStat: { flex: 1, alignItems: 'center', gap: 2 },
  analyticsValue: { fontSize: 24, fontFamily: Fonts.bold },
  analyticsLabel: { fontSize: 12, fontFamily: Fonts.medium, color: '#64748B' },
  analyticsDivider: { width: 1, backgroundColor: '#E2E8F0', marginHorizontal: 2 },
  performanceStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  performanceText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#15803D',
  },
  growthBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  growthBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#15803D',
  },
  listingsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  listingsSectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },

  // Listing Card
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Shadows.subtle,
  },
  boostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  boostBannerText: { fontSize: 10, fontFamily: Fonts.bold, color: '#FFFFFF', letterSpacing: 0.5 },
  cardTop: { flexDirection: 'row', padding: 14, gap: 12 },
  listingThumb: { width: 90, height: 90, borderRadius: 12, backgroundColor: '#F1F5F9' },
  listingInfo: { flex: 1, gap: 3 },
  listingTitle: { fontSize: 15, fontFamily: Fonts.bold, color: '#0F172A' },
  listingLocation: { fontSize: 12, fontFamily: Fonts.regular, color: '#64748B' },
  listingRent: { fontSize: 16, fontFamily: Fonts.bold, color: '#0F172A', marginTop: 2 },
  listingRentSub: { fontSize: 12, fontFamily: Fonts.regular, color: '#64748B' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: Fonts.bold },

  // Stats
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 14, fontFamily: Fonts.bold, color: '#0F172A' },
  statLabel: { fontSize: 11, fontFamily: Fonts.regular, color: '#64748B' },
  statDivider: { width: 1, backgroundColor: '#E2E8F0', marginHorizontal: 4 },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontFamily: Fonts.medium },
  boostBtn: { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' },
  boostedBtn: { borderColor: '#DDD6FE', backgroundColor: '#EDE9FE' },
  pauseBtn: { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
  activateBtn: { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' },
  rentedBtn: { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' },
  deleteBtn: { borderColor: '#FECACA', backgroundColor: '#FEF2F2', paddingHorizontal: 10 },

  // Empty state
  emptyState: { alignItems: 'center', padding: 40, gap: 10 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  emptyTitle: { fontSize: 18, fontFamily: Fonts.bold, color: '#0F172A' },
  emptySub: { fontSize: 13, fontFamily: Fonts.regular, color: '#64748B', textAlign: 'center', lineHeight: 18 },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: '#0F172A',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    ...Shadows.primary,
  },
  emptyBtnText: { color: '#FFFFFF', fontFamily: Fonts.bold, fontSize: 14 },

  // Tips
  tipsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipsTitle: { fontSize: 14, fontFamily: Fonts.bold, color: '#0F172A' },
  tipText: { fontSize: 12, color: '#475569', fontFamily: Fonts.regular, flex: 1, lineHeight: 18 },

  // Boost Sheet
  boostSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 36,
    ...Shadows.float,
  },
  dragHandle: { width: 36, height: 4, backgroundColor: '#CBD5E1', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontFamily: Fonts.bold, color: '#0F172A' },
  boostPropertyRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 18, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  boostThumb: { width: 52, height: 52, borderRadius: 10 },
  boostPropertyTitle: { fontSize: 14, fontFamily: Fonts.bold, color: '#0F172A' },
  boostPropertySub: { fontSize: 12, fontFamily: Fonts.regular, color: '#64748B' },
  boostSectionLabel: { fontSize: 13, fontFamily: Fonts.bold, color: '#0F172A', marginBottom: 10 },
  boostOptions: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  boostOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  boostOptionSelected: { borderColor: '#0754C0', backgroundColor: '#EFF6FF' },
  boostDays: { fontSize: 13, fontFamily: Fonts.bold, color: '#0F172A' },
  boostPrice: { fontSize: 16, fontFamily: Fonts.bold, color: '#0F172A', marginTop: 3 },
  boostSelectedText: { color: '#0754C0' },
  popularBadge: {
    position: 'absolute',
    top: -9,
    alignSelf: 'center',
    backgroundColor: '#0754C0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  popularText: { fontSize: 10, fontFamily: Fonts.bold, color: '#FFFFFF', letterSpacing: 0.5 },
  boostBenefits: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, marginBottom: 16 },
  boostPayBtn: {
    backgroundColor: '#0F172A',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.primary,
  },
  boostPayBtnText: { fontSize: 15, fontFamily: Fonts.bold, color: '#FFFFFF' },
  verificationBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 14,
    marginBottom: 12,
  },
  verificationBannerText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#B45309',
    flex: 1,
  },
  verifyActionBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  verifyActionBtnText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  pendingBanner: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 14,
    marginBottom: 12,
    gap: 6,
  },
  pendingBannerText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#1D4ED8',
  },
});
