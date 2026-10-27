import React from 'react';
import { StyleSheet, StatusBar, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/Navigation/AppNavigator';
import { AuthProvider } from './src/Context/AuthContext';
import { ChatProvider } from './src/Context/ChatContext';
import { useFonts } from 'expo-font';

function App() {
  const [fontsLoaded] = useFonts({
    'Gotham-Bold': require('./src/Assets/Fonts/Gotham-Bold.otf'),
    'Gotham-Medium': require('./src/Assets/Fonts/Gotham-Medium.otf'),
    'Gotham-Book': require('./src/Assets/Fonts/Gotham-Book.otf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6F8' }}>
        <ActivityIndicator size="large" color="#0754C0" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ChatProvider>
          <AppNavigator />
          <StatusBar barStyle="dark-content" />
        </ChatProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
