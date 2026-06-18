import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { AuthContext } from '../context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getMatchMessages, sendMatchMessage, updateMatchMessage, deleteMatchMessage, createRematch, getMatch } from '../api/matches';

export default function MatchChatScreen({ route, navigation }) {
    const { t } = useTranslation();
    const { matchId, matchTitle } = route.params;
    const { user } = useContext(AuthContext);

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMsg, setEditingMsg] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [date, setDate] = useState(new Date());
    const flatListRef = useRef(null);

    useEffect(() => {
        navigation.setOptions({ 
            title: matchTitle || t('chat_title', 'Чат'),
            headerRight: () => (
                <TouchableOpacity onPress={handleRematch} style={{ marginRight: 15 }}>
                    <MaterialIcons name="repeat" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            )
        });

        fetchMessages();
        const intervalId = setInterval(fetchMessages, 3000);

        return () => clearInterval(intervalId);
    }, [matchId]);

    const fetchMessages = async () => {
        try {
            const data = await getMatchMessages(matchId);
            setMessages(Array.isArray(data) ? data : []);
        } catch (error) {
            console.log("Error loading chat messages:", error);
        } finally {
            if (loading) setLoading(false);
        }
    };

    const confirmRematch = async (daysToAdd = null, customDate = null) => {
        setSending(true);
        try {
            let targetDate;
            if (daysToAdd) {
                const matchData = await getMatch(matchId);
                targetDate = new Date(matchData.start_time);
                targetDate.setDate(targetDate.getDate() + daysToAdd);
            } else {
                targetDate = customDate;
            }
            
            await createRematch(matchId, targetDate.toISOString());
            Alert.alert(t('success'), t('rematch_created_success', 'Повторный матч успешно создан!'));
            await fetchMessages();
        } catch (err) {
            Alert.alert(t('error'), err.message);
        } finally {
            setSending(false);
        }
    };

    const handleRematch = () => {
        Alert.alert(
            t('rematch_title', 'Повторить матч'),
            t('rematch_desc', 'Когда вы хотите провести повторную игру?'),
            [
                { text: t('cancel', 'Отмена'), style: 'cancel' },
                { text: t('next_week', 'Через 1 неделю'), onPress: () => confirmRematch(7) },
                { text: t('two_weeks', 'Через 2 недели'), onPress: () => confirmRematch(14) },
                { text: t('pick_date', 'Выбрать в календаре'), onPress: () => setShowDatePicker(true) }
            ]
        );
    };

    const handleSend = async () => {
        if (!inputText.trim() || sending) return;

        const textToSend = inputText.trim();
        setSending(true);

        try {
            if (editingMsg) {
                await updateMatchMessage(matchId, editingMsg.id, textToSend);
            } else {
                await sendMatchMessage(matchId, textToSend, replyingTo ? replyingTo.id : null);
            }
            setInputText('');
            setEditingMsg(null);
            setReplyingTo(null);
            await fetchMessages();
        } catch (error) {
            console.log("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    const handleLongPress = (message) => {
        const isMyMessage = user && user.username === message.sender_name;
        
        const options = [];
        options.push({ text: t('reply', 'Ответить'), onPress: () => {
            setEditingMsg(null);
            setReplyingTo(message);
        }});
        
        if (isMyMessage) {
            options.push({ text: t('edit', 'Редактировать'), onPress: () => {
                setReplyingTo(null);
                setEditingMsg(message);
                setInputText(message.text);
            }});
            options.push({ text: t('delete', 'Удалить'), style: 'destructive', onPress: () => confirmDelete(message) });
        }
        
        options.push({ text: t('cancel', 'Отмена'), style: 'cancel' });
        
        Alert.alert(t('actions', 'Действия'), t('message_actions_desc', 'Что вы хотите сделать с сообщением?'), options);
    };

    const confirmDelete = (message) => {
        Alert.alert(
            t('confirm_delete_title', 'Удалить сообщение?'),
            t('confirm_delete_desc', 'Это действие нельзя отменить.'),
            [
                { text: t('cancel', 'Отмена'), style: 'cancel' },
                { text: t('delete', 'Удалить'), style: 'destructive', onPress: async () => {
                    try {
                        await deleteMatchMessage(matchId, message.id);
                        await fetchMessages();
                    } catch (err) {
                        console.log(err);
                    }
                }}
            ]
        );
    };

    const getAvatarUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `http://192.168.0.67:8000${path}`;
    };

    const inviteRegex = /Матч ID: (\d+)/;

    const renderMessage = ({ item }) => {
        const isMyMessage = user && user.username === item.sender_name;
        
        const inviteMatch = item.text.match(inviteRegex);

        if (inviteMatch) {
            const newMatchId = inviteMatch[1];
            return (
                <View style={styles.inviteCardContainer}>
                    <View style={styles.inviteCard}>
                        <View style={styles.inviteCardHeader}>
                            <MaterialIcons name="event-available" size={24} color="#FFF" />
                            <Text style={styles.inviteCardTitle}>
                                 {item.sender_name} {t('created_rematch', 'повторяет игру')}!
                            </Text>
                        </View>
                        <Text style={styles.inviteCardText}>
                            {item.text.replace(inviteMatch[0], '').trim()}
                        </Text>
                        <TouchableOpacity 
                            style={styles.inviteCardButton}
                            onPress={() => navigation.navigate('MatchDetails', { match: { id: parseInt(newMatchId) } })}
                        >
                            <Text style={styles.inviteCardButtonText}>{t('go_to_match', 'Вступить в новую игру')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return (
            <TouchableOpacity 
                activeOpacity={0.8}
                onLongPress={() => handleLongPress(item)}
                style={[styles.messageWrapper, isMyMessage ? styles.messageWrapperRight : styles.messageWrapperLeft]}
            >
                {!isMyMessage && (
                    <View style={styles.avatarContainer}>
                        {item.sender_avatar ? (
                            <Image source={{ uri: getAvatarUrl(item.sender_avatar) }} style={styles.avatar} />
                        ) : (
                            <MaterialIcons name="account-circle" size={32} color={theme.colors.primary} />
                        )}
                    </View>
                )}
                
                <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble]}>
                    {item.reply_to && (
                        <View style={[styles.quoteBlock, isMyMessage ? styles.myQuoteBlock : styles.otherQuoteBlock]}>
                            <Text style={[styles.quoteSender, isMyMessage ? styles.myQuoteSender : styles.otherQuoteSender]}>
                                {item.reply_to.sender_name}
                            </Text>
                            <Text style={[styles.quoteText, isMyMessage ? styles.myQuoteText : styles.otherQuoteText]} numberOfLines={2}>
                                {item.reply_to.text}
                            </Text>
                        </View>
                    )}
                
                    <Text style={[styles.senderName, isMyMessage ? styles.mySenderName : null]}>
                        {item.sender_name ? item.sender_name.replace(/_/g, ' ') : 'User'}
                    </Text>
                    <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
                        {item.text}
                    </Text>
                    <View style={styles.timeContainer}>
                        {item.is_edited && (
                            <Text style={[styles.editedText, isMyMessage ? styles.myEditedText : styles.otherEditedText]}>
                                {t('edited', '(изменено)')}
                            </Text>
                        )}
                        <Text style={[styles.timeText, isMyMessage ? styles.myTimeText : styles.otherTimeText]}>
                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderMessage}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
            
            {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="datetime"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setDate(selectedDate);
                      if (Platform.OS === 'android' || event.type === 'set') {
                          confirmRematch(null, selectedDate);
                          setShowDatePicker(false);
                      }
                    }
                  }}
                />
            )}
            
            { (replyingTo || editingMsg) && (
                <View style={styles.actionBanner}>
                    <View style={styles.actionBannerContent}>
                        <MaterialIcons 
                            name={editingMsg ? "edit" : "reply"} 
                            size={20} 
                            color={theme.colors.primary} 
                            style={{ marginRight: 8 }} 
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.actionBannerTitle}>
                                {editingMsg ? t('editing_message', 'Редактирование') : t('replying_to', 'Ответ: ') + replyingTo.sender_name}
                            </Text>
                            <Text style={styles.actionBannerText} numberOfLines={1}>
                                {editingMsg ? editingMsg.text : replyingTo.text}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => { setReplyingTo(null); setEditingMsg(null); setInputText(''); }}>
                        <MaterialIcons name="close" size={24} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            )}
            
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder={t('send_msg_placeholder', 'Введите сообщение...')}
                    placeholderTextColor={theme.colors.textSecondary}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                />
                <TouchableOpacity 
                    style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
                    onPress={handleSend}
                    disabled={!inputText.trim() || sending}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <MaterialIcons name="send" size={24} color="#FFF" />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    inviteCardContainer: {
        marginVertical: 16,
        paddingHorizontal: 16,
        width: '100%',
        alignItems: 'center',
    },
    inviteCard: {
        width: '100%',
        backgroundColor: '#4ade80',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    inviteCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    inviteCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        marginLeft: 8,
    },
    inviteCardText: {
        fontSize: 14,
        color: '#FFF',
        marginBottom: 16,
        lineHeight: 20,
        opacity: 0.9,
    },
    inviteCardButton: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    inviteCardButtonText: {
        color: '#166534',
        fontSize: 16,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
        flexGrow: 1,
        justifyContent: 'flex-end',
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-end',
    },
    messageWrapperLeft: {
        justifyContent: 'flex-start',
        paddingRight: 50,
    },
    messageWrapperRight: {
        justifyContent: 'flex-end',
        paddingLeft: 50,
    },
    avatarContainer: {
        marginRight: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E1E1E1',
    },
    messageBubble: {
        padding: 12,
        borderRadius: 16,
    },
    otherMessageBubble: {
        backgroundColor: theme.colors.surface,
        borderBottomLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    myMessageBubble: {
        backgroundColor: theme.colors.primary,
        borderBottomRightRadius: 4,
    },
    senderName: {
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: 4,
        fontSize: 13,
    },
    mySenderName: {
        color: '#FFF',
        opacity: 0.8,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    otherMessageText: {
        color: theme.colors.text,
    },
    myMessageText: {
        color: '#FFF',
    },
    timeText: {
        fontSize: 11,
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    otherTimeText: {
        color: theme.colors.textSecondary,
    },
    myTimeText: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    quoteBlock: {
        borderLeftWidth: 3,
        paddingLeft: 8,
        paddingVertical: 2,
        marginBottom: 6,
        borderRadius: 4,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    myQuoteBlock: {
        borderColor: '#FFF',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    otherQuoteBlock: {
        borderColor: theme.colors.primary,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    quoteSender: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    myQuoteSender: {
        color: '#FFF',
    },
    otherQuoteSender: {
        color: theme.colors.primary,
    },
    quoteText: {
        fontSize: 12,
    },
    myQuoteText: {
        color: 'rgba(255,255,255,0.8)',
    },
    otherQuoteText: {
        color: theme.colors.textSecondary,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    editedText: {
        fontSize: 10,
        marginRight: 4,
    },
    myEditedText: {
        color: 'rgba(255,255,255,0.6)',
    },
    otherEditedText: {
        color: theme.colors.textSecondary,
    },
    actionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    actionBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    actionBannerTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: 2,
    },
    actionBannerText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        fontSize: 15,
        color: theme.colors.text,
        maxHeight: 100,
        minHeight: 40,
    },
    sendButton: {
        backgroundColor: theme.colors.primary,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
        marginBottom: 2,
    },
    sendButtonDisabled: {
        backgroundColor: theme.colors.textSecondary,
    },
});
