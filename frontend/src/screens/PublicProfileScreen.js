import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import ImageView from "react-native-image-viewing";
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import Card from '../components/ui/Card';

export default function PublicProfileScreen({ route }) {
  const { t } = useTranslation();
  const { user } = route.params;
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);

  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://192.168.0.67:8000${path}`;
  };

  const avatarUrl = getAvatarUrl(user.avatar);
  const sportSkills = user.sport_skills || {};
  const skillsEntries = Object.entries(sportSkills);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.headerCard}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => avatarUrl && setIsGalleryVisible(true)}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <MaterialIcons name="account-circle" size={100} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
        <Text style={styles.username}>{(user.username || '').replace(/_/g, ' ')}</Text>
      </Card>

      <Card style={styles.skillsCard}>
        <Text style={styles.sectionTitle}>{t('sports_level_title')}</Text>
        <View style={styles.skillsCloud}>
          {skillsEntries.length > 0 ? (
            skillsEntries.map(([sport, level], index) => (
              <View key={index} style={styles.skillBadge}>
                <Text style={styles.skillBadgeText}>{t(sport)}: {t(level)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>{t('no_skills_yet')}</Text>
          )}
        </View>
      </Card>

      <ImageView
        images={avatarUrl ? [{ uri: avatarUrl }] : []}
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
  content: {
    padding: 16,
  },
  headerCard: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E1E1E1',
    marginBottom: 16,
  },
  username: {
    ...theme.typography.headlineMedium,
    color: theme.colors.text,
  },
  skillsCard: {
  },
  sectionTitle: {
    ...theme.typography.titleMedium,
    color: theme.colors.text,
    marginBottom: 16,
  },
  skillsCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.radii.pill,
    marginBottom: 8,
    marginRight: 8,
  },
  skillBadgeText: {
    color: theme.colors.textInverse,
    ...theme.typography.labelMedium,
  },
  emptyText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});
