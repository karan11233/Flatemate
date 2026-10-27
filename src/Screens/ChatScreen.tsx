import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../Context/ChatContext';
import { useAuth } from '../Context/AuthContext';
import { Shadows } from '../Theme/colors';
import { Fonts } from '../Theme/Fonts';
import { dummyListings } from '../utils/dummyData';

export default function ChatScreen({ route, navigation }: any) {
  const { listingId } = route.params || {};
  const { user } = useAuth();
  const { sendMessage, getConversation } = useChat();
  const [inputText, setInputText] = useState('');

  const conversation = getConversation(listingId);
  const listing = dummyListings.find((l) => l.id === listingId);

  // Fallbacks if conversation doesn't exist yet (first message not sent)
  const landlordName = conversation?.landlordName || listing?.landlordName || 'Landlord';
  const listingTitle = conversation?.listingTitle || listing?.title || 'Property Chat';
  const listingRent = listing?.rent || 0;
  
  const listingImage = conversation?.listingImage || (listing?.photos && listing.photos[0]) || '';
  const imageSource = typeof listingImage === 'number' 
    ? listingImage 
    : (listingImage ? { uri: listingImage } : require('../Assets/Images/Map.png')); // Fallback placeholder

  const messages = conversation?.messages || [];
  const currentUserId = user?.id || 'guest';

  const flatListRef = useRef<FlatList>(null);

  // Scroll to bottom when messages list changes
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    if (!listingId) return; // Guard: do not send if listingId is missing
    sendMessage(listingId, inputText);
    setInputText('');
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const renderMessageItem = ({ item }: { item: any }) => {
    const isMe = item.senderId === currentUserId;
    return (
      <View style={[styles.messageRow, isMe ? styles.myRow : styles.otherRow]}>
        {!isMe && (
          <View style={styles.avatarCircleSmall}>
            <Text style={styles.avatarTextSmall}>{landlordName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isMe ? styles.myText : styles.otherText]}>
            {item.text}
          </Text>
          <Text style={[styles.timestampText, isMe ? styles.myTimestamp : styles.otherTimestamp]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.landlordNameText} numberOfLines={1}>{landlordName}</Text>
            <Ionicons name="shield-checkmark" size={14} color="#15803D" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 }}>
            <View style={styles.onlinePulseDot} />
            <Text style={styles.onlineStatusText}>Active today</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.callButton}
          activeOpacity={0.8}
          onPress={() => {
            const phone = conversation?.landlordPhone || listing?.landlordPhone;
            if (phone) {
              import('react-native').then(({ Linking }) => {
                Linking.openURL(`tel:${phone}`);
              });
            }
          }}
        >
          <Ionicons name="call" size={17} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Listing Sticky Context Bar */}
      <View style={styles.listingContextWrapper}>
        <TouchableOpacity 
          style={styles.listingContextBar}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('DetailPage', { propertyId: listingId })}
        >
          <Image source={imageSource} style={styles.listingThumbnail} />
          <View style={styles.listingInfo}>
            <Text style={styles.listingTitleText} numberOfLines={1}>{listingTitle}</Text>
            <Text style={styles.listingRentText}>₹{listingRent.toLocaleString('en-IN')}<Text style={{ fontSize: 11, fontFamily: Fonts.regular, color: '#64748B' }}> / mo</Text></Text>
          </View>
          <View style={styles.viewListingBadge}>
            <Text style={styles.viewListingBadgeText}>View</Text>
            <Ionicons name="chevron-forward" size={13} color="#0F172A" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={32} color="#0F172A" />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySub}>
              Send a message to inquire about this property.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Text Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
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
  headerTitleContainer: {
    flex: 1,
  },
  landlordNameText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  onlinePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#15803D',
  },
  onlineStatusText: {
    fontSize: 11,
    color: '#15803D',
    fontFamily: Fonts.medium,
  },
  callButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  listingContextWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  listingContextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  listingThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  listingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listingTitleText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  listingRentText: {
    fontSize: 13,
    color: '#0F172A',
    fontFamily: Fonts.bold,
    marginTop: 2,
  },
  viewListingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 3,
  },
  viewListingBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '82%',
  },
  myRow: {
    alignSelf: 'flex-end',
  },
  otherRow: {
    alignSelf: 'flex-start',
    gap: 8,
  },
  avatarCircleSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextSmall: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  bubble: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    ...Shadows.subtle,
  },
  myBubble: {
    backgroundColor: '#0F172A',
    borderBottomRightRadius: 3,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  myText: {
    color: '#FFFFFF',
  },
  otherText: {
    color: '#0F172A',
  },
  timestampText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: '#64748B',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    color: '#0F172A',
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
    opacity: 0.6,
  },
});
