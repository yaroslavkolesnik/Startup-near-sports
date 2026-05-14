import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import { updateMatch } from '../api/matches';
import { SPORT_KEYS } from '../config/sports';

export default function EditMatchScreen({ route, navigation }) {
    const { t } = useTranslation();
    const { match } = route.params;
    const pitchSportType = match.pitch_sport_type;

    const [title, setTitle] = useState(match.title || '');
    const [sportType, setSportType] = useState(match.sport_type || 'FOOTBALL');
    const [level, setLevel] = useState(match.level || 'ANY');
    const [maxPlayers, setMaxPlayers] = useState(match.max_players ? match.max_players.toString() : '');
    const [durationMinutes, setDurationMinutes] = useState(match.duration_minutes ? match.duration_minutes.toString() : '90');
    
    const LEVEL_CHOICES = [
        { key: 'ANY', label: t('level_any') },
        { key: 'BEGINNER', label: t('BEGINNER') },
        { key: 'AMATEUR', label: t('AMATEUR') },
        { key: 'PRO', label: t('PRO') },
    ];
    
    // DateTimePicker states
    const [date, setDate] = useState(match.start_time ? new Date(match.start_time) : new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState('date');
    
    const [externalChatLink, setExternalChatLink] = useState(match.external_chat_link || '');
    const [description, setDescription] = useState(match.description || '');
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

    const handleUpdate = async () => {
        if (!title || !maxPlayers || !durationMinutes) {
            Alert.alert(t('error'), t('error_fill_required_match'));
            return;
        }

        setLoading(true);
        try {
            await updateMatch(match.id, {
                title,
                sport_type: sportType,
                level: level,
                max_players: parseInt(maxPlayers, 10),
                duration_minutes: parseInt(durationMinutes, 10),
                start_time: date.toISOString(),
                external_chat_link: externalChatLink,
                description: description,
            });
            Alert.alert(t('success'), t('success_update_match'));
            navigation.goBack(); 
        } catch (error) {
            Alert.alert(t('error'), error.message || t('error_update_match'));
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
                <Text style={styles.label}>{t('match_name_label')}</Text>
                <TextInput
                    style={styles.input}
                    placeholder={t('match_name_placeholder')}
                    placeholderTextColor={colors.textSecondary}
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

                <Text style={styles.label}>{t('max_players_label')}</Text>
                <TextInput
                    style={styles.input}
                    placeholder={t('max_players_placeholder')}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={maxPlayers}
                    onChangeText={setMaxPlayers}
                />

                <Text style={styles.label}>{t('duration_label')}</Text>
                <TextInput
                    style={styles.input}
                    placeholder="90"
                    placeholderTextColor={colors.textSecondary}
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

                <Text style={styles.label}>{t('chat_link_label')}</Text>
                <TextInput
                    style={styles.input}
                    placeholder={t('chat_link_placeholder')}
                    placeholderTextColor={colors.textSecondary}
                    value={externalChatLink}
                    onChangeText={setExternalChatLink}
                    autoCapitalize="none"
                />

                <Text style={styles.label}>{t('description_optional_label')}</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    multiline={true}
                    numberOfLines={4}
                    placeholder={t('match_description_placeholder')}
                    placeholderTextColor={colors.textSecondary}
                    value={description}
                    onChangeText={setDescription}
                />

                <TouchableOpacity 
                    style={styles.submitButton} 
                    onPress={handleUpdate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>{t('save_changes_btn')}</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContainer: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: colors.surface,
        borderRadius: 8,
        padding: 14,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
        fontSize: 16,
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
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 10,
    },
    badgeSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    badgeText: {
        color: colors.textSecondary,
        fontWeight: '600',
    },
    badgeTextSelected: {
        color: '#FFF',
    },
    submitButton: {
        backgroundColor: colors.primary,
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    iosPickerContainer: {
        backgroundColor: colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
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
        backgroundColor: colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    pickerButtonText: {
        color: colors.text,
        fontSize: 16,
    },
});
