import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { theme } from '../theme';
import { SPORT_KEYS, getSportName } from '../config/sports';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function EditProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const { user, updateProfile, isLoading } = useContext(AuthContext);
  
  const [username, setUsername] = useState(user?.username ? user.username.replace(/_/g, ' ') : '');
  const [sportSkills, setSportSkills] = useState(user?.sport_skills || {});
  const [preferredSports, setPreferredSports] = useState([]);
  const [avatarUri, setAvatarUri] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://192.168.0.67:8000${path}`;
  };

  useEffect(() => {
    if (user?.preferred_sports) {
      setPreferredSports(user.preferred_sports.split(',').map(s => s.trim()).filter(s => s));
    }
  }, [user]);

  const toggleSport = (sport) => {
    if (preferredSports.includes(sport)) {
      setPreferredSports(prev => prev.filter(s => s !== sport));
      setSportSkills(prev => {
        const newSkills = { ...prev };
        delete newSkills[sport];
        return newSkills;
      });
    } else {
      setPreferredSports(prev => [...prev, sport]);
      setSportSkills(prev => ({ ...prev, [sport]: 'BEGINNER' }));
    }
  };

  const updateSkill = (sport, level) => {
    setSportSkills(prev => ({ ...prev, [sport]: level }));
  };

  const handleSave = async () => {
    if (!username) {
      Alert.alert(t('error'), t('error_username_empty'));
      return;
    }
    const safeUsername = username.trim().replace(/\s+/g, '_');
    const sportsString = preferredSports.join(',');
    setIsSaving(true);
    try {
      if (avatarUri) {
        const formData = new FormData();
        formData.append('username', safeUsername);
        formData.append('preferred_sports', sportsString);
        formData.append('sport_skills', JSON.stringify(sportSkills));
        
        formData.append('avatar', {
          uri: avatarUri,
          name: 'avatar.jpg',
          type: 'image/jpeg'
        });

        await updateProfile(formData);
      } else {
        await updateProfile({
          username: safeUsername,
          sport_skills: sportSkills,
          preferred_sports: sportsString
        });
      }
      navigation.goBack();
    } catch (error) {
      // Error handled in context
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
        
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarCircle}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : user?.avatar ? (
              <Image source={{ uri: getAvatarUrl(user.avatar) }} style={styles.avatarImage} />
            ) : (
              <MaterialIcons name="camera-alt" size={40} color="#999" />
            )}
          </TouchableOpacity>
        </View>

        <Input
          label={t('username_label')}
          placeholder={t('username_placeholder')}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.sectionTitle}>{t('favorite_sports_label')}</Text>
        <View style={styles.sportsContainer}>
          {SPORT_KEYS.map((sport) => {
            const isSelected = preferredSports.includes(sport);
            return (
              <TouchableOpacity
                key={sport}
                style={[styles.sportBadge, isSelected && styles.sportBadgeActive]}
                onPress={() => toggleSport(sport)}
              >
                <Text style={[styles.sportBadgeText, isSelected && styles.sportBadgeTextActive]}>
                  {t(sport)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {preferredSports.length > 0 && (
          <View style={styles.dynamicSkillContainer}>
            <Text style={styles.sectionTitle}>{t('skill_level_label')}</Text>
            {preferredSports.map(sport => {
              const currentLevel = sportSkills[sport] || 'BEGINNER';
              return (
                <View key={sport} style={styles.skillRow}>
                  <Text style={styles.sportName}>{t(sport)}</Text>
                  <View style={styles.skillContainer}>
                    {['BEGINNER', 'AMATEUR', 'PRO'].map(level => (
                      <TouchableOpacity
                        key={level}
                        style={[styles.skillButton, currentLevel === level && styles.skillButtonActive]}
                        onPress={() => updateSkill(sport, level)}
                      >
                        <Text style={[styles.skillButtonText, currentLevel === level && styles.skillButtonTextActive]}>
                          {t(level)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Button 
          title={t('save_changes_btn')}
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
          style={{ marginTop: 8 }}
        />
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'flex-start',
    paddingTop: 24,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E1E1E1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  sectionTitle: {
    ...theme.typography.labelMedium,
    color: theme.colors.textSecondary,
    marginTop: 8,
    marginBottom: 12,
  },
  skillContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  skillButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: theme.colors.surface,
  },
  skillButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  skillButtonText: {
    ...theme.typography.labelSmall,
    color: theme.colors.textSecondary,
  },
  skillButtonTextActive: {
    color: theme.colors.textInverse,
  },
  dynamicSkillContainer: {
    marginBottom: 16,
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 32,
  },
  sportBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
  },
  sportBadgeActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  sportBadgeText: {
    ...theme.typography.labelSmall,
    color: theme.colors.textSecondary,
  },
  sportBadgeTextActive: {
    color: theme.colors.textInverse,
  },
});
