import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Shadows } from '../Theme/colors';
import { Fonts } from '../Theme/Fonts';
import { useAuth } from '../Context/AuthContext';
import Back from '../Assets/Svg/Back.svg';
import { Ionicons } from '@expo/vector-icons';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../utils/firebase';

export default function Login({ route, navigation }: any) {
  const { login } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isResendActive, setIsResendActive] = useState(false);

  const recaptchaVerifier = useRef<any>(null);
  const [verificationId, setVerificationId] = useState<string>('');
  const otpRefs = useRef<any[]>([]);

  // Count down timer for Resend OTP code
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsResendActive(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOtp = async () => {
    if (phone.length === 10) {
      const formattedPhone = `+91${phone}`;

      if (isFirebaseConfigured && auth) {
        try {
          const phoneProvider = new PhoneAuthProvider(auth);
          const verId = await phoneProvider.verifyPhoneNumber(
            formattedPhone,
            recaptchaVerifier.current
          );
          setVerificationId(verId);
          setStep('otp');
          setTimer(30);
          setIsResendActive(false);
        } catch (error) {
          console.error("Firebase SMS OTP send error:", error);
          Alert.alert("Error", "Failed to send verification code. Check number/internet and try again.");
        }
      } else {
        // Fallback mock mode
        setStep('otp');
        setTimer(30);
        setIsResendActive(false);
        Alert.alert("Mock Mode Active", "Firebase is not configured. Enter '123456' to proceed.");
      }
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanText;
    setOtp(newOtp);

    // Auto-advance if number entered
    if (cleanText && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 filled
    const completeOtp = newOtp.join('');
    if (completeOtp.length === 6 && index === 5) {
      handleVerify(completeOtp);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // On backspace, focus previous input box
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    setTimer(30);
    setIsResendActive(false);
    setOtp(['', '', '', '', '', '']);
    setTimeout(() => {
      otpRefs.current[0]?.focus();
    }, 100);
  };

  const handleVerify = async (enteredOtp?: string) => {
    const finalOtp = enteredOtp || otp.join('');
    if (finalOtp.length === 6) {
      if (isFirebaseConfigured && auth && verificationId) {
        try {
          const credential = PhoneAuthProvider.credential(
            verificationId,
            finalOtp
          );
          const userCredential = await signInWithCredential(auth, credential);
          const firebaseUser = userCredential.user;

          await login(phone, { id: firebaseUser.uid });
          const storedRaw = await import('@react-native-async-storage/async-storage')
            .then(m => m.default.getItem('@flatemate_user'));
          const storedUser = storedRaw ? JSON.parse(storedRaw) : null;
          if (!storedUser?.name) {
            navigation.navigate('ProfileSetup', { phone, id: firebaseUser.uid });
          } else {
            navigation.goBack();
          }
        } catch (error) {
          console.error("OTP verification failed:", error);
          Alert.alert("Error", "Invalid verification code. Please try again.");
        }
      } else {
        // Fallback simulated verification
        if (finalOtp === '123456') {
          await login(phone);
          const storedRaw = await import('@react-native-async-storage/async-storage')
            .then(m => m.default.getItem('@flatemate_user'));
          const storedUser = storedRaw ? JSON.parse(storedRaw) : null;
          if (!storedUser?.name) {
            navigation.navigate('ProfileSetup', { phone });
          } else {
            navigation.goBack();
          }
        } else {
          Alert.alert("Error", "Simulated OTP matches '123456' only.");
        }
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.Gray50 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Top Header Row */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step === 'otp' ? setStep('phone') : navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Back height={22} width={22} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIconCircle}>
              <Ionicons name="home" size={32} color="#0F172A" />
            </View>
            <Text style={styles.logoText}>FlateMate</Text>
            <Text style={styles.taglineText}>Zero Brokerage · Verified Homes</Text>
          </View>

          {step === 'phone' ? (
            /* STEP 1: Phone input */
            <View style={styles.formContainer}>
              <Text style={styles.title}>Welcome to FlateMate</Text>
              <Text style={styles.subtitle}>Enter your mobile number to get started</Text>

              <View style={styles.phoneInputRow}>
                <View style={styles.prefixContainer}>
                  <Text style={styles.prefixText}>🇮🇳 +91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={10}
                  value={phone}
                  onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, phone.length !== 10 && styles.disabledButton]}
                disabled={phone.length !== 10}
                onPress={handleSendOtp}
                activeOpacity={0.85}
              >
                <Text style={styles.submitButtonText}>Send Verification Code</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* STEP 2: OTP inputs */
            <View style={styles.formContainer}>
              <Text style={styles.title}>Enter Verification Code</Text>
              <Text style={styles.subtitle}>Sent to +91 {phone.substring(0, 3)}••••{phone.substring(7)}</Text>

              <View style={styles.otpInputRow}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    style={[styles.otpBox, digit !== '' && styles.otpBoxFilled]}
                    keyboardType="numeric"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    autoFocus={index === 0}
                  />
                ))}
              </View>

              <View style={styles.timerRow}>
                {isResendActive ? (
                  <TouchableOpacity onPress={handleResend}>
                    <Text style={styles.resendText}>Didn't receive code? <Text style={{ fontFamily: Fonts.bold, color: '#0754C0' }}>Resend</Text></Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.timerText}>Resend code in {timer}s</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.submitButton, otp.join('').length !== 6 && styles.disabledButton]}
                disabled={otp.join('').length !== 6}
                onPress={() => handleVerify()}
                activeOpacity={0.85}
              >
                <Text style={styles.submitButtonText}>Verify & Continue</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.White,
    borderWidth: 1,
    borderColor: Colors.Gray800,
    ...Shadows.subtle,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  logoText: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  taglineText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#64748B',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  formContainer: {
    backgroundColor: Colors.White,
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.card,
  },
  title: {
    fontSize: 26,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  phoneInputRow: {
    flexDirection: 'row',
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: Colors.White,
  },
  prefixContainer: {
    width: 76,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1.5,
    borderRightColor: '#E2E8F0',
  },
  prefixText: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: '#0F172A',
  },
  submitButton: {
    height: 52,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.45,
  },
  submitButtonText: {
    color: Colors.White,
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  // OTP elements
  otpInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 54,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  otpBoxFilled: {
    borderColor: '#0F172A',
    backgroundColor: Colors.White,
    borderWidth: 2,
  },
  timerRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Fonts.medium,
  },
  resendText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Fonts.regular,
  },
});
