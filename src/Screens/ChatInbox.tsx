import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../Context/ChatContext';
import { Shadows } from '../Theme/colors';
import { Fonts } from '../Theme/Fonts';

export default function ChatInbox({ navigation }: any) {
  const { conversations, isLoading, markAsRead } = useChat();

  const formatMessageTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      
      // Check if it is today
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      // Check if it is yesterday
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      
      // Otherwise show day and month
      return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    } catch (e) {
      return '';
    }
  };

  const renderConversationItem = ({ item }: { item: any }) => {
    const thumbSource = typeof item.listingImage === 'number' 
      ? item.listingImage 
      : (item.listingImage ? { uri: item.listingImage } : require('../Assets/Images/Map.png'));

    return (
      <TouchableOpacity
        style={styles.chatCard}
        activeOpacity={0.8}
        onPress={() => {
          markAsRead(item.listingId);
          navigation.navigate('ChatScreen', { listingId: item.listingId });
        }}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.landlordAvatar}>
            <Text style={styles.avatarText}>{item.landlordName.charAt(0).toUpperCase()}</Text>
          </View>
          <Image source={thumbSource} style={styles.listingThumbnailOverlay} />
        </View>

        <View style={styles.chatDetails}>
          <View style={styles.chatHeaderRow}>
            <Text style={styles.landlordName} numberOfLines={1}>
              {item.landlordName}
            </Text>
            <Text style={styles.timeText}>
              {formatMessageTime(item.lastMessageTimestamp)}
            </Text>
          </View>

          <Text style={styles.listingTitle} numberOfLines={1}>
            {item.listingTitle}
          </Text>

          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessageText}
          </Text>
        </View>
        
        <Ionicons name="chevron-forward" size={16} color="#64748B" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inbox Messages</Text>
        {conversations.length > 0 ? (
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{conversations.length}</Text>
          </View>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={32} color="#0F172A" />
          </View>
          <Text style={styles.emptyTitle}>Your Inbox is empty</Text>
          <Text style={styles.emptySub}>
            Start a chat with a landlord from any listing detail page to see your conversations here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.listingId}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  badgeCount: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgeCountText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#0754C0',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Fonts.regular,
    paddingHorizontal: 20,
  },
  listContainer: {
    padding: 16,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.card,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  landlordAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  listingThumbnailOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#F1F5F9',
  },
  chatDetails: {
    flex: 1,
    gap: 2,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  landlordName: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: Fonts.medium,
  },
  listingTitle: {
    fontSize: 12,
    color: '#0754C0',
    fontFamily: Fonts.medium,
  },
  lastMessage: {
    fontSize: 13,
    color: '#475569',
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  separator: {
    height: 10,
  },
});
