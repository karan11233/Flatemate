import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Shadows } from '../Theme/colors';
import { Fonts } from '../Theme/Fonts';
import { dummyListings, Listing } from '../utils/dummyData';
import { useAuth } from '../Context/AuthContext';
import Card from '../Components/Card';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../utils/firebase';

export default function Profile({ navigation }: any) {
  const { user, isLoggedIn, logout } = useAuth();
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [isVisitsExpanded, setIsVisitsExpanded] = useState(true);

  useEffect(() => {
    if (!isLoggedIn || !user) return;

    const loadCachedListings = async () => {
      try {
        const cached = await AsyncStorage.getItem('@flatemate_listings');
        if (cached) {
          setAllListings(JSON.parse(cached));
        } else {
          setAllListings(dummyListings);
        }
      } catch (e) {
        setAllListings(dummyListings);
      }
    };

    if (isFirebaseConfigured && db) {
      loadCachedListings();

      const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const liveListings: Listing[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            liveListings.push({
              id: doc.id,
              ...data,
            } as any);
          });

          let finalMergedListings: Listing[] = [];
          if (liveListings.length === 0) {
            finalMergedListings = dummyListings;
          } else {
            const merged = [...liveListings];
            dummyListings.forEach((dummy) => {
              if (!merged.some((item) => item.title === dummy.title && item.rent === dummy.rent)) {
                merged.push(dummy);
              }
            });
            finalMergedListings = merged;
          }
          setAllListings(finalMergedListings);
        },
        (error) => {
          console.error('Firestore listings sync in Profile error:', error);
        }
      );

      return () => unsubscribe();
    } else {
      loadCachedListings();
    }
  }, [isLoggedIn, user?.id]);

  const myListings = allListings.filter(
    (l) => l.landlordId === user?.id || (l.landlordPhone === user?.phone && l.landlordName === user?.name)
  );

  const handleSupportWhatsApp = () => {
    const message = encodeURIComponent('Hello FlateMate Support, I need assistance with my account and listings.');
    Linking.openURL(`https://wa.me/919876543210?text=${message}`).catch(() => {
      Alert.alert('Help & Support', 'Email us at support@flatemate.in or WhatsApp +91 98765 43210');
    });
  };

  const handleLogoutConfirm = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your FlateMate account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  // ── Logged Out State ──
  if (!isLoggedIn || !user) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.loggedOutContainer}>
          <View style={styles.loggedOutHeroCircle}>
            <Ionicons name="home-outline" size={42} color="#0F172A" />
          </View>

          <Text style={styles.loggedOutTitle}>Welcome to FlateMate</Text>
          <Text style={styles.loggedOutSub}>
            Direct flats, shared apartments, and verified roommates in Ahmedabad with zero brokerage.
          </Text>

          <View style={styles.valuePropsContainer}>
            <View style={styles.valuePropRow}>
              <View style={styles.valuePropIcon}>
                <Ionicons name="shield-checkmark" size={16} color="#15803D" />
              </View>
              <Text style={styles.valuePropText}>100% Aadhaar & identity-verified hosts</Text>
            </View>
            <View style={styles.valuePropRow}>
              <View style={styles.valuePropIcon}>
                <Ionicons name="flash" size={16} color="#0F172A" />
              </View>
              <Text style={styles.valuePropText}>Instant WhatsApp & direct phone unlocks</Text>
            </View>
            <View style={styles.valuePropRow}>
              <View style={styles.valuePropIcon}>
                <Ionicons name="document-text" size={16} color="#0F172A" />
              </View>
              <Text style={styles.valuePropText}>E-stamped Gujarat digital rental agreements</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.loggedOutButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loggedOutButtonText}>Log In or Register</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const firstLetter = user.name ? user.name.charAt(0).toUpperCase() : 'U';
  const isPro = user.subscriptionPlan === 'pro';
  const isEarlyBird = user.subscriptionPlan === 'early_bird';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarTitle}>Account</Text>
          <View style={styles.cityRow}>
            <Ionicons name="location-sharp" size={12} color="#64748B" />
            <Text style={styles.cityText}>Ahmedabad, GJ</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.topBarIconBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* ── 1. Hero Profile Card ── */}
        <View style={styles.heroProfileCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{firstLetter}</Text>
            </View>
            {user.isIdentityVerified && (
              <View style={styles.avatarVerifiedBadge}>
                <Ionicons name="checkmark-sharp" size={12} color="#FFFFFF" />
              </View>
            )}
          </View>

          <View style={styles.profileDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName} numberOfLines={1}>{user.name}</Text>
              {isPro && (
                <View style={styles.proPill}>
                  <Text style={styles.proPillText}>PRO</Text>
                </View>
              )}
              {isEarlyBird && (
                <View style={styles.earlyPill}>
                  <Text style={styles.earlyPillText}>EARLY BIRD</Text>
                </View>
              )}
            </View>

            <Text style={styles.profileContact} numberOfLines={1}>
              {user.phone}{user.profession ? ` · ${user.profession}` : ''}
            </Text>

            {/* Verification Status Pill */}
            <TouchableOpacity
              style={[
                styles.verificationPill,
                user.isIdentityVerified
                  ? styles.verifiedPillBg
                  : user.identityVerificationStatus === 'pending'
                  ? styles.pendingPillBg
                  : styles.unverifiedPillBg,
              ]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('DocumentVerification')}
            >
              <Ionicons
                name={
                  user.isIdentityVerified
                    ? 'shield-checkmark'
                    : user.identityVerificationStatus === 'pending'
                    ? 'time-outline'
                    : 'shield-outline'
                }
                size={13}
                color={
                  user.isIdentityVerified
                    ? '#15803D'
                    : user.identityVerificationStatus === 'pending'
                    ? '#B45309'
                    : '#0F172A'
                }
              />
              <Text
                style={[
                  styles.verificationPillText,
                  {
                    color: user.isIdentityVerified
                      ? '#15803D'
                      : user.identityVerificationStatus === 'pending'
                      ? '#B45309'
                      : '#0F172A',
                  },
                ]}
              >
                {user.isIdentityVerified
                  ? 'Identity Verified'
                  : user.identityVerificationStatus === 'pending'
                  ? 'Verification In Review'
                  : 'Verify Identity →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. Quick 3-Metric Interactive Bar ── */}
        <View style={styles.metricRow}>
          <TouchableOpacity
            style={styles.metricCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Saved')}
          >
            <View style={styles.metricIconBox}>
              <Ionicons name="heart-outline" size={18} color="#EF4444" />
            </View>
            <Text style={styles.metricValue}>{user.savedListings?.length || 0}</Text>
            <Text style={styles.metricLabel}>Saved Flats</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricCard}
            activeOpacity={0.8}
            onPress={() => setIsVisitsExpanded(true)}
          >
            <View style={styles.metricIconBox}>
              <Ionicons name="calendar-outline" size={18} color="#0F172A" />
            </View>
            <Text style={styles.metricValue}>{user.visits?.length || 0}</Text>
            <Text style={styles.metricLabel}>Visits</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricCard}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Unlocked Contacts', `You have unlocked direct contact info for ${user.contactsUnlocked ? user.contactsUnlocked.length : 0} owner(s).`)}
          >
            <View style={styles.metricIconBox}>
              <Ionicons name="call-outline" size={18} color="#0754C0" />
            </View>
            <Text style={styles.metricValue}>{user.contactsUnlocked?.length || 0}</Text>
            <Text style={styles.metricLabel}>Unlocked</Text>
          </TouchableOpacity>
        </View>

        {/* ── 3. Pro Membership Banner ── */}
        {!isPro ? (
          <TouchableOpacity
            style={styles.proBanner}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('SubscriptionPlans')}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <View style={styles.proBadgeRow}>
                <Ionicons name="sparkles" size={14} color="#0F172A" />
                <Text style={styles.proBannerTag}>FLATEMATE PRO</Text>
              </View>
              <Text style={styles.proBannerTitle}>Unlock Direct Owner Contacts</Text>
              <Text style={styles.proBannerSub}>
                Zero brokerage, early bird listings, and verified tenant badge.
              </Text>
            </View>
            <View style={styles.proBannerCta}>
              <Text style={styles.proBannerCtaText}>View Plans</Text>
              <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.activeProCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('SubscriptionPlans')}
          >
            <View style={styles.activeProIcon}>
              <Ionicons name="star" size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.activeProTitle}>FlateMate Pro Active</Text>
              <Text style={styles.activeProSub}>Unlimited direct contacts & priority visits</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </TouchableOpacity>
        )}

        {/* ── 4. Host & Landlord Hub ── */}
        <View style={styles.landlordHub}>
          <View style={styles.landlordHubHeader}>
            <View>
              <Text style={styles.landlordHubTitle}>Host & Landlord Hub</Text>
              <Text style={styles.landlordHubSub}>List your property in Ahmedabad with 0% brokerage</Text>
            </View>
          </View>

          <View style={styles.landlordActionRow}>
            <TouchableOpacity
              style={styles.landlordBtnPrimary}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AddListing')}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.landlordBtnPrimaryText}>Post Listing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.landlordBtnSecondary}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('OwnerDashboard')}
            >
              <Ionicons name="business-outline" size={16} color="#0F172A" />
              <Text style={styles.landlordBtnSecondaryText}>
                My Listings ({myListings.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 5. Scheduled Property Visits ── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setIsVisitsExpanded(!isVisitsExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionTitle}>Scheduled Property Visits</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{user.visits?.length || 0}</Text>
              </View>
            </View>
            <Ionicons name={isVisitsExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#64748B" />
          </TouchableOpacity>

          {isVisitsExpanded && (
            user.visits && user.visits.length > 0 ? (
              <View style={{ gap: 10 }}>
                {user.visits.map((visit) => {
                  const visitImageSource =
                    typeof visit.propertyImage === 'number'
                      ? visit.propertyImage
                      : { uri: visit.propertyImage };
                  const isConfirmed = visit.status && visit.status.toLowerCase() === 'confirmed';

                  return (
                    <View key={visit.id} style={styles.visitCard}>
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <Image source={visitImageSource} style={styles.visitThumbnail} />
                        <View style={{ flex: 1, gap: 4 }}>
                          <Text style={styles.visitPropertyTitle} numberOfLines={1}>
                            {visit.propertyTitle}
                          </Text>
                          <View style={styles.visitSlotRow}>
                            <Ionicons name="calendar-outline" size={13} color="#64748B" />
                            <Text style={styles.visitSlotText}>
                              {visit.date} · {visit.timeSlot}
                            </Text>
                          </View>
                          <View style={[styles.visitStatusPill, isConfirmed ? styles.statusConfirmed : styles.statusPending]}>
                            <Text style={[styles.visitStatusText, { color: isConfirmed ? '#15803D' : '#B45309' }]}>
                              {visit.status || 'Pending'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {visit.notes ? (
                        <Text style={styles.visitNoteText} numberOfLines={1}>
                          Note: {visit.notes}
                        </Text>
                      ) : null}

                      <View style={styles.visitActionRow}>
                        <TouchableOpacity
                          style={styles.visitCallBtn}
                          activeOpacity={0.8}
                          onPress={() => Linking.openURL(`tel:${visit.landlordPhone}`)}
                        >
                          <Ionicons name="call-outline" size={14} color="#0F172A" />
                          <Text style={styles.visitCallBtnText}>Call Host</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.visitMapBtn}
                          activeOpacity={0.85}
                          onPress={() =>
                            Linking.openURL(
                              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                visit.propertyTitle + ' Ahmedabad'
                              )}`
                            )
                          }
                        >
                          <Ionicons name="navigate-outline" size={14} color="#FFFFFF" />
                          <Text style={styles.visitMapBtnText}>Get Directions</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-clear-outline" size={32} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Visits Booked Yet</Text>
                <Text style={styles.emptySub}>
                  Browse verified listings in Ahmedabad and schedule an in-person visit with 1 tap.
                </Text>
              </View>
            )
          )}
        </View>

        {/* ── 6. My Listed Properties ── */}
        {myListings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionTitle}>My Listed Properties</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{myListings.length}</Text>
              </View>
            </View>

            <View style={{ gap: 14 }}>
              {myListings.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.92}
                  onPress={() => navigation.navigate('DetailPage', { propertyId: item.id })}
                >
                  <Card item={item} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── 7. Grouped Settings & Services ── */}
        
        {/* Group A: Rental & Verification */}
        <View style={styles.settingsGroup}>
          <Text style={styles.settingsGroupHeader}>RENTAL & VERIFICATION</Text>

          <TouchableOpacity
            style={styles.settingsRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('DocumentVerification')}
          >
            <View style={styles.settingsRowLeft}>
              <View style={styles.settingsIconCircle}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#0F172A" />
              </View>
              <View>
                <Text style={styles.settingsLabel}>Identity Verification</Text>
                <Text style={styles.settingsSubtext}>Aadhaar & Government ID check</Text>
              </View>
            </View>
            <View style={styles.settingsRowRight}>
              <View
                style={[
                  styles.statusTag,
                  user.isIdentityVerified
                    ? styles.statusTagSuccess
                    : user.identityVerificationStatus === 'pending'
                    ? styles.statusTagPending
                    : styles.statusTagNeutral,
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    {
                      color: user.isIdentityVerified
                        ? '#15803D'
                        : user.identityVerificationStatus === 'pending'
                        ? '#B45309'
                        : '#0F172A',
                    },
                  ]}
                >
                  {user.isIdentityVerified ? 'Verified' : user.identityVerificationStatus === 'pending' ? 'Pending' : 'Verify'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingsRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('RentAgreementCabinet')}
          >
            <View style={styles.settingsRowLeft}>
              <View style={styles.settingsIconCircle}>
                <Ionicons name="document-text-outline" size={18} color="#0F172A" />
              </View>
              <View>
                <Text style={styles.settingsLabel}>Gujarat Digital Lease Agreements</Text>
                <Text style={styles.settingsSubtext}>Online legal drafting & e-stamping</Text>
              </View>
            </View>
            <View style={styles.settingsRowRight}>
              <Text style={styles.settingsRightNote}>
                {user.rentAgreements && user.rentAgreements.length > 0 ? `${user.rentAgreements.length} active` : 'Draft'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingsRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ChatInbox')}
          >
            <View style={styles.settingsRowLeft}>
              <View style={styles.settingsIconCircle}>
                <Ionicons name="chatbubbles-outline" size={18} color="#0F172A" />
              </View>
              <View>
                <Text style={styles.settingsLabel}>Messages & Inquiries</Text>
                <Text style={styles.settingsSubtext}>Direct tenant and host chats</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Group B: Credits & Subscription */}
        <View style={styles.settingsGroup}>
          <Text style={styles.settingsGroupHeader}>CREDITS & MEMBERSHIP</Text>

          <TouchableOpacity
            style={styles.settingsRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SubscriptionPlans')}
          >
            <View style={styles.settingsRowLeft}>
              <View style={styles.settingsIconCircle}>
                <Ionicons name="card-outline" size={18} color="#0F172A" />
              </View>
              <View>
                <Text style={styles.settingsLabel}>Subscription Tier</Text>
                <Text style={styles.settingsSubtext}>Manage membership pass</Text>
              </View>
            </View>
            <View style={styles.settingsRowRight}>
              <Text style={styles.settingsRightHighlight}>
                {isPro ? 'Pro Active' : isEarlyBird ? 'Early Access' : 'Free Tier'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingsRow}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Contact Balance', `You have ${user.creditBalance || 0} contact unlock credits remaining.`)}
          >
            <View style={styles.settingsRowLeft}>
              <View style={styles.settingsIconCircle}>
                <Ionicons name="key-outline" size={18} color="#0F172A" />
              </View>
              <View>
                <Text style={styles.settingsLabel}>Direct Contact Credits</Text>
                <Text style={styles.settingsSubtext}>Owner phone & WhatsApp unlocks</Text>
              </View>
            </View>
            <View style={styles.settingsRowRight}>
              <Text style={styles.settingsRightNote}>{user.creditBalance || 0} credits</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Group C: Support & Account */}
        <View style={styles.settingsGroup}>
          <Text style={styles.settingsGroupHeader}>HELP & PREFERENCES</Text>

          <TouchableOpacity
            style={styles.settingsRow}
            activeOpacity={0.7}
            onPress={handleSupportWhatsApp}
          >
            <View style={styles.settingsRowLeft}>
              <View style={styles.settingsIconCircle}>
                <Ionicons name="logo-whatsapp" size={18} color="#15803D" />
              </View>
              <View>
                <Text style={styles.settingsLabel}>WhatsApp Concierge Support</Text>
                <Text style={styles.settingsSubtext}>Direct resolution within 15 mins</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingsRow}
            activeOpacity={0.7}
            onPress={handleLogoutConfirm}
          >
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingsIconCircle, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              </View>
              <View>
                <Text style={[styles.settingsLabel, { color: '#EF4444' }]}>Log Out</Text>
                <Text style={styles.settingsSubtext}>Sign out of this device</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Footer Branding */}
        <View style={styles.footerBranding}>
          <Text style={styles.footerVersion}>FlateMate v2.4 · Ahmedabad's 0% Brokerage Network</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cityText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#64748B',
  },
  topBarIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: 16,
    gap: 16,
  },

  /* Hero Profile Card */
  heroProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...Shadows.subtle,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 22,
  },
  avatarVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#15803D',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileDetails: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  profileName: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  proPill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proPillText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  earlyPill: {
    backgroundColor: '#D97706',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  earlyPillText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  profileContact: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#64748B',
  },
  verificationPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
  },
  verifiedPillBg: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  pendingPillBg: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  unverifiedPillBg: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  verificationPillText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
  },

  /* 3-Metric Interactive Bar */
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 4,
    ...Shadows.subtle,
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: '#64748B',
  },

  /* Pro Banner */
  proBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    ...Shadows.subtle,
  },
  proBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  proBannerTag: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    letterSpacing: 0.8,
  },
  proBannerTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  proBannerSub: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: '#64748B',
    lineHeight: 15,
  },
  proBannerCta: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  proBannerCtaText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  activeProCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadows.subtle,
  },
  activeProIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeProTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  activeProSub: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: '#64748B',
  },

  /* Host / Landlord Hub */
  landlordHub: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    ...Shadows.subtle,
  },
  landlordHubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  landlordHubTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  landlordHubSub: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },
  landlordActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  landlordBtnPrimary: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  landlordBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
  landlordBtnSecondary: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  landlordBtnSecondaryText: {
    color: '#0F172A',
    fontSize: 12,
    fontFamily: Fonts.medium,
  },

  /* Section */
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },

  /* Visit Card */
  visitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    ...Shadows.subtle,
  },
  visitThumbnail: {
    width: 62,
    height: 62,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  visitPropertyTitle: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  visitSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visitSlotText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: '#64748B',
  },
  visitStatusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  statusConfirmed: {
    backgroundColor: '#ECFDF5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  visitStatusText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  visitNoteText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: '#64748B',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  visitActionRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  visitCallBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  visitCallBtnText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  visitMapBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  visitMapBtnText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },

  /* Empty Visit State */
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    marginTop: 4,
  },
  emptySub: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },

  /* Grouped Settings */
  settingsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Shadows.subtle,
  },
  settingsGroupHeader: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#64748B',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  settingsRow: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsLabel: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#0F172A',
  },
  settingsSubtext: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: '#64748B',
    marginTop: 1,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingsRightNote: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#64748B',
  },
  settingsRightHighlight: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  statusTagSuccess: {
    backgroundColor: '#ECFDF5',
  },
  statusTagPending: {
    backgroundColor: '#FEF3C7',
  },
  statusTagNeutral: {
    backgroundColor: '#F1F5F9',
  },
  statusTagText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 64,
  },

  /* Footer */
  footerBranding: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerVersion: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#64748B',
  },

  /* Logged Out Screen */
  loggedOutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  loggedOutHeroCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.subtle,
  },
  loggedOutTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  loggedOutSub: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  valuePropsContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    marginVertical: 8,
  },
  valuePropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  valuePropIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  valuePropText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#0F172A',
    flex: 1,
  },
  loggedOutButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    ...Shadows.subtle,
  },
  loggedOutButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
});
