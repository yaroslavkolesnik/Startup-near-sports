import React, { useState } from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import { theme } from '../../theme';

const Input = ({ label, error, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.focused,
          error && styles.errorInput
        ]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor={theme.colors.outline}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.gutter,
  },
  label: {
    ...theme.typography.labelSmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radii.lg,
    minHeight: theme.spacing.safeTap,
    paddingHorizontal: theme.spacing.md,
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  focused: {
    borderColor: theme.colors.primary,
  },
  errorInput: {
    borderColor: theme.colors.error,
  },
  errorText: {
    ...theme.typography.labelSmall,
    color: theme.colors.error,
    marginTop: theme.spacing.sm,
  }
});

export default Input;
