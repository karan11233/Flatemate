import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileImg from '../Assets/Images/Profile.png';
import Location from '../Assets/Svg/Location.svg';
import { Fonts } from '../Theme/Fonts';
import Card from '../Components/Card';
import { dummyListings, Listing } from '../utils/dummyData';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../utils/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../Context/AuthContext';
import FilterModal, { FilterOptions, defaultFilters } from '../Components/FilterModal';

const FILTER_PILLS = [
  'All',
  '1 BHK',
  '2 BHK',
  '3 BHK',
  'Furnished',
  'Satellite',
  'Bodakdev',
  'Prahlad Nagar',
  'SG Highway',
  'Vastrapur',
];

const SORT_LABELS: Record<FilterOptions['sortBy'], string> = {
  newest: 'Newest',
  rent_low: 'Price: Low',
  rent_high: 'Price: High',
  rating: 'Top Rated',
};

const SORT_ORDER: FilterOptions['sortBy'][] = ['newest', 'rent_low', 'rent_high', 'rating'];

export default function Home({ navigation }: any) {
  const { user, isLoggedIn } = useAuth();
  const [selectedPill, setSelectedPill] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState<Listing[]>(dummyListings);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>(defaultFilters);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<any>(null);

  // Compute active filter count for badge
  const activeFilterCount = [
    activeFilters.listingType !== 'All',
    activeFilters.furnished !== 'Any',
    activeFilters.genderPreference !== 'Any',
    activeFilters.budgetMax < 30000,
    activeFilters.availableNow,
    activeFilters.bhk.length > 0,
    activeFilters.sortBy !== 'newest',
  ].filter(Boolean).length;

  useEffect(() => {
    const loadCachedListings = async () => {
      try {
        const cached = await AsyncStorage.getItem('@flatemate_listings');
        if (cached) {
          setListings(JSON.parse(cached));
        } else {
          await AsyncStorage.setItem('@flatemate_listings', JSON.stringify(dummyListings));
        }
      } catch (e) {
        console.error("Failed to load cached listings:", e);
      }
    };

    if (isFirebaseConfigured && db) {
      loadCachedListings();
      const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const liveListings: Listing[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          liveListings.push({
            id: doc.id,
            title: data.title,
            rent: data.rent,
            deposit: data.deposit,
            bhk: data.bhk,
            area: data.area,
            city: data.city,
            floor: data.floor,
            furnished: data.furnished,
            amenities: data.amenities || [],
            photos: data.photos || [],
            listingType: data.listingType || 'flat',
            isVerified: data.isVerified ?? false,
            availableFrom: data.availableFrom || 'Immediate',
            landlordId: data.landlordId || '',
            landlordName: data.landlordName || 'Landlord',
            landlordInitials: data.landlordInitials || 'LL',
            landlordJoined: data.landlordJoined || '2023',
            landlordRentalsCompleted: data.landlordRentalsCompleted || 0,
            landlordPhone: data.landlordPhone || '',
            distanceText: data.distanceText || '',
            rating: data.rating || '4.8',
            badges: data.badges || [],
            description: data.description || '',
            currentFlatmates: data.currentFlatmates,
            totalCapacity: data.totalCapacity,
            genderPreference: data.genderPreference,
            isActive: data.isActive ?? true,
            createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          });
        });

        if (liveListings.length > 0) {
          setListings(liveListings);
          AsyncStorage.setItem('@flatemate_listings', JSON.stringify(liveListings));
        }
      }, (error) => {
        console.warn("Firestore snapshot error, staying on cached:", error);
      });

      return () => unsubscribe();
    } else {
      loadCachedListings();
    }
  }, []);

  // Filter & Search Logic
  const filteredListings = listings
    .filter((item) => {
      // 1. Text Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesArea = item.area.toLowerCase().includes(q);
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCity = item.city.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        if (!matchesArea && !matchesTitle && !matchesCity && !matchesDesc) return false;
      }

      // 2. Single Unified Pill Filter
      if (selectedPill === '1 BHK' && item.bhk !== 1) return false;
      if (selectedPill === '2 BHK' && item.bhk !== 2) return false;
      if (selectedPill === '3 BHK' && item.bhk !== 3) return false;
      if (selectedPill === 'Furnished' && !item.furnished) return false;
      if (['Satellite', 'Bodakdev', 'Prahlad Nagar', 'SG Highway', 'Vastrapur'].includes(selectedPill)) {
        if (!item.area.toLowerCase().includes(selectedPill.toLowerCase())) return false;
      }

      // 3. Modal Filters
      if (activeFilters.listingType !== 'All' && item.listingType !== activeFilters.listingType) return false;
      if (activeFilters.furnished === 'Furnished' && !item.furnished) return false;
      if (activeFilters.furnished === 'Unfurnished' && item.furnished) return false;
      if (activeFilters.genderPreference !== 'Any' && item.genderPreference && item.genderPreference !== activeFilters.genderPreference) return false;
      if (item.rent > activeFilters.budgetMax) return false;
      if (activeFilters.bhk.length > 0 && !activeFilters.bhk.includes(item.bhk)) return false;

      return true;
    })
    .sort((a, b) => {
      if (activeFilters.sortBy === 'rent_low') return a.rent - b.rent;
      if (activeFilters.sortBy === 'rent_high') return b.rent - a.rent;
      if (activeFilters.sortBy === 'rating') return parseFloat(b.rating) - parseFloat(a.rating);
      return 0; // newest
    });

  // Cycle through sort options on tap
  const cycleSort = () => {
    const currentIndex = SORT_ORDER.indexOf(activeFilters.sortBy);
    const nextSort = SORT_ORDER[(currentIndex + 1) % SORT_ORDER.length];
    setActiveFilters((prev) => ({ ...prev, sortBy: nextSort }));
  };

  const displayName = isLoggedIn && user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── 1. Top Header (White with subtle bottom shadow & FlateMate logo + city selector) ── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          {isLoggedIn && user?.name ? (
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
          ) : (
            <Image source={ProfileImg} style={styles.profileImg} />
          )}
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.brandLogoText}>FlateMate</Text>
              <View style={styles.citySelectorBadge}>
                <Ionicons name="location-sharp" size={11} color="#0754C0" />
                <Text style={styles.citySelectorText}>Ahmedabad</Text>
                <Ionicons name="chevron-down" size={12} color="#0754C0" />
              </View>
            </View>
            <Text style={styles.greetingText}>Hello, {displayName}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={19} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* ── 2. Search & Filter Bar ── */}
      <View style={styles.searchBarRow}>
        <View style={[styles.searchBox, isSearchFocused && styles.searchBoxFocused]}>
          <Ionicons name="search-outline" size={17} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="Search locality, flat name, or budget…"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => setIsFilterVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={activeFilterCount > 0 ? '#FFFFFF' : '#0F172A'}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterDot} />
          )}
        </TouchableOpacity>
      </View>

      {/* ── 3. Single Unified Filter Pill Row ── */}
      <View style={styles.pillContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillScroll}
        >
          {FILTER_PILLS.map((pill) => {
            const isActive = selectedPill === pill;
            return (
              <TouchableOpacity
                key={pill}
                style={[styles.pill, isActive && styles.pillActive]}
                onPress={() => setSelectedPill(pill)}
                activeOpacity={0.75}
              >
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                  {pill}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── 4. Main Feed ScrollView ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Sub-header: Count & 1-Tap Sort */}
        <View style={styles.feedSubHeader}>
          <Text style={styles.feedCountText}>
            {filteredListings.length} {filteredListings.length === 1 ? 'property' : 'properties'} found
          </Text>

          <TouchableOpacity style={styles.sortToggle} onPress={cycleSort} activeOpacity={0.7}>
            <Ionicons name="swap-vertical" size={13} color="#475569" />
            <Text style={styles.sortToggleText}>{SORT_LABELS[activeFilters.sortBy]}</Text>
          </TouchableOpacity>
        </View>

        {/* Listings Cards Feed */}
        {filteredListings.length > 0 ? (
          filteredListings.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.94}
              onPress={() => navigation.navigate('DetailPage', { listingId: item.id })}
            >
              <Card item={item} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="search" size={38} color="#0754C0" />
            </View>
            <Text style={styles.emptyTitle}>No matching flats found</Text>
            <Text style={styles.emptySub}>Try searching a different area or reset your filters.</Text>
            <TouchableOpacity
              style={styles.clearBtn}
              activeOpacity={0.85}
              onPress={() => {
                setSelectedPill('All');
                setSearchQuery('');
                setActiveFilters(defaultFilters);
              }}
            >
              <Text style={styles.clearBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        isVisible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        onApply={(filters) => {
          setActiveFilters(filters);
          setIsFilterVisible(false);
        }}
        currentFilters={activeFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogoText: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  citySelectorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  citySelectorText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#0754C0',
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  profileImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  greetingText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#475569',
    marginTop: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  locationText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: '#64748B',
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search Bar Row
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchBoxFocused: {
    borderColor: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#0F172A',
    height: '100%',
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },

  // Filter Pills (Single unified row)
  pillContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  pillScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  pillText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#475569',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },

  // Main Scroll Content
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },
  feedSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedCountText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  sortToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  sortToggleText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  clearBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  clearBtnText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
});
