import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDocs, setDoc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../utils/firebase';
import { useAuth } from './AuthContext';
import { dummyListings } from '../utils/dummyData';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string; // ISO string
}

export interface Conversation {
  listingId: string;
  listingTitle: string;
  listingImage: string | number;
  landlordId: string;
  landlordName: string;
  landlordPhone: string;
  messages: Message[];
  lastMessageText: string;
  lastMessageTimestamp: string;
  unreadCount?: number;
  userId?: string;
  participants?: string[];
}

interface ChatContextType {
  conversations: Conversation[];
  isLoading: boolean;
  sendMessage: (listingId: string, text: string) => Promise<void>;
  getConversation: (listingId: string) => Conversation | undefined;
  markAsRead: (listingId: string) => Promise<void>;
  clearChats: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Initial Load: Load local cached data from AsyncStorage first for instant startup
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const storedConversations = await AsyncStorage.getItem('@flatemate_conversations');
        const storedChats = await AsyncStorage.getItem('@flatemate_chats');

        let initialConversations: Conversation[] = storedConversations ? JSON.parse(storedConversations) : [];
        let initialChats: { [key: string]: Message[] } = storedChats ? JSON.parse(storedChats) : {};

        // Hydrate each conversation with its corresponding messages list
        initialConversations = initialConversations.map(conv => {
          const messages = conv.messages || initialChats[conv.listingId] || [];
          return { ...conv, messages };
        });

        // Order conversations by lastMessageTimestamp descending
        initialConversations.sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());

        setConversations(initialConversations);
      } catch (err) {
        console.error("Failed to load local cached chats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCachedData();
  }, []);

  // 2. Real-Time Cloud Sync: Subscribe to Firestore 'conversations' collection
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !user) {
      return;
    }

    const conversationsRef = collection(db, 'conversations');
    
    // Listen for changes on the conversations collection
    const unsubscribe = onSnapshot(conversationsRef, async (querySnapshot) => {
      try {
        const firestoreConversations: Conversation[] = [];

        for (const docSnapshot of querySnapshot.docs) {
          const data = docSnapshot.data();
          const participants = data.participants || [];
          const listingId = data.listingId || docSnapshot.id;

          // Process only conversations involving the current logged-in user
          if (
            participants.includes(user.id) ||
            data.userId === user.id ||
            data.landlordId === user.id
          ) {
            // Load messages subcollection for this conversation
            const messagesRef = collection(db, 'conversations', listingId, 'messages');
            const messagesSnapshot = await getDocs(messagesRef);
            
            const messages: Message[] = messagesSnapshot.docs.map(mDoc => {
              const mData = mDoc.data();
              return {
                id: mDoc.id,
                senderId: mData.senderId,
                senderName: mData.senderName,
                text: mData.text,
                timestamp: mData.timestamp
              };
            });

            // Sort messages chronologically
            messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            firestoreConversations.push({
              listingId,
              listingTitle: data.listingTitle || 'Property Chat',
              listingImage: data.listingImage || '',
              landlordId: data.landlordId || 'landlord_mock',
              landlordName: data.landlordName || 'Landlord',
              landlordPhone: data.landlordPhone || '',
              messages,
              lastMessageText: data.lastMessageText || '',
              lastMessageTimestamp: data.lastMessageTimestamp || new Date().toISOString(),
              unreadCount: data.unreadCount || 0,
              userId: data.userId,
              participants: participants
            });
          }
        }

        // Sort by timestamp descending
        firestoreConversations.sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());

        setConversations(prev => {
          // Merge local cache and Firestore data
          const mergedMap = new Map<string, Conversation>();
          prev.forEach(c => mergedMap.set(c.listingId, c));
          firestoreConversations.forEach(c => {
            const existing = mergedMap.get(c.listingId);
            if (
              !existing || 
              new Date(c.lastMessageTimestamp).getTime() > new Date(existing.lastMessageTimestamp).getTime() ||
              c.messages.length >= existing.messages.length
            ) {
              mergedMap.set(c.listingId, c);
            }
          });

          const mergedList = Array.from(mergedMap.values());
          mergedList.sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());

          // Update AsyncStorage caching
          AsyncStorage.setItem('@flatemate_conversations', JSON.stringify(mergedList))
            .catch(err => console.error("Error caching synced conversations:", err));

          const chatsMap: { [key: string]: Message[] } = {};
          mergedList.forEach(c => {
            chatsMap[c.listingId] = c.messages;
          });
          AsyncStorage.setItem('@flatemate_chats', JSON.stringify(chatsMap))
            .catch(err => console.error("Error caching synced chats:", err));

          return mergedList;
        });

      } catch (err) {
        console.error("Error processing Firestore onSnapshot update:", err);
      }
    }, (error) => {
      console.error("Firestore onSnapshot subscription failed:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Send message action
  const sendMessage = async (listingId: string, text: string) => {
    if (!text.trim()) return;

    // Retrieve listing info from dummyListings to construct metadata
    const listing = dummyListings.find(l => l.id === listingId);
    const listingTitle = listing ? listing.title : 'Property Chat';
    const listingImage = listing && listing.photos && listing.photos.length > 0 ? listing.photos[0] : '';
    const landlordId = listing ? listing.landlordId : 'landlord_mock';
    const landlordName = listing ? listing.landlordName : 'Landlord';
    const landlordPhone = listing ? listing.landlordPhone : '';

    const currentUserId = user?.id || 'user_karan';
    const currentUserName = user?.name || 'Karan';

    // 1. Create message object
    const messageId = "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    const userMessage: Message = {
      id: messageId,
      senderId: currentUserId,
      senderName: currentUserName,
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    // 2. Update state and cache locally first for responsive UI
    setConversations(prev => {
      const existingConv = prev.find(c => c.listingId === listingId);
      const existingMessages = existingConv ? existingConv.messages || [] : [];
      const updatedMessages = [...existingMessages, userMessage];

      const updatedConv: Conversation = {
        listingId,
        listingTitle,
        listingImage,
        landlordId,
        landlordName,
        landlordPhone,
        messages: updatedMessages,
        lastMessageText: text.trim(),
        lastMessageTimestamp: userMessage.timestamp,
        unreadCount: 0,
        userId: currentUserId,
        participants: [currentUserId, landlordId]
      };

      const filtered = prev.filter(c => c.listingId !== listingId);
      const updatedConversations = [updatedConv, ...filtered];

      // Cache updated data structure in AsyncStorage
      AsyncStorage.setItem('@flatemate_conversations', JSON.stringify(updatedConversations))
        .catch(err => console.error("Error caching conversations locally:", err));

      const chatsMap: { [key: string]: Message[] } = {};
      updatedConversations.forEach(c => {
        chatsMap[c.listingId] = c.messages;
      });
      AsyncStorage.setItem('@flatemate_chats', JSON.stringify(chatsMap))
        .catch(err => console.error("Error caching chats locally:", err));

      return updatedConversations;
    });

    // 3. Sync to Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        const convRef = doc(db, 'conversations', listingId);
        await setDoc(convRef, {
          listingId,
          listingTitle,
          listingImage,
          landlordId,
          landlordName,
          landlordPhone,
          lastMessageText: text.trim(),
          lastMessageTimestamp: userMessage.timestamp,
          unreadCount: 0,
          userId: currentUserId,
          participants: [currentUserId, landlordId]
        }, { merge: true });

        const msgRef = doc(db, 'conversations', listingId, 'messages', messageId);
        await setDoc(msgRef, userMessage);
      } catch (err) {
        console.error("Firestore sync for sent message failed:", err);
      }
    }

    // 4. Mock landlord auto-responder (triggers simulated reply in 3 seconds)
    setTimeout(() => {
      const landlordReplyText = `Hi! Thanks for showing interest in "${listingTitle}". Let me know when you would like to visit the place or if you have any specific questions!`;
      const replyMessageId = "msg_reply_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

      const landlordMessage: Message = {
        id: replyMessageId,
        senderId: landlordId,
        senderName: landlordName,
        text: landlordReplyText,
        timestamp: new Date().toISOString()
      };

      setConversations(prev => {
        const existingConv = prev.find(c => c.listingId === listingId);
        const existingMessages = existingConv ? existingConv.messages || [] : [];
        
        // Safeguard to prevent duplicate reply insertions
        if (existingMessages.some(m => m.id === replyMessageId)) return prev;

        const updatedMessages = [...existingMessages, landlordMessage];

        const updatedConv: Conversation = {
          listingId,
          listingTitle,
          listingImage,
          landlordId,
          landlordName,
          landlordPhone,
          messages: updatedMessages,
          lastMessageText: landlordReplyText,
          lastMessageTimestamp: landlordMessage.timestamp,
          unreadCount: existingConv ? (existingConv.unreadCount || 0) + 1 : 1,
          userId: existingConv?.userId || currentUserId,
          participants: existingConv?.participants || [currentUserId, landlordId]
        };

        const filtered = prev.filter(c => c.listingId !== listingId);
        const updatedConversations = [updatedConv, ...filtered];

        // Cache updated reply in AsyncStorage
        AsyncStorage.setItem('@flatemate_conversations', JSON.stringify(updatedConversations))
          .catch(err => console.error("Error caching auto-reply conversations locally:", err));

        const chatsMap: { [key: string]: Message[] } = {};
        updatedConversations.forEach(c => {
          chatsMap[c.listingId] = c.messages;
        });
        AsyncStorage.setItem('@flatemate_chats', JSON.stringify(chatsMap))
          .catch(err => console.error("Error caching auto-reply chats locally:", err));

        // Sync landlord reply to Firestore if configured
        if (isFirebaseConfigured && db) {
          const convRef = doc(db, 'conversations', listingId);
          setDoc(convRef, {
            lastMessageText: landlordReplyText,
            lastMessageTimestamp: landlordMessage.timestamp,
            unreadCount: updatedConv.unreadCount
          }, { merge: true }).catch(err => console.error("Firestore sync landlord reply metadata failed:", err));

          const msgRef = doc(db, 'conversations', listingId, 'messages', replyMessageId);
          setDoc(msgRef, landlordMessage).catch(err => console.error("Firestore sync landlord reply message failed:", err));
        }

        return updatedConversations;
      });
    }, 3000);
  };

  // Helper function to find a specific conversation by listingId
  const getConversation = (listingId: string) => {
    return conversations.find(c => c.listingId === listingId);
  };

  // Reset unread count for a conversation
  const markAsRead = async (listingId: string) => {
    setConversations(prev => {
      const updatedConversations = prev.map(c => {
        if (c.listingId === listingId) {
          return { ...c, unreadCount: 0 };
        }
        return c;
      });
      AsyncStorage.setItem('@flatemate_conversations', JSON.stringify(updatedConversations))
        .catch(err => console.error("Error updating unread count in cache:", err));
      return updatedConversations;
    });

    if (isFirebaseConfigured && db) {
      try {
        const convRef = doc(db, 'conversations', listingId);
        await setDoc(convRef, { unreadCount: 0 }, { merge: true });
      } catch (err) {
        console.error("Firestore sync for markAsRead failed:", err);
      }
    }
  };

  // Clear all chats and conversations
  const clearChats = async () => {
    setConversations([]);
    try {
      await AsyncStorage.removeItem('@flatemate_conversations');
      await AsyncStorage.removeItem('@flatemate_chats');
    } catch (err) {
      console.error("Failed to clear local chat storage:", err);
    }
  };

  return (
    <ChatContext.Provider value={{
      conversations,
      isLoading,
      sendMessage,
      getConversation,
      markAsRead,
      clearChats
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
