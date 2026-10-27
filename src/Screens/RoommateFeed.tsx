import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import Profile from '../Assets/Images/Profile.png';
import Location from '../Assets/Svg/Location.svg';
import { Fonts } from '../Theme/Fonts';
import { Colors, Shadows } from '../Theme/colors';
import Bell from '../Assets/Svg/Bell.svg';
import Input from '../Components/Input';
import Search from '../Assets/Svg/Search.svg';
import Filter from '../Assets/Svg/Filter.svg';
import Card from '../Components/Card';
import { dummyListings, Listing } from '../utils/dummyData';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../utils/firebase';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import FilterBottomSheet from '../Components/FilterBottomSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RoommateFeed({ navigation }: any) {
  const { user, isLoggedIn } = useAuth();
  const [activeChip, setActiveChip] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState<Listing[]>(dummyListings);

  // Lifestyle Filters state
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [lifestyleFilters, setLifestyleFilters] = useState<{
    cleanliness: number;
    noiseTolerance: 'Quiet Hours' | 'Social' | 'Any';
    guestPolicy: 'No' | 'Weekends' | 'Yes' | 'Any';
  }>({
    cleanliness: 3,
    noiseTolerance: 'Any',
    guestPolicy: 'Any',
  });

  // Premium Modal State
  const [isPremiumModalVisible, setIsPremiumModalVisible] = useState(false);

  // Sync with Firestore if configured, otherwise use AsyncStorage caching
  useEffect(() => {
    const loadCachedListings = async () => {
      try {
        const cached = await AsyncStorage.getItem('@flatemate_listings');
        if (cached) {
          setListings(JSON.parse(cached));
        } else {
          // Initialize with dummy listings
          await AsyncStorage.setItem('@flatemate_listings', JSON.stringify(dummyListings));
        }
      } catch (e) {
        console.error("Failed to load cached listings:", e);
      }
    };

    if (isFirebaseConfigured && db) {
      // Load cache first for instant visual render
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
            listingType: data.listingType,
            isVerified: data.isVerified || false,
            availableFrom: data.availableFrom,
            landlordId: data.landlordId,
            landlordName: data.landlordName,
            landlordInitials: data.landlordInitials,
            landlordJoined: data.landlordJoined,
            landlordRentalsCompleted: data.landlordRentalsCompleted || 0,
            landlordPhone: data.landlordPhone,
            distanceText: data.distanceText,
            rating: data.rating || '4.0',
            badges: data.badges || [],
            description: data.description,
            currentFlatmates: data.currentFlatmates,
            totalCapacity: data.totalCapacity,
            genderPreference: data.genderPreference,
            isActive: data.isActive ?? true,
            createdAt: data.createdAt,
            roommates: data.roommates,
            compatibilityScore: data.compatibilityScore,
            compatibilityFactors: data.compatibilityFactors,
            expenseSplitText: data.expenseSplitText,
            cleanliness: data.cleanliness,
            noiseTolerance: data.noiseTolerance,
            guestPolicy: data.guestPolicy,
          });
        });

        let finalMergedListings: Listing[] = [];
        if (liveListings.length === 0) {
          finalMergedListings = dummyListings;
        } else {
          const merged = [...liveListings];
          dummyListings.forEach((dummy) => {
            if (!merged.some(item => item.title === dummy.title && item.rent === dummy.rent)) {
              merged.push(dummy);
            }
          });
          finalMergedListings = merged;
        }
        setListings(finalMergedListings);
        AsyncStorage.setItem('@flatemate_listings', JSON.stringify(finalMergedListings)).catch(e => {
          console.error("Failed to cache listings to AsyncStorage:", e);
        });
      }, (error) => {
        console.error("Firestore roommate listings fetch error:", error);
      });

      return () => unsubscribe();
    } else {
      // Offline / Unconfigured fallback: load listings from AsyncStorage cache
      loadCachedListings();
    }
  }, []);

  // Filter listings for listingType === 'roommate'
  // Also prioritize active status and high response rates (simulated via isActive and isVerified)
  const roommateListings = listings
    .filter(l => l.listingType === 'roommate')
    .sort((a, b) => {
      // Prioritize active first
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      // Prioritize verified second
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;
      return 0;
    });

  // Filter listings based on active filter chip, search query, and lifestyle filters
  const filteredListings = roommateListings.filter((item) => {
    // Search query matching
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.area.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Filter chip matching
    if (activeChip !== 'All') {
      if (activeChip === '1 spot left') {
        const left = item.totalCapacity && item.currentFlatmates ? (item.totalCapacity - item.currentFlatmates) === 1 : false;
        if (!left) return false;
      } else if (activeChip === '2 spots left') {
        const left = item.totalCapacity && item.currentFlatmates ? (item.totalCapacity - item.currentFlatmates) === 2 : false;
        if (!left) return false;
      } else if (activeChip === 'Males only') {
        if (item.genderPreference !== 'Males only') return false;
      } else if (activeChip === 'Females only') {
        if (item.genderPreference !== 'Females only') return false;
      } else if (activeChip === 'Any') {
        if (item.genderPreference !== 'Any') return false;
      }
    }

    // Apply Lifestyle Filters (cleanliness, noise tolerance, guest policy)
    const itemCleanliness = item.cleanliness ?? (item.id === '3' ? 4 : (item.id === '5' ? 3 : 3));
    // Allow simple tolerance filter (+/- 1)
    if (Math.abs(itemCleanliness - lifestyleFilters.cleanliness) > 1.5) {
      return false;
    }

    // 2. Noise Tolerance
    if (lifestyleFilters.noiseTolerance !== 'Any') {
      const hasQuietHours = item.noiseTolerance === 'Quiet Hours' || item.compatibilityFactors?.some(f => f.toLowerCase().includes('quiet')) || false;
      if (lifestyleFilters.noiseTolerance === 'Quiet Hours' && !hasQuietHours) {
        return false;
      }
      if (lifestyleFilters.noiseTolerance === 'Social' && hasQuietHours) {
        return false;
      }
    }

    // 3. Guest Policy
    if (lifestyleFilters.guestPolicy !== 'Any') {
      const itemGuestPolicy = item.guestPolicy ?? (item.id === '3' ? 'Weekends' : (item.id === '5' ? 'No' : 'Yes'));
      if (lifestyleFilters.guestPolicy !== itemGuestPolicy) {
        return false;
      }
    }

    return true;
  });

  const handleApplyLifestyleFilters = (filters: typeof lifestyleFilters) => {
    setLifestyleFilters(filters);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            {isLoggedIn && user?.name ? (
              <View style={styles.userAvatarBadge}>
                <Text style={styles.userAvatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            ) : (
              <Image source={Profile} style={styles.profileImage} />
            )}

            <View style={styles.headerGreetingCol}>
              <Text style={styles.greetingText} numberOfLines={1}>
                {isLoggedIn && user?.name ? `Hello, ${user.name.split(' ')[0]} 👋` : 'Find Roommates 👋'}
              </Text>

              <View style={styles.locationPinRow}>
                <Location height={13} width={13} color={Colors.Gray400} />
                <Text style={styles.locationPinText}>
                  Satellite, Ahmedabad
                </Text>
              </View>
            </View>
          </View>

          {/* Notification Bell */}
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <Bell height={20} width={20} />
            <View style={styles.bellNotificationDot} />
          </TouchableOpacity>
        </View>

        {/* Search Bar + Lifestyle Filter Button */}
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <Input
              leftIcon={<Search height={18} width={18} color={Colors.Gray400} />}
              placeHolder="Search roommates by area, flat..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setIsFilterVisible(true)}
            style={styles.filterButton}
          >
            <Filter height={18} width={18} />
          </TouchableOpacity>
        </View>

        {/* Filter Scroll Chips */}
        <ScrollView
          horizontal
          style={{ flexGrow: 0 }}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {['All', '1 spot left', '2 spots left', 'Males only', 'Females only', 'Any'].map((text) => {
            const isActive = activeChip === text;
            return (
              <TouchableOpacity
                key={text}
                style={[
                  styles.chip,
                  isActive ? styles.chipActive : styles.chipInactive,
                ]}
                onPress={() => setActiveChip(text)}
                activeOpacity={0.78}
              >
                <Text style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}>
                  {text}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Premium filter chips */}
          {['🎓 Student Alumni', '💼 Same Profession'].map((text) => (
            <TouchableOpacity
              key={text}
              activeOpacity={0.8}
              onPress={() => setIsPremiumModalVisible(true)}
              style={styles.premiumChip}
            >
              <FontAwesome5 name="crown" size={11} color={Colors.Gold} style={{ marginRight: 5 }} />
              <Text style={styles.premiumChipText}>{text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Roommate Listings Header */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.accentBar} />
            <Text style={styles.sectionTitle}>
              Available Roommate Slots
            </Text>
          </View>
          <View style={styles.resultsBadge}>
            <Text style={styles.resultsBadgeText}>
              {filteredListings.length} found
            </Text>
          </View>
        </View>

        {/* Render Dynamic Cards */}
        <View style={styles.cardsStack}>
          {filteredListings.length > 0 ? (
            filteredListings.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.92}
                onPress={() => navigation.navigate('DetailPage', { propertyId: item.id })}
              >
                <Card item={item} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="people-outline" size={32} color={Colors.Primary} />
              </View>
              <Text style={styles.emptyTitle}>No matching roommates</Text>
              <Text style={styles.emptyText}>
                Try loosening your lifestyle criteria or checking other areas in Ahmedabad.
              </Text>
              <TouchableOpacity
                style={styles.clearBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setActiveChip('All');
                  setSearchQuery('');
                  setLifestyleFilters({ cleanliness: 3, noiseTolerance: 'Any', guestPolicy: 'Any' });
                }}
              >
                <Text style={styles.clearBtnText}>Reset Roommate Filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        onApply={handleApplyLifestyleFilters}
        initialFilters={lifestyleFilters}
      />

      {/* Premium Activation Modal */}
      <Modal
        visible={isPremiumModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPremiumModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsPremiumModalVisible(false)}>
          <View style={styles.premiumOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.premiumSheetContainer}>
                {/* Drag Handle */}
                <View style={styles.dragHandle} />

                <View style={{ alignItems: 'center', marginVertical: 18, gap: 10 }}>
                  <View style={styles.premiumIconContainer}>
                    <FontAwesome5 name="crown" size={32} color={Colors.Gold} />
                  </View>
                  <Text style={styles.premiumTitle}>Unlock Premium Matching</Text>
                  <Text style={styles.premiumDescription}>
                    Connect with roommates who graduated from your college or work in the same field. Verified networks match 3x faster!
                  </Text>
                </View>

                {/* Features List */}
                <View style={styles.premiumFeaturesList}>
                  <View style={styles.premiumFeatureRow}>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.Gold} />
                    <Text style={styles.premiumFeatureText}>Filter by Student Alumni & Colleges</Text>
                  </View>
                  <View style={styles.premiumFeatureRow}>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.Gold} />
                    <Text style={styles.premiumFeatureText}>Filter by Profession & Workplace</Text>
                  </View>
                  <View style={styles.premiumFeatureRow}>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.Gold} />
                    <Text style={styles.premiumFeatureText}>Unlimited Direct Landlord Unlocks</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.premiumBuyButton}
                  activeOpacity={0.85}
                  onPress={() => {
                    setIsPremiumModalVisible(false);
                    Alert.alert(
                      "🎉 Upgrade Successful!",
                      "You have unlocked premium roommate filters. Happy matching!",
                      [{ text: "Awesome!" }]
                    );
                  }}
                >
                  <Text style={styles.premiumBuyButtonText}>Upgrade to Premium for ₹199</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.premiumCancelButton}
                  onPress={() => setIsPremiumModalVisible(false)}
                >
                  <Text style={styles.premiumCancelText}>Maybe Later</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    paddingHorizontal: 20,
    backgroundColor: Colors.Gray50,
    flex: 1,
  },
  scrollContent: {
    gap: 18,
    paddingTop: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  userAvatarBadge: {
    height: 46,
    width: 46,
    borderRadius: 23,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.White,
    ...Shadows.subtle,
  },
  userAvatarText: {
    color: '#ffffff',
    fontFamily: Fonts.bold,
    fontSize: 18,
  },
  profileImage: {
    height: 46,
    width: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  headerGreetingCol: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 19,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  locationPinRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    marginTop: 2,
  },
  locationPinText: {
    color: '#64748B',
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  bellButton: {
    height: 44,
    width: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: Colors.White,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  bellNotificationDot: {
    backgroundColor: '#EF4444',
    borderRadius: 5,
    borderColor: Colors.White,
    borderWidth: 1.5,
    height: 9,
    width: 9,
    position: 'absolute',
    top: 10,
    right: 11,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  filterButton: {
    height: 48,
    width: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: Colors.White,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  bannerContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 18,
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
    gap: 6,
  },
  bannerTagRow: {
    flexDirection: 'row',
  },
  bannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bannerPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: Fonts.bold,
    letterSpacing: 0.3,
  },
  bannerTitle: {
    fontSize: 19,
    fontFamily: Fonts.bold,
    color: '#ffffff',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  bannerDesc: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 18,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  chip: {
    height: 36,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  chipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
    ...Shadows.subtle,
  },
  chipInactive: {
    backgroundColor: Colors.White,
    borderColor: '#E2E8F0',
    ...Shadows.subtle,
  },
  chipText: {
    fontSize: 13,
  },
  chipTextActive: {
    color: '#ffffff',
    fontFamily: Fonts.bold,
  },
  chipTextInactive: {
    color: '#475569',
    fontFamily: Fonts.medium,
  },
  premiumChip: {
    height: 36,
    borderWidth: 1.5,
    borderColor: '#B45309',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    flexDirection: 'row',
  },
  premiumChipText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#B45309',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accentBar: {
    width: 4,
    height: 18,
    backgroundColor: '#0F172A',
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: Fonts.bold,
    letterSpacing: -0.2,
  },
  resultsBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resultsBadgeText: {
    color: '#0754C0',
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  cardsStack: {
    gap: 4,
  },
  emptyContainer: {
    backgroundColor: Colors.White,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...Shadows.card,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 8,
  },
  clearBtn: {
    height: 46,
    paddingHorizontal: 22,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  clearBtnText: {
    color: Colors.White,
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  // Premium modal styles
  premiumOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  premiumSheetContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 36,
    borderTopWidth: 2,
    borderColor: Colors.Gold,
    ...Shadows.float,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  premiumIconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.Gold,
  },
  premiumTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: '#ffffff',
    textAlign: 'center',
  },
  premiumDescription: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  premiumFeaturesList: {
    marginVertical: 14,
    gap: 10,
    alignSelf: 'center',
  },
  premiumFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  premiumFeatureText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#ffffff',
  },
  premiumBuyButton: {
    backgroundColor: Colors.Gold,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    ...Shadows.float,
  },
  premiumBuyButtonText: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  premiumCancelButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  premiumCancelText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
