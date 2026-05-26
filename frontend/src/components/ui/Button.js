import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';

const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  loading = false, 
  disabled = false,
  style,
  textStyle
}) => {
  const getBackgroundStyle = () => {
    switch (variant) {
      case 'primary': return styles.primaryBg;
      case 'secondary': return styles.secondaryBg;
      case 'urgent': return styles.urgentBg;
      default: return styles.primaryBg;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary': return styles.primaryText;
      case 'secondary': return styles.secondaryText;
      case 'urgent': return styles.urgentText;
      default: return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        getBackgroundStyle(),
        (disabled || loading) && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8} // Slight scale simulation for MVP
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? theme.colors.primary : theme.colors.textInverse} />
      ) : (
        <Text style={[styles.textBase, getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: theme.spacing.safeTap,
    borderRadius: theme.radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  textBase: {
    ...theme.typography.labelMedium,
    textTransform: 'uppercase', // Scoreboard feel
  },
  primaryBg: {
    backgroundColor: theme.colors.primary,
  },
  primaryText: {
    color: theme.colors.textInverse,
  },
  secondaryBg: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  secondaryText: {
    color: theme.colors.primary,
  },
  urgentBg: {
    backgroundColor: theme.colors.secondary, // Neon Green
  },
  urgentText: {
    color: theme.colors.text, // Black on Neon Green
  },
  disabled: {
    opacity: 0.6,
  }
});

export default Button;
