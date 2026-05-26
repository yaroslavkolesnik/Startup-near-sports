import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { theme } from '../theme';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, isLoading } = useContext(AuthContext);

  const handleLogin = () => {
    if (!username || !password) return;
    signIn(username, password);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>{t('welcome_back')}</Text>
        <Text style={styles.subtitle}>{t('login_to_continue')}</Text>

        <Input
          placeholder={t('username_placeholder')}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        <Input
          placeholder={t('password_placeholder')}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button 
          title={t('login_btn')}
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading}
          style={{ marginTop: 8 }}
        />

        <TouchableOpacity 
          style={styles.linkContainer}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.6}
        >
          <Text style={styles.linkText}>{t('no_account')}<Text style={styles.linkTextBold}>{t('register_link')}</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    ...theme.typography.headlineLarge,
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
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
});
