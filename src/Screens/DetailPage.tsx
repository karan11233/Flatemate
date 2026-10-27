import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts } from '../Theme/Fonts';
import { Shadows } from '../Theme/colors';
import { dummyListings, calculateCompatibility } from '../utils/dummyData';
import { useAuth } from '../Context/AuthContext';
import PaymentBottomSheet from '../Components/PaymentBottomSheet';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../utils/firebase';

const { width } = Dimensions.get('window');

export default function DetailPage({ route, navigation }: any) {
  const { user, isLoggedIn, toggleSaveListing } = useAuth();
  const { propertyId, listingId } = route.params || {};
  const activeId = propertyId || listingId || '1';

  const [property, setProperty] = useState<any>(
    dummyListings.find((l) => l.id === activeId) || dummyListings[0]
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPaymentSheetVisible, setIsPaymentSheetVisible] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const isSaved = user?.savedListings?.includes(property?.id) || false;
  const isUnlocked = user?.contactsUnlocked?.includes(property?.landlordPhone) || false;

  useEffect(() => {
    const fetchProperty = async () => {
      // 1. In-memory check
      let found = dummyListings.find((l) => l.id === activeId);

      // 2. Cache check
      if (!found) {
        try {
          const cached = await AsyncStorage.getItem('@flatemate_listings');
          if (cached) {
            const listings = JSON.parse(cached);
            found = listings.find((l: any) => l.id === activeId);
          }
        } catch (e) {
          console.error('Cache read error:', e);
        }
      }

      // 3. Firestore check
      if (!found && isFirebaseConfigured && db) {
        try {
          const docRef = doc(db, 'listings', activeId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            found = { id: docSnap.id, ...docSnap.data() } as any;
          }
        } catch (e) {
          console.error('Firestore doc fetch error:', e);
        }
      }

      if (found) {
        setProperty(found);
      }
    };

    fetchProperty();
  }, [activeId]);

  const photos = property?.photos && property.photos.length > 0
    ? property.photos
    : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'];

  const mainImageSource = typeof photos[activeImageIndex] === 'number'
    ? photos[activeImageIndex]
    : { uri: photos[activeImageIndex] };

  const handleCallLandlord = () => {
    if (property?.landlordPhone) {
      Linking.openURL(`tel:${property.landlordPhone}`);
    }
  };

  const handleWhatsApp = () => {
    if (property?.landlordPhone) {
      const cleanPhone = property.landlordPhone.replace(/[^0-9]/g, '');
      const msg = encodeURIComponent(`Hello ${property.landlordName}, I saw your listing "${property.title}" in ${property.area}, Ahmedabad on FlateMate. Is it available for a visit?`);
      Linking.openURL(`https://wa.me/${cleanPhone}?text=${msg}`);
    }
  };

  const handleActionButton = () => {
    if (!isLoggedIn) {
      navigation.navigate('Login');
    } else {
      setIsPaymentSheetVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ── Scrollable Body ── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* ── 1. Hero Photo Gallery (Zero Dark Scrim) ── */}
        <View style={styles.heroWrapper}>
          <ImageBackground source={mainImageSource} style={styles.heroImage} resizeMode="cover">
            {/* Top Floating Controls */}
            <View style={styles.floatingTopBar}>
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={20} color="#0F172A" />
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={styles.circleBtn}
                  onPress={() => {
                    if (isLoggedIn) {
                      toggleSaveListing(property.id);
                    } else {
                      Alert.alert('Login Required', 'Please log in to save listings.');
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isSaved ? 'heart' : 'heart-outline'}
                    size={20}
                    color={isSaved ? '#EF4444' : '#0F172A'}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.circleBtn}
                  onPress={() => {
                    Alert.alert('Share Listing', `Check out ${property.title} in ${property.area}, Ahmedabad on FlateMate!`);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="share-outline" size={20} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Image Counter */}
            <View style={styles.photoPill}>
              <Ionicons name="image-outline" size={13} color="#FFFFFF" />
              <Text style={styles.photoPillText}>
                {activeImageIndex + 1} / {photos.length}
              </Text>
            </View>
          </ImageBackground>

          {/* Thumbnail Selector Bar */}
          {photos.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbScroll}
            >
              {photos.map((img: any, idx: number) => {
                const src = typeof img === 'number' ? img : { uri: img };
                const isActive = activeImageIndex === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setActiveImageIndex(idx)}
                    activeOpacity={0.8}
                    style={[styles.thumbBox, isActive && styles.thumbBoxActive]}
                  >
                    <Image source={src} style={styles.thumbImg} resizeMode="cover" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ── 2. Content Body ── */}
        <View style={styles.bodyContainer}>
          
          {/* Price & Title Block */}
          <View style={styles.headerBlock}>
            <View style={styles.priceRow}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text style={styles.priceMain}>₹{property.rent?.toLocaleString('en-IN')}</Text>
                <Text style={styles.pricePeriod}>/month</Text>
              </View>

              <View style={styles.zeroBrokeragePill}>
                <Text style={styles.zeroBrokerageText}>0% Brokerage</Text>
              </View>
            </View>

            <Text style={styles.propertyTitle}>{property.title}</Text>

            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={15} color="#64748B" />
              <Text style={styles.locationText}>
                {property.area}, {property.city} · {property.distanceText || 'Ahmedabad'}
              </Text>
            </View>
          </View>

          {/* ── 3. Four Key Spec Cards (Modern Minimalist Grid) ── */}
          <View style={styles.specsGrid}>
            <View style={styles.specCard}>
              <Ionicons name="home-outline" size={18} color="#0F172A" />
              <Text style={styles.specCardVal}>
                {property.listingType === 'roommate' ? 'Shared Flat' : `${property.bhk} BHK`}
              </Text>
              <Text style={styles.specCardLbl}>Type</Text>
            </View>

            <View style={styles.specCard}>
              <Ionicons name="bed-outline" size={18} color="#0F172A" />
              <Text style={styles.specCardVal}>
                {property.furnished ? 'Furnished' : 'Unfurnished'}
              </Text>
              <Text style={styles.specCardLbl}>Furnishing</Text>
            </View>

            <View style={styles.specCard}>
              <Ionicons
                name={property.listingType === 'roommate' ? 'people-outline' : 'layers-outline'}
                size={18}
                color="#0F172A"
              />
              <Text style={styles.specCardVal} numberOfLines={1}>
                {property.listingType === 'roommate'
                  ? (property.genderPreference || 'Any')
                  : `${property.floor || '1st'} Floor`}
              </Text>
              <Text style={styles.specCardLbl}>
                {property.listingType === 'roommate' ? 'Preference' : 'Floor'}
              </Text>
            </View>

            <View style={styles.specCard}>
              <Ionicons
                name={property.listingType === 'roommate' ? 'pie-chart-outline' : 'calendar-outline'}
                size={18}
                color="#0F172A"
              />
              <Text style={styles.specCardVal} numberOfLines={1}>
                {property.listingType === 'roommate' && property.currentFlatmates !== undefined && property.totalCapacity
                  ? `${property.currentFlatmates}/${property.totalCapacity} Spots`
                  : (property.availableFrom || 'Immediate')}
              </Text>
              <Text style={styles.specCardLbl}>
                {property.listingType === 'roommate' ? 'Occupancy' : 'Available'}
              </Text>
            </View>
          </View>

          {/* ── 3b. Roommate Compatibility Match (ONLY for roommate listings) ── */}
          {property.listingType === 'roommate' && property.roommates && property.roommates.length > 0 && (() => {
            const compat = calculateCompatibility(user?.habits, property.roommates);
            const scoreColor = compat.score >= 85 ? '#15803D' : compat.score >= 70 ? '#D97706' : '#EF4444';
            const scoreBg = compat.score >= 85 ? '#ECFDF5' : compat.score >= 70 ? '#FEF3C7' : '#FEF2F2';
            const scoreBorderColor = compat.score >= 85 ? '#A7F3D0' : compat.score >= 70 ? '#FDE68A' : '#FECACA';
            return (
              <View style={styles.roommateSectionWrapper}>
                {/* Compatibility Score Banner */}
                <View style={styles.compatBanner}>
                  <View style={[styles.compatIconCircle, { backgroundColor: scoreBg, borderColor: scoreBorderColor }]}>
                    <Ionicons name="sparkles" size={20} color={scoreColor} />
                  </View>
                  <View style={styles.compatTextContainer}>
                    <View style={styles.compatTitleRow}>
                      <Text style={styles.compatHeading}>Your Habit Match</Text>
                      <View style={[styles.compatScorePill, { backgroundColor: scoreBg, borderColor: scoreBorderColor }]}>
                        <Text style={[styles.compatScoreText, { color: scoreColor }]}>{compat.score}%</Text>
                      </View>
                    </View>
                    <Text style={styles.compatSubtitle}>
                      {compat.score >= 85
                        ? '🎯 Excellent match! Your habits align very well with current flatmates.'
                        : compat.score >= 70
                        ? '✅ Good match. A few preferences differ — worth a quick chat.'
                        : '⚠️ Partial match. Some habits differ — discuss before committing.'}
                    </Text>
                  </View>
                </View>

                {/* Habit-by-Habit Breakdown */}
                {compat.factors.length > 0 && (
                  <View style={styles.compatFactorBox}>
                    <View style={styles.compatFactorHeader}>
                      <Text style={styles.sectionHeading}>Habit Compatibility Breakdown</Text>
                      <Text style={styles.compatFactorSub}>Comparing your lifestyle with flatmates</Text>
                    </View>
                    <View style={styles.compatFactorList}>
                      {compat.factors.map((f, i) => (
                        <View
                          key={i}
                          style={[
                            styles.compatFactorRow,
                            i === compat.factors.length - 1 && styles.compatFactorRowLast,
                          ]}
                        >
                          <View style={[styles.compatFactorIcon, f.match ? styles.factorIconMatch : styles.factorIconDiff]}>
                            <Ionicons
                              name={f.match ? 'checkmark' : 'close'}
                              size={14}
                              color={f.match ? '#15803D' : '#64748B'}
                            />
                          </View>
                          <View style={styles.factorTextCol}>
                            <Text style={styles.compatFactorName}>{f.name}</Text>
                            <Text style={styles.compatFactorValues}>
                              You: <Text style={styles.factorValHighlight}>{f.yourValue}</Text> · Flatmate: <Text style={styles.factorValHighlight}>{f.flatmateValue}</Text>
                            </Text>
                          </View>
                          <View style={[styles.matchTag, f.match ? styles.matchTagYes : styles.matchTagNo]}>
                            <Text style={[styles.matchTagText, { color: f.match ? '#15803D' : '#64748B' }]}>
                              {f.match ? 'Match' : 'Differs'}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Who Lives Here */}
                <View style={styles.sectionBox}>
                  <View style={styles.whoLivesHeader}>
                    <View>
                      <Text style={styles.sectionHeading}>Who Lives Here</Text>
                      <Text style={styles.whoLivesSub}>Meet the flatmates in this home</Text>
                    </View>
                    <View style={styles.occupancyPill}>
                      <Ionicons name="people" size={13} color="#0F172A" />
                      <Text style={styles.occupancyText}>
                        {property.currentFlatmates}/{property.totalCapacity} occupied
                      </Text>
                    </View>
                  </View>

                  <View style={styles.roommateCardsList}>
                    {property.roommates.map((rm: any, i: number) => (
                      <View key={i} style={styles.roommateCard}>
                        {/* Header: Avatar + Identity */}
                        <View style={styles.rmCardHeader}>
                          <View style={[styles.roommateAvatar, { backgroundColor: rm.avatarColor || '#0F172A' }]}>
                            <Text style={styles.roommateAvatarText}>{rm.initials}</Text>
                          </View>
                          <View style={styles.rmIdentityCol}>
                            <View style={styles.rmNameRow}>
                              <Text style={styles.rmName}>{rm.name}</Text>
                              <View style={styles.rmAgePill}>
                                <Text style={styles.rmAgePillText}>
                                  {rm.age} yrs{rm.gender ? ` · ${rm.gender}` : ''}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.rmProfessionRow}>
                              <Ionicons name="briefcase-outline" size={13} color="#64748B" />
                              <Text style={styles.rmProfession} numberOfLines={1}>
                                {rm.profession}
                                {rm.companyOrCollege ? ` · ${rm.companyOrCollege}` : ''}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Bio quote box */}
                        {rm.bio ? (
                          <View style={styles.rmBioBox}>
                            <Text style={styles.rmBio}>"{rm.bio}"</Text>
                          </View>
                        ) : null}

                        {/* Habits row */}
                        {(rm.diet || rm.smoking || rm.sleepSchedule || rm.cleanliness) && (
                          <View style={styles.rmMetaSection}>
                            <Text style={styles.rmMetaLabel}>LIFESTYLE</Text>
                            <View style={styles.rmHabitRow}>
                              {rm.diet ? (
                                <View style={styles.rmHabitTagVeg}>
                                  <Text style={styles.rmHabitTagVegText}>🥗 {rm.diet}</Text>
                                </View>
                              ) : null}
                              {rm.smoking ? (
                                <View style={styles.rmHabitTag}>
                                  <Text style={styles.rmHabitTagText}>🚭 {rm.smoking}</Text>
                                </View>
                              ) : null}
                              {rm.sleepSchedule ? (
                                <View style={styles.rmHabitTagAmber}>
                                  <Text style={styles.rmHabitTagAmberText}>⏰ {rm.sleepSchedule}</Text>
                                </View>
                              ) : null}
                              {rm.cleanliness ? (
                                <View style={styles.rmHabitTag}>
                                  <Text style={styles.rmHabitTagText}>✨ {rm.cleanliness} Clean</Text>
                                </View>
                              ) : null}
                            </View>
                          </View>
                        )}

                        {/* Interests row */}
                        {rm.interests && rm.interests.length > 0 && (
                          <View style={styles.rmMetaSection}>
                            <Text style={styles.rmMetaLabel}>INTERESTS</Text>
                            <View style={styles.rmInterestRow}>
                              {rm.interests.slice(0, 4).map((interest: string, j: number) => (
                                <View key={j} style={styles.rmInterestTag}>
                                  <Text style={styles.rmInterestText}>#{interest}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>

                {/* Expense Split */}
                {property.expenseSplitText ? (
                  <View style={styles.expenseSplitBox}>
                    <View style={styles.expenseSplitHeader}>
                      <View style={styles.expenseIconCircle}>
                        <Ionicons name="calculator-outline" size={17} color="#0F172A" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.expenseSplitTitle}>Monthly Expense Split</Text>
                        <Text style={styles.expenseSplitSub}>Shared costs handled transparently</Text>
                      </View>
                    </View>
                    <Text style={styles.expenseSplitText}>{property.expenseSplitText}</Text>
                  </View>
                ) : null}
              </View>
            );
          })()}

          {/* ── 4. Landlord / Host Profile Card ── */}
          <View style={styles.hostCard}>
            <View style={styles.hostHeader}>
              <View style={styles.hostAvatarCircle}>
                <Text style={styles.hostAvatarText}>{property.landlordInitials || 'H'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.hostName}>{property.landlordName}</Text>
                  {property.isVerified && (
                    <Ionicons name="shield-checkmark" size={16} color="#15803D" />
                  )}
                </View>
                <Text style={styles.hostMeta}>
                  Direct Owner · Joined {property.landlordJoined || '2023'}
                </Text>
                <Text style={styles.hostFastReply}>⚡ Usually replies within 15 minutes</Text>
              </View>
            </View>

            {/* Direct Connect Options */}
            <View style={styles.hostActionsRow}>
              <TouchableOpacity
                style={styles.whatsAppBtn}
                onPress={handleWhatsApp}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                <Text style={styles.whatsAppBtnText}>WhatsApp Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.callHostBtn}
                onPress={handleCallLandlord}
                activeOpacity={0.8}
              >
                <Ionicons name="call-outline" size={16} color="#0F172A" />
                <Text style={styles.callHostBtnText}>Call Owner</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── 5. Amenities ── */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionHeading}>Amenities & Facilities</Text>
            <View style={styles.amenitiesGrid}>
              {property.amenities?.map((am: string, i: number) => (
                <View key={i} style={styles.amenityItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#0F172A" />
                  <Text style={styles.amenityText}>{am}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── 6. Description ── */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionHeading}>About this Home</Text>
            <Text style={styles.descText} numberOfLines={isDescExpanded ? undefined : 4}>
              {property.description || 'No description provided by the landlord.'}
            </Text>
            {property.description && property.description.length > 150 && (
              <TouchableOpacity
                onPress={() => setIsDescExpanded(!isDescExpanded)}
                activeOpacity={0.7}
                style={{ marginTop: 6 }}
              >
                <Text style={styles.expandText}>
                  {isDescExpanded ? 'Show less' : 'Read more'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── 7. Monthly Cost Breakdown ── */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionHeading}>Transparent Cost Breakdown</Text>
            <View style={styles.costBox}>
              <View style={styles.costLine}>
                <Text style={styles.costLabel}>Monthly Rent</Text>
                <Text style={styles.costVal}>₹{property.rent?.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.costLine}>
                <Text style={styles.costLabel}>Security Deposit</Text>
                <Text style={styles.costVal}>₹{property.deposit?.toLocaleString('en-IN') || 'Negotiable'}</Text>
              </View>
              <View style={styles.costLine}>
                <Text style={styles.costLabel}>Brokerage / Commission</Text>
                <Text style={[styles.costVal, { color: '#15803D' }]}>₹0 (Zero Brokerage)</Text>
              </View>
              <View style={styles.costDivider} />
              <View style={styles.costLine}>
                <Text style={styles.costTotalLabel}>Estimated Monthly</Text>
                <Text style={styles.costTotalVal}>₹{property.rent?.toLocaleString('en-IN')}/mo</Text>
              </View>
            </View>
          </View>

          {/* ── 8. Digital Rental Agreement CTA ── */}
          <View style={styles.agreementCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.agreementIconBox}>
                <Ionicons name="document-text-outline" size={20} color="#0F172A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.agreementTitle}>Digital Gujarat Rental Agreement</Text>
                <Text style={styles.agreementSub}>Generate legally compliant e-stamp lease agreements online.</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.agreementBtn}
              onPress={() => navigation.navigate('AgreementForm', { property })}
              activeOpacity={0.8}
            >
              <Text style={styles.agreementBtnText}>Draft Agreement Now →</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* ── Sticky Bottom Action Bar ── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceGroup}>
          <Text style={styles.bottomPriceVal}>₹{property.rent?.toLocaleString('en-IN')}</Text>
          <Text style={styles.bottomPriceLbl}>/month · {property.deposit ? `${Math.round(property.deposit / property.rent)}m dep` : 'Zero broker'}</Text>
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.visitBtn}
            onPress={() => navigation.navigate('ScheduleVisit', { propertyId: property.id })}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={16} color="#0F172A" />
            <Text style={styles.visitBtnText}>Visit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactBtn}
            onPress={isUnlocked ? handleCallLandlord : handleActionButton}
            activeOpacity={0.85}
          >
            <Text style={styles.contactBtnText}>
              {isUnlocked ? 'Call Landlord' : 'Connect Owner'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment Sheet */}
      <PaymentBottomSheet
        isVisible={isPaymentSheetVisible}
        onClose={() => setIsPaymentSheetVisible(false)}
        property={property}
        onSuccess={() => {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    paddingBottom: 100,
  },

  // 1. Hero
  heroWrapper: {
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  heroImage: {
    width: width,
    height: 320,
    justifyContent: 'space-between',
  },
  floatingTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  photoPill: {
    position: 'absolute',
    bottom: 14,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoPillText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  thumbScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  thumbBox: {
    width: 54,
    height: 54,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbBoxActive: {
    borderColor: '#0F172A',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },

  // 2. Content
  bodyContainer: {
    padding: 16,
    gap: 20,
  },
  headerBlock: {
    gap: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  priceMain: {
    fontSize: 26,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  pricePeriod: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#64748B',
  },
  zeroBrokeragePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  zeroBrokerageText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  propertyTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#64748B',
  },

  // 3. Specs Grid
  specsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  specCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    alignItems: 'center',
    gap: 3,
  },
  specCardVal: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    marginTop: 2,
  },
  specCardLbl: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: '#64748B',
  },

  // 4. Host Card
  hostCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 14,
  },
  hostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hostAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostAvatarText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  hostName: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  hostMeta: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#64748B',
    marginTop: 1,
  },
  hostFastReply: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#15803D',
    marginTop: 2,
  },
  hostActionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  whatsAppBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  whatsAppBtnText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  callHostBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  callHostBtnText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },

  // Sections
  sectionBox: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '48%',
    paddingVertical: 4,
  },
  amenityText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#334155',
  },
  descText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#475569',
    lineHeight: 20,
  },
  expandText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },

  // Cost Box
  costBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 8,
  },
  costLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#64748B',
  },
  costVal: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#0F172A',
  },
  costDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  costTotalLabel: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  costTotalVal: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },

  // Agreement Card
  agreementCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10,
  },
  agreementIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  agreementTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  agreementSub: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#64748B',
  },
  agreementBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  agreementBtnText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },

  // Sticky Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomPriceGroup: {
    flex: 1,
  },
  bottomPriceVal: {
    fontSize: 19,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  bottomPriceLbl: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#64748B',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 8,
  },
  visitBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visitBtnText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  contactBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactBtnText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },

  // ── Compatibility Match ──
  roommateSectionWrapper: {
    gap: 20,
  },
  compatBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadows.subtle,
  },
  compatIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  compatTextContainer: {
    flex: 1,
    gap: 4,
  },
  compatTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  compatHeading: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  compatScorePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  compatScoreText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
  compatSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#475569',
    lineHeight: 18,
  },

  // ── Compatibility Factor Breakdown ──
  compatFactorBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    gap: 14,
    ...Shadows.subtle,
  },
  compatFactorHeader: {
    gap: 2,
  },
  compatFactorSub: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#64748B',
  },
  compatFactorList: {
    gap: 0,
  },
  compatFactorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  compatFactorRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  compatFactorIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  factorIconMatch: {
    backgroundColor: '#ECFDF5',
  },
  factorIconDiff: {
    backgroundColor: '#F1F5F9',
  },
  factorTextCol: {
    flex: 1,
    gap: 2,
  },
  compatFactorName: {
    fontSize: 13.5,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  compatFactorValues: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#64748B',
  },
  factorValHighlight: {
    fontFamily: Fonts.medium,
    color: '#334155',
  },
  matchTag: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchTagYes: {
    backgroundColor: '#ECFDF5',
  },
  matchTagNo: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  matchTagText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
  },

  // ── Who Lives Here ──
  whoLivesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  whoLivesSub: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },
  occupancyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  occupancyText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  roommateCardsList: {
    gap: 14,
    marginTop: 4,
  },
  roommateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
    ...Shadows.subtle,
  },
  rmCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roommateAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  roommateAvatarText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  rmIdentityCol: {
    flex: 1,
    gap: 3,
  },
  rmNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  rmName: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  rmAgePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rmAgePillText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#475569',
  },
  rmProfessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rmProfession: {
    fontSize: 12.5,
    fontFamily: Fonts.medium,
    color: '#64748B',
    flex: 1,
  },
  rmBioBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0F172A',
  },
  rmBio: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#334155',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  rmMetaSection: {
    gap: 6,
  },
  rmMetaLabel: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: '#64748B',
    letterSpacing: 0.6,
  },
  rmHabitRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  rmHabitTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rmHabitTagText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: '#334155',
  },
  rmHabitTagVeg: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  rmHabitTagVegText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#15803D',
  },
  rmHabitTagAmber: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  rmHabitTagAmberText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#B45309',
  },
  rmInterestRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  rmInterestTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  rmInterestText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: '#1D4ED8',
  },

  // ── Expense Split ──
  expenseSplitBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 10,
  },
  expenseSplitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  expenseIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  expenseSplitTitle: {
    fontSize: 14.5,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  expenseSplitSub: {
    fontSize: 11.5,
    fontFamily: Fonts.regular,
    color: '#64748B',
  },
  expenseSplitText: {
    fontSize: 12.5,
    fontFamily: Fonts.regular,
    color: '#334155',
    lineHeight: 19,
  },
});
