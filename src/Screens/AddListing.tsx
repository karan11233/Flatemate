import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Shadows } from '../Theme/colors';
import { Fonts } from '../Theme/Fonts';
import { addDummyListing, Listing, dummyListings } from '../utils/dummyData';
import { useAuth } from '../Context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Back from '../Assets/Svg/Back.svg';
import { collection, addDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../utils/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function AddListing({ navigation }: any) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  // H-7: Auth guard — redirect unauthenticated users to Login
  useEffect(() => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'You must be logged in to list a property.',
        [{ text: 'Login', onPress: () => navigation.navigate('Login') }]
      );
    }
  }, [user]);

  // Form State
  const [listingType, setListingType] = useState<'flat' | 'roommate'>('flat');
  const [photos, setPhotos] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [rent, setRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [bhk, setBhk] = useState<number>(2);
  const [floor, setFloor] = useState('3rd');
  const [furnished, setFurnished] = useState(true);
  const [area, setArea] = useState('');
  const [availableFrom, setAvailableFrom] = useState('Available now');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  
  // Roommate-specific state
  const [currentFlatmates, setCurrentFlatmates] = useState<number>(1);
  const [totalCapacity, setTotalCapacity] = useState<number>(2);
  const [genderPreference, setGenderPreference] = useState<'Any' | 'Males only' | 'Females only'>('Any');
  const [roommateNote, setRoommateNote] = useState('');

  const amenitiesList = [
    'Wifi',
    'AC',
    'Washing Machine',
    'Geyser',
    'Parking',
    'RO Water',
    'Gas Stove',
    '24/7 Security',
    'Lift',
  ];

  // Helper to simulate adding photos from local asset bank
  const handleAddPhotoMock = () => {
    const mockImageBank = [
      require('../Assets/Images/Flat1.png'),
      require('../Assets/Images/FlatImage.png'),
      require('../Assets/Images/DetailImage.png'),
    ];
    
    // Pick photo sequentially
    const nextPhoto = mockImageBank[photos.length % mockImageBank.length];
    setPhotos([...photos, nextPhoto]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, idx) => idx !== index));
  };

  const toggleAmenity = (amenity: string) => {
    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter((a) => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  };

  const handleSubmit = async () => {
    const newListingData: any = {
      title: title || `${bhk} BHK in ${area}`,
      rent: parseInt(rent) || 8000,
      deposit: parseInt(deposit) || 15000,
      bhk: bhk,
      area: area || 'Satellite',
      city: 'Ahmedabad',
      floor: floor,
      furnished: furnished,
      amenities: amenities.length > 0 ? amenities : ['Free wifi', 'AC', '24/7 Security'],
      photos: photos.length >= 3 ? photos : [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
      ],
      listingType: listingType,
      isVerified: false,
      availableFrom: availableFrom,
      landlordId: user?.id || 'landlord_karan',
      landlordName: user?.name || 'Karan',
      landlordInitials: user?.name ? user.name.charAt(0).toUpperCase() : 'K',
      landlordJoined: '2026',
      landlordRentalsCompleted: 0,
      landlordPhone: user?.phone || '9876543210',
      distanceText: '10 min from Metro',
      rating: '4.0',
      badges: [listingType === 'roommate' ? 'Roommate Slot' : 'Full Flat', 'Bachelors', 'New Listing'],
      description: description || 'No description provided.',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    if (listingType === 'roommate') {
      newListingData.currentFlatmates = currentFlatmates;
      newListingData.totalCapacity = totalCapacity;
      newListingData.genderPreference = genderPreference;
      
      // Seed matching and compatibility details for the detail page
      newListingData.compatibilityScore = 90;
      newListingData.compatibilityFactors = ["Vegetarian Friendly", "Working Professionals", "Quiet Hours"];
      newListingData.expenseSplitText = `Rent: ₹${rent}/mo. Cooking and utility bills split equally.`;
      newListingData.roommates = [
        {
          name: user?.name || 'Karan',
          age: 23,
          gender: user?.gender || 'Male',
          profession: user?.profession || 'Software Engineer',
          interests: ['Tech', 'Reading', 'Music'],
          avatarColor: Colors.Primary,
          initials: user?.name ? user.name.charAt(0).toUpperCase() : 'K'
        }
      ];
    }

    const saveListingLocally = async (newListing: any) => {
      try {
        addDummyListing(newListing); // Update memory array for current session
        const cached = await AsyncStorage.getItem('@flatemate_listings');
        let listingsList = cached ? JSON.parse(cached) : [...dummyListings];
        // Ensure newListing isn't already in the list
        if (!listingsList.some((l: any) => l.id === newListing.id)) {
          listingsList.unshift(newListing);
        }
        await AsyncStorage.setItem('@flatemate_listings', JSON.stringify(listingsList));
      } catch (e) {
        console.error("Failed to save listing locally:", e);
      }
    };

    const localId = Date.now().toString();
    const finalListing = { id: localId, ...newListingData };

    if (isFirebaseConfigured && db) {
      try {
        const docRef = await addDoc(collection(db, 'listings'), newListingData);
        await saveListingLocally({ id: docRef.id, ...newListingData });
      } catch (error) {
        console.error("Error writing listing to Firestore:", error);
        Alert.alert("Error", "Failed to list property in cloud database. Saving locally instead.");
        await saveListingLocally(finalListing);
      }
    } else {
      await saveListingLocally(finalListing);
    }

    Alert.alert('Success', 'Property Listed Successfully!', [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  // Determine total steps depending on type
  const totalSteps = listingType === 'roommate' ? 7 : 6;

  // Form validations for each step
  const canGoNext = () => {
    if (step === 1) return true;
    if (step === 2) return photos.length >= 3;
    if (step === 3) return title.trim() && rent && deposit && area.trim();
    if (step === 4) return true;
    if (step === 5) return description.trim().length >= 10;
    if (step === 6 && listingType === 'roommate') return totalCapacity > currentFlatmates;
    return true;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.Gray50 }} edges={['top']}>
      {/* Header with step navigation info */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Back height={20} width={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>List Your Property</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>
            Step {step} of {totalSteps}
          </Text>
        </View>
      </View>

      {/* Step Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${(step / totalSteps) * 100}%` }]} />
      </View>

      {/* Main Step ScrollView Form */}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          /* STEP 1: Select listing type */
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Select listing type</Text>
            <Text style={styles.stepSub}>What kind of listing are you creating?</Text>

            <TouchableOpacity
              style={[styles.typeSelectionCard, listingType === 'flat' && styles.selectedTypeCard]}
              activeOpacity={0.8}
              onPress={() => setListingType('flat')}
            >
              <View style={[styles.typeIconBox, listingType === 'flat' && styles.selectedTypeIconBox]}>
                <Ionicons
                  name="home"
                  size={24}
                  color={listingType === 'flat' ? '#0F172A' : '#64748B'}
                />
              </View>
              <View style={styles.typeInfo}>
                <Text style={styles.typeTitle}>Full flat for rent</Text>
                <Text style={styles.typeSub}>Rent the entire house to family/bachelors</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeSelectionCard, listingType === 'roommate' && styles.selectedTypeCard]}
              activeOpacity={0.8}
              onPress={() => setListingType('roommate')}
            >
              <View style={[styles.typeIconBox, listingType === 'roommate' && styles.selectedTypeIconBox]}>
                <Ionicons
                  name="people"
                  size={24}
                  color={listingType === 'roommate' ? '#0F172A' : '#64748B'}
                />
              </View>
              <View style={styles.typeInfo}>
                <Text style={styles.typeTitle}>
                  Roommate slot
                </Text>
                <Text style={styles.typeSub}>I have a flat already, looking for flatmates</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          /* STEP 2: Photos upload grid */
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Add photos</Text>
            <Text style={styles.stepSub}>Minimum 3 photos are required to list a flat.</Text>

            <View style={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoBox}>
                  <Image source={photo} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.deletePhotoBtn}
                    onPress={() => handleRemovePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#FF1010" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addPhotoBox} onPress={handleAddPhotoMock}>
                <Ionicons name="add" size={32} color={Colors.Primary} />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            </View>
            
            {photos.length < 3 && (
              <Text style={styles.warningText}>
                Please add at least {3 - photos.length} more photo(s).
              </Text>
            )}
          </View>
        )}

        {step === 3 && (
          /* STEP 3: Basic details form */
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Basic details</Text>
            <Text style={styles.stepSub}>Provide specific details of the property.</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Cozy 2 BHK in Vastrapur"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Rent per month (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Rent"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={rent}
                  onChangeText={(text) => setRent(text.replace(/[^0-9]/g, ''))}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Deposit amount (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Deposit"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={deposit}
                  onChangeText={(text) => setDeposit(text.replace(/[^0-9]/g, ''))}
                />
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>BHK</Text>
                <View style={styles.selectorsRow}>
                  {[1, 2, 3, 4].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[styles.selectorBtn, bhk === num && styles.activeSelectorBtn]}
                      onPress={() => setBhk(num)}
                    >
                      <Text style={[styles.selectorBtnText, bhk === num && { color: '#ffffff' }]}>
                        {num === 4 ? '3+' : `${num}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Floor</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 3rd"
                  placeholderTextColor={Colors.Gray500}
                  value={floor}
                  onChangeText={setFloor}
                />
              </View>
              
              <View style={[styles.formGroup, { justifyContent: 'center', marginLeft: 16 }]}>
                <Text style={styles.label}>Is Furnished?</Text>
                <Switch
                  value={furnished}
                  onValueChange={setFurnished}
                  trackColor={{ false: '#E2E8F0', true: '#0F172A' }}
                  thumbColor={'#FFFFFF'}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Locality / Area (Ahmedabad)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Vastrapur"
                placeholderTextColor="#94A3B8"
                value={area}
                onChangeText={setArea}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Available From</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Available now or 15 Jun 2026"
                placeholderTextColor="#94A3B8"
                value={availableFrom}
                onChangeText={setAvailableFrom}
              />
            </View>
          </View>
        )}

        {step === 4 && (
          /* STEP 4: Amenities checkboxes toggler */
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Select amenities</Text>
            <Text style={styles.stepSub}>Toggle what amenities are available at the flat.</Text>

            <View style={styles.amenitiesGrid}>
              {amenitiesList.map((amenity) => {
                const isSelected = amenities.includes(amenity);
                return (
                  <TouchableOpacity
                    key={amenity}
                    style={[
                      styles.amenityToggleChip,
                      isSelected && styles.amenityToggleChipActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => toggleAmenity(amenity)}
                  >
                    <Text style={[styles.amenityToggleText, isSelected && styles.amenityToggleTextActive]}>
                      {amenity}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 5 && (
          /* STEP 5: Description multi-line counter */
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Describe your flat</Text>
            <Text style={styles.stepSub}>Be honest. High quality descriptions get better leads.</Text>

            <TextInput
              style={styles.textArea}
              placeholder="Describe your flat honestly. Clean photos and honest descriptions get more genuine leads."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={6}
              maxLength={500}
              value={description}
              onChangeText={setDescription}
            />
            <Text style={styles.charCounter}>{description.length} / 500 characters</Text>
          </View>
        )}

        {step === 6 && listingType === 'roommate' && (
          /* STEP 6: Roommates details details (Roommate only) */
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Roommate details</Text>
            <Text style={styles.stepSub}>Provide specific details of current occupancies.</Text>

            <View style={styles.rowInputs}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Current flatmates</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={currentFlatmates.toString()}
                  onChangeText={(text) => setCurrentFlatmates(parseInt(text.replace(/[^0-9]/g, '')) || 1)}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Total capacity</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={totalCapacity.toString()}
                  onChangeText={(text) => setTotalCapacity(parseInt(text.replace(/[^0-9]/g, '')) || 2)}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Gender Preference</Text>
              <View style={styles.selectorsRow}>
                {['Any', 'Males only', 'Females only'].map((pref) => {
                  const isSelected = genderPreference === pref;
                  return (
                    <TouchableOpacity
                      key={pref}
                      style={[
                        styles.genderSelectorBtn,
                        isSelected && styles.genderSelectorBtnActive,
                      ]}
                      onPress={() => setGenderPreference(pref as any)}
                    >
                      <Text style={[styles.genderSelectorText, isSelected && styles.genderSelectorTextActive]}>
                        {pref}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Existing flatmate details note</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. We are 2 IT professionals, cook is available"
                placeholderTextColor="#94A3B8"
                value={roommateNote}
                onChangeText={setRoommateNote}
              />
            </View>
          </View>
        )}

        {((step === 6 && listingType === 'flat') || (step === 7 && listingType === 'roommate')) && (
          /* STEP FINAL: Review Screen Details */
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Review your listing</Text>
            <Text style={styles.stepSub}>Check all details before submitting.</Text>

            <View style={styles.reviewGroup}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Type:</Text>
                <Text style={styles.reviewValue}>
                  {listingType === 'roommate' ? 'Roommate Slot' : 'Full Flat'}
                </Text>
                <TouchableOpacity onPress={() => setStep(1)}>
                  <Text style={styles.editBtn}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Photos:</Text>
                <Text style={styles.reviewValue}>{photos.length} added</Text>
                <TouchableOpacity onPress={() => setStep(2)}>
                  <Text style={styles.editBtn}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Title:</Text>
                <Text style={styles.reviewValue} numberOfLines={1}>{title}</Text>
                <TouchableOpacity onPress={() => setStep(3)}>
                  <Text style={styles.editBtn}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Rent:</Text>
                <Text style={styles.reviewValue}>₹{rent}/mo</Text>
                <TouchableOpacity onPress={() => setStep(3)}>
                  <Text style={styles.editBtn}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Area:</Text>
                <Text style={styles.reviewValue}>{area}</Text>
                <TouchableOpacity onPress={() => setStep(3)}>
                  <Text style={styles.editBtn}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Amenities:</Text>
                <Text style={styles.reviewValue} numberOfLines={1}>{amenities.join(', ')}</Text>
                <TouchableOpacity onPress={() => setStep(4)}>
                  <Text style={styles.editBtn}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Form Navigation Action Buttons */}
      <View style={styles.footer}>
        {((step === 6 && listingType === 'flat') || (step === 7 && listingType === 'roommate')) ? (
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>List My Property</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, !canGoNext() && styles.disabledNextBtn]}
            disabled={!canGoNext()}
            onPress={() => setStep(step + 1)}
          >
            <Text style={styles.nextBtnText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  stepBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  stepText: {
    fontSize: 12,
    color: '#0754C0',
    fontFamily: Fonts.bold,
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  progressBarFill: {
    height: 3,
    backgroundColor: '#0F172A',
  },
  content: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 36,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.card,
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  stepSub: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Fonts.regular,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  // Selection
  typeSelectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    marginBottom: 12,
    gap: 14,
    backgroundColor: '#FFFFFF',
  },
  selectedTypeCard: {
    borderColor: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  typeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTypeIconBox: {
    backgroundColor: '#E2E8F0',
  },
  typeInfo: {
    flex: 1,
    gap: 3,
  },
  typeTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  typeSub: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Fonts.regular,
    lineHeight: 16,
  },
  // Photo Grid
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  photoBox: {
    width: (width - 76) / 3,
    height: 88,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  deletePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
  },
  addPhotoBox: {
    width: (width - 76) / 3,
    height: 88,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0754C0',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#0754C0',
  },
  warningText: {
    fontSize: 12,
    color: '#EF4444',
    fontFamily: Fonts.medium,
    marginTop: 14,
  },
  // Form Elements
  formGroup: {
    marginBottom: 16,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#0F172A',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
    fontFamily: Fonts.medium,
    backgroundColor: '#FFFFFF',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  selectorsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  selectorBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeSelectorBtn: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  selectorBtnText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#475569',
  },
  genderSelectorBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderSelectorBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  genderSelectorText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#475569',
  },
  genderSelectorTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  // Amenities
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityToggleChip: {
    height: 38,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  amenityToggleChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  amenityToggleText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#475569',
  },
  amenityToggleTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  // Description
  textArea: {
    height: 120,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#0F172A',
    fontFamily: Fonts.regular,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 6,
    fontFamily: Fonts.regular,
  },
  // Review Section
  reviewGroup: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  reviewRow: {
    flexDirection: 'row',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewLabel: {
    width: 90,
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#64748B',
  },
  reviewValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  editBtn: {
    fontSize: 13,
    color: '#0754C0',
    fontFamily: Fonts.bold,
    paddingLeft: 8,
  },
  // Footer
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...Shadows.subtle,
  },
  nextBtn: {
    height: 48,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.primary,
  },
  disabledNextBtn: {
    opacity: 0.5,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  submitBtn: {
    height: 48,
    backgroundColor: '#15803D',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
});
