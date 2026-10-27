import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../Theme/colors';
import { Fonts } from '../Theme/Fonts';
import { useAuth, RentAgreement } from '../Context/AuthContext';

export default function RentAgreementCabinet({ navigation }: any) {
  const { user, signRentAgreement } = useAuth();

  const agreements = user?.rentAgreements || [];

  const handleAgreementPress = (agreement: RentAgreement) => {
    // Determine action based on status
    const isLandlord = agreement.landlordId === user?.id;
    const hasSigned = isLandlord ? agreement.landlordSigned : agreement.tenantSigned;

    if (agreement.status === 'active') {
      Alert.alert(
        'Agreement Active',
        `This agreement for "${agreement.propertyTitle}" is fully signed and active.\n\nRent: ₹${agreement.rentAmount}/mo\nStart Date: ${agreement.startDate}`,
        [{ text: 'Download PDF', onPress: () => Alert.alert('Download', 'Agreement PDF download simulated successfully!') }, { text: 'Close' }]
      );
    } else if (!hasSigned && (agreement.status === 'pending_tenant_signature' || agreement.status === 'pending_landlord_signature' || agreement.status === 'draft')) {
      // Prompt user to sign
      Alert.alert(
        'Signature Required',
        `Would you like to review and sign the rent agreement for "${agreement.propertyTitle}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Agreement',
            onPress: async () => {
              try {
                await signRentAgreement(agreement.id, isLandlord ? 'landlord' : 'tenant');
                Alert.alert('Success', 'You have signed the agreement successfully!');
              } catch (e) {
                Alert.alert('Error', 'Failed to sign the agreement.');
              }
            }
          }
        ]
      );
    } else {
      // Already signed, waiting for the other party
      Alert.alert(
        'Awaiting Signature',
        `You have already signed this agreement. Waiting for the ${isLandlord ? 'Tenant' : 'Landlord'} to sign.`,
        [{ text: 'OK' }]
      );
    }
  };

  const getStatusStyle = (status: RentAgreement['status']) => {
    switch (status) {
      case 'active':
        return { bg: '#ECFDF5', text: '#15803D', label: 'Active & Signed' };
      case 'pending_tenant_signature':
      case 'pending_landlord_signature':
        return { bg: '#FFFBEB', text: '#D97706', label: 'Pending Signatures' };
      default:
        return { bg: '#F1F5F9', text: '#475569', label: 'Draft' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rent Agreements</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, agreements.length === 0 && { flex: 1, justifyContent: 'center' }]}
      >
        {agreements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="document-text-outline" size={40} color="#0754C0" />
            </View>
            <Text style={styles.emptyTitle}>No Rent Agreements Yet</Text>
            <Text style={styles.emptyDescription}>
              Draft and sign legally-binding rental agreements digitally with e-stamp paper right from the app. Zero broker fees, 100% paperless.
            </Text>

            <TouchableOpacity
              style={styles.createBtnEmpty}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AgreementForm')}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
              <Text style={styles.createBtnEmptyText}>Draft New Agreement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {/* Promotional Banner */}
            <View style={styles.promoBanner}>
              <View style={styles.promoIconCircle}>
                <Ionicons name="shield-checkmark" size={20} color="#0754C0" />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.promoTitle}>E-Stamp & Digital Signatures</Text>
                <Text style={styles.promoSub}>Drafting is 100% free. Pay only when stamp duty is generated.</Text>
              </View>
            </View>

            {/* List */}
            <View style={{ gap: 12 }}>
              <Text style={styles.sectionTitle}>Your Agreements ({agreements.length})</Text>
              {agreements.map((agreement) => {
                const statusInfo = getStatusStyle(agreement.status);
                const isLandlord = agreement.landlordId === user?.id;

                return (
                  <TouchableOpacity
                    key={agreement.id}
                    style={styles.agreementCard}
                    activeOpacity={0.92}
                    onPress={() => handleAgreementPress(agreement)}
                  >
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {agreement.propertyTitle}
                        </Text>
                        <Text style={styles.cardAddress} numberOfLines={1}>
                          📍 {agreement.propertyAddress}
                        </Text>
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: statusInfo.text }]}>
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.cardGrid}>
                      <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Monthly Rent</Text>
                        <Text style={styles.gridValue}>₹{agreement.rentAmount.toLocaleString('en-IN')}</Text>
                      </View>

                      <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Lease Period</Text>
                        <Text style={styles.gridValue}>{agreement.durationMonths} Months</Text>
                      </View>

                      <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Your Role</Text>
                        <Text style={styles.gridValue}>{isLandlord ? 'Landlord' : 'Tenant'}</Text>
                      </View>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.cardFooter}>
                      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        <Ionicons
                          name={agreement.landlordSigned ? "checkmark-circle" : "ellipse-outline"}
                          size={15}
                          color={agreement.landlordSigned ? '#15803D' : '#94A3B8'}
                        />
                        <Text style={styles.signLabel}>Landlord</Text>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        <Ionicons
                          name={agreement.tenantSigned ? "checkmark-circle" : "ellipse-outline"}
                          size={15}
                          color={agreement.tenantSigned ? '#15803D' : '#94A3B8'}
                        />
                        <Text style={styles.signLabel}>Tenant</Text>
                      </View>

                      <View style={styles.actionPrompt}>
                        <Text style={styles.actionPromptText}>
                          {agreement.status === 'active' ? 'View Details' : 'Review & Sign'}
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color="#0754C0" />
                      </View>
                    </View>

                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {agreements.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AgreementForm')}
        >
          <Ionicons name="add" size={26} color="#ffffff" />
        </TouchableOpacity>
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 14,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    ...Shadows.subtle,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  createBtnEmpty: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    ...Shadows.primary,
  },
  createBtnEmptyText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  promoBanner: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 12,
  },
  promoIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.subtle,
  },
  promoTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  promoSub: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#475569',
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    marginBottom: 2,
  },
  agreementCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  cardAddress: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  cardGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    gap: 3,
  },
  gridLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#64748B',
  },
  gridValue: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#475569',
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionPromptText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: '#0754C0',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.primary,
  },
});
