import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../Theme/Fonts';
import { useAuth } from '../Context/AuthContext';

type PlanKey = 'free' | 'early_bird' | 'pro';

interface PlanDetail {
  id: PlanKey;
  label: string;
  badge?: string;
  weeklyPrice: string;
  monthlyPrice: string;
  weeklyNum: number;
  monthlyNum: number;
  description: string;
  features: string[];
}

const PLANS: PlanDetail[] = [
  {
    id: 'free',
    label: 'Basic',
    weeklyPrice: 'Free',
    monthlyPrice: 'Free',
    weeklyNum: 0,
    monthlyNum: 0,
    description: 'Browse all listings and pay per contact unlock.',
    features: [
      'Browse all Ahmedabad listings',
      'Save favorites & view photos',
      'Pay ₹99 per contact unlock',
    ],
  },
  {
    id: 'early_bird',
    label: 'Starter Pass',
    badge: 'FLEXIBLE',
    weeklyPrice: '₹49',
    monthlyPrice: '₹149',
    weeklyNum: 49,
    monthlyNum: 149,
    description: 'See new listings early and test the platform.',
    features: [
      'See new listings 6 hrs early',
      '1 free contact unlock / week',
      'Priority visit scheduling',
      'Pay ₹79 for extra unlocks',
    ],
  },
  {
    id: 'pro',
    label: 'FlateMate Pro',
    badge: 'BEST VALUE',
    weeklyPrice: '₹299',
    monthlyPrice: '₹899',
    weeklyNum: 299,
    monthlyNum: 899,
    description: 'Unlimited direct owner contacts with zero brokerage.',
    features: [
      'Unlimited owner phone & WhatsApp unlocks',
      'See all new listings 6 hrs early',
      'Verified Tenant priority badge',
      'Digital Gujarat Rental Agreement generator',
      '7-day 100% money-back guarantee',
    ],
  },
];

export default function SubscriptionPlans({ navigation }: any) {
  const { user, subscribeToPlan } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('pro');
  const [billingCycle, setBillingCycle] = useState<'weekly' | 'monthly'>('monthly');
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const currentPlan = user?.subscriptionPlan || 'free';

  const handleSelectPlan = (key: PlanKey) => {
    setSelectedPlan(key);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.98, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 18 }),
    ]).start();
  };

  const handleSubscribe = () => {
    if (selectedPlan === 'free') {
      Alert.alert('Basic Plan Active', 'You are already on the free Basic plan.');
      return;
    }
    setIsConfirmVisible(true);
  };

  const handleConfirmPurchase = async () => {
    if (selectedPlan === 'free') return;
    setIsLoading(true);
    try {
      await subscribeToPlan(selectedPlan as 'early_bird' | 'pro');
      setIsLoading(false);
      setIsConfirmVisible(false);
      const chosen = PLANS.find((p) => p.id === selectedPlan);
      Alert.alert(
        '🎉 Membership Activated!',
        `You are now on ${chosen?.label}. Start connecting directly with property owners!`,
        [{ text: 'Start Browsing', onPress: () => navigation.goBack() }]
      );
    } catch {
      setIsLoading(false);
      Alert.alert('Payment Failed', 'Please try again.');
    }
  };

  const activePlanObj = PLANS.find((p) => p.id === selectedPlan) || PLANS[2];
  const activePriceStr = billingCycle === 'weekly' ? activePlanObj.weeklyPrice : activePlanObj.monthlyPrice;
  const cyclePeriodStr = billingCycle === 'weekly' ? '/week' : '/month';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>FlateMate Pass</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* ── 1. Clean Hero Value Proposition ── */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Unlock Direct Owner Contacts</Text>
          <Text style={styles.heroSub}>
            Zero brokerage, no middle-men. Talk directly to verified landlords across Ahmedabad.
          </Text>

          {/* 3 Core Value Bullet Points */}
          <View style={styles.valueList}>
            <View style={styles.valueItem}>
              <View style={styles.valueIconBox}>
                <Ionicons name="call-outline" size={16} color="#0754C0" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.valueTitle}>Direct Phone & WhatsApp</Text>
                <Text style={styles.valueDesc}>Call owners directly and book visits without paying broker fees.</Text>
              </View>
            </View>

            <View style={styles.valueItem}>
              <View style={styles.valueIconBox}>
                <Ionicons name="flash-outline" size={16} color="#0754C0" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.valueTitle}>6-Hour Early Access</Text>
                <Text style={styles.valueDesc}>See fresh listings 6 hours before they are visible to regular users.</Text>
              </View>
            </View>

            <View style={styles.valueItem}>
              <View style={styles.valueIconBox}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#0754C0" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.valueTitle}>Verified Tenant Badge</Text>
                <Text style={styles.valueDesc}>Landlords prioritize verified profiles with faster responses.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── 2. Segmented Billing Switcher (Weekly vs Monthly) ── */}
        <View style={styles.switcherWrapper}>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segmentBtn, billingCycle === 'weekly' && styles.segmentBtnActive]}
              onPress={() => setBillingCycle('weekly')}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentText, billingCycle === 'weekly' && styles.segmentTextActive]}>
                Weekly
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, billingCycle === 'monthly' && styles.segmentBtnActive]}
              onPress={() => setBillingCycle('monthly')}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentText, billingCycle === 'monthly' && styles.segmentTextActive]}>
                Monthly
              </Text>
              <View style={styles.saveTag}>
                <Text style={styles.saveTagText}>SAVE 65%</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 3. Plan Cards (Minimalist & High Contrast) ── */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }], gap: 12 }}>
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const isPro = plan.id === 'pro';
            const price = billingCycle === 'weekly' ? plan.weeklyPrice : plan.monthlyPrice;
            const period = plan.id === 'free' ? 'forever' : billingCycle === 'weekly' ? '/wk' : '/mo';

            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  isSelected && styles.planCardSelected,
                  isPro && styles.planCardPro,
                  isSelected && isPro && styles.planCardProSelected,
                ]}
                onPress={() => handleSelectPlan(plan.id)}
                activeOpacity={0.9}
              >
                {/* Header Row */}
                <View style={styles.planHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.planTitleRow}>
                      <Text style={styles.planTitle}>{plan.label}</Text>
                      {plan.badge ? (
                        <View style={[styles.badgePill, isPro && styles.badgePillPro]}>
                          <Text style={[styles.badgePillText, isPro && styles.badgePillTextPro]}>
                            {plan.badge}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.planDesc}>{plan.description}</Text>
                  </View>

                  {/* Price */}
                  <View style={styles.priceColumn}>
                    <Text style={styles.priceText}>{price}</Text>
                    <Text style={styles.pricePeriodText}>{period}</Text>
                  </View>
                </View>

                {/* Features list */}
                <View style={styles.featuresList}>
                  {plan.features.map((feat, i) => (
                    <View key={i} style={styles.featureItem}>
                      <Ionicons
                        name="checkmark"
                        size={15}
                        color={isPro ? '#15803D' : '#0754C0'}
                        style={{ marginTop: 1 }}
                      />
                      <Text style={styles.featureLabel}>{feat}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* ── 4. Guarantee & Safety Note ── */}
        <View style={styles.guaranteeBox}>
          <Ionicons name="shield-checkmark" size={18} color="#15803D" />
          <Text style={styles.guaranteeText}>
            <Text style={{ fontFamily: Fonts.bold }}>7-Day Money Back Guarantee</Text> · If you don&apos;t connect with landlords, get an instant full refund.
          </Text>
        </View>

        {/* ── 5. Main Action CTA ── */}
        <View style={styles.ctaWrapper}>
          <TouchableOpacity
            style={[styles.ctaButton, selectedPlan === 'free' && styles.ctaButtonSecondary]}
            onPress={handleSubscribe}
            activeOpacity={0.85}
          >
            <Text style={[styles.ctaButtonText, selectedPlan === 'free' && styles.ctaButtonTextSecondary]}>
              {selectedPlan === 'free'
                ? 'Continue with Basic'
                : `Unlock ${activePlanObj.label} — ${activePriceStr}${cyclePeriodStr}`}
            </Text>
          </TouchableOpacity>
          <Text style={styles.ctaSubtext}>
            100% secure · Cancel anytime from account settings
          </Text>
        </View>

      </ScrollView>

      {/* ── Confirmation Modal ── */}
      <Modal
        visible={isConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsConfirmVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Upgrade</Text>
              <TouchableOpacity onPress={() => setIsConfirmVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalPlanName}>{activePlanObj.label}</Text>
              <Text style={styles.modalPrice}>
                {activePriceStr} {cyclePeriodStr}
              </Text>

              <View style={styles.modalHighlights}>
                {activePlanObj.features.slice(0, 3).map((f, i) => (
                  <View key={i} style={styles.modalHighlightRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.modalHighlightText}>{f}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.modalPayBtn}
                onPress={handleConfirmPurchase}
                activeOpacity={0.85}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalPayBtnText}>Pay {activePriceStr} & Activate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topBarTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },

  // Hero Section
  heroSection: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  valueList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  valueIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  valueTitle: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  valueDesc: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#64748B',
    marginTop: 1,
  },

  // Segmented Switcher
  switcherWrapper: {
    alignItems: 'center',
    marginBottom: 18,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    width: '100%',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    flexDirection: 'row',
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#64748B',
  },
  segmentTextActive: {
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  saveTag: {
    backgroundColor: '#15803D',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  saveTagText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Plan Cards
  planCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  planCardSelected: {
    borderColor: '#0F172A',
    borderWidth: 2,
  },
  planCardPro: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  planCardProSelected: {
    borderColor: '#0F172A',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  badgePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgePillPro: {
    backgroundColor: '#0F172A',
  },
  badgePillText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: '#475569',
  },
  badgePillTextPro: {
    color: '#FFFFFF',
  },
  planDesc: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#64748B',
    maxWidth: '90%',
  },
  priceColumn: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  pricePeriodText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: '#64748B',
  },

  featuresList: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#334155',
    flex: 1,
  },

  // Guarantee Box
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
    marginVertical: 18,
  },
  guaranteeText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#15803D',
    flex: 1,
    lineHeight: 16,
  },

  // CTA
  ctaWrapper: {
    gap: 8,
  },
  ctaButton: {
    backgroundColor: '#0F172A',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaButtonSecondary: {
    backgroundColor: '#F1F5F9',
  },
  ctaButtonText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  ctaButtonTextSecondary: {
    color: '#0F172A',
  },
  ctaSubtext: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: '#64748B',
    textAlign: 'center',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  modalBody: {
    alignItems: 'center',
  },
  modalPlanName: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    marginBottom: 2,
  },
  modalPrice: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    marginBottom: 16,
  },
  modalHighlights: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 20,
  },
  modalHighlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHighlightText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#334155',
  },
  modalPayBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPayBtnText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
});
