import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../Theme/colors';
import { Fonts } from '../Theme/Fonts';

// Screens
import Home from '../Screens/Home';
import DetailPage from '../Screens/DetailPage';
import RoommateFeed from '../Screens/RoommateFeed';
import SavedListings from '../Screens/SavedListings';
import Profile from '../Screens/Profile';
import AddListing from '../Screens/AddListing';
import Login from '../Screens/Login';
import ProfileSetup from '../Screens/ProfileSetup';
import ScheduleVisit from '../Screens/ScheduleVisit';
import ChatScreen from '../Screens/ChatScreen';
import ChatInbox from '../Screens/ChatInbox';
import Notifications from '../Screens/Notifications';
import OwnerDashboard from '../Screens/OwnerDashboard';
import SubscriptionPlans from '../Screens/SubscriptionPlans';
import DocumentVerification from '../Screens/DocumentVerification';
import RentAgreementCabinet from '../Screens/RentAgreementCabinet';
import AgreementForm from '../Screens/AgreementForm';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.Primary,
        tabBarInactiveTintColor: Colors.Gray400,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: Colors.Gray800,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.03,
          shadowRadius: 8,
          elevation: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: Fonts.medium,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Roommate') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Saved') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={focused ? size + 2 : size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} options={{ tabBarLabel: 'Explore' }} />
      <Tab.Screen name="Roommate" component={RoommateFeed} options={{ tabBarLabel: 'Roommates' }} />
      <Tab.Screen name="Saved" component={SavedListings} options={{ tabBarLabel: 'Saved' }} />
      <Tab.Screen name="Profile" component={Profile} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="DetailPage" component={DetailPage} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetup} />
        <Stack.Screen name="AddListing" component={AddListing} />
        <Stack.Screen name="ScheduleVisit" component={ScheduleVisit} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen name="ChatInbox" component={ChatInbox} />
        <Stack.Screen name="Notifications" component={Notifications} />
        <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} />
        <Stack.Screen name="SubscriptionPlans" component={SubscriptionPlans} />
        <Stack.Screen name="DocumentVerification" component={DocumentVerification} />
        <Stack.Screen name="RentAgreementCabinet" component={RentAgreementCabinet} />
        <Stack.Screen name="AgreementForm" component={AgreementForm} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
