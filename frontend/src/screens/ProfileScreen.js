import React, { useContext, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import ImageView from "react-native-image-viewing";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { theme } from '../theme';
import { getSportName, SportIcon } from '../config/sports';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function ProfileScreen({ navigation }) {
  const { user, signOut, isLoading } = useContext(AuthContext);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const { t, i18n } = useTranslation();

  if (isLoading || !user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Combine preferred sports and skills into a unique list
  const sportsList = user.preferred_sports ? user.preferred_sports.split(',').map(s => s.trim()).filter(Boolean) : [];
  const skillsList = Object.keys(user.sport_skills || {});
  const activeSports = Array.from(new Set([...sportsList, ...skillsList]));

  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://192.168.0.67:8000${path}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.card}>
        <View style={styles.profileHeader}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => user.avatar && setIsGalleryVisible(true)}>
            {user.avatar ? (
              <Image source={{ uri: getAvatarUrl(user.avatar) }} style={styles.profileAvatar} />
            ) : (
              <MaterialIcons name="account-circle" size={100} color={theme.colors.primary} style={styles.profileAvatarPlaceholder} />
            )}
          </TouchableOpacity>
          <Text style={styles.username}>{(user.username || '').replace(/_/g, ' ')}</Text>
          {user.email ? <Text style={styles.email}>{user.email}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('my_sports')}</Text>
          <View style={styles.sportsVerticalContainer}>
            {activeSports.length > 0 ? (
              activeSports.map((sport, index) => {
                // Get level directly from db (e.g. 'PRO')
                const level = user?.sport_skills?.[sport];

                // If level exists, translate it. If not - leave null
                const levelName = level ? t(level) : null;

                return (
                  <View key={index} style={styles.sportRow}>
                    <View style={styles.sportRowLeft}>
                      {SportIcon ? (
                        <SportIcon sport={sport} size={24} color={theme.colors.primary} style={styles.sportIcon} />
                      ) : (
                        <Ionicons name="fitness-outline" size={24} color={theme.colors.primary} style={styles.sportIcon} />
                      )}
                      {/* Если getSportName возвращает русский текст, лучше заменить на t(sport) */}
                      <Text style={styles.sportNameText}>{t(sport)}</Text>
                    </View>
                    {levelName && (
                      <View style={styles.skillBadge}>
                        <Text style={styles.skillBadgeText}>{levelName}</Text>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <Text style={styles.noDataText}>{t('no_sports')}</Text>
            )}
          </View>
        </View>
      </Card>

      <View style={styles.actionsContainer}>
        <Button 
          title={t('edit_profile')}
          onPress={() => navigation.navigate('EditProfile')}
          style={{ marginBottom: 12 }}
        />

        <Button 
          title={t('my_games')}
          variant="secondary"
          onPress={() => navigation.navigate('MyMatches')}
          style={{ marginBottom: 12 }}
        />

        <TouchableOpacity style={styles.logoutMinimalButton} onPress={signOut}>
          <Ionicons name="log-out-outline" size={22} color="#FF3B30" style={{ marginRight: 6 }} />
          <Text style={styles.logoutMinimalText}>{t('logout')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.languageSection}>
        <Text style={styles.languageTitle}>{t('language')}</Text>
        <View style={styles.languageButtonsContainer}>
          <TouchableOpacity
            style={[styles.langButton, i18n.language === 'uk' && styles.langButtonActive]}
            onPress={() => i18n.changeLanguage('uk')}
          >
            <Text style={[styles.langButtonText, i18n.language === 'uk' && styles.langButtonTextActive]}>🇺🇦 УКР</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langButton, i18n.language === 'en' && styles.langButtonActive]}
            onPress={() => i18n.changeLanguage('en')}
          >
            <Text style={[styles.langButtonText, i18n.language === 'en' && styles.langButtonTextActive]}>🇬🇧 ENG</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langButton, i18n.language === 'ru' && styles.langButtonActive]}
            onPress={() => i18n.changeLanguage('ru')}
          >
            <Text style={[styles.langButtonText, i18n.language === 'ru' && styles.langButtonTextActive]}>🇷🇺 РУС</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ImageView
        images={user.avatar ? [{ uri: getAvatarUrl(user.avatar) }] : []}
        imageIndex={0}
        visible={isGalleryVisible}
        onRequestClose={() => setIsGalleryVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 24,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E1E1E1',
    marginBottom: 16,
  },
  profileAvatarPlaceholder: {
    marginBottom: 12,
  },
  username: {
    ...theme.typography.headlineMedium,
    color: theme.colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  email: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    ...theme.typography.labelLarge,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  sportsVerticalContainer: {
    marginTop: 4,
  },
  sportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sportRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportIcon: {
    marginRight: 14,
  },
  sportNameText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text,
    fontWeight: '500',
  },
  skillBadge: {
    backgroundColor: theme.colors.surfaceContainer, // Light gray
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radii.pill,
  },
  skillBadgeText: {
    ...theme.typography.labelSmall,
    color: theme.colors.textSecondary,
  },
  noDataText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  actionsContainer: {
    marginTop: 'auto',
  },
  logoutMinimalButton: {
    flexDirection: 'row',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutMinimalText: {
    color: '#FF3B30',
    ...theme.typography.labelLarge,
  },
  languageSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  languageTitle: {
    ...theme.typography.labelMedium,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  languageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  langButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  langButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  langButtonText: {
    ...theme.typography.labelMedium,
    color: theme.colors.textSecondary,
  },
  langButtonTextActive: {
    color: '#FFF',
  },
});
