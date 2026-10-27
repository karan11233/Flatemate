import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../Theme/Fonts';

interface Notification {
  id: string;
  type: 'new_listing' | 'visit_confirmed' | 'message' | 'price_drop' | 'promo';
  title: string;
  body: string;
  time: string;
  isRead: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
}

const dummyNotifications: Notification[] = [
  {
    id: '1',
    type: 'visit_confirmed',
    title: 'Visit Confirmed! 🎉',
    body: 'Your visit to "Modern 2BHK Near Metro" on Jun 10 at 11:00 AM has been confirmed by the host.',
    time: '2 min ago',
    isRead: false,
    icon: 'checkmark-circle',
    iconColor: '#15803D',
    iconBg: '#ECFDF5',
  },
  {
    id: '2',
    type: 'message',
    title: 'New message from Suresh Kumar',
    body: '"Hi! The flat is available. When would you like to visit?" — Reply now to confirm your slot.',
    time: '15 min ago',
    isRead: false,
    icon: 'chatbubble-ellipses',
    iconColor: '#0754C0',
    iconBg: '#E2EBF7',
  },
  {
    id: '3',
    type: 'new_listing',
    title: 'New listing in Vastrapur!',
    body: 'A new 2 BHK flat is available at ₹8,200/mo near your saved search area in Vastrapur.',
    time: '1 hr ago',
    isRead: false,
    icon: 'home',
    iconColor: '#F59E0B',
    iconBg: '#FFFBEB',
  },
  {
    id: '4',
    type: 'price_drop',
    title: 'Price Drop on Saved Listing 📉',
    body: '"Spacious 1 BHK Flat" rent has dropped from ₹7,000 to ₹6,500/mo. Grab it before it\'s gone!',
    time: '3 hr ago',
    isRead: true,
    icon: 'trending-down',
    iconColor: '#EF4444',
    iconBg: '#FEF2F2',
  },
  {
    id: '5',
    type: 'new_listing',
    title: 'New Roommate Slot in Bodakdev',
    body: 'A new roommate slot is available at ₹4,200/mo in a 3 BHK flat — only 1 spot left!',
    time: 'Yesterday',
    isRead: true,
    icon: 'people',
    iconColor: '#8B5CF6',
    iconBg: '#F5F3FF',
  },
  {
    id: '6',
    type: 'promo',
    title: '🎁 Get 2 free contact credits!',
    body: 'Complete your profile to unlock 2 free contact credits. No payment needed.',
    time: '2 days ago',
    isRead: true,
    icon: 'gift',
    iconColor: '#15803D',
    iconBg: '#ECFDF5',
  },
];

export default function Notifications({ navigation }: any) {
  const [notifications, setNotifications] = useState(dummyNotifications);
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);
  const unreadCount = unreadNotifications.length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const renderNotificationCard = (notif: Notification) => (
    <TouchableOpacity
      key={notif.id}
      style={[styles.notifCard, !notif.isRead && styles.notifCardUnread]}
      activeOpacity={0.8}
      onPress={() => {
        markRead(notif.id);
        // Navigate based on type
        if (notif.type === 'message') navigation.navigate('ChatInbox');
        else if (notif.type === 'visit_confirmed') navigation.navigate('MainTabs', { screen: 'Profile' });
        else if (notif.type === 'new_listing') navigation.navigate('MainTabs', { screen: 'Home' });
        else if (notif.type === 'price_drop') navigation.navigate('MainTabs', { screen: 'Saved' });
        else if (notif.type === 'promo') navigation.navigate('MainTabs', { screen: 'Home' });
      }}
    >
      {/* Icon */}
      <View style={[styles.iconCircle, { backgroundColor: notif.iconBg }]}>
        <Ionicons name={notif.icon} size={20} color={notif.iconColor} />
      </View>

      {/* Content */}
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={[styles.notifTitle, !notif.isRead && { color: '#0F172A', fontFamily: Fonts.bold }]} numberOfLines={1}>
            {notif.title}
          </Text>
          <Text style={styles.notifTime}>{notif.time}</Text>
        </View>
        <Text style={styles.notifBody} numberOfLines={2}>
          {notif.body}
        </Text>
      </View>

      {/* Unread indicator dot */}
      {!notif.isRead && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
        </Text>

        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
        {unreadNotifications.length > 0 && (
          <View style={{ gap: 8, marginBottom: 8 }}>
            <View style={styles.sectionHeader}>
              <View style={styles.unreadDot} />
              <Text style={styles.sectionHeaderText}>New · {unreadCount} unread</Text>
            </View>
            {unreadNotifications.map(renderNotificationCard)}
          </View>
        )}

        {readNotifications.length > 0 && (
          <View style={{ gap: 8 }}>
            <View style={[styles.sectionHeader, { marginTop: unreadNotifications.length > 0 ? 12 : 0 }]}>
              <Text style={[styles.sectionHeaderText, { color: '#64748B', marginLeft: 0 }]}>Earlier</Text>
            </View>
            {readNotifications.map(renderNotificationCard)}
          </View>
        )}

        {notifications.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={32} color="#0F172A" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  markAllRead: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F172A',
  },
  sectionHeaderText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  notifCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#0F172A',
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    marginRight: 8,
  },
  notifTime: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: '#64748B',
    flexShrink: 0,
  },
  notifBody: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#475569',
    lineHeight: 19,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F172A',
    alignSelf: 'center',
    marginLeft: 4,
    flexShrink: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
});
