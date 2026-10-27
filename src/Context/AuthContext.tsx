import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../utils/firebase';
import { dummyListings, LifestyleHabits, defaultUserHabits } from '../utils/dummyData';


export interface VisitBooking {
  id: string;
  listingId: string;
  propertyId: string;
  date: string;
  timeSlot: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'Pending' | 'Confirmed' | 'Cancelled';
  propertyTitle: string;
  propertyImage: any;
  landlordPhone: string;
  createdAt?: string;
}

export type ScheduledVisit = VisitBooking;

export interface RentAgreement {
  id: string;
  landlordId: string;
  landlordName: string;
  landlordPhone: string;
  landlordIdType: string;
  landlordIdNumber: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  tenantIdType: string;
  tenantIdNumber: string;
  propertyTitle: string;
  propertyAddress: string;
  rentAmount: number;
  depositAmount: number;
  durationMonths: number;
  noticePeriodDays: number;
  startDate: string;
  status: 'draft' | 'pending_tenant_signature' | 'pending_landlord_signature' | 'active' | 'expired';
  tenantSigned?: boolean;
  landlordSigned?: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  gender: string;
  profession: string;
  avatar: any;
  contactsUnlocked: string[];
  creditBalance: number;
  savedListings: string[];
  isIdentityVerified?: boolean;
  identityVerificationStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  identityDocType?: string;
  identityDocFront?: string;
  identityDocBack?: string;
  visits: VisitBooking[];
  subscriptionPlan?: 'free' | 'early_bird' | 'pro';
  subscriptionExpiry?: string;
  rentAgreements?: RentAgreement[];
  habits?: LifestyleHabits;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  login: (phone: string, profileDetails?: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  unlockContact: (landlordPhone: string) => Promise<void>;
  purchasePackage: (landlordPhone: string, selectedPack: 1 | 3 | 5) => Promise<void>;
  useCreditToUnlock: (landlordPhone: string) => Promise<void>;
  toggleSaveListing: (listingId: string) => Promise<void>;
  bookVisit: (listingId: string, date: string, timeSlot: string, notes?: string) => Promise<void>;
  cancelVisit: (bookingId: string) => Promise<void>;
  subscribeToPlan: (plan: 'early_bird' | 'pro') => Promise<void>;
  uploadIdentityDocs: (idType: string, frontUri: string, backUri: string) => Promise<void>;
  saveRentAgreement: (agreement: Omit<RentAgreement, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
  signRentAgreement: (agreementId: string, role: 'landlord' | 'tenant') => Promise<void>;
  verifyPropertyListing: (listingId: string, docUri: string) => Promise<void>;
  updateHabits: (newHabits: Partial<LifestyleHabits>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  // Load user session on startup
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@flatemate_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // require resources can't be stored as string, fallback to standard profile avatar
          parsedUser.avatar = require('../Assets/Images/Profile.png');
          parsedUser.visits = parsedUser.visits || [];
          parsedUser.habits = parsedUser.habits || defaultUserHabits;
          setUser(parsedUser);
        }
      } catch (e) {
        console.error('Failed to load stored auth details', e);
      }
    };
    loadStoredAuth();
  }, []);

  const login = async (phone: string, profileDetails?: Partial<UserProfile>) => {
    // Generate base profile
    const userId = profileDetails?.id || "user_" + phone;
    let loggedInUser: UserProfile = {
      id: userId,
      name: profileDetails?.name || '',
      phone: phone,
      email: profileDetails?.email || '',
      gender: profileDetails?.gender || '',
      profession: profileDetails?.profession || '',
      avatar: require('../Assets/Images/Profile.png'),
      contactsUnlocked: profileDetails?.contactsUnlocked || [],
      creditBalance: profileDetails?.creditBalance || 0,
      savedListings: profileDetails?.savedListings || [],
      isIdentityVerified: profileDetails?.isIdentityVerified || false,
      identityVerificationStatus: profileDetails?.identityVerificationStatus || 'none',
      identityDocType: profileDetails?.identityDocType || '',
      identityDocFront: profileDetails?.identityDocFront || '',
      identityDocBack: profileDetails?.identityDocBack || '',
      visits: profileDetails?.visits || [],
      subscriptionPlan: profileDetails?.subscriptionPlan || 'free',
      subscriptionExpiry: profileDetails?.subscriptionExpiry || '',
      rentAgreements: profileDetails?.rentAgreements || [],
      habits: profileDetails?.habits || defaultUserHabits,
    };

    // Sync from Firestore if connected
    if (isFirebaseConfigured && db) {
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const dbData = userDoc.data();
          loggedInUser = {
            ...loggedInUser,
            name: dbData.name !== undefined ? dbData.name : loggedInUser.name,
            email: dbData.email !== undefined ? dbData.email : loggedInUser.email,
            gender: dbData.gender !== undefined ? dbData.gender : loggedInUser.gender,
            profession: dbData.profession !== undefined ? dbData.profession : loggedInUser.profession,
            contactsUnlocked: dbData.contactsUnlocked !== undefined ? dbData.contactsUnlocked : loggedInUser.contactsUnlocked,
            creditBalance: dbData.creditBalance !== undefined ? dbData.creditBalance : loggedInUser.creditBalance,
            savedListings: dbData.savedListings !== undefined ? dbData.savedListings : loggedInUser.savedListings,
            isIdentityVerified: dbData.isIdentityVerified !== undefined ? dbData.isIdentityVerified : loggedInUser.isIdentityVerified,
            identityVerificationStatus: dbData.identityVerificationStatus !== undefined ? dbData.identityVerificationStatus : loggedInUser.identityVerificationStatus,
            identityDocType: dbData.identityDocType !== undefined ? dbData.identityDocType : loggedInUser.identityDocType,
            identityDocFront: dbData.identityDocFront !== undefined ? dbData.identityDocFront : loggedInUser.identityDocFront,
            identityDocBack: dbData.identityDocBack !== undefined ? dbData.identityDocBack : loggedInUser.identityDocBack,
            visits: dbData.visits !== undefined ? dbData.visits : loggedInUser.visits,
            subscriptionPlan: dbData.subscriptionPlan !== undefined ? dbData.subscriptionPlan : loggedInUser.subscriptionPlan,
            subscriptionExpiry: dbData.subscriptionExpiry !== undefined ? dbData.subscriptionExpiry : loggedInUser.subscriptionExpiry,
            rentAgreements: dbData.rentAgreements !== undefined ? dbData.rentAgreements : loggedInUser.rentAgreements,
          };
        } else {
          // Save new user profile to Firestore
          await setDoc(userDocRef, {
            id: loggedInUser.id,
            name: loggedInUser.name,
            phone: loggedInUser.phone,
            email: loggedInUser.email,
            gender: loggedInUser.gender,
            profession: loggedInUser.profession,
            contactsUnlocked: loggedInUser.contactsUnlocked,
            creditBalance: loggedInUser.creditBalance,
            savedListings: loggedInUser.savedListings,
            isIdentityVerified: loggedInUser.isIdentityVerified,
            identityVerificationStatus: loggedInUser.identityVerificationStatus,
            identityDocType: loggedInUser.identityDocType,
            identityDocFront: loggedInUser.identityDocFront,
            identityDocBack: loggedInUser.identityDocBack,
            visits: loggedInUser.visits,
            subscriptionPlan: loggedInUser.subscriptionPlan,
            subscriptionExpiry: loggedInUser.subscriptionExpiry,
            rentAgreements: loggedInUser.rentAgreements,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error("Firestore user sync error:", err);
      }
    } else {
      // Local fallback: Restore full user profile if re-logging with same phone number
      try {
        const storedUser = await AsyncStorage.getItem('@flatemate_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.phone === phone) {
            loggedInUser = {
              ...loggedInUser,
              ...parsed,
              avatar: require('../Assets/Images/Profile.png'),
              ...(profileDetails || {})
            };
          }
        }
      } catch (e) {}
    }

    setUser(loggedInUser);
    try {
      await AsyncStorage.setItem('@flatemate_user', JSON.stringify(loggedInUser));
    } catch (e) {
      console.error('Failed to save user details', e);
    }
  };

  const logout = async () => {
    setUser(null);
    try {
      await AsyncStorage.removeItem('@flatemate_user');
    } catch (e) {
      console.error('Failed to clear stored auth details', e);
    }
  };

  const unlockContact = async (landlordPhone: string) => {
    if (!user) return;

    const updatedContacts = user.contactsUnlocked.includes(landlordPhone)
      ? user.contactsUnlocked
      : [...user.contactsUnlocked, landlordPhone];

    const updatedUser = {
      ...user,
      contactsUnlocked: updatedContacts,
    };

    // Update state immediately for a responsive UI
    setUser(updatedUser);

    // Save locally
    try {
      await AsyncStorage.setItem('@flatemate_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Failed to save user details locally', e);
    }

    // Save to Firestore if connected
    if (isFirebaseConfigured && db) {
      try {
        const userDocRef = doc(db, 'users', user.id);
        await setDoc(userDocRef, { contactsUnlocked: updatedContacts }, { merge: true });
      } catch (error) {
        console.error("Failed to update unlocked contact in Firestore:", error);
      }
    }
  };

  const purchasePackage = async (landlordPhone: string, selectedPack: 1 | 3 | 5) => {
    if (!user) return;

    let creditsToAdd = 0;
    if (selectedPack === 3) creditsToAdd = 2;
    else if (selectedPack === 5) creditsToAdd = 4;

    const updatedContacts = user.contactsUnlocked.includes(landlordPhone)
      ? user.contactsUnlocked
      : [...user.contactsUnlocked, landlordPhone];

    const updatedUser = {
      ...user,
      contactsUnlocked: updatedContacts,
      creditBalance: user.creditBalance + creditsToAdd,
    };

    // Update state immediately for a responsive UI
    setUser(updatedUser);

    // Save locally
    try {
      await AsyncStorage.setItem('@flatemate_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Failed to save user package purchase details locally', e);
    }

    // Save to Firestore if connected
    if (isFirebaseConfigured && db) {
      try {
        const userDocRef = doc(db, 'users', user.id);
        await setDoc(userDocRef, {
          contactsUnlocked: updatedContacts,
          creditBalance: updatedUser.creditBalance,
        }, { merge: true });
      } catch (error) {
        console.error("Failed to update user package purchase in Firestore:", error);
      }
    }
  };

  const useCreditToUnlock = async (landlordPhone: string) => {
    if (!user || user.creditBalance <= 0) return;

    const updatedContacts = user.contactsUnlocked.includes(landlordPhone)
      ? user.contactsUnlocked
      : [...user.contactsUnlocked, landlordPhone];

    const updatedUser = {
      ...user,
      contactsUnlocked: updatedContacts,
      creditBalance: user.creditBalance - 1,
    };

    // Update state immediately for a responsive UI
    setUser(updatedUser);

    // Save locally
    try {
      await AsyncStorage.setItem('@flatemate_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Failed to save user credit usage locally', e);
    }

    // Save to Firestore if connected
    if (isFirebaseConfigured && db) {
      try {
        const userDocRef = doc(db, 'users', user.id);
        await setDoc(userDocRef, {
          contactsUnlocked: updatedContacts,
          creditBalance: updatedUser.creditBalance,
        }, { merge: true });
      } catch (error) {
        console.error("Failed to update user credit usage in Firestore:", error);
      }
    }
  };

  const toggleSaveListing = async (listingId: string) => {
    if (!user) return;

    const saved = user.savedListings || [];
    const updatedSaved = saved.includes(listingId)
      ? saved.filter((id) => id !== listingId)
      : [...saved, listingId];

    const updatedUser = {
      ...user,
      savedListings: updatedSaved,
    };

    // Update state immediately for a responsive UI
    setUser(updatedUser);

    // Save locally
    try {
      await AsyncStorage.setItem('@flatemate_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Failed to save user details locally', e);
    }

    // Save to Firestore if connected
    if (isFirebaseConfigured && db) {
      try {
        const userDocRef = doc(db, 'users', user.id);
        await setDoc(userDocRef, { savedListings: updatedSaved }, { merge: true });
      } catch (error) {
        console.error("Failed to update saved listings in Firestore:", error);
      }
    }
  };

  const bookVisit = async (listingId: string, date: string, timeSlot: string, notes?: string) => {
    if (!user) return;

    const listing = dummyListings.find((l) => l.id === listingId);
    const propertyTitle = listing ? listing.title : 'Property Visit';
    const propertyImage = listing && listing.photos && listing.photos.length > 0 ? listing.photos[0] : '';
    const landlordPhone = listing ? listing.landlordPhone : '';

    const newBooking: VisitBooking = {
      id: "visit_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      listingId,
      propertyId: listingId,
      date,
      timeSlot,
      notes,
      status: 'pending',
      propertyTitle,
      propertyImage,
      landlordPhone,
    };

    const updatedVisits = [...(user.visits || []), newBooking];
    const updatedUser = {
      ...user,
      visits: updatedVisits,
    };

    setUser(updatedUser);

    // Save locally
    try {
      await AsyncStorage.setItem('@flatemate_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Failed to save user visit booking locally', e);
    }

    // Save to Firestore if connected
    if (isFirebaseConfigured && db) {
      try {
        const userDocRef = doc(db, 'users', user.id);
        await setDoc(userDocRef, { visits: updatedVisits }, { merge: true });
      } catch (error) {
        console.error("Failed to update user visits in Firestore:", error);
      }
    }

    // 5-second transition timer (simulates landlord confirmation)
    setTimeout(async () => {
      setUser((currentUser) => {
        if (!currentUser) return null;

        const latestVisits = (currentUser.visits || []).map((v) =>
          v.id === newBooking.id ? { ...v, status: 'confirmed' as const } : v
        );

        const finalUser = {
          ...currentUser,
          visits: latestVisits,
        };

        // Save updated state back to AsyncStorage asynchronously
        AsyncStorage.setItem('@flatemate_user', JSON.stringify(finalUser))
          .catch((e) => console.error('Failed to save confirmed visit locally', e));

        // Save updated state to Firestore if configured
        if (isFirebaseConfigured && db) {
          const userDocRef = doc(db, 'users', currentUser.id);
          setDoc(userDocRef, { visits: latestVisits }, { merge: true })
            .catch((error) => console.error("Failed to update confirmed visit in Firestore:", error));
        }

        return finalUser;
      });
    }, 5000);
  };

  const cancelVisit = async (bookingId: string) => {
    if (!user) return;

    const updatedVisits = (user.visits || []).map((v) =>
      v.id === bookingId ? { ...v, status: 'cancelled' as const } : v
    );

    const updatedUser = {
      ...user,
      visits: updatedVisits,
    };

    setUser(updatedUser);

    // Save locally
    try {
      await AsyncStorage.setItem('@flatemate_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Failed to save user visit cancellation locally', e);
    }

    // Save to Firestore if connected
    if (isFirebaseConfigured && db) {
      try {
        const userDocRef = doc(db, 'users', user.id);
        await setDoc(userDocRef, { visits: updatedVisits }, { merge: true });
      } catch (error) {
        console.error("Failed to update user visits cancellation in Firestore:", error);
      }
    }
  };

  const subscribeToPlan = async (plan: 'early_bird' | 'pro') => {
    if (!user) return;
    // Simulate 1-week subscription expiry
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    const updatedUser = {
      ...user,
      subscriptionPlan: plan,
      subscriptionExpiry: expiry.toISOString(),
      // Pro members get 999 credits (effectively unlimited)
      creditBalance: plan === 'pro' ? 999 : user.creditBalance + 1,
    };
    setUser(updatedUser);
    try {
      await AsyncStorage.setItem('@flatemate_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Failed to save subscription', e);
    }
    if (isFirebaseConfigured && db) {
      try {
        const userDocRef = doc(db, 'users', user.id);
        await setDoc(userDocRef, {
          subscriptionPlan: updatedUser.subscriptionPlan,
          subscriptionExpiry: updatedUser.subscriptionExpiry,
          creditBalance: updatedUser.creditBalance,
        }, { merge: true });
      } catch (error) {
        console.error('Failed to save subscription to Firestore:', error);
      }
    }
  };

  const uploadIdentityDocs = async (idType: string, frontUri: string, backUri: string) => {
    if (!user) return;
    const updatedUser: UserProfile = {
      ...user,
      identityVerificationStatus: 'pending',
      identityDocType: idType,
      identityDocFront: frontUri,
      identityDocBack: backUri,
      isIdentityVerified: false, // Under review
    };
    setUser(updatedUser);
    try {
      await AsyncStorage.setItem('@flatemate_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Failed to save identity docs locally', e);
    }
    if (isFirebaseConfigured && db) {
      try {
        const userDocRef = doc(db, 'users', user.id);
        await setDoc(userDocRef, {
          identityVerificationStatus: 'pending',
          identityDocType: idType,
          identityDocFront: frontUri,
          identityDocBack: backUri,
          isIdentityVerified: false,
        }, { merge: true });
      } catch (e) {
        console.error('Failed to save identity docs to Firestore', e);
      }
    }
  };

  const saveRentAgreement = async (agreementData: Omit<RentAgreement, 'id' | 'createdAt'> & { id?: string }) => {
    if (!user) return;
    const agreements = user.rentAgreements || [];
    let updatedAgreements = [...agreements];
    
    if (agreementData.id) {
      // Update existing
      updatedAgreements = agreements.map(a => 
        a.id === agreementData.id 
          ? { ...a, ...agreementData } as RentAgreement
          : a
      );
    } else {
      // Create new
      const newAgreement: RentAgreement = {
        ...agreementData,
        id: 'agreement_' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
      } as RentAgreement;
      updatedAgreements.push(newAgreement);
    }

    const updatedUser: UserProfile = {
      ...user,
      rentAgreements: updatedAgreements,
    };
    setUser(updatedUser);
    
    try {
      await AsyncStorage.setItem('@flatemate_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Failed to save agreement locally', e);
    }

    if (isFirebaseConfigured && db) {
      try {
        const userDocRef = doc(db, 'users', user.id);
        await setDoc(userDocRef, { rentAgreements: updatedAgreements }, { merge: true });
      } catch (e) {
        console.error('Failed to save agreement to Firestore', e);
      }
    }
  };

  const signRentAgreement = async (agreementId: string, role: 'landlord' | 'tenant') => {
    if (!user) return;
    const agreements = user.rentAgreements || [];
    const updatedAgreements = agreements.map(a => {
      if (a.id === agreementId) {
        const isLandlord = role === 'landlord';
        const updated = {
          ...a,
          landlordSigned: isLandlord ? true : a.landlordSigned,
          tenantSigned: !isLandlord ? true : a.tenantSigned,
        };
        // Update status based on signatures
        if (updated.landlordSigned && updated.tenantSigned) {
          updated.status = 'active' as const;
        } else if (updated.landlordSigned) {
          updated.status = 'pending_tenant_signature' as const;
        } else if (updated.tenantSigned) {
          updated.status = 'pending_landlord_signature' as const;
        }
        return updated as RentAgreement;
      }
      return a;
    });

    const updatedUser: UserProfile = {
      ...user,
      rentAgreements: updatedAgreements,
    };
    setUser(updatedUser);

    try {
      await AsyncStorage.setItem('@flatemate_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Failed to sign agreement locally', e);
    }

    if (isFirebaseConfigured && db) {
      try {
        const userDocRef = doc(db, 'users', user.id);
        await setDoc(userDocRef, { rentAgreements: updatedAgreements }, { merge: true });
      } catch (e) {
        console.error('Failed to sign agreement in Firestore', e);
      }
    }
  };

  const verifyPropertyListing = async (listingId: string, docUri: string) => {
    // Update locally stored listings
    try {
      const cached = await AsyncStorage.getItem('@flatemate_listings');
      let listings = cached ? JSON.parse(cached) : dummyListings;
      
      listings = listings.map((l: any) => {
        if (l.id === listingId) {
          return {
            ...l,
            isVerified: false, // Verification pending review
            verificationStatus: 'pending',
            verificationDocUri: docUri,
          };
        }
        return l;
      });

      await AsyncStorage.setItem('@flatemate_listings', JSON.stringify(listings));
    } catch (e) {
      console.error('Failed to update listing verification locally', e);
    }

    if (isFirebaseConfigured && db) {
      try {
        const listingDocRef = doc(db, 'listings', listingId);
        await setDoc(listingDocRef, {
          isVerified: false,
          verificationStatus: 'pending',
          verificationDocUri: docUri,
        }, { merge: true });
      } catch (e) {
        console.error('Failed to update listing verification in Firestore', e);
      }
    }
  };

  const updateHabits = async (newHabits: Partial<LifestyleHabits>) => {
    if (!user) return;
    const mergedHabits: LifestyleHabits = { ...(user.habits || defaultUserHabits), ...newHabits };
    const updatedUser = { ...user, habits: mergedHabits };
    setUser(updatedUser);

    try {
      await AsyncStorage.setItem('@flatemate_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Failed to update habits locally', e);
    }

    if (isFirebaseConfigured && db) {
      try {
        const userDocRef = doc(db, 'users', user.id);
        await setDoc(userDocRef, { habits: mergedHabits }, { merge: true });
      } catch (e) {
        console.error('Failed to sync habits to Firestore', e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoggedIn: !!user, 
      login, 
      logout, 
      unlockContact, 
      purchasePackage, 
      useCreditToUnlock,
      toggleSaveListing,
      bookVisit,
      cancelVisit,
      subscribeToPlan,
      uploadIdentityDocs,
      saveRentAgreement,
      signRentAgreement,
      verifyPropertyListing,
      updateHabits,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
