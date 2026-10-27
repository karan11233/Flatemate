import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../Theme/colors';
import { Fonts } from '../Theme/Fonts';
import { useAuth } from '../Context/AuthContext';
import { dummyListings } from '../utils/dummyData';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ScheduleVisit({ route, navigation }: any) {
  const { bookVisit, user } = useAuth();
  const { propertyId } = route.params || {};
  const [property, setProperty] = useState<any>(null);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<'Morning' | 'Afternoon' | 'Evening' | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Generate next 7 days for calendar selection
  const getNext7Days = () => {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({
        dayName: dayNames[d.getDay()],
        dayOfMonth: d.getDate(),
        month: monthNames[d.getMonth()],
        fullDate: d.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      });
    }
    return days;
  };

  const datesList = getNext7Days();

  useEffect(() => {
    const findProperty = async () => {
      if (!propertyId) return;
      let found = dummyListings.find((l) => l.id === propertyId);
      if (!found) {
        try {
          const cached = await AsyncStorage.getItem('@flatemate_listings');
          if (cached) {
            const listings = JSON.parse(cached);
            found = listings.find((l: any) => l.id === propertyId);
          }
        } catch (e) { console.error(e); }
      }
      if (found) setProperty(found);
    };
    findProperty();
    if (datesList.length > 0) setSelectedDate(datesList[0].fullDate);
  }, [propertyId]);

  const handleConfirmBooking = async () => {
    if (!propertyId) return;
    if (!user) {
      Alert.alert('Login Required', 'Please log in to schedule a visit.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    if (!selectedDate) {
      Alert.alert('Select Date', 'Please select a date to continue.');
      return;
    }
    if (!selectedTimeSlot) {
      Alert.alert('Select Time', 'Please select a time slot to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      await bookVisit(propertyId, selectedDate, selectedTimeSlot, notes);
      setIsSubmitting(false);
      setShowSuccessModal(true);
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert('Booking Failed', 'Failed to book visit. Please try again.');
    }
  };

  if (!property) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.Primary} />
      </SafeAreaView>
    );
  }

  const timeSlots = [
    { label: 'Morning', time: '10:00 AM - 01:00 PM', icon: 'sunny-outline' },
    { label: 'Afternoon', time: '01:00 PM - 05:00 PM', icon: 'partly-sunny-outline' },
    { label: 'Evening', time: '05:00 PM - 08:00 PM', icon: 'moon-outline' },
  ];

  const mainImageSource = property.photos && property.photos.length > 0
    ? (typeof property.photos[0] === 'number' ? property.photos[0] : { uri: property.photos[0] })
    : require('../Assets/Images/Banner.png');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.Gray100} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule a Visit</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Property Brief Card */}
        <View style={styles.propertyCard}>
          <Image source={mainImageSource} style={styles.propertyImage} />
          <View style={styles.propertyDetails}>
            <Text style={styles.propertyTitle} numberOfLines={1}>
              {property.title}
            </Text>
            <Text style={styles.propertyLocation}>
              📍 {property.area}, {property.city}
            </Text>
            <Text style={styles.propertyPrice}>
              ₹{property.rent.toLocaleString('en-IN')} / month
            </Text>
          </View>
        </View>

        {/* Calendar Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesList}
          >
            {datesList.map((item, index) => {
              const isSelected = selectedDate === item.fullDate;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dateCard, isSelected && styles.selectedDateCard]}
                  onPress={() => setSelectedDate(item.fullDate)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dateDayName, isSelected && styles.selectedDateText]}>
                    {item.dayName}
                  </Text>
                  <Text style={[styles.dateDayOfMonth, isSelected && styles.selectedDateText]}>
                    {item.dayOfMonth}
                  </Text>
                  <Text style={[styles.dateMonth, isSelected && styles.selectedDateText]}>
                    {item.month}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time Slot Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time Slot</Text>
          <View style={styles.timeSlotsGrid}>
            {timeSlots.map((slot) => {
              const isSelected = selectedTimeSlot === slot.label;
              return (
                <TouchableOpacity
                  key={slot.label}
                  style={[styles.timeSlotCard, isSelected && styles.selectedTimeSlotCard]}
                  onPress={() => setSelectedTimeSlot(slot.label as any)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.timeSlotIconCircle, isSelected && styles.selectedTimeSlotIconCircle]}>
                    <Ionicons
                      name={slot.icon as any}
                      size={20}
                      color={isSelected ? '#0F172A' : '#0754C0'}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={[styles.timeSlotLabel, isSelected && styles.selectedTimeSlotText]}
                    >
                      {slot.label}
                    </Text>
                    <Text
                      style={[
                        styles.timeSlotTime,
                        isSelected && styles.selectedTimeSlotSubText,
                      ]}
                    >
                      {slot.time}
                    </Text>
                  </View>
                  <View style={[styles.radioCircle, isSelected && styles.selectedRadioCircle]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notes Input Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Mention any specific queries or requests for the host..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Sticky Bottom Confirm Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmBooking}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm Visit Booking</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={36} color="#ffffff" />
            </View>

            <Text style={styles.modalTitle}>Visit Scheduled!</Text>
            <Text style={styles.modalDescription}>
              Your request for a visit at <Text style={{ fontFamily: Fonts.bold }}>{property.title}</Text> has been successfully placed with the host.
            </Text>

            <View style={styles.simulationBanner}>
              <Ionicons name="information-circle" size={18} color="#15803D" />
              <Text style={styles.simulationText}>
                Simulation active: Host approval will run in the background (takes 5s).
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              activeOpacity={0.8}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate('MainTabs', { screen: 'Profile' });
              }}
            >
              <Text style={styles.modalButtonText}>View Visits in Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  container: {
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
  backButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  propertyCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    alignItems: 'center',
    ...Shadows.card,
  },
  propertyImage: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  propertyDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  propertyTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  propertyLocation: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#64748B',
    marginTop: 4,
  },
  propertyPrice: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    marginTop: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  datesList: {
    paddingRight: 16,
    paddingVertical: 2,
  },
  dateCard: {
    width: 70,
    height: 90,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    ...Shadows.subtle,
  },
  selectedDateCard: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
    ...Shadows.primary,
  },
  dateDayName: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#64748B',
  },
  dateDayOfMonth: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    marginVertical: 2,
  },
  dateMonth: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#64748B',
  },
  selectedDateText: {
    color: '#FFFFFF',
  },
  timeSlotsGrid: {
    gap: 10,
  },
  timeSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    ...Shadows.subtle,
  },
  selectedTimeSlotCard: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
    ...Shadows.primary,
  },
  timeSlotIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTimeSlotIconCircle: {
    backgroundColor: '#FFFFFF',
  },
  timeSlotLabel: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  timeSlotTime: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },
  selectedTimeSlotText: {
    color: '#FFFFFF',
  },
  selectedTimeSlotSubText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadioCircle: {
    borderColor: '#FFFFFF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    height: 100,
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: '#0F172A',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
    paddingBottom: 24,
    ...Shadows.float,
  },
  confirmButton: {
    height: 50,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.primary,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    ...Shadows.float,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#15803D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...Shadows.card,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  simulationBanner: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  simulationText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#15803D',
    lineHeight: 16,
  },
  modalButton: {
    height: 48,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.primary,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
});
