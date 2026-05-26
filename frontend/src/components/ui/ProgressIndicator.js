import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme';

const ProgressIndicator = ({ current, max, style }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  
  // Neon Green fill creates visual urgency
  return (
    <View style={[styles.track, style]}>
      <View 
        style={[
          styles.fill, 
          { width: `${percentage}%` }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radii.pill,
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: theme.colors.secondary, // Neon green
    borderRadius: theme.radii.pill,
  }
});

export default ProgressIndicator;
