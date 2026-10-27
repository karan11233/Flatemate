import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../Theme/colors';
import { Fonts } from '../Theme/Fonts';
import { useAuth } from '../Context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Back from '../Assets/Svg/Back.svg';
import UserIcon from '../Assets/Svg/User.svg';

export default function ProfileSetup({ route, navigation }: any) {
  const { login } = useAuth();
  const { phone, id } = route.params || { phone: '', id: '' };

  const [step, setStep] = useState(3); // Step 3 of 4: Profile Details, Step 4 of 4: Identity Verification
  const [hasSelfie, setHasSelfie] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [profession, setProfession] = useState('');
  const [isGenderModalVisible, setIsGenderModalVisible] = useState(false);

  const genderOptions = ['Male', 'Female', 'Other'];

  const handleSignUp = (verified: boolean) => {
    if (name && email && gender && profession) {
      // Simulate profile completion & login
      login(phone, {
        id, // pass the Firebase User UID
        name,
        email,
        gender,
        profession,
        isIdentityVerified: verified,
      });
      // Go back to the screen that triggered login flow
      if (navigation.canGoBack()) {
        navigation.navigate('MainTabs');
      }
    }
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isFormValid = name.trim() && isEmailValid && gender && profession.trim();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.Gray50 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header with back navigation and dots */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step === 4 ? setStep(3) : navigation.goBack()} style={styles.backBtn}>
            <Back height={24} width={24} />
          </TouchableOpacity>
          <View style={styles.stepContainer}>
            <View style={styles.stepDotCompleted}>
              <Ionicons name="checkmark" size={10} color="#FFFFFF" />
            </View>
            <View style={styles.stepDotCompleted}>
              <Ionicons name="checkmark" size={10} color="#FFFFFF" />
            </View>
            <View style={step === 3 ? styles.stepDotActive : styles.stepDotCompleted}>
              {step > 3 ? (
                <Ionicons name="checkmark" size={10} color="#FFFFFF" />
              ) : null}
            </View>
            <View style={step === 4 ? styles.stepDotActive : styles.stepDotInactive} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step === 3 ? (
            <>
              {/* Compact Hero */}
              <View style={styles.heroBox}>
                <View style={styles.heroIconCircle}>
                  <Ionicons name="person" size={24} color="#0754C0" />
                </View>
                <Text style={styles.title}>Set up your profile</Text>
                <Text style={styles.subtitle}>Tell us about yourself to personalize your experience</Text>
              </View>

              {/* Profile Avatar Circle */}
              <View style={styles.avatarContainer}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{name ? name.charAt(0).toUpperCase() : 'K'}</Text>
                </View>
                <TouchableOpacity style={styles.addAvatarBtn} activeOpacity={0.8}>
                  <Ionicons name="camera-outline" size={14} color="#0F172A" style={{ marginRight: 2 }} />
                  <Text style={styles.addAvatarText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Form Fields */}
              <View style={styles.form}>
                {/* Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <View style={styles.inputWrapper}>
                    <View style={styles.iconWrapper}>
                      <UserIcon height={18} width={18} color="#64748B" />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter name"
                      placeholderTextColor="#94A3B8"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <View style={styles.iconWrapper}>
                      <Ionicons name="mail-outline" size={18} color="#64748B" />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter email"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </View>

                {/* Phone Input (Pre-filled and Disabled) */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Phone number</Text>
                  <View style={[styles.inputWrapper, styles.disabledWrapper]}>
                    <View style={styles.iconWrapper}>
                      <Ionicons name="call-outline" size={18} color="#64748B" />
                    </View>
                    <TextInput
                      style={[styles.textInput, styles.disabledInput]}
                      value={phone}
                      editable={false}
                    />
                  </View>
                </View>

                {/* Gender Segmented Control */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Gender</Text>
                  <View style={styles.genderSegmentRow}>
                    {genderOptions.map((option) => {
                      const isSelected = gender === option;
                      return (
                        <TouchableOpacity
                          key={option}
                          style={[styles.genderSegmentBtn, isSelected && styles.genderSegmentBtnActive]}
                          activeOpacity={0.8}
                          onPress={() => setGender(option)}
                        >
                          <Text style={[styles.genderSegmentText, isSelected && styles.genderSegmentTextActive]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Profession Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Profession</Text>
                  <View style={styles.inputWrapper}>
                    <View style={styles.iconWrapper}>
                      <Ionicons name="briefcase-outline" size={18} color="#64748B" />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Software Engineer, Student"
                      placeholderTextColor="#94A3B8"
                      value={profession}
                      onChangeText={setProfession}
                    />
                  </View>
                </View>

                {/* Continue to Step 4 Button */}
                <TouchableOpacity
                  style={[styles.submitBtn, !isFormValid && styles.disabledSubmitBtn]}
                  disabled={!isFormValid}
                  activeOpacity={0.85}
                  onPress={() => setStep(4)}
                >
                  <Text style={styles.submitBtnText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Step 4 Hero */}
              <View style={styles.heroBox}>
                <View style={[styles.heroIconCircle, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                  <Ionicons name="shield-checkmark" size={26} color="#15803D" />
                </View>
                <Text style={styles.title}>Verify Your Identity</Text>
                <Text style={styles.subtitle}>
                  Verify with phone SMS and a quick selfie to get 3x more roommate matches
                </Text>
              </View>

              {/* Camera Placeholder */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setHasSelfie(!hasSelfie)}
                style={styles.cameraPlaceholder}
              >
                {hasSelfie ? (
                  <View style={{ alignItems: 'center', gap: 10 }}>
                    <Ionicons name="checkmark-circle" size={48} color="#15803D" />
                    <Text style={styles.cameraPlaceholderTextActive}>Selfie Captured Successfully!</Text>
                    <Text style={{ fontSize: 12, color: '#64748B', fontFamily: Fonts.medium }}>Tap to retake</Text>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center', gap: 10 }}>
                    <Ionicons name="camera-outline" size={48} color="#0754C0" />
                    <Text style={styles.cameraPlaceholderText}>Tap to take a quick selfie</Text>
                    <Text style={{ fontSize: 12, color: '#64748B', fontFamily: Fonts.regular }}>Selfie is used only for verification</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={styles.verificationActions}>
                <TouchableOpacity
                  style={styles.verifyNowBtn}
                  activeOpacity={0.85}
                  onPress={() => handleSignUp(true)}
                >
                  <Text style={styles.verifyNowBtnText}>Verify Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipBtn}
                  activeOpacity={0.8}
                  onPress={() => handleSignUp(false)}
                >
                  <Text style={styles.skipBtnText}>Skip for Now</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>

        {/* Gender Option Modal Dropdown */}
        <Modal
          visible={isGenderModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsGenderModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsGenderModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Select Gender</Text>
                <TouchableOpacity onPress={() => setIsGenderModalVisible(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={18} color={Colors.Gray400} />
                </TouchableOpacity>
              </View>
              <View style={{ gap: 10, marginTop: 8 }}>
                {genderOptions.map((option) => {
                  const isSelected = gender === option;
                  const renderGenderIcon = (opt: string) => {
                    switch (opt.toLowerCase()) {
                      case 'male': return <Ionicons name="male-outline" size={16} color={isSelected ? Colors.Primary : Colors.Gray300} />;
                      case 'female': return <Ionicons name="female-outline" size={16} color={isSelected ? Colors.Primary : Colors.Gray300} />;
                      default: return <Ionicons name="person-outline" size={16} color={isSelected ? Colors.Primary : Colors.Gray300} />;
                    }
                  };
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.modalOptionCard,
                        isSelected && styles.modalOptionCardSelected
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setGender(option);
                        setIsGenderModalVisible(false);
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={[styles.modalIconBox, isSelected && { backgroundColor: Colors.White }]}>
                          {renderGenderIcon(option)}
                        </View>
                        <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                          {option}
                        </Text>
                      </View>
                      <View style={[
                        styles.modalRadioOuter,
                        isSelected && { borderColor: Colors.Primary }
                      ]}>
                        {isSelected && <View style={styles.modalRadioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 12,
  },
  stepDotInactive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  stepDotActive: {
    width: 24,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0F172A',
  },
  stepDotCompleted: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#15803D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  heroBox: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  heroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: '#0754C0',
  },
  addAvatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginTop: -14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  addAvatarText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#0F172A',
    marginLeft: 2,
  },
  inputWrapper: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  disabledWrapper: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  iconWrapper: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: '100%',
    paddingRight: 16,
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#0F172A',
  },
  disabledInput: {
    color: '#64748B',
  },
  genderSegmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderSegmentBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderSegmentBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  genderSegmentText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#475569',
  },
  genderSegmentTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  submitBtn: {
    height: 50,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledSubmitBtn: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  cameraPlaceholder: {
    height: 180,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  cameraPlaceholderText: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: Fonts.medium,
  },
  cameraPlaceholderTextActive: {
    fontSize: 14,
    color: '#15803D',
    fontFamily: Fonts.bold,
  },
  verificationActions: {
    gap: 12,
    marginTop: 20,
  },
  verifyNowBtn: {
    height: 50,
    backgroundColor: '#15803D',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  verifyNowBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  skipBtn: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtnText: {
    color: '#475569',
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 4,
  },
  modalCloseBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  modalOptionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalOptionCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0754C0',
    borderWidth: 1.5,
  },
  modalIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#475569',
  },
  modalOptionTextSelected: {
    color: '#0754C0',
    fontFamily: Fonts.bold,
  },
  modalRadioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0754C0',
  },
});
