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

export default function AgreementForm({ route, navigation }: any) {
  const { user, saveRentAgreement } = useAuth();

  // Optional pre-filled listing data if navigated from listing DetailPage
  const prepopulatedProperty = route?.params?.property;

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'landlord' | 'tenant'>('tenant');

  // Parties details
  const [landlordName, setLandlordName] = useState(role === 'landlord' ? (user?.name || '') : '');
  const [landlordPhone, setLandlordPhone] = useState(role === 'landlord' ? (user?.phone || '') : '');
  const [landlordIdType] = useState('AADHAAR');
  const [landlordIdNumber, setLandlordIdNumber] = useState('');

  const [tenantName, setTenantName] = useState(role === 'tenant' ? (user?.name || '') : '');
  const [tenantPhone, setTenantPhone] = useState(role === 'tenant' ? (user?.phone || '') : '');
  const [tenantIdType] = useState('AADHAAR');
  const [tenantIdNumber, setTenantIdNumber] = useState('');

  // Property details
  const [propertyTitle, setPropertyTitle] = useState(prepopulatedProperty?.title || '');
  const [propertyAddress, setPropertyAddress] = useState(prepopulatedProperty?.area ? `${prepopulatedProperty.title}, ${prepopulatedProperty.area}, Ahmedabad` : '');
  const [rentAmount, setRentAmount] = useState(prepopulatedProperty?.rent ? String(prepopulatedProperty.rent) : '');
  const [depositAmount, setDepositAmount] = useState(prepopulatedProperty?.deposit ? String(prepopulatedProperty.deposit) : '');
  const [durationMonths, setDurationMonths] = useState('11');
  const [noticePeriodDays, setNoticePeriodDays] = useState('30');
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-IN'));

  const handleRoleToggle = (selectedRole: 'landlord' | 'tenant') => {
    setRole(selectedRole);
    if (selectedRole === 'landlord') {
      setLandlordName(user?.name || '');
      setLandlordPhone(user?.phone || '');
      setTenantName('');
      setTenantPhone('');
    } else {
      setTenantName(user?.name || '');
      setTenantPhone(user?.phone || '');
      setLandlordName('');
      setLandlordPhone('');
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!landlordName || !landlordPhone || !landlordIdNumber || !tenantName || !tenantPhone || !tenantIdNumber) {
        Alert.alert('Incomplete Details', 'Please fill in all identity information for both landlord and tenant.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!propertyTitle || !propertyAddress || !rentAmount || !depositAmount) {
        Alert.alert('Incomplete Details', 'Please enter all property lease specifications.');
        return;
      }
      setStep(3);
    }
  };

  const handleGenerateAgreement = async () => {
    try {
      const agreementData = {
        landlordId: role === 'landlord' ? (user?.id || '') : 'landlord_id_mocked',
        landlordName,
        landlordPhone,
        landlordIdType,
        landlordIdNumber,
        tenantId: role === 'tenant' ? (user?.id || '') : 'tenant_id_mocked',
        tenantName,
        tenantPhone,
        tenantIdType,
        tenantIdNumber,
        propertyTitle,
        propertyAddress,
        rentAmount: parseInt(rentAmount) || 8000,
        depositAmount: parseInt(depositAmount) || 16000,
        durationMonths: parseInt(durationMonths) || 11,
        noticePeriodDays: parseInt(noticePeriodDays) || 30,
        startDate,
        status: (role === 'landlord' ? 'pending_tenant_signature' : 'pending_landlord_signature') as any,
        tenantSigned: role === 'tenant',
        landlordSigned: role === 'landlord',
      };

      await saveRentAgreement(agreementData);

      Alert.alert(
        'Agreement Drafted',
        'Your rental agreement draft has been created and e-stamp generated. It is now awaiting signature from the other party.',
        [{ text: 'View Agreements', onPress: () => navigation.replace('RentAgreementCabinet') }]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to generate rental agreement.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.8}
          onPress={() => {
            if (step > 1) setStep(step - 1);
            else navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Draft Rent Agreement</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stepper Progress Bar */}
      <View style={styles.stepperContainer}>
        <View style={styles.stepperRow}>
          <View style={[styles.stepIndicator, step >= 1 && styles.stepIndicatorActive]}>
            {step > 1 ? (
              <Ionicons name="checkmark" size={14} color="#ffffff" />
            ) : (
              <Text style={[styles.stepNum, step >= 1 && styles.stepNumActive]}>1</Text>
            )}
          </View>
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={[styles.stepIndicator, step >= 2 && styles.stepIndicatorActive]}>
            {step > 2 ? (
              <Ionicons name="checkmark" size={14} color="#ffffff" />
            ) : (
              <Text style={[styles.stepNum, step >= 2 && styles.stepNumActive]}>2</Text>
            )}
          </View>
          <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
          <View style={[styles.stepIndicator, step >= 3 && styles.stepIndicatorActive]}>
            <Text style={[styles.stepNum, step >= 3 && styles.stepNumActive]}>3</Text>
          </View>
        </View>
        <View style={styles.stepperLabels}>
          <Text style={[styles.stepperLabelText, step === 1 && styles.stepperLabelTextActive]}>Parties</Text>
          <Text style={[styles.stepperLabelText, step === 2 && styles.stepperLabelTextActive]}>Lease Terms</Text>
          <Text style={[styles.stepperLabelText, step === 3 && styles.stepperLabelTextActive]}>E-Stamp Preview</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* STEP 1: Parties details */}
        {step === 1 && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Your Role in this Lease</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, role === 'tenant' && styles.toggleBtnActive]}
                activeOpacity={0.8}
                onPress={() => handleRoleToggle('tenant')}
              >
                <Text style={[styles.toggleBtnText, role === 'tenant' && styles.toggleBtnTextActive]}>I am Tenant</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, role === 'landlord' && styles.toggleBtnActive]}
                activeOpacity={0.8}
                onPress={() => handleRoleToggle('landlord')}
              >
                <Text style={[styles.toggleBtnText, role === 'landlord' && styles.toggleBtnTextActive]}>I am Landlord</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cardDivider} />

            {/* Landlord details */}
            <Text style={styles.sectionHeading}>Landlord Details</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Legal Name (as per Govt ID)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter Landlord Name"
                placeholderTextColor="#94A3B8"
                value={landlordName}
                onChangeText={setLandlordName}
                editable={role === 'tenant'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter 10-digit Phone Number"
                placeholderTextColor="#94A3B8"
                value={landlordPhone}
                onChangeText={setLandlordPhone}
                keyboardType="numeric"
                editable={role === 'tenant'}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 0.38 }]}>
                <Text style={styles.inputLabel}>Govt ID</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.disabledDropdownText}>{landlordIdType}</Text>
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 0.62 }]}>
                <Text style={styles.inputLabel}>Govt ID Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter ID Number"
                  placeholderTextColor="#94A3B8"
                  value={landlordIdNumber}
                  onChangeText={setLandlordIdNumber}
                />
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* Tenant details */}
            <Text style={styles.sectionHeading}>Tenant Details</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Legal Name (as per Govt ID)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter Tenant Name"
                placeholderTextColor="#94A3B8"
                value={tenantName}
                onChangeText={setTenantName}
                editable={role === 'landlord'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter 10-digit Phone Number"
                placeholderTextColor="#94A3B8"
                value={tenantPhone}
                onChangeText={setTenantPhone}
                keyboardType="numeric"
                editable={role === 'landlord'}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 0.38 }]}>
                <Text style={styles.inputLabel}>Govt ID</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.disabledDropdownText}>{tenantIdType}</Text>
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 0.62 }]}>
                <Text style={styles.inputLabel}>Govt ID Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter ID Number"
                  placeholderTextColor="#94A3B8"
                  value={tenantIdNumber}
                  onChangeText={setTenantIdNumber}
                />
              </View>
            </View>
          </View>
        )}

        {/* STEP 2: Property & Lease terms */}
        {step === 2 && (
          <View style={styles.formCard}>
            <Text style={styles.sectionHeading}>Property Specifications</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Property Name / Flat Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 2BHK Smart Flat Satellite"
                placeholderTextColor="#94A3B8"
                value={propertyTitle}
                onChangeText={setPropertyTitle}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Complete Property Address</Text>
              <TextInput
                style={[styles.textInput, { height: 68, textAlignVertical: 'top' }]}
                placeholder="Flat / House No, Building, Street, Area, City"
                placeholderTextColor="#94A3B8"
                value={propertyAddress}
                onChangeText={setPropertyAddress}
                multiline
              />
            </View>

            <View style={styles.cardDivider} />

            <Text style={styles.sectionHeading}>Rental Financial Terms</Text>
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Monthly Rent (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 12000"
                  placeholderTextColor="#94A3B8"
                  value={rentAmount}
                  onChangeText={setRentAmount}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Security Deposit (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 24000"
                  placeholderTextColor="#94A3B8"
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Lease Duration (Months)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 11"
                  placeholderTextColor="#94A3B8"
                  value={durationMonths}
                  onChangeText={setDurationMonths}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Notice Period (Days)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 30"
                  placeholderTextColor="#94A3B8"
                  value={noticePeriodDays}
                  onChangeText={setNoticePeriodDays}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Agreement Commencement Date</Text>
              <TextInput
                style={styles.textInput}
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#94A3B8"
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
          </View>
        )}

        {/* STEP 3: Preview and e-Stamp Paper */}
        {step === 3 && (
          <View style={styles.stampPaperContainer}>
            {/* The Stamp Paper Header */}
            <View style={styles.stampPaperHeader}>
              <Text style={styles.stampHeaderGovt}>GOVERNMENT OF GUJARAT</Text>
              <View style={styles.stampHeaderDivider} />
              <Text style={styles.stampHeaderTitle}>E-STAMP CERTIFICATE</Text>
              <View style={styles.stampSealContainer}>
                <Ionicons name="ribbon-outline" size={22} color="#C2410C" />
                <Text style={styles.stampSealText}>SECURE DIGITAL CERTIFICATE</Text>
              </View>
              <View style={styles.stampCertificateRow}>
                <View style={{ gap: 2 }}>
                  <Text style={styles.stampCertLabel}>Certificate No.</Text>
                  <Text style={styles.stampCertVal}>IN-GJ884950284759D</Text>
                </View>
                <View style={{ gap: 2, alignItems: 'flex-end' }}>
                  <Text style={styles.stampCertLabel}>Stamp Duty Paid</Text>
                  <Text style={styles.stampCertVal}>₹ 300.00</Text>
                </View>
              </View>
            </View>

            {/* Contract content */}
            <View style={styles.stampPaperBody}>
              <Text style={styles.agreementTextHeader}>RENTAL LEASE AGREEMENT</Text>

              <Text style={styles.agreementTextBody}>
                This Rental Lease Agreement is made and executed on this <Text style={styles.boldText}>{startDate}</Text> at Ahmedabad, Gujarat, by and between:
              </Text>

              <Text style={styles.agreementTextBody}>
                <Text style={styles.boldText}>LANDLORD:</Text> {landlordName}, residing at Ahmedabad, holder of {landlordIdType} number {landlordIdNumber} (hereinafter referred to as the "Landlord" which expression shall include heirs, legal representatives, and assigns).
              </Text>

              <Text style={styles.agreementTextBody}>
                AND
              </Text>

              <Text style={styles.agreementTextBody}>
                <Text style={styles.boldText}>TENANT:</Text> {tenantName}, residing at Ahmedabad, holder of {tenantIdType} number {tenantIdNumber} (hereinafter referred to as the "Tenant" which expression shall include heirs, legal representatives, and assigns).
              </Text>

              <Text style={styles.agreementTextBody}>
                WHEREAS the Landlord is the absolute lawful owner of the residential premises situated at: <Text style={styles.boldText}>{propertyAddress}</Text> (hereinafter "Leased Premises").
              </Text>

              <Text style={styles.agreementTextBody}>
                NOW THIS DEED WITNESSETH AND IT IS MUTUALLY AGREED AS FOLLOWS:
              </Text>

              <Text style={styles.agreementTextBody}>
                1. <Text style={styles.boldText}>RENT & TERM:</Text> The tenancy shall be for a fixed term of <Text style={styles.boldText}>{durationMonths} Months</Text> starting from <Text style={styles.boldText}>{startDate}</Text>. The Tenant agrees to pay monthly rent of <Text style={styles.boldText}>₹{parseInt(rentAmount || '0').toLocaleString('en-IN')}</Text> on or before the 5th day of each calendar month.
              </Text>

              <Text style={styles.agreementTextBody}>
                2. <Text style={styles.boldText}>SECURITY DEPOSIT:</Text> The Tenant has deposited a refundable interest-free security sum of <Text style={styles.boldText}>₹{parseInt(depositAmount || '0').toLocaleString('en-IN')}</Text> with the Landlord, refundable upon vacant possession subject to utility dues.
              </Text>

              <Text style={styles.agreementTextBody}>
                3. <Text style={styles.boldText}>NOTICE PERIOD:</Text> Either party may terminate this agreement by providing written notice of at least <Text style={styles.boldText}>{noticePeriodDays} Days</Text> in advance.
              </Text>

              <Text style={styles.agreementTextBody}>
                4. <Text style={styles.boldText}>UTILITIES & MAINTENANCE:</Text> Electricity and running water charges shall be borne by the Tenant. Structural maintenance remains the responsibility of the Landlord.
              </Text>

              <View style={styles.stampPaperFooter}>
                <View style={styles.signColumn}>
                  <Text style={styles.signLabelText}>LANDLORD SIGNATURE</Text>
                  <View style={styles.signZone}>
                    {role === 'landlord' ? (
                      <View style={styles.signatureBadge}>
                        <Ionicons name="checkmark-circle" size={13} color="#15803D" />
                        <Text style={styles.signatureBadgeText}>Digitally Signed</Text>
                      </View>
                    ) : (
                      <Text style={styles.awaitingSign}>Awaiting Signature</Text>
                    )}
                  </View>
                  <Text style={styles.signNameText}>{landlordName || 'Landlord'}</Text>
                </View>

                <View style={styles.signColumn}>
                  <Text style={styles.signLabelText}>TENANT SIGNATURE</Text>
                  <View style={styles.signZone}>
                    {role === 'tenant' ? (
                      <View style={styles.signatureBadge}>
                        <Ionicons name="checkmark-circle" size={13} color="#15803D" />
                        <Text style={styles.signatureBadgeText}>Digitally Signed</Text>
                      </View>
                    ) : (
                      <Text style={styles.awaitingSign}>Awaiting Signature</Text>
                    )}
                  </View>
                  <Text style={styles.signNameText}>{tenantName || 'Tenant'}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Action Button */}
        {step < 3 ? (
          <TouchableOpacity
            style={styles.submitButton}
            activeOpacity={0.85}
            onPress={handleNextStep}
          >
            <Text style={styles.submitButtonText}>Continue to Next Step</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: '#15803D' }]}
            activeOpacity={0.85}
            onPress={handleGenerateAgreement}
          >
            <Ionicons name="create" size={18} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.submitButtonText}>Confirm & Generate Agreement</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.Gray50,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: Colors.White,
    borderBottomWidth: 1,
    borderColor: Colors.Gray800,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: Colors.Gray100,
  },
  stepperContainer: {
    backgroundColor: Colors.White,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderColor: Colors.Gray800,
    gap: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: Colors.Gray400,
    backgroundColor: Colors.White,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicatorActive: {
    borderColor: Colors.Primary,
    backgroundColor: Colors.Primary,
  },
  stepNum: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.Gray400,
  },
  stepNumActive: {
    color: '#ffffff',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.Gray800,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: Colors.Primary,
  },
  stepperLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  stepperLabelText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.Gray400,
  },
  stepperLabelTextActive: {
    color: Colors.Primary,
    fontFamily: Fonts.bold,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  formCard: {
    backgroundColor: Colors.White,
    borderWidth: 1,
    borderColor: Colors.Gray800,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    ...Shadows.subtle,
  },
  formTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.Gray100,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleBtn: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: Colors.Gray800,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.Gray50,
  },
  toggleBtnActive: {
    borderColor: Colors.Primary,
    backgroundColor: Colors.PrimaryLight,
  },
  toggleBtnText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.Gray300,
  },
  toggleBtnTextActive: {
    color: Colors.Primary,
    fontFamily: Fonts.bold,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.Gray800,
  },
  sectionHeading: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.Gray100,
    marginBottom: -2,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.Gray300,
  },
  textInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.Gray800,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.Gray100,
    backgroundColor: Colors.White,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  disabledDropdown: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.Gray800,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: Colors.Gray50,
    justifyContent: 'center',
  },
  disabledDropdownText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.Gray400,
  },
  submitButton: {
    height: 50,
    backgroundColor: Colors.Primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    ...Shadows.primary,
    marginTop: 4,
  },
  submitButtonText: {
    color: '#ffffff',
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  stampPaperContainer: {
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#E7E2D8',
    borderRadius: 16,
    padding: 18,
    gap: 16,
    ...Shadows.card,
  },
  stampPaperHeader: {
    borderWidth: 2,
    borderColor: '#C2410C',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF7ED',
  },
  stampHeaderGovt: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#9A3412',
    letterSpacing: 1,
  },
  stampHeaderDivider: {
    width: '60%',
    height: 1.5,
    backgroundColor: '#C2410C',
  },
  stampHeaderTitle: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#C2410C',
    letterSpacing: 0.5,
  },
  stampSealContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  stampSealText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: '#C2410C',
  },
  stampCertificateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
    borderTopWidth: 1,
    borderColor: '#FDBA74',
    paddingTop: 8,
  },
  stampCertLabel: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: '#9A3412',
  },
  stampCertVal: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#431407',
  },
  stampPaperBody: {
    paddingHorizontal: 4,
    gap: 14,
  },
  agreementTextHeader: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginVertical: 4,
  },
  agreementTextBody: {
    fontSize: 12.5,
    fontFamily: Fonts.regular,
    color: '#334155',
    lineHeight: 19,
    textAlign: 'justify',
  },
  boldText: {
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  stampPaperFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    gap: 16,
  },
  signColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  signLabelText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  signZone: {
    height: 48,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signatureBadge: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    gap: 4,
  },
  signatureBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#15803D',
  },
  awaitingSign: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: '#64748B',
  },
  signNameText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    marginTop: 2,
    textAlign: 'center',
  },
});
