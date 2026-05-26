import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { useTranslation } from 'react-i18next';

import { PITCH_SPORTS, SPORTS, SportIcon } from '../config/sports';

export default function SportFilter({ selectedSport, onSelectSport, style, excludeMulti = false, paymentFilter = undefined, onPaymentFilterChange = null }) {
  const { t } = useTranslation();
  const sourceSports = excludeMulti ? SPORTS : PITCH_SPORTS;
  
  const OPTIONS = [
    { label: t('all_sports'), value: 'ALL', icon: 'all-inclusive' },
    ...Object.keys(sourceSports).map(key => ({
      label: t(key),
      value: key,
      icon: sourceSports[key].icon
    }))
  ];
  return (
    <View style={[styles.wrapper, style]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {OPTIONS.map((option) => {
          const isActive = selectedSport === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.chip, isActive && styles.activeChip]}
              onPress={() => onSelectSport(option.value)}
            >
              {option.value === 'ALL' ? (
                 <Text style={[styles.text, isActive && styles.activeText]}>{option.label}</Text>
              ) : (
                 <View style={styles.chipContent}>
                   <SportIcon sport={option.value} size={16} color={isActive ? '#FFFFFF' : theme.colors.textSecondary} style={styles.icon} />
                   <Text style={[styles.text, isActive && styles.activeText]}>
                     {option.label}
                   </Text>
                 </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {onPaymentFilterChange && (
        <View style={styles.paymentFilterContainer}>
          <TouchableOpacity
            style={[styles.paymentChip, paymentFilter === null && styles.activePaymentChip]}
            onPress={() => onPaymentFilterChange(null)}
          >
            <Text style={[styles.paymentText, paymentFilter === null && styles.activePaymentText]}>{t('filter_all')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.paymentChip, paymentFilter === false && styles.activePaymentChip]}
            onPress={() => onPaymentFilterChange(false)}
          >
            <Text style={[styles.paymentText, paymentFilter === false && styles.activePaymentText]}>{t('filter_free')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.paymentChip, paymentFilter === true && styles.activePaymentChip]}
            onPress={() => onPaymentFilterChange(true)}
          >
            <Text style={[styles.paymentText, paymentFilter === true && styles.activePaymentText]}>{t('filter_paid')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexShrink: 0,
    paddingVertical: 10,
    minHeight: 60,
  },
  container: {
    maxHeight: 60,
  },
  contentContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  text: {
    ...theme.typography.labelMedium,
    color: theme.colors.textSecondary,
  },
  activeText: {
    color: theme.colors.textInverse,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  paymentFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: 10,
    justifyContent: 'space-between',
  },
  paymentChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainer,
    marginHorizontal: 4,
    borderRadius: theme.radii.md,
  },
  activePaymentChip: {
    backgroundColor: theme.colors.primary,
  },
  paymentText: {
    ...theme.typography.labelSmall,
    color: theme.colors.textSecondary,
  },
  activePaymentText: {
    color: theme.colors.textInverse,
  },
});
