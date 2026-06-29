import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import Button from '../components/ui/Button';
import { sendFeedback } from '../api/users';

const CATEGORIES = ['BUG', 'IDEA', 'OTHER'];

export default function FeedbackScreen({ navigation }) {
  const { t } = useTranslation();
  const [category, setCategory] = useState('OTHER');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) {
      Alert.alert(t('error_title'), t('error_empty_feedback'));
      return;
    }

    setIsLoading(true);
    try {
      await sendFeedback(category, text.trim());
      Alert.alert(
        t('success'),
        t('success_feedback_desc'),
        [{ text: 'ОК', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(t('error_title'), error.message || t('error_send_feedback'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.descriptionText}>
          {t('feedback_desc')}
        </Text>

        <Text style={styles.sectionTitle}>{t('category_label')}</Text>
        <View style={styles.categoriesContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPill, category === cat && styles.categoryPillActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryPillText, category === cat && styles.categoryPillTextActive]}>
                {t(`cat_${cat.toLowerCase()}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('message_label')}</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={6}
          placeholder={t('feedback_placeholder')}
          placeholderTextColor={theme.colors.textSecondary}
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />

        <Button 
          title={isLoading ? t('sending_btn') : t('send_btn')}
          onPress={handleSend}
          disabled={isLoading || !text.trim()}
          loading={isLoading}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  descriptionText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  sectionTitle: {
    ...theme.typography.labelMedium,
    color: theme.colors.text,
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  categoryPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryPillText: {
    ...theme.typography.labelMedium,
    color: theme.colors.textSecondary,
  },
  categoryPillTextActive: {
    color: theme.colors.textInverse,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: 16,
    color: theme.colors.text,
    ...theme.typography.bodyLarge,
    minHeight: 150,
  },
});
