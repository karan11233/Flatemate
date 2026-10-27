export interface RoommateProfile {
  name: string;
  age: number;
  gender: string;
  profession: string;
  companyOrCollege?: string;
  interests: string[];
  avatarColor: string;
  initials: string;
  diet?: string;
  smoking?: string;
  drinking?: string;
  sleepSchedule?: string;
  workStyle?: string;
  cleanliness?: string;
  bio?: string;
}

export interface LifestyleHabits {
  diet: string;
  smoking: string;
  drinking: string;
  sleepSchedule: string;
  cleanliness: string;
  workStyle: string;
}

export const defaultUserHabits: LifestyleHabits = {
  diet: 'Vegetarian',
  smoking: 'Non-smoker',
  drinking: 'Non-drinker',
  sleepSchedule: 'Early Bird (11 PM)',
  cleanliness: 'High',
  workStyle: 'Working Professional',
};

export function calculateCompatibility(
  userHabits?: LifestyleHabits,
  roommates?: RoommateProfile[]
): {
  score: number;
  factors: { name: string; match: boolean; yourValue: string; flatmateValue: string }[];
} {
  const habits = userHabits || defaultUserHabits;
  if (!roommates || roommates.length === 0) {
    return { score: 80, factors: [] };
  }

  const firstRoommate = roommates[0];
  const factors = [
    {
      name: 'Dietary Preference',
      match:
        (firstRoommate.diet?.toLowerCase().includes('veg') && habits.diet.toLowerCase().includes('veg')) ||
        firstRoommate.diet === habits.diet,
      yourValue: habits.diet,
      flatmateValue: firstRoommate.diet || 'Pure Veg',
    },
    {
      name: 'Smoking Policy',
      match:
        firstRoommate.smoking?.toLowerCase().includes('non') ===
        habits.smoking.toLowerCase().includes('non'),
      yourValue: habits.smoking,
      flatmateValue: firstRoommate.smoking || 'Non-smoker',
    },
    {
      name: 'Sleep & Quiet Hours',
      match:
        firstRoommate.sleepSchedule?.toLowerCase().includes('early') ===
        habits.sleepSchedule.toLowerCase().includes('early'),
      yourValue: habits.sleepSchedule,
      flatmateValue: firstRoommate.sleepSchedule || 'Early Bird (11 PM)',
    },
    {
      name: 'Cleanliness Standard',
      match:
        firstRoommate.cleanliness === habits.cleanliness ||
        habits.cleanliness === 'High' ||
        firstRoommate.cleanliness === 'High',
      yourValue: habits.cleanliness,
      flatmateValue: firstRoommate.cleanliness || 'High Standard',
    },
    {
      name: 'Work / Lifestyle Routine',
      match: true,
      yourValue: habits.workStyle,
      flatmateValue: firstRoommate.workStyle || 'Working Professional',
    },
  ];

  const matchCount = factors.filter((f) => f.match).length;
  // Scaled realistically between 78% and 95%
  const score = Math.round((matchCount / factors.length) * 20 + 75);
  return { score: Math.min(score, 95), factors };
}

export interface Listing {
  id: string;
  title: string;
  rent: number;
  deposit: number;
  bhk: number;
  area: string;
  city: string;
  floor: string;
  furnished: boolean;
  amenities: string[];
  photos: any[];
  listingType: 'flat' | 'roommate';
  isVerified: boolean;
  availableFrom: string;
  landlordId: string;
  landlordName: string;
  landlordInitials: string;
  landlordJoined: string;
  landlordRentalsCompleted: number;
  landlordPhone: string;
  distanceText: string;
  rating: string;
  badges: string[];
  description: string;
  currentFlatmates?: number;
  totalCapacity?: number;
  genderPreference?: 'Males only' | 'Females only' | 'Any';
  isActive: boolean;
  createdAt: string;
  roommates?: RoommateProfile[];
  compatibilityScore?: number;
  compatibilityFactors?: string[];
  expenseSplitText?: string;
  cleanliness?: number;
  verificationStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  verificationDocUri?: string;
  noiseTolerance?: 'Quiet Hours' | 'Social' | 'Any';
  guestPolicy?: 'No' | 'Weekends' | 'Yes' | 'Any';
}

export const dummyListings: Listing[] = [
  {
    id: "1",
    title: "Modern 2BHK Near Metro",
    rent: 8500,
    deposit: 15000,
    bhk: 2,
    area: "Vastrapur",
    city: "Ahmedabad",
    floor: "3rd",
    furnished: true,
    amenities: ["Free wifi", "Furnished Bed", "AC", "RO Water", "Washing Machine", "24/7 Security", "Gas Stove"],
    photos: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
    ],
    listingType: "flat",
    isVerified: true,
    availableFrom: "01 Jun 2026",
    landlordId: "landlord_1",
    landlordName: "Suresh Kumar",
    landlordInitials: "SK",
    landlordJoined: "2021",
    landlordRentalsCompleted: 12,
    landlordPhone: "9876543210",
    distanceText: "5 min from Metro",
    rating: "4.8",
    badges: ["Full Flat", "Bachelors", "New Listing"],
    description: "A clean and fully furnished spacious 2BHK apartment located near the metro station and major colleges. The flat includes high-speed WiFi, washing machine, modular kitchen, attached bathroom, and 24/7 security. Perfect for young professionals and students.",
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "2",
    title: "Spacious 1 BHK Flat",
    rent: 6500,
    deposit: 10000,
    bhk: 1,
    area: "Satellite",
    city: "Ahmedabad",
    floor: "1st",
    furnished: true,
    amenities: ["Free wifi", "Furnished Bed", "RO Water", "Parking", "Gas Stove"],
    photos: [
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"
    ],
    listingType: "flat",
    isVerified: true,
    availableFrom: "Available now",
    landlordId: "landlord_2",
    landlordName: "Ramesh Patel",
    landlordInitials: "RP",
    landlordJoined: "2023",
    landlordRentalsCompleted: 4,
    landlordPhone: "9912345678",
    distanceText: "10 min from Metro",
    rating: "4.5",
    badges: ["Full Flat", "Any", "1 BHK"],
    description: "Well ventilated 1 BHK flat in a highly demand area of Satellite, Ahmedabad. Quiet society, security guard, lift facility, and nearby grocery shops. Rent is negotiable for long term tenants.",
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "3",
    title: "1 Roommate Slot in 3 BHK",
    rent: 4200,
    deposit: 8000,
    bhk: 3,
    area: "Bodakdev",
    city: "Ahmedabad",
    floor: "4th",
    furnished: true,
    amenities: ["Free wifi", "AC", "Washing Machine", "RO Water", "Lift", "Parking"],
    photos: [
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"
    ],
    listingType: "roommate",
    isVerified: true,
    availableFrom: "Available now",
    landlordId: "landlord_3",
    landlordName: "Meet Shah",
    landlordInitials: "MS",
    landlordJoined: "2024",
    landlordRentalsCompleted: 1,
    landlordPhone: "9823456789",
    distanceText: "15 min from Metro",
    rating: "4.2",
    badges: ["Shared Room", "Males Only", "2 spots filled"],
    description: "Looking for 1 chill roommate to join us in a spacious 3 BHK flat. We are two working professionals in IT. We have hired a cook and a maid for cleaning. Expenses are split equally at the end of the month.",
    currentFlatmates: 2,
    totalCapacity: 3,
    genderPreference: "Males only",
    isActive: true,
    createdAt: new Date().toISOString(),
    compatibilityScore: 88,
    compatibilityFactors: ["Non-Smoker", "Shared Cook", "Working Professionals", "Quiet Hours (11 PM - 7 AM)"],
    expenseSplitText: "Rent: ₹4,200/mo. Cook & Maid split equally (approx. ₹1,500/mo). Electricity split on actual usage.",
    roommates: [
      {
        name: "Meet Shah",
        age: 24,
        gender: "Male",
        profession: "Software Developer",
        companyOrCollege: "TCS Infocity",
        interests: ["Tech", "Gaming", "Cricket"],
        avatarColor: "#0F172A",
        initials: "MS",
        diet: "Pure Veg",
        smoking: "Non-smoker",
        drinking: "Non-drinker",
        sleepSchedule: "Early Bird (11 PM)",
        cleanliness: "High",
        workStyle: "Working Professional",
        bio: "Work at Infocity from 10 to 7. Keep the hall neat and chill with FIFA on weekends."
      },
      {
        name: "Hardik Patel",
        age: 23,
        gender: "Male",
        profession: "UI/UX Designer",
        companyOrCollege: "Fintech Studio",
        interests: ["Design", "Movies", "Foodie"],
        avatarColor: "#2563EB",
        initials: "HP",
        diet: "Vegetarian",
        smoking: "Non-smoker",
        drinking: "Social",
        sleepSchedule: "Early Bird (11 PM)",
        cleanliness: "High",
        workStyle: "Working Professional",
        bio: "Work mostly from office. Quiet after 11 PM and love exploring food on Sundays."
      }
    ]
  },
  {
    id: "4",
    title: "Premium 3 BHK Apartment",
    rent: 18000,
    deposit: 40000,
    bhk: 3,
    area: "Thaltej",
    city: "Ahmedabad",
    floor: "6th",
    furnished: true,
    amenities: ["Free wifi", "AC", "Washing Machine", "RO Water", "Lift", "Parking", "24/7 Security", "Gym", "Gas Stove"],
    photos: [
      "https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1545464629-e32560f7e48a?auto=format&fit=crop&w=800&q=80"
    ],
    listingType: "flat",
    isVerified: true,
    availableFrom: "15 Jun 2026",
    landlordId: "landlord_4",
    landlordName: "Anjali Vyas",
    landlordInitials: "AV",
    landlordJoined: "2022",
    landlordRentalsCompleted: 8,
    landlordPhone: "9734567890",
    distanceText: "2 min from Metro",
    rating: "4.9",
    badges: ["Full Flat", "Family/Bachelors", "Verified Listing"],
    description: "Luxurious 3 BHK flat with modern interiors, large balcony, park view. Located in a prime area in Thaltej with close proximity to metro and SG Highway.",
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "5",
    title: "Roommate Slot - Flat Sharing",
    rent: 3500,
    deposit: 6000,
    bhk: 2,
    area: "Vastrapur",
    city: "Ahmedabad",
    floor: "Ground",
    furnished: false,
    amenities: ["Free wifi", "Parking", "RO Water"],
    photos: [
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80"
    ],
    listingType: "roommate",
    isVerified: false,
    availableFrom: "Available now",
    landlordId: "landlord_5",
    landlordName: "Kriti Sharma",
    landlordInitials: "KS",
    landlordJoined: "2025",
    landlordRentalsCompleted: 0,
    landlordPhone: "9645678901",
    distanceText: "8 min from Metro",
    rating: "4.0",
    badges: ["Private Room", "Females Only", "1 spot left"],
    description: "Looking for a female roommate for a private bedroom in a semi-furnished 2 BHK flat near Vastrapur Lake. Cook is already available. Rent and electricity will be split 50-50.",
    currentFlatmates: 1,
    totalCapacity: 2,
    genderPreference: "Females only",
    isActive: true,
    createdAt: new Date().toISOString(),
    compatibilityScore: 84,
    compatibilityFactors: ["Vegetarian", "Female Only Flat", "College Students", "Cleaning Schedule"],
    expenseSplitText: "Rent: ₹3,500/mo. Internet & Maid split equally (approx. ₹800/mo). Utility bills split 50-50.",
    roommates: [
      {
        name: "Kriti Sharma",
        age: 22,
        gender: "Female",
        profession: "MBA Student",
        companyOrCollege: "Nirma University",
        interests: ["Music", "Reading", "Travel"],
        avatarColor: "#DB2777",
        initials: "KS",
        diet: "Vegetarian",
        smoking: "Non-smoker",
        drinking: "Non-drinker",
        sleepSchedule: "Early Bird (11 PM)",
        cleanliness: "High",
        workStyle: "Student",
        bio: "2nd year MBA student. Prefer quiet study environment on weekday evenings."
      }
    ]
  },
  {
    id: "6",
    title: "Shared Master Bed in 2BHK",
    rent: 5000,
    deposit: 10000,
    bhk: 2,
    area: "Prahlad Nagar",
    city: "Ahmedabad",
    floor: "2nd",
    furnished: true,
    amenities: ["Free wifi", "AC", "Washing Machine", "RO Water", "Parking", "Gym"],
    photos: [
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80"
    ],
    listingType: "roommate",
    isVerified: true,
    availableFrom: "Immediate",
    landlordId: "landlord_6",
    landlordName: "Rohan Dave",
    landlordInitials: "RD",
    landlordJoined: "2024",
    landlordRentalsCompleted: 3,
    landlordPhone: "9876501234",
    distanceText: "Near Corporate Road",
    rating: "4.7",
    badges: ["Shared Room", "Males Only", "1 spot left"],
    description: "Looking for 1 flatmate in a modern 2BHK flat in Prahlad Nagar. Fully furnished, high speed WiFi, maid comes daily for cleaning.",
    currentFlatmates: 2,
    totalCapacity: 3,
    genderPreference: "Males only",
    isActive: true,
    createdAt: new Date().toISOString(),
    compatibilityScore: 92,
    compatibilityFactors: ["Non-smoker", "Working Professional", "Pure Veg", "Clean Environment"],
    expenseSplitText: "Rent: ₹5,000/mo. Maid & WiFi split equally (₹900/mo). Electricity on actual meter.",
    roommates: [
      {
        name: "Rohan Dave",
        age: 25,
        gender: "Male",
        profession: "Data Analyst",
        companyOrCollege: "Adani Corporate",
        interests: ["Data", "Chess", "Gym"],
        avatarColor: "#059669",
        initials: "RD",
        diet: "Pure Veg",
        smoking: "Non-smoker",
        drinking: "Non-drinker",
        sleepSchedule: "Early Bird (11 PM)",
        cleanliness: "High",
        workStyle: "Working Professional",
        bio: "Working in corporate near SG Highway. Value clean kitchen and quiet nights."
      },
      {
        name: "Yash Mehta",
        age: 24,
        gender: "Male",
        profession: "Product Marketing",
        companyOrCollege: "Tech Startup",
        interests: ["Marketing", "Podcasts", "Running"],
        avatarColor: "#7C3AED",
        initials: "YM",
        diet: "Vegetarian",
        smoking: "Non-smoker",
        drinking: "Social",
        sleepSchedule: "Early Bird (11 PM)",
        cleanliness: "High",
        workStyle: "Working Professional",
        bio: "Work 5 days from office. Friendly and respect everyone's personal space."
      }
    ]
  }
];

export const addDummyListing = (newListing: Listing) => {
  dummyListings.unshift(newListing);
};

export const dummyUser = {
  id: "user_karan",
  name: "Karan",
  phone: "9876543210",
  email: "karan@example.com",
  gender: "Male",
  profession: "Software Engineer",
  avatar: require('../Assets/Images/Profile.png'),
  contactsUnlocked: [],
  creditBalance: 0,
  habits: defaultUserHabits,
};
