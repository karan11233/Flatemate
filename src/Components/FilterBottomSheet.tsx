import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Colors, Shadows } from '../Theme/colors';
import { Fonts } from '../Theme/Fonts';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: {
    cleanliness: number;
    noiseTolerance: 'Quiet Hours' | 'Social' | 'Any';
    guestPolicy: 'No' | 'Weekends' | 'Yes' | 'Any';
  }) => void;
  initialFilters?: {
    cleanliness: number;
    noiseTolerance: 'Quiet Hours' | 'Social' | 'Any';
    guestPolicy: 'No' | 'Weekends' | 'Yes' | 'Any';
  };
}

export default function FilterBottomSheet({
  visible,
  onClose,
  onApply,
  initialFilters,
}: FilterBottomSheetProps) {
  const [cleanliness, setCleanliness] = useState<number>(3);
  const [noiseTolerance, setNoiseTolerance] = useState<'Quiet Hours' | 'Social' | 'Any'>('Any');
  const [guestPolicy, setGuestPolicy] = useState<'No' | 'Weekends' | 'Yes' | 'Any'>('Any');

  useEffect(() => {
    if (initialFilters) {
      setCleanliness(initialFilters.cleanliness);
      setNoiseTolerance(initialFilters.noiseTolerance);
      setGuestPolicy(initialFilters.guestPolicy);
    }
  }, [initialFilters, visible]);

  const handleApply = () => {
    onApply({
      cleanliness,
      noiseTolerance,
      guestPolicy,
    });
    onClose();
  };

  const handleReset = () => {
    setCleanliness(3);
    setNoiseTolerance('Any');
    setGuestPolicy('Any');
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Drag Handle */}
              <View style={styles.dragHandle} />

              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={22} color={Colors.Gray100} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lifestyle Compatibility</Text>
                <TouchableOpacity onPress={handleReset}>
                  <Text style={styles.resetText}>Reset</Text>
                </TouchableOpacity>
              </View>

              {/* Cleanliness Level (1 to 5 Slider/Scale) */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Cleanliness Level</Text>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelBadgeText}>Level {cleanliness}/5</Text>
                  </View>
                </View>
                <Text style={styles.sectionDesc}>1 = Relaxed/Messy, 5 = Spotless/Neat Freak</Text>
                <View style={styles.sliderContainer}>
                  <View style={styles.sliderLine} />
                  <View
                    style={[
                      styles.sliderProgress,
                      { width: `${((cleanliness - 1) / 4) * 100}%` },
                    ]}
                  />
                  {[1, 2, 3, 4, 5].map((num) => {
                    const isSelected = cleanliness === num;
                    return (
                      <TouchableOpacity
                        key={num}
                        activeOpacity={0.8}
                        onPress={() => setCleanliness(num)}
                        style={[
                          styles.sliderDot,
                          isSelected ? styles.sliderDotSelected : styles.sliderDotUnselected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.sliderDotText,
                            isSelected && styles.sliderDotTextSelected,
                          ]}
                        >
                          {num}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Noise Tolerance */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Noise Tolerance</Text>
                <Text style={styles.sectionDesc}>Preferred atmosphere during study/sleep hours</Text>
                <View style={styles.chipRow}>
                  {(['Quiet Hours', 'Social', 'Any'] as const).map((pref) => {
                    const isSelected = noiseTolerance === pref;
                    return (
                      <TouchableOpacity
                        key={pref}
                        activeOpacity={0.75}
                        onPress={() => setNoiseTolerance(pref)}
                        style={[
                          styles.chip,
                          isSelected && styles.chipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextActive,
                          ]}
                        >
                          {pref === 'Quiet Hours' ? '🤫 Quiet Hours' : pref === 'Social' ? '🎉 Social & Lively' : '✨ Any'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Guest Policy */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Guest Policy</Text>
                <Text style={styles.sectionDesc}>Are visitors allowed in the flat?</Text>
                <View style={styles.chipRow}>
                  {(['No', 'Weekends', 'Yes', 'Any'] as const).map((pref) => {
                    const isSelected = guestPolicy === pref;
                    return (
                      <TouchableOpacity
                        key={pref}
                        activeOpacity={0.75}
                        onPress={() => setGuestPolicy(pref)}
                        style={[
                          styles.chip,
                          isSelected && styles.chipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextActive,
                          ]}
                        >
                          {pref === 'No' ? '🚫 No Guests' : pref === 'Weekends' ? '📅 Weekends Only' : pref === 'Yes' ? '🤝 Guests Welcome' : '👥 Any'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelButton} activeOpacity={0.8} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} activeOpacity={0.85} onPress={handleApply}>
                  <Text style={styles.applyText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.White,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 34,
    maxHeight: height * 0.82,
    ...Shadows.float,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.Gray700,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Gray800,
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  resetText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0754C0',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  levelBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#0754C0',
  },
  sectionDesc: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  sliderContainer: {
    height: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 10,
  },
  sliderLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  sliderProgress: {
    position: 'absolute',
    left: 20,
    height: 4,
    backgroundColor: '#0F172A',
    borderRadius: 2,
  },
  sliderDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...Shadows.subtle,
  },
  sliderDotSelected: {
    backgroundColor: '#0F172A',
    borderColor: Colors.White,
    borderWidth: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sliderDotUnselected: {
    backgroundColor: Colors.White,
    borderColor: '#94A3B8',
    borderWidth: 1.5,
  },
  sliderDotText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#334155',
  },
  sliderDotTextSelected: {
    color: Colors.White,
    fontFamily: Fonts.bold,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
    ...Shadows.subtle,
  },
  chipText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#334155',
  },
  chipTextActive: {
    color: Colors.White,
    fontFamily: Fonts.bold,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.White,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#475569',
  },
  applyButton: {
    flex: 2,
    height: 48,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  applyText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.White,
  },
});
