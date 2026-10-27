import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Image,
  Animated,
  Dimensions,
  Linking,
  Clipboard,
  Alert,
} from 'react-native';
import { Shadows } from '../Theme/colors';
import { Fonts } from '../Theme/Fonts';
import { Listing } from '../utils/dummyData';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../Context/AuthContext';

const { height } = Dimensions.get('window');

interface PaymentBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  property: Listing;
  onSuccess: (landlordPhone: string) => void;
}

export default function PaymentBottomSheet({
  isVisible,
  onClose,
  property,
  onSuccess,
}: PaymentBottomSheetProps) {
  const { user, purchasePackage, useCreditToUnlock } = useAuth();
  const [selectedPack, setSelectedPack] = useState<1 | 3 | 5>(1);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'credit_usage' | 'success'>('selection');

  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Handle slide up/down animation
  useEffect(() => {
    if (isVisible) {
      if (user && user.creditBalance > 0) {
        setPaymentStep('credit_usage');
      } else {
        setPaymentStep('selection');
      }
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.6,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const handlePay = () => {
    // Simulate successful payment delay
    setTimeout(async () => {
      try {
        await purchasePackage(property.landlordPhone, selectedPack);
        setPaymentStep('success');
        onSuccess(property.landlordPhone);
      } catch (error) {
        console.error("Failed to complete package purchase:", error);
      }
    }, 900);
  };

  const handleConfirmUseCredit = async () => {
    if (user && user.creditBalance > 0) {
      try {
        await useCreditToUnlock(property.landlordPhone);
        setPaymentStep('success');
        onSuccess(property.landlordPhone);
      } catch (error) {
        console.error("Failed to unlock with credit:", error);
      }
    }
  };

  const handleCall = () => {
    Linking.openURL(`tel:${property.landlordPhone}`);
  };

  const handleCopy = () => {
    Clipboard.setString(property.landlordPhone);
    Alert.alert('Copied!', 'Phone number copied to clipboard.');
  };

  const getPrice = () => {
    if (selectedPack === 1) return 99;
    if (selectedPack === 3) return 249;
    return 349;
  };

  const imageSource = typeof property.photos[0] === 'number' ? property.photos[0] : { uri: property.photos[0] };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Dim Background */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />

        {/* Slide-up Container */}
        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {paymentStep === 'credit_usage' ? (
            /* STEP 1.5: Confirm credit use */
            <View style={styles.sheetContent}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>Unlock with Credits</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#475569" />
                </TouchableOpacity>
              </View>

              {/* Property Summary Row */}
              <View style={styles.summaryRow}>
                <Image source={imageSource} style={styles.summaryThumb} />
                <View style={styles.summaryText}>
                  <Text style={styles.summaryTitle} numberOfLines={1}>
                    {property.title}
                  </Text>
                  <Text style={styles.summarySub}>
                    {property.area}, {property.city}
                  </Text>
                </View>
              </View>

              {/* Credit Status Card */}
              <View style={styles.creditStatusCard}>
                <View style={styles.creditIconCircle}>
                  <Ionicons name="key" size={24} color="#0754C0" />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.creditStatusTitle}>
                    {user?.creditBalance} Unlocks Available
                  </Text>
                  <Text style={styles.creditStatusSub}>
                    Using 1 credit will leave you with {user ? user.creditBalance - 1 : 0} unlock{user?.creditBalance === 2 ? '' : 's'}.
                  </Text>
                </View>
              </View>

              {/* Buttons */}
              <TouchableOpacity
                style={styles.payButton}
                activeOpacity={0.85}
                onPress={handleConfirmUseCredit}
              >
                <Text style={styles.payButtonText}>Unlock using 1 credit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.8}
                onPress={() => setPaymentStep('selection')}
              >
                <Text style={styles.secondaryButtonText}>Purchase a new pack instead</Text>
              </TouchableOpacity>
            </View>
          ) : paymentStep === 'selection' ? (
            /* STEP 1: Select contact pack */
            <View style={styles.sheetContent}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>Connect with Host</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#475569" />
                </TouchableOpacity>
              </View>

              {/* Property Summary Row */}
              <View style={styles.summaryRow}>
                <Image source={imageSource} style={styles.summaryThumb} />
                <View style={styles.summaryText}>
                  <Text style={styles.summaryTitle} numberOfLines={1}>
                    {property.title}
                  </Text>
                  <Text style={styles.summarySub}>
                    {property.area}, {property.city}
                  </Text>
                </View>
              </View>

              {/* Trust Badges Row */}
              <View style={styles.trustBadgesRow}>
                <View style={styles.trustBadgeItem}>
                  <Ionicons name="shield-checkmark" size={13} color="#15803D" />
                  <Text style={styles.trustBadgeTextSuccess}>Your number is NEVER shared</Text>
                </View>
                <View style={styles.trustBadgeItemPrimary}>
                  <Ionicons name="infinite" size={13} color="#0754C0" />
                  <Text style={styles.trustBadgeTextPrimary}>Credits never expire</Text>
                </View>
              </View>

              {/* Pack Selection Cards */}
              <View style={styles.packsContainer}>
                {/* Pack 1: 1 Contact */}
                <TouchableOpacity
                  style={[styles.packCard, selectedPack === 1 && styles.selectedPackCard]}
                  onPress={() => setSelectedPack(1)}
                  activeOpacity={0.8}
                >
                  <View style={styles.packInfo}>
                    <Text style={styles.packTitle}>1 Contact</Text>
                    <Text style={styles.packSub}>Direct landlord phone number</Text>
                  </View>
                  <Text style={styles.packPrice}>₹99</Text>
                </TouchableOpacity>

                {/* Pack 2: 3 Contacts */}
                <TouchableOpacity
                  style={[styles.packCard, selectedPack === 3 && styles.selectedPackCard]}
                  onPress={() => setSelectedPack(3)}
                  activeOpacity={0.8}
                >
                  <View style={styles.packInfo}>
                    <Text style={styles.packTitle}>3 Contacts</Text>
                    <Text style={styles.packSub}>Save ₹48 vs single packs</Text>
                  </View>
                  <Text style={styles.packPrice}>₹249</Text>
                </TouchableOpacity>

                {/* Pack 3: 5 Contacts */}
                <TouchableOpacity
                  style={[styles.packCard, selectedPack === 5 && styles.selectedPackCard]}
                  onPress={() => setSelectedPack(5)}
                  activeOpacity={0.8}
                >
                  <View style={styles.packInfo}>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <Text style={styles.packTitle}>5 Contacts</Text>
                      <View style={styles.bestValueBadge}>
                        <Text style={styles.bestValueText}>BEST VALUE</Text>
                      </View>
                    </View>
                    <Text style={styles.packSub}>Save ₹146 vs single packs</Text>
                  </View>
                  <Text style={styles.packPrice}>₹349</Text>
                </TouchableOpacity>
              </View>

              {/* Savings disclaimer */}
              <Text style={styles.savingsText}>
                ✨ Zero broker fee · Average savings of ₹7,900
              </Text>

              {/* Payment methods placeholder icons row */}
              <View style={styles.paymentMethodsRow}>
                <View style={styles.paymentBrandBox}>
                  <Text style={styles.paymentBrandText}>GPay</Text>
                </View>
                <View style={styles.paymentBrandBox}>
                  <Text style={styles.paymentBrandText}>PhonePe</Text>
                </View>
                <View style={styles.paymentBrandBox}>
                  <Text style={styles.paymentBrandText}>Paytm</Text>
                </View>
                <Text style={styles.paymentSubText}>UPI, Cards & NetBanking</Text>
              </View>

              {/* Pro Upsell Note */}
              <View style={styles.proUpsellCard}>
                <Ionicons name="star" size={14} color="#0754C0" />
                <Text style={styles.proUpsellText}>
                  <Text style={{ fontFamily: Fonts.bold }}>Pro</Text> members unlock for free. Save ₹{getPrice()} today.
                </Text>
              </View>

              {/* Pay button */}
              <TouchableOpacity
                style={styles.payButton}
                activeOpacity={0.85}
                onPress={handlePay}
              >
                <Text style={styles.payButtonText}>Pay ₹{getPrice()}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* STEP 2: Success State */
            <View style={[styles.sheetContent, { alignItems: 'center', paddingVertical: 24 }]}>
              {/* Success checkmark */}
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={38} color="#ffffff" />
              </View>

              <Text style={styles.successTitle}>Number Unlocked!</Text>
              <Text style={styles.successSub}>
                {selectedPack === 1
                  ? 'You can now contact the landlord directly.'
                  : `You can now contact the landlord directly.\n+${selectedPack === 3 ? 2 : 4} extra unlocks added to your balance!`}
              </Text>

              {/* Remaining balance text */}
              {user !== null && (
                <View style={styles.balanceBadge}>
                  <Ionicons name="key" size={13} color="#0754C0" />
                  <Text style={styles.balanceBadgeText}>
                    {user.creditBalance} remaining unlocks
                  </Text>
                </View>
              )}

              {/* Phone number large text */}
              <View style={styles.phoneBox}>
                <Text style={styles.phoneNumberText}>
                  +91 {property.landlordPhone.substring(0, 5)} {property.landlordPhone.substring(5)}
                </Text>
              </View>

              {/* Connect buttons */}
              <View style={styles.successButtonsRow}>
                <TouchableOpacity
                  style={styles.callNowButton}
                  activeOpacity={0.85}
                  onPress={handleCall}
                >
                  <Ionicons name="call" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.callNowButtonText}>Call Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.copyNumberButton}
                  activeOpacity={0.8}
                  onPress={handleCopy}
                >
                  <Ionicons name="copy-outline" size={16} color="#0F172A" style={{ marginRight: 6 }} />
                  <Text style={styles.copyNumberButtonText}>Copy Number</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F172A',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: height * 0.88,
    width: '100%',
    ...Shadows.float,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  sheetContent: {
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  summaryText: {
    flex: 1,
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  summarySub: {
    fontSize: 13,
    color: '#475569',
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  trustBadgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  trustBadgeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
  },
  trustBadgeTextSuccess: {
    fontSize: 12,
    color: '#15803D',
    fontFamily: Fonts.bold,
    flex: 1,
  },
  trustBadgeItemPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 10,
  },
  trustBadgeTextPrimary: {
    fontSize: 12,
    color: '#0754C0',
    fontFamily: Fonts.bold,
    flex: 1,
  },
  packsContainer: {
    gap: 10,
  },
  packCard: {
    height: 66,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  selectedPackCard: {
    borderColor: '#0F172A',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
  },
  packInfo: {
    justifyContent: 'center',
    gap: 2,
  },
  packTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  packSub: {
    fontSize: 12,
    color: '#475569',
    fontFamily: Fonts.regular,
  },
  packPrice: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  bestValueBadge: {
    backgroundColor: '#0F172A',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bestValueText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  savingsText: {
    fontSize: 13,
    color: '#15803D',
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  paymentBrandBox: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  paymentBrandText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#334155',
  },
  paymentSubText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Fonts.regular,
  },
  proUpsellCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  proUpsellText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#0754C0',
    flex: 1,
  },
  payButton: {
    height: 50,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
    marginTop: 4,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  // Success states
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#15803D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...Shadows.subtle,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  successSub: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 2,
    marginBottom: 16,
  },
  phoneBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
  },
  phoneNumberText: {
    fontSize: 21,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    letterSpacing: 1,
  },
  successButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  callNowButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  callNowButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  copyNumberButton: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  copyNumberButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  creditStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  creditIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.subtle,
  },
  creditStatusTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  creditStatusSub: {
    fontSize: 12,
    color: '#475569',
    fontFamily: Fonts.regular,
    lineHeight: 16,
  },
  secondaryButton: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  balanceBadgeText: {
    color: '#0754C0',
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
});
