import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../theme';
import { changePassword } from '../api/auth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function ChangePasswordScreen({ navigation }) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Помилка', 'Будь ласка, заповніть всі поля');
            return;
        }

        if (newPassword.length < 8) {
            Alert.alert('Помилка', 'Новий пароль має бути не коротше 8 символів');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Помилка', 'Новий пароль та підтвердження не співпадають');
            return;
        }

        setLoading(true);
        try {
            await changePassword(oldPassword, newPassword);
            Alert.alert('Успіх', 'Пароль успішно змінено', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Помилка', error.message || 'Не вдалося змінити пароль');
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
                    label="Старий пароль"
                    placeholder="Введіть старий пароль"
                    secureTextEntry={true}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                />
                
                <Input
                    label="Новий пароль"
                    placeholder="Мінімум 8 символів"
                    secureTextEntry={true}
                    value={newPassword}
                    onChangeText={setNewPassword}
                />
                
                <Input
                    label="Підтвердження нового пароля"
                    placeholder="Повторіть новий пароль"
                    secureTextEntry={true}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />

                <Button 
                    title="Зберегти новий пароль"
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
