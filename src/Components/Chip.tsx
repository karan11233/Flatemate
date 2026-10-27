import { StyleSheet, Text, TouchableOpacity, View, StyleProp, ViewStyle } from 'react-native';
import React from 'react';
import { Colors, Shadows } from '../Theme/colors';
import { Fonts } from '../Theme/Fonts';

type Props = {
  text: string;
  isActive?: boolean;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function Chip({ text, isActive = false, onPress, leftIcon, style }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      style={[
        styles.Container,
        isActive ? styles.containerActive : styles.containerInactive,
        style,
      ]}
    >
      {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
      <Text
        style={[
          styles.text,
          isActive ? styles.textActive : styles.textInactive,
        ]}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  Container: {
    height: 36,
    paddingHorizontal: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    flexDirection: 'row',
  },
  containerActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
    ...Shadows.subtle,
  },
  containerInactive: {
    backgroundColor: Colors.White,
    borderColor: '#E2E8F0',
    ...Shadows.subtle,
  },
  iconContainer: {
    marginRight: 6,
  },
  text: {
    fontSize: 13,
  },
  textActive: {
    color: Colors.White,
    fontFamily: Fonts.bold,
  },
  textInactive: {
    color: '#475569',
    fontFamily: Fonts.medium,
  },
});