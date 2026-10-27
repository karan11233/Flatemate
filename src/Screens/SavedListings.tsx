import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import React, { useRef, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../Theme/colors';
import { Fonts } from '../Theme/Fonts';
import { useAuth } from '../Context/AuthContext';
import { dummyListings, Listing } from '../utils/dummyData';
import Card from '../Components/Card';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../utils/firebase';

export default function SavedListings({ navigation }: any) {
  const { user, isLoggedIn } = useAuth();
  const [allListings, setAllListings] = useState<Listing[]>(dummyListings);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const loadCachedListings = async () => {
      try {
        const cached = await AsyncStorage.getItem('@flatemate_listings');
        if (cached) setAllListings(JSON.parse(cached));
        else setAllListings(dummyListings);
      } catch {
        setAllListings(dummyListings);
      }
    };

    if (isFirebaseConfigured && db) {
      loadCachedListings();
      const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const live: Listing[] = [];
        snapshot.forEach((doc) => live.push({ id: doc.id, ...doc.data() } as any));
        const merged = live.length === 0 ? dummyListings : [
          ...live,
          ...dummyListings.filter(d => !live.some(l => l.title === d.title && l.rent === d.rent)),
        ];
        setAllListings(merged);
      });
      return () => unsubscribe();
    } else {
      loadCachedListings();
    }
  }, []);

  const savedListings = allListings.filter(l => user?.savedListings?.includes(l.id));

  if (!isLoggedIn || !user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved Listings</Text>
        </View>
        <View style={styles.emptyCenter}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="heart" size={40} color="#EF4444" />
          </View>
          <Text style={styles.emptyTitle}>Save your favourites</Text>
          <Text style={styles.emptySubtitle}>
            Log in to save properties and access them anytime from any device.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Login / Sign Up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Properties</Text>
        <View style={styles.countBadge}>
          <Text style={styles.headerCount}>
            {savedListings.length} saved
          </Text>
        </View>
      </View>

      {savedListings.length === 0 ? (
        <Animated.View style={[styles.emptyCenter, { opacity: fadeAnim }]}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="heart-outline" size={44} color="#EF4444" />
          </View>
          <Text style={styles.emptyTitle}>No saved properties yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the ❤️ icon on any listing card to keep track of your favourite flats.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="search" size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.loginButtonText}>Browse Listings</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 18, gap: 14 }}
        >
          {/* Collection Banner */}
          <Animated.View style={[styles.collectionBanner, { opacity: fadeAnim }]}>
            <View style={styles.bannerIconBox}>
              <Ionicons name="heart" size={15} color={Colors.Red} />
            </View>
            <Text style={styles.collectionBannerText}>
              Your Wishlist · {savedListings.length} saved home{savedListings.length > 1 ? 's' : ''}
            </Text>
          </Animated.View>

          {savedListings.map((item) => (
            <Animated.View
              key={item.id}
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
              }}
            >
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => navigation.navigate('DetailPage', { propertyId: item.id })}
              >
                <Card item={item} />
              </TouchableOpacity>
            </Animated.View>
          ))}

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  headerCount: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#0754C0',
  },
  emptyCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    ...Shadows.subtle,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  loginButton: {
    height: 48,
    paddingHorizontal: 32,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  loginButtonText: {
    color: Colors.White,
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  collectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.White,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.Gray800,
    ...Shadows.subtle,
  },
  bannerIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.DangerLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionBannerText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.Gray100,
  },
});
