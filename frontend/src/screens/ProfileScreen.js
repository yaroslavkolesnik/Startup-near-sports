import React, { useContext, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import ImageView from "react-native-image-viewing";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { getSportName, SportIcon } from '../config/sports';

export default function ProfileScreen({ navigation }) {
  const { user, signOut, isLoading } = useContext(AuthContext);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const { t, i18n } = useTranslation();

  if (isLoading || !user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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
      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => user.avatar && setIsGalleryVisible(true)}>
            {user.avatar ? (
              <Image source={{ uri: getAvatarUrl(user.avatar) }} style={styles.profileAvatar} />
            ) : (
              <MaterialIcons name="account-circle" size={100} color={colors.primary} style={styles.profileAvatarPlaceholder} />
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
                        <SportIcon sport={sport} size={24} color={colors.primary} style={styles.sportIcon} />
                      ) : (
                        <Ionicons name="fitness-outline" size={24} color={colors.primary} style={styles.sportIcon} />
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
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.primaryButtonText}>{t('edit_profile')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('MyMatches')}
        >
          <Text style={styles.secondaryButtonText}>{t('my_games')}</Text>
        </TouchableOpacity>

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
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
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
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
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
    borderBottomColor: colors.border,
  },
  sportRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportIcon: {
    marginRight: 14,
  },
  sportNameText: {
    fontSize: 17,
    color: colors.text,
    fontWeight: '500',
  },
  skillBadge: {
    backgroundColor: '#F3F4F6', // Light gray
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  skillBadgeText: {
    color: '#374151', // Dark gray text
    fontSize: 13,
    fontWeight: '600',
  },
  noDataText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  actionsContainer: {
    marginTop: 'auto',
  },
  actionButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border, // Or colors.primary if you want colored outline
  },
  secondaryButtonText: {
    color: colors.text, // Or colors.primary
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: '600',
  },
  languageSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  languageTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  languageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  langButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  langButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  langButtonTextActive: {
    color: '#FFF',
  },
});
