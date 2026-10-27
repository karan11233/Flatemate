import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../Theme/colors';
import { Fonts } from '../Theme/Fonts';
import { useAuth } from '../Context/AuthContext';
import DocumentUploadZone from '../Components/DocumentUploadZone';

const ID_TYPES = [
  { key: 'aadhaar', label: 'Aadhaar Card', icon: 'card-outline', doubleSided: true },
  { key: 'pan', label: 'PAN Card', icon: 'barcode-outline', doubleSided: false },
  { key: 'voter', label: 'Voter ID', icon: 'id-card-outline', doubleSided: true },
  { key: 'passport', label: 'Passport', icon: 'book-outline', doubleSided: true },
];

export default function DocumentVerification({ navigation }: any) {
  const { user, uploadIdentityDocs } = useAuth();

  const currentStatus = user?.identityVerificationStatus || 'none';
  const isVerified = user?.isIdentityVerified || false;

  const [selectedId, setSelectedId] = useState('aadhaar');
  const [idNumber, setIdNumber] = useState(user?.identityDocType ? '•••• •••• ••••' : '');
  const [frontImage, setFrontImage] = useState<string | null>(user?.identityDocFront || null);
  const [backImage, setBackImage] = useState<string | null>(user?.identityDocBack || null);

  const activeIdConfig = ID_TYPES.find(i => i.key === selectedId);
  const requiresBack = activeIdConfig?.doubleSided ?? true;

  const handleClearFront = () => setFrontImage(null);
  const handleClearBack = () => setBackImage(null);

  const handleIdTypeChange = (key: string) => {
    setSelectedId(key);
    setFrontImage(null);
    setBackImage(null);
    setIdNumber('');
  };

  const handleVerifySubmit = async () => {
    if (!idNumber.trim()) {
      Alert.alert('Missing Number', 'Please enter your identity document number.');
      return;
    }
    if (!frontImage) {
      Alert.alert('Missing Photo', 'Please upload the front photo of your ID.');
      return;
    }
    if (requiresBack && !backImage) {
      Alert.alert('Missing Photo', 'Please upload the back photo of your ID.');
      return;
    }

    try {
      await uploadIdentityDocs(
        selectedId.toUpperCase(),
        frontImage,
        backImage || ''
      );
      Alert.alert(
        'Documents Submitted',
        'Your documents have been submitted for verification. We will notify you once approved.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Submission Error', 'Failed to submit verification. Please try again.');
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
        <Text style={styles.headerTitle}>Identity Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Status Display Card */}
        {isVerified ? (
          <View style={[styles.statusCard, styles.statusCardSuccess]}>
            <View style={styles.statusHeader}>
              <View style={[styles.statusBadgeIcon, { backgroundColor: '#15803D' }]}>
                <Ionicons name="checkmark" size={16} color="#ffffff" />
              </View>
              <Text style={[styles.statusTitle, { color: '#15803D' }]}>Identity 100% Verified</Text>
            </View>
            <Text style={styles.statusDescription}>
              Your account is fully verified. You now enjoy the verified trust badge across all your chats and listings.
            </Text>
          </View>
        ) : currentStatus === 'pending' ? (
          <View style={[styles.statusCard, styles.statusCardPending]}>
            <View style={styles.statusHeader}>
              <View style={[styles.statusBadgeIcon, { backgroundColor: '#D97706' }]}>
                <Ionicons name="time" size={16} color="#ffffff" />
              </View>
              <Text style={[styles.statusTitle, { color: '#B45309' }]}>Verification Under Review</Text>
            </View>
            <Text style={styles.statusDescription}>
              Our compliance team is auditing your details. Your account badge will be updated within 24 hours.
            </Text>
          </View>
        ) : (
          <View style={styles.disclaimerCard}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={styles.disclaimerIconBox}>
                <Ionicons name="shield-checkmark" size={20} color="#0754C0" />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.disclaimerTitle}>Bank-Grade 256-Bit Security</Text>
                <Text style={styles.disclaimerText}>
                  Your documents are strictly encrypted and used solely for authentic user verification. They are never shared or made public.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Input Form (Only editable when not verified/pending) */}
        {currentStatus === 'none' && (
          <View style={styles.formContainer}>
            <Text style={styles.sectionLabel}>1. Select Government ID Type</Text>
            <View style={styles.idGrid}>
              {ID_TYPES.map((type) => {
                const isSel = selectedId === type.key;
                return (
                  <TouchableOpacity
                    key={type.key}
                    style={[styles.idCard, isSel && styles.idCardSelected]}
                    activeOpacity={0.8}
                    onPress={() => handleIdTypeChange(type.key)}
                  >
                    <Ionicons name={type.icon as any} size={22} color={isSel ? '#0F172A' : '#64748B'} />
                    <Text style={[styles.idText, isSel && styles.idTextSelected]}>{type.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 10 }]}>2. Enter Document Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="create-outline" size={18} color="#64748B" />
              <TextInput
                style={styles.input}
                placeholder={`Enter ${activeIdConfig?.label} Number`}
                placeholderTextColor="#94A3B8"
                value={idNumber}
                onChangeText={setIdNumber}
                keyboardType={selectedId === 'aadhaar' ? 'numeric' : 'default'}
              />
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 10 }]}>3. Upload Photo Proof</Text>
            <View style={{ gap: 14 }}>
              <DocumentUploadZone
                title="Front Photo"
                subtitle={`Upload front of your ${activeIdConfig?.label}`}
                imageUri={frontImage}
                onUpload={setFrontImage}
                onClear={handleClearFront}
              />

              {requiresBack && (
                <DocumentUploadZone
                  title="Back Photo"
                  subtitle={`Upload back of your ${activeIdConfig?.label}`}
                  imageUri={backImage}
                  onUpload={setBackImage}
                  onClear={handleClearBack}
                />
              )}
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={styles.submitButton}
              activeOpacity={0.85}
              onPress={handleVerifySubmit}
            >
              <Text style={styles.submitButtonText}>Submit Verification Docs</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Existing verified documents metadata (Only visible when verified/pending) */}
        {currentStatus !== 'none' && (
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionLabel}>Submitted Verification Details</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Document Type</Text>
              <Text style={styles.metaValue}>{user?.identityDocType || 'Govt ID'}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Document Number</Text>
              <Text style={styles.metaValue}>{idNumber || '•••• •••• ••••'}</Text>
            </View>

            {frontImage && (
              <View style={{ marginTop: 14, gap: 8 }}>
                <Text style={styles.metaLabel}>Submitted Photo</Text>
                <View style={styles.submittedImageContainer}>
                  <DocumentUploadZone
                    title="Front Side"
                    subtitle="Front photo"
                    imageUri={frontImage}
                    onUpload={() => {}}
                    onClear={() => {}}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
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
    gap: 16,
  },
  disclaimerCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 16,
  },
  disclaimerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.subtle,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#475569',
    lineHeight: 18,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  statusCardSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusCardPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadgeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  statusDescription: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#475569',
    lineHeight: 18,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    ...Shadows.subtle,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  idGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  idCard: {
    width: '48%',
    flexGrow: 1,
    height: 72,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
  },
  idCardSelected: {
    borderColor: '#0F172A',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
  },
  idText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#475569',
  },
  idTextSelected: {
    color: '#0F172A',
    fontFamily: Fonts.bold,
  },
  inputWrapper: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#0F172A',
  },
  submitButton: {
    height: 50,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    ...Shadows.primary,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.subtle,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  metaLabel: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#64748B',
  },
  metaValue: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  metaDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  submittedImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});
