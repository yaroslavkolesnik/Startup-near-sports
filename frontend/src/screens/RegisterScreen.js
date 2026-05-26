import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView, SafeAreaView, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { theme } from '../theme';
import { SPORT_KEYS, getSportName } from '../config/sports';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sportSkills, setSportSkills] = useState({});
  const [preferredSports, setPreferredSports] = useState([]);
  const [avatarUri, setAvatarUri] = useState(null);
  const { signUp, isLoading } = useContext(AuthContext);

  const toggleSport = (sport) => {
    setPreferredSports(prev => {
      if (prev.includes(sport)) {
        const newSkills = { ...sportSkills };
        delete newSkills[sport];
        setSportSkills(newSkills);
        return prev.filter(s => s !== sport);
      } else {
        return [...prev, sport];
      }
    });
  };

  const updateSkill = (sport, level) => {
    setSportSkills(prev => ({
      ...prev,
      [sport]: level
    }));
  };

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

  const handleRegister = () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert(t('error'), t('error_fill_all_fields'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('error'), t('error_passwords_mismatch'));
      return;
    }
    const safeUsername = username.trim().replace(/\s+/g, '_');
    const sportsString = preferredSports.join(',');
    signUp(safeUsername, email, password, sportSkills, sportsString, avatarUri);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={styles.formContainer}>
          <Text style={styles.title}>{t('create_account_title')}</Text>
          <Text style={styles.subtitle}>{t('join_community_subtitle')}</Text>

          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarCircle}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <MaterialIcons name="camera-alt" size={40} color="#999" />
              )}
            </TouchableOpacity>
            {!avatarUri && <Text style={styles.avatarText}>{t('add_photo')}</Text>}
          </View>

        <Input
          placeholder={t('username_placeholder')}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        <Input
          placeholder={t('email_placeholder')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          placeholder={t('password_placeholder')}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        
        <Input
          placeholder={t('confirm_password_placeholder')}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <Text style={styles.label}>{t('favorite_sports_label')}</Text>
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
          <View style={styles.skillsContainer}>
            <Text style={styles.label}>{t('your_level_label')}</Text>
            {preferredSports.map(sport => {
              const currentLevel = sportSkills[sport] || 'BEGINNER';
              return (
                <View key={sport} style={styles.skillRow}>
                  <Text style={styles.skillSportName}>{t(sport)}</Text>
                  <View style={styles.levelButtons}>
                    {['BEGINNER', 'AMATEUR', 'PRO'].map(level => (
                      <TouchableOpacity
                        key={level}
                        style={[styles.levelBadge, currentLevel === level && styles.levelBadgeSelected]}
                        onPress={() => updateSkill(sport, level)}
                      >
                        <Text style={[styles.levelText, currentLevel === level && styles.levelTextSelected]}>
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
          title={t('create_account_title')}
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading}
          style={{ marginTop: 8 }}
        />

        <TouchableOpacity 
          style={styles.linkContainer}
          onPress={() => navigation.goBack()}
          activeOpacity={0.6}
        >
          <Text style={styles.linkText}>{t('already_have_account')}<Text style={styles.linkTextBold}>{t('login_btn')}</Text></Text>
        </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  title: {
    ...theme.typography.headlineMedium,
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E1E1E1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    ...theme.typography.labelMedium,
    color: theme.colors.textSecondary,
  },
  linkContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: theme.colors.textSecondary,
    ...theme.typography.bodyMedium,
  },
  linkTextBold: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  label: {
    ...theme.typography.labelMedium,
    color: theme.colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
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
    color: theme.colors.textSecondary,
    ...theme.typography.labelSmall,
  },
  sportBadgeTextActive: {
    color: theme.colors.surface,
  },
  skillsContainer: {
    marginBottom: 24,
  },
  skillRow: {
    marginBottom: 16,
  },
  skillSportName: {
    ...theme.typography.labelMedium,
    color: theme.colors.text,
    marginBottom: 8,
  },
  levelButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelBadge: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: theme.colors.surface,
  },
  levelBadgeSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  levelText: {
    color: theme.colors.textSecondary,
    ...theme.typography.labelSmall,
  },
  levelTextSelected: {
    color: theme.colors.surface,
  },
});
