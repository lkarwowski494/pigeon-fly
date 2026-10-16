/**
 * PIGEON-FLY — FieldButton Component
 * Ergonomic Field Mode button designed for one-handed operation in the loft.
 * Touch target >= 56pt, high contrast, tactile haptic feedback.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export interface FieldButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  accessibilityLabel?: string;
}

export const FieldButton: React.FC<FieldButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
  accessibilityLabel,
}) => {
  const handlePress = async () => {
    if (disabled || loading) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics not supported or mocked
    }
    onPress();
  };

  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading }}
      activeOpacity={0.7}
      disabled={disabled || loading}
      onPress={disabled || loading ? undefined : handlePress}
      style={[
        styles.button,
        styles[variant],
        disabled && styles.disabledButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'secondary' ? styles.secondaryText : styles.primaryText,
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 56, // Ergonomic minimum touch target
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: '#E5A93C', // Pigeon amber / high contrast
  },
  secondary: {
    backgroundColor: '#262930',
    borderWidth: 1.5,
    borderColor: '#3D424D',
  },
  success: {
    backgroundColor: '#2E7D32',
  },
  danger: {
    backgroundColor: '#C62828',
  },
  disabledButton: {
    backgroundColor: '#1E2024',
    borderColor: '#2A2D33',
    borderWidth: 1,
  },
  text: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  primaryText: {
    color: '#121417',
  },
  secondaryText: {
    color: '#F0F2F5',
  },
  disabledText: {
    color: '#656A76',
  },
});
