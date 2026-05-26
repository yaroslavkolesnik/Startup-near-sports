import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme';

const Card = ({ children, style, level = 1 }) => {
  return (
    <View style={[
      styles.card,
      level === 1 ? styles.level1 : styles.level2,
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.gutter,
  },
  level1: {
    ...theme.shadows.level1,
  },
  level2: {
    ...theme.shadows.level2,
  }
});

export default Card;
