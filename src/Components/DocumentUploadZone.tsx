import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../Theme/colors';
import { Fonts } from '../Theme/Fonts';

interface DocumentUploadZoneProps {
  title: string;
  subtitle: string;
  imageUri: string | null;
  onUpload: (uri: string) => void;
  onClear: () => void;
}

export default function DocumentUploadZone({
  title,
  subtitle,
  imageUri,
  onUpload,
  onClear,
}: DocumentUploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleSimulateUpload = () => {
    setIsUploading(true);
    // Simulate upload delay
    setTimeout(() => {
      setIsUploading(false);
      // Simulate file URI callback with dummy image path
      onUpload('https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=300&auto=format&fit=crop');
    }, 1200);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.uploadLabel}>{title}</Text>

      {imageUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
          <View style={styles.overlay}>
            <View style={styles.fileUploadedTag}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.Success} />
              <Text style={styles.fileUploadedText}>Ready to submit</Text>
            </View>
            <TouchableOpacity
              style={styles.clearBtn}
              activeOpacity={0.8}
              onPress={onClear}
            >
              <Ionicons name="trash-outline" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.uploadBox, isUploading && styles.uploadBoxUploading]}
          activeOpacity={0.7}
          onPress={handleSimulateUpload}
          disabled={isUploading}
        >
          {isUploading ? (
            <View style={styles.statusBox}>
              <ActivityIndicator size="small" color={Colors.Primary} />
              <Text style={styles.uploadingText}>Securing & uploading document...</Text>
            </View>
          ) : (
            <View style={styles.statusBox}>
              <View style={styles.iconCircle}>
                <Ionicons name="cloud-upload-outline" size={20} color={Colors.Primary} />
              </View>
              <Text style={styles.titleText}>{subtitle}</Text>
              <Text style={styles.subText}>PNG, JPG or PDF up to 5MB</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  uploadLabel: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  uploadBox: {
    height: 124,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBoxUploading: {
    borderColor: Colors.Primary,
    backgroundColor: Colors.PrimaryLight,
  },
  statusBox: {
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  titleText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  subText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#64748B',
  },
  uploadingText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#0754C0',
  },
  previewContainer: {
    height: 124,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.subtle,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'space-between',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  fileUploadedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fileUploadedText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#15803D',
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.subtle,
  },
});
