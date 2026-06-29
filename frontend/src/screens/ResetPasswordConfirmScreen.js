import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { confirmPasswordReset } from '../api/auth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function ResetPasswordConfirmScreen({ route, navigation }) {
    const { t } = useTranslation();
    const initialEmail = route.params?.email || '';
    const [email, setEmail] = useState(initialEmail);
    const [pinCode, setPinCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email || !pinCode || !newPassword) {
            Alert.alert(t('error_title'), t('error_fill_all_fields'));
            return;
        }

        setLoading(true);
        try {
            await confirmPasswordReset(email, pinCode, newPassword);
            Alert.alert(t('success'), t('success_password_changed'), [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
        } catch (error) {
            Alert.alert(t('error_title'), error.message || 'Не вдалося змінити пароль');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={styles.formContainer}>
                <Text style={styles.title}>{t('nav_reset_password_confirm')}</Text>
                <Text style={styles.subtitle}>{t('code_entry_subtitle')}</Text>

                <Input
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <Input
                    placeholder={t('pin_code_placeholder')}
                    value={pinCode}
                    onChangeText={setPinCode}
                    keyboardType="numeric"
                    maxLength={6}
                />

                <Input
                    placeholder={t('new_password_placeholder')}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                />

                <Button 
                    title={t('change_password_btn')}
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading}
                    style={{ marginTop: 16 }}
                />

                <Button 
                    title={t('back_to_login_btn')}
                    variant="secondary"
                    onPress={() => navigation.navigate('Login')}
                    style={{ marginTop: 16 }}
                    disabled={loading}
                />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' },
    formContainer: { paddingHorizontal: 24 },
    title: { ...theme.typography.headlineLarge, color: theme.colors.text, marginBottom: 8, textAlign: 'center' },
    subtitle: { ...theme.typography.bodyMedium, color: theme.colors.textSecondary, marginBottom: 32, textAlign: 'center' },
});
