import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

const Badge = ({ label, variant = 'default', style }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'active':
        return { bg: theme.colors.primary, text: theme.colors.textInverse };
      case 'success':
        return { bg: theme.colors.secondary, text: theme.colors.text };
      case 'warning':
        return { bg: theme.colors.tertiary, text: theme.colors.textInverse };
      default:
        return { bg: theme.colors.inputBg, text: theme.colors.textSecondary };
    }
  };

  const { bg, text } = getVariantStyles();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.pill,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    ...theme.typography.labelSmall,
    textTransform: 'uppercase',
  }
});

export default Badge;
