import {
  StyleSheet,
  View,
  TextInput,
  TextInputProps,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';
import React, { useState } from 'react';
import { Colors } from '../Theme/colors';
import { Fonts } from '../Theme/Fonts';

interface Props extends TextInputProps {
  label?: string;
  placeHolder?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function Input({
  label,
  placeHolder,
  leftIcon,
  rightIcon,
  value,
  onChangeText,
  style,
  containerStyle,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.rootWrapper}>
      {label && <Text style={styles.labelText}>{label}</Text>}
      <View
        style={[
          styles.container,
          isFocused && styles.containerFocused,
          containerStyle,
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          placeholder={placeHolder}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          style={[styles.textInput, style]}
          {...rest}
        />
        {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootWrapper: {
    gap: 6,
  },
  labelText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#0F172A',
  },
  container: {
    height: 48,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    paddingHorizontal: 14,
    flexDirection: 'row',
    backgroundColor: Colors.White,
  },
  containerFocused: {
    borderColor: '#0F172A',
    backgroundColor: Colors.White,
  },
  leftIconContainer: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: '100%',
    color: '#0F172A',
    fontFamily: Fonts.medium,
    fontSize: 14,
    padding: 0,
  },
});