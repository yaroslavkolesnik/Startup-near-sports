import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { createMatch } from '../api/matches';
import { SPORT_KEYS } from '../config/sports';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function CreateMatchScreen({ route, navigation }) {
    const { t } = useTranslation();
    const { pitchId, pitchSportType } = route.params;

    const [title, setTitle] = useState('');
    const [sportType, setSportType] = useState(pitchSportType && pitchSportType !== 'MULTI' ? pitchSportType : 'FOOTBALL');
    const [level, setLevel] = useState('ANY');
    const [maxPlayers, setMaxPlayers] = useState('');
    const [durationMinutes, setDurationMinutes] = useState('90');
    
    const LEVEL_CHOICES = [
        { key: 'ANY', label: t('level_any') },
        { key: 'BEGINNER', label: t('BEGINNER') },
        { key: 'AMATEUR', label: t('AMATEUR') },
        { key: 'PRO', label: t('PRO') },
    ];
    
    // DateTimePicker states
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState('date');
    
    const [externalChatLink, setExternalChatLink] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        if (Platform.OS === 'android') {
            setShowPicker(false);
        }
        setDate(currentDate);
    };

    const showMode = (currentMode) => {
        setPickerMode(currentMode);
        setShowPicker(true);
    };

    const handleSubmit = async () => {
        if (!title || !maxPlayers || !durationMinutes) {
            Alert.alert(t('error'), t('error_fill_required_match'));
            return;
        }

        setLoading(true);
        try {
            await createMatch({
                pitch: pitchId,
                title,
                sport_type: sportType,
                level: level,
                max_players: parseInt(maxPlayers, 10),
                duration_minutes: parseInt(durationMinutes, 10),
                start_time: date.toISOString(),
                external_chat_link: externalChatLink,
                description: description,
            });
            Alert.alert(t('success'), t('success_create_match'));
            navigation.popToTop(); // Return to main screen (Map, since it's first in stack)
        } catch (error) {
            let isValidationError = false;
            let backendError = null;

            // Handle Axios-like response object or stringified JSON from fetch
            if (error.response && error.response.status === 400) {
                isValidationError = true;
                backendError = error.response.data?.non_field_errors?.[0] || error.response.data?.error;
            } else {
                try {
                    const parsed = JSON.parse(error.message);
                    if (parsed.non_field_errors || parsed.error) {
                        isValidationError = true;
                        backendError = parsed.non_field_errors?.[0] || parsed.error;
                    }
                } catch (e) {}
            }

            if (isValidationError) {
                Alert.alert(
                    t('error_title'), 
                    backendError || t('error_time_taken')
                );
                return;
            }

            // Дефолтный вывод ошибки (Default error fallback)
            Alert.alert(t('error_title'), error.message || t('error_create_match'));
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
                    label={t('match_name_label')}
                    placeholder={t('match_name_placeholder')}
                    value={title}
                    onChangeText={setTitle}
                />

                <Text style={styles.label}>{t('sport_type_label')}</Text>
                <View style={styles.badgesContainer}>
                    {SPORT_KEYS.map(sport => {
                        if (pitchSportType && pitchSportType !== 'MULTI' && sport !== pitchSportType) {
                            return null;
                        }
                        const isSelected = sportType === sport;
                        return (
                            <TouchableOpacity
                                key={sport}
                                style={[styles.badge, isSelected && styles.badgeSelected]}
                                onPress={() => setSportType(sport)}
                                disabled={pitchSportType && pitchSportType !== 'MULTI'}
                            >
                                <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                                    {t(sport)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.label}>{t('game_level_label')}</Text>
                <View style={styles.badgesContainer}>
                    {LEVEL_CHOICES.map(item => (
                        <TouchableOpacity
                            key={item.key}
                            style={[styles.badge, level === item.key && styles.badgeSelected]}
                            onPress={() => setLevel(item.key)}
                        >
                            <Text style={[styles.badgeText, level === item.key && styles.badgeTextSelected]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Input
                    label={t('max_players_label')}
                    placeholder={t('max_players_placeholder')}
                    keyboardType="numeric"
                    value={maxPlayers}
                    onChangeText={setMaxPlayers}
                />

                <Input
                    label={t('duration_label')}
                    placeholder="90"
                    keyboardType="numeric"
                    value={durationMinutes}
                    onChangeText={setDurationMinutes}
                />

                <Text style={styles.label}>{t('start_time_label')}</Text>
                
                {Platform.OS === 'ios' ? (
                    <View style={styles.iosPickerContainer}>
                        <DateTimePicker
                            value={date}
                            mode="datetime"
                            display="default"
                            onChange={onDateChange}
                            style={styles.iosPicker}
                        />
                    </View>
                ) : (
                    <View style={styles.androidPickerButtons}>
                        <TouchableOpacity style={styles.pickerButton} onPress={() => showMode('date')}>
                            <Text style={styles.pickerButtonText}>
                                {t('date_label')}{date.toLocaleDateString()}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.pickerButton} onPress={() => showMode('time')}>
                            <Text style={styles.pickerButtonText}>
                                {t('time_label')}{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </TouchableOpacity>
                        {showPicker && (
                            <DateTimePicker
                                value={date}
                                mode={pickerMode}
                                is24Hour={true}
                                display="default"
                                onChange={onDateChange}
                            />
                        )}
                    </View>
                )}

                <Input
                    label={t('chat_link_label')}
                    placeholder={t('chat_link_placeholder')}
                    value={externalChatLink}
                    onChangeText={setExternalChatLink}
                    autoCapitalize="none"
                />

                <Input
                    label={t('description_optional_label')}
                    style={styles.textArea}
                    multiline={true}
                    numberOfLines={4}
                    placeholder={t('match_description_placeholder')}
                    value={description}
                    onChangeText={setDescription}
                />

                <Button 
                    title={t('create_game_btn')}
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading}
                    style={{ marginTop: 20, marginBottom: 20 }}
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
    label: {
        ...theme.typography.labelMedium,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
        marginTop: 16,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    badgesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    badge: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 10,
    },
    badgeSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    badgeText: {
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    badgeTextSelected: {
        color: '#FFF',
    },
    iosPickerContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 8,
        alignItems: 'flex-start',
    },
    iosPicker: {
        width: '100%',
    },
    androidPickerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    pickerButton: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 14,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    pickerButtonText: {
        color: theme.colors.text,
        fontSize: 16,
    },
});
