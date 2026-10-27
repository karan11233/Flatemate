import { StyleSheet, Text, View, Image, TouchableOpacity, Alert } from 'react-native';
import React from 'react';
import { Colors } from '../Theme/colors';
import { Fonts } from '../Theme/Fonts';
import { Listing, calculateCompatibility } from '../utils/dummyData';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../Context/AuthContext';

interface CardProps {
  item: Listing;
  onPress?: () => void;
  navigation?: any;
}

export default function Card({ item, onPress, navigation }: CardProps) {
  const { user, isLoggedIn, toggleSaveListing } = useAuth();
  const isSaved = user?.savedListings?.includes(item.id) || false;

  const imageSource = typeof item.photos[0] === 'number' ? item.photos[0] : { uri: item.photos[0] };

  const isRoommate = item.listingType === 'roommate';
  const compat = isRoommate && item.roommates && item.roommates.length > 0
    ? calculateCompatibility(user?.habits, item.roommates)
    : null;

  const scoreColor = compat
    ? compat.score >= 85 ? '#15803D' : compat.score >= 70 ? '#B45309' : '#DC2626'
    : '#0F172A';
  const scoreBg = compat
    ? compat.score >= 85 ? '#ECFDF5' : compat.score >= 70 ? '#FEF3C7' : '#FEF2F2'
    : '#F1F5F9';

  return (
    <View style={styles.cardContainer}>
      {/* ── 1. Clean Photo (Zero dark shadow/scrim) ── */}
      <View style={styles.mediaContainer}>
        <Image style={styles.mediaImage} source={imageSource} resizeMode="cover" />

        {/* Floating Host Initials Avatar (Airbnb style) */}
        <View style={styles.hostAvatar}>
          <Text style={styles.hostAvatarText}>{item.landlordInitials || 'H'}</Text>
          {item.isActive && <View style={styles.activeDot} />}
        </View>

        {/* Floating Heart / Bookmark Button */}
        <TouchableOpacity
          style={styles.heartButton}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => {
            if (isLoggedIn) {
              toggleSaveListing(item.id);
            } else {
              Alert.alert('Login Required', 'Please log in to save listings.');
            }
          }}
        >
          <Ionicons
            name={isSaved ? 'heart' : 'heart-outline'}
            size={18}
            color={isSaved ? '#EF4444' : '#0F172A'}
          />
        </TouchableOpacity>

        {/* Floating Listing Type Tag */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>
            {isRoommate ? 'Roommate' : `${item.bhk} BHK Flat`}
          </Text>
        </View>

        {/* Compatibility Score Badge — only for roommate listings */}
        {compat && (
          <View style={[styles.compatBadge, { backgroundColor: scoreBg }]}>
            <Ionicons name="people" size={11} color={scoreColor} />
            <Text style={[styles.compatBadgeText, { color: scoreColor }]}>
              {compat.score}% match
            </Text>
          </View>
        )}
      </View>

      {/* ── 2. Content Container ── */}
      <View style={styles.contentContainer}>
        
        {/* Row 1: Price + Furnishing */}
        <View style={styles.primaryRow}>
          <View style={styles.priceGroup}>
            <Text style={styles.priceAmount}>₹{item.rent.toLocaleString('en-IN')}</Text>
            <Text style={styles.pricePeriod}>/month</Text>
          </View>

          <View style={styles.furnishPill}>
            <Text style={styles.furnishPillText}>
              {item.furnished ? 'Furnished' : 'Unfurnished'}
            </Text>
          </View>
        </View>

        {/* Row 2: Property Title */}
        <Text style={styles.titleText} numberOfLines={1}>
          {item.title}
        </Text>

        {/* Row 3: Locality & Distance */}
        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={13} color="#64748B" />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.area}, Ahmedabad
          </Text>
          {item.distanceText ? (
            <>
              <Text style={styles.dotDivider}>·</Text>
              <Text style={styles.distanceText} numberOfLines={1}>
                {item.distanceText}
              </Text>
            </>
          ) : null}
        </View>

        {/* Row 4: Roommate Avatars strip (only for roommate listings) */}
        {isRoommate && item.roommates && item.roommates.length > 0 && (
          <View style={styles.roommateStrip}>
            <View style={styles.roommateAvatarRow}>
              {item.roommates.slice(0, 3).map((rm, i) => (
                <View
                  key={i}
                  style={[
                    styles.rmMiniAvatar,
                    { backgroundColor: rm.avatarColor || '#0F172A', marginLeft: i === 0 ? 0 : -8 },
                  ]}
                >
                  <Text style={styles.rmMiniAvatarText}>{rm.initials}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.roommateStripText}>
              {item.roommates.map(r => r.name.split(' ')[0]).join(' & ')} live{item.roommates.length > 1 ? '' : 's'} here
              {item.totalCapacity && item.currentFlatmates !== undefined
                ? ` · ${item.totalCapacity - item.currentFlatmates} spot${item.totalCapacity - item.currentFlatmates > 1 ? 's' : ''} left`
                : ''}
            </Text>
          </View>
        )}

        {/* Row 5: Clean Specs (Deposit, Zero Brokerage, Preference) */}
        <View style={styles.specRow}>
          <View style={styles.specPill}>
            <Text style={styles.specPillText}>0% Brokerage</Text>
          </View>
          {item.deposit ? (
            <View style={styles.specPill}>
              <Text style={styles.specPillText}>
                {Math.round(item.deposit / item.rent)}m deposit
              </Text>
            </View>
          ) : null}
          {item.genderPreference && item.genderPreference !== 'Any' ? (
            <View style={styles.specPill}>
              <Text style={styles.specPillText}>{item.genderPreference}</Text>
            </View>
          ) : null}
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Media Section (Photo without any top scrim shadow)
  mediaContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
    backgroundColor: '#F1F5F9',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },

  // Floating Host Avatar (Clean circular badge)
  hostAvatar: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hostAvatarText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  activeDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#15803D',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // Floating Heart Button
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Floating Type Pill (Clean white badge on bottom left of image)
  typeBadge: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  typeBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },

  // Content
  contentContainer: {
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  primaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  priceGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  priceAmount: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  pricePeriod: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#64748B',
  },
  furnishPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  furnishPillText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#334155',
  },

  titleText: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.2,
    marginBottom: 4,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#475569',
    maxWidth: '55%',
  },
  dotDivider: {
    color: '#64748B',
    fontSize: 12,
  },
  distanceText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#64748B',
    flex: 1,
  },

  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  specPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  specPillText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#334155',
  },

  // Compatibility Score Badge (floating on image)
  compatBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  compatBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
  },

  // Roommate avatars strip
  roommateStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 2,
  },
  roommateAvatarRow: {
    flexDirection: 'row',
  },
  rmMiniAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  rmMiniAvatarText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  roommateStripText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#475569',
    flex: 1,
  },
});

