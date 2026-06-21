import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import Button from '../components/ui/Button';
import { sendFeedback } from '../api/users';

const CATEGORIES = [
  { id: 'BUG', label: 'Помилка (BUG)' },
  { id: 'IDEA', label: 'Ідея (IDEA)' },
  { id: 'OTHER', label: 'Інше (OTHER)' }
];

export default function FeedbackScreen({ navigation }) {
  const { t } = useTranslation();
  const [category, setCategory] = useState('OTHER');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) {
      Alert.alert('Помилка', 'Будь ласка, введіть текст повідомлення.');
      return;
    }

    setIsLoading(true);
    try {
      await sendFeedback(category, text.trim());
      Alert.alert(
        'Успіх!',
        "Дякуємо за зворотний зв'язок! 🚀 Ми отримали твоє повідомлення і вже взяли його в роботу. Ти допомагаєш робити наш застосунок кращим!",
        [{ text: 'ОК', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Помилка', error.message || 'Помилка відправки. Спробуйте пізніше.');
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
          Ця форма створена для того, щоб ви могли підказати, що змінити або додати в наш застосунок для покращення його роботи.
        </Text>

        <Text style={styles.sectionTitle}>Категорія</Text>
        <View style={styles.categoriesContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryPill, category === cat.id && styles.categoryPillActive]}
              onPress={() => setCategory(cat.id)}
            >
              <Text style={[styles.categoryPillText, category === cat.id && styles.categoryPillTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Повідомлення</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={6}
          placeholder="Опишіть вашу ідею або знайдену помилку..."
          placeholderTextColor={theme.colors.textSecondary}
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />

        <Button 
          title={isLoading ? 'Відправка...' : 'Відправити'}
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
