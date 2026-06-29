import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { requestPasswordReset } from '../api/auth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function ForgotPasswordScreen({ navigation }) {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email) {
            Alert.alert(t('error_title'), t('error_fill_email'));
            return;
        }

        setLoading(true);
        try {
            await requestPasswordReset(email);
            Alert.alert(t('success'), t('success_code_sent'), [
                { text: 'OK', onPress: () => navigation.navigate('ResetPasswordConfirm', { email }) }
            ]);
        } catch (error) {
            Alert.alert(t('error_title'), error.message || 'Не вдалося відправити запит');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={styles.formContainer}>
                <Text style={styles.title}>{t('nav_forgot_password')}</Text>
                <Text style={styles.subtitle}>{t('forgot_password_subtitle')}</Text>

                <Input
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <Button 
                    title={t('send_code_btn')}
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading}
                    style={{ marginTop: 16 }}
                />

                <Button 
                    title={t('back_btn')}
                    variant="secondary"
                    onPress={() => navigation.goBack()}
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
