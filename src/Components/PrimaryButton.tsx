import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native';
import React from 'react';
import { Colors, Shadows } from '../Theme/colors';
import { Fonts } from '../Theme/Fonts';

type Props = {
  Label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: 'primary' | 'white' | 'outline';
  disabled?: boolean;
  loading?: boolean;
};

export default function PrimaryButton({
  Label,
  onPress,
  style,
  textStyle,
  variant = 'white',
  disabled = false,
  loading = false,
}: Props) {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[
        styles.Button,
        isPrimary && styles.buttonPrimary,
        isOutline && styles.buttonOutline,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isPrimary ? '#ffffff' : '#0F172A'} />
      ) : (
        <Text
          style={[
            styles.ButtonText,
            isPrimary && styles.textPrimary,
            isOutline && styles.textOutline,
            textStyle,
          ]}
        >
          {Label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  Button: {
    height: 48,
    paddingHorizontal: 20,
    backgroundColor: Colors.White,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  buttonPrimary: {
    backgroundColor: '#0F172A',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  ButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: Fonts.bold,
    letterSpacing: 0.2,
  },
  textPrimary: {
    color: Colors.White,
  },
  textOutline: {
    color: '#0F172A',
  },
});