import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { changePassword } from '../api/auth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function ChangePasswordScreen({ navigation }) {
    const { t } = useTranslation();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert(t('error_title'), t('error_fill_all_fields'));
            return;
        }

        if (newPassword.length < 8) {
            Alert.alert(t('error_title'), t('password_min_length'));
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert(t('error_title'), t('error_passwords_mismatch'));
            return;
        }

        setLoading(true);
        try {
            await changePassword(oldPassword, newPassword);
            Alert.alert(t('success'), t('success_password_changed'), [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert(t('error_title'), error.message || 'Не вдалося змінити пароль');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Input
                    label={t('old_password_label')}
                    placeholder={t('old_password_placeholder')}
                    secureTextEntry={true}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                />
                
                <Input
                    label={t('new_password_label')}
                    placeholder={t('new_password_min_8')}
                    secureTextEntry={true}
                    value={newPassword}
                    onChangeText={setNewPassword}
                />
                
                <Input
                    label={t('confirm_new_password_label')}
                    placeholder={t('confirm_new_password_placeholder')}
                    secureTextEntry={true}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />

                <Button 
                    title={t('save_new_password_btn')}
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading}
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
    scrollContainer: {
        padding: 20,
    },
});
