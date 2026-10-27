import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../Theme/colors';
import { Fonts } from '../Theme/Fonts';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface FilterOptions {
  listingType: 'All' | 'flat' | 'roommate';
  furnished: 'Any' | 'Furnished' | 'Unfurnished';
  genderPreference: 'Any' | 'Males only' | 'Females only';
  budgetMax: number;
  availableNow: boolean;
  bhk: number[];
  sortBy: 'newest' | 'rent_low' | 'rent_high' | 'rating';
}

export const defaultFilters: FilterOptions = {
  listingType: 'All',
  furnished: 'Any',
  genderPreference: 'Any',
  budgetMax: 30000,
  availableNow: false,
  bhk: [],
  sortBy: 'newest',
};

interface FilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

const BUDGET_STEPS = [3000, 5000, 7000, 10000, 15000, 20000, 30000];

export default function FilterModal({ isVisible, onClose, onApply, currentFilters }: FilterModalProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);

  useEffect(() => {
    if (isVisible) {
      setFilters(currentFilters);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [isVisible]);

  const activeCount = [
    filters.listingType !== 'All',
    filters.furnished !== 'Any',
    filters.genderPreference !== 'Any',
    filters.budgetMax < 30000,
    filters.availableNow,
    filters.bhk.length > 0,
    filters.sortBy !== 'newest',
  ].filter(Boolean).length;

  const resetFilters = () => setFilters(defaultFilters);

  const toggleBhk = (val: number) => {
    setFilters(f => ({
      ...f,
      bhk: f.bhk.includes(val) ? f.bhk.filter(b => b !== val) : [...f.bhk, val],
    }));
  };

  const SectionLabel = ({ label }: { label: string }) => (
    <Text style={styles.sectionLabel}>{label}</Text>
  );

  const ToggleChip = ({
    label, active, onPress,
  }: { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal transparent animationType="none" visible={isVisible} onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={Colors.Gray100} />
          </TouchableOpacity>
          <Text style={styles.sheetTitle}>
            Filters {activeCount > 0 ? `(${activeCount})` : ''}
          </Text>
          <TouchableOpacity onPress={resetFilters}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 22 }}>

          {/* Sort By */}
          <View style={styles.section}>
            <SectionLabel label="Sort By" />
            <View style={styles.chipRow}>
              {([
                { key: 'newest', label: '🆕 Newest' },
                { key: 'rent_low', label: '↑ Rent Low' },
                { key: 'rent_high', label: '↓ Rent High' },
                { key: 'rating', label: '⭐ Rating' },
              ] as const).map(({ key, label }) => (
                <ToggleChip
                  key={key}
                  label={label}
                  active={filters.sortBy === key}
                  onPress={() => setFilters(f => ({ ...f, sortBy: key }))}
                />
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Listing Type */}
          <View style={styles.section}>
            <SectionLabel label="Listing Type" />
            <View style={styles.chipRow}>
              {(['All', 'flat', 'roommate'] as const).map((t) => (
                <ToggleChip
                  key={t}
                  label={t === 'All' ? '🏠 All' : t === 'flat' ? '🏠 Full Flat' : '👥 Roommate Slot'}
                  active={filters.listingType === t}
                  onPress={() => setFilters(f => ({ ...f, listingType: t }))}
                />
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* BHK */}
          <View style={styles.section}>
            <SectionLabel label="BHK Configuration" />
            <View style={styles.chipRow}>
              {[1, 2, 3, 4].map((bhk) => (
                <ToggleChip
                  key={bhk}
                  label={`${bhk} BHK`}
                  active={filters.bhk.includes(bhk)}
                  onPress={() => toggleBhk(bhk)}
                />
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Budget */}
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <SectionLabel label="Max Budget / Month" />
              <Text style={styles.budgetValue}>
                {filters.budgetMax >= 30000 ? 'No limit' : `₹${filters.budgetMax.toLocaleString('en-IN')}`}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 4 }}>
              {BUDGET_STEPS.map((step) => (
                <ToggleChip
                  key={step}
                  label={step >= 30000 ? 'Any' : `₹${(step / 1000).toFixed(0)}k`}
                  active={filters.budgetMax === step}
                  onPress={() => setFilters(f => ({ ...f, budgetMax: step }))}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.divider} />

          {/* Furnished */}
          <View style={styles.section}>
            <SectionLabel label="Furnishing Status" />
            <View style={styles.chipRow}>
              {(['Any', 'Furnished', 'Unfurnished'] as const).map((t) => (
                <ToggleChip
                  key={t}
                  label={t}
                  active={filters.furnished === t}
                  onPress={() => setFilters(f => ({ ...f, furnished: t }))}
                />
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Gender */}
          <View style={styles.section}>
            <SectionLabel label="Gender Preference" />
            <View style={styles.chipRow}>
              {(['Any', 'Males only', 'Females only'] as const).map((g) => (
                <ToggleChip
                  key={g}
                  label={g === 'Any' ? '👥 Any' : g === 'Males only' ? '🔵 Males Only' : '🩷 Females Only'}
                  active={filters.genderPreference === g}
                  onPress={() => setFilters(f => ({ ...f, genderPreference: g }))}
                />
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Available Now Toggle */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setFilters(f => ({ ...f, availableNow: !f.availableNow }))}
              activeOpacity={0.8}
            >
              <View>
                <Text style={styles.toggleLabel}>Available Immediately Only</Text>
                <Text style={styles.toggleSub}>Show listings ready for instant move-in</Text>
              </View>
              <View style={[styles.toggleSwitch, filters.availableNow && styles.toggleSwitchActive]}>
                <View style={[styles.toggleThumb, filters.availableNow && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 90 }} />
        </ScrollView>

        {/* Apply Button */}
        <View style={styles.applyContainer}>
          <TouchableOpacity
            style={styles.applyButton}
            activeOpacity={0.85}
            onPress={() => {
              onApply(filters);
              onClose();
            }}
          >
            <Text style={styles.applyButtonText}>
              Apply Filters {activeCount > 0 ? `(${activeCount} active)` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    zIndex: 1,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.White,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.88,
    zIndex: 2,
    ...Shadows.float,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.Gray700,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Gray800,
  },
  sheetTitle: {
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
    gap: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.1,
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
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  budgetValue: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },
  toggleSub: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#0F172A',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.White,
    ...Shadows.subtle,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  applyContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
    paddingBottom: 28,
    backgroundColor: Colors.White,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  applyButton: {
    height: 50,
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
  applyButtonText: {
    color: Colors.White,
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
});
