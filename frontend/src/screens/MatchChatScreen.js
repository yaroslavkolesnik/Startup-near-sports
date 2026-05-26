import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { AuthContext } from '../context/AuthContext';
import { getMatchMessages, sendMatchMessage } from '../api/matches';

export default function MatchChatScreen({ route, navigation }) {
    const { t } = useTranslation();
    const { matchId, matchTitle } = route.params;
    const { user } = useContext(AuthContext);

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef(null);

    useEffect(() => {
        navigation.setOptions({ title: matchTitle || t('chat_title', 'Чат') });

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

    const handleSend = async () => {
        if (!inputText.trim() || sending) return;

        const textToSend = inputText.trim();
        setInputText('');
        setSending(true);

        try {
            await sendMatchMessage(matchId, textToSend);
            await fetchMessages();
        } catch (error) {
            console.log("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    const getAvatarUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `http://192.168.0.67:8000${path}`;
    };

    const renderMessage = ({ item }) => {
        const isMyMessage = user && user.username === item.sender_name;
        
        return (
            <View style={[styles.messageWrapper, isMyMessage ? styles.messageWrapperRight : styles.messageWrapperLeft]}>
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
                    <Text style={[styles.senderName, isMyMessage ? styles.mySenderName : null]}>
                        {item.sender_name ? item.sender_name.replace(/_/g, ' ') : 'User'}
                    </Text>
                    <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
                        {item.text}
                    </Text>
                    <Text style={[styles.timeText, isMyMessage ? styles.myTimeText : styles.otherTimeText]}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
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
