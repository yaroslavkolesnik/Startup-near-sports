import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Linking, Modal, FlatList, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';
import { joinMatch, leaveMatch, deleteMatch } from '../api/matches';

export default function MatchDetailsScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { match: initialMatch } = route.params;
  const [match, setMatch] = useState(initialMatch);
  const [isJoining, setIsJoining] = useState(false);
  const [isParticipantsModalVisible, setParticipantsModalVisible] = useState(false);
  const { user } = useContext(AuthContext);

  // Format start time or show placeholder
  const timeFormatted = match?.start_time 
      ? new Date(match.start_time).toLocaleString('ru-RU', { 
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
        })
      : t('time_not_specified');

  const participantsCount = match?.participants?.length || 0;

  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://192.168.0.67:8000${path}`;
  };

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const response = await joinMatch(match.id);
      
      // Update local state without fetching again
      if (response && response.message === 'Вы успешно присоединились') {
         setMatch(prevMatch => {
             const newParticipant = {
                 id: user.id,
                 username: user.username,
                 sport_skills: user.sport_skills || {}
             };
             const newParticipants = [...(prevMatch.participants || []), newParticipant];
             return {
                 ...prevMatch,
                 participants: newParticipants,
                 status: newParticipants.length >= prevMatch.max_players ? 'FULL' : prevMatch.status
             };
         });
      }
      
      Alert.alert(t('notification'), t('success_joined'));
    } catch (error) {
      Alert.alert(t('error'), error.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    setIsJoining(true); // re-use loading state
    try {
      const response = await leaveMatch(match.id);
      
      if (response && response.message === 'Вы покинули игру') {
         setMatch(prevMatch => {
             const newParticipants = (prevMatch.participants || []).filter(p => {
                 const pId = typeof p === 'object' ? p.id : p;
                 return pId !== user.id;
             });
             return {
                 ...prevMatch,
                 participants: newParticipants,
                 status: newParticipants.length < prevMatch.max_players && prevMatch.status === 'FULL' ? 'OPEN' : prevMatch.status
             };
         });
      }
      
      Alert.alert(t('notification'), t('success_left'));
    } catch (error) {
      Alert.alert(t('error'), error.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('delete_match_title'),
      t('delete_match_desc'),
      [
        { text: t('cancel'), style: "cancel" },
        { 
          text: t('delete'), 
          style: "destructive",
          onPress: async () => {
            setIsJoining(true);
            try {
              await deleteMatch(match.id);
              Alert.alert(t('success'), t('success_delete_match'));
              navigation.goBack();
            } catch (error) {
               Alert.alert(t('error'), error.message);
               setIsJoining(false);
            }
          }
        }
      ]
    );
  };

  const isUserParticipant = match?.participants?.some(p => (typeof p === 'object' ? p.id : p) === user?.id);
  const isOrganizer = match?.organizer === user?.id;
  const isFull = match?.participants?.length >= match?.max_players || match?.status === 'FULL';

  const renderActionButtons = () => {
    if (isOrganizer) {
      return (
        <View>
          <TouchableOpacity 
            style={[styles.joinButton, { backgroundColor: '#007AFF' }]} 
            onPress={() => navigation.navigate('EditMatch', { match })}
            disabled={isJoining}
          >
            <Text style={styles.joinButtonText}>{t('edit_match')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.joinButton, { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#FF3B30', marginTop: 10 }]} 
            onPress={handleDelete}
            disabled={isJoining}
            activeOpacity={0.8}
          >
            {isJoining ? (
              <ActivityIndicator color={'#FF3B30'} />
            ) : (
              <Text style={[styles.joinButtonText, { color: '#FF3B30' }]}>{t('delete_match')}</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    if (isUserParticipant) {
        return (
          <TouchableOpacity 
            style={[styles.joinButton, { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#FF3B30' }]} 
            onPress={handleLeave} 
            disabled={isJoining}
            activeOpacity={0.8}
          >
            {isJoining ? (
              <ActivityIndicator color={'#FF3B30'} />
            ) : (
              <Text style={[styles.joinButtonText, { color: '#FF3B30' }]}>{t('cancel_participation')}</Text>
            )}
          </TouchableOpacity>
        );
    }

    if (isFull) {
        return (
          <TouchableOpacity 
            style={[styles.joinButton, { backgroundColor: '#A1A1AA' }]} 
            disabled={true}
          >
            <Text style={styles.joinButtonText}>{t('no_spots')}</Text>
          </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity 
          style={styles.joinButton} 
          onPress={handleJoin} 
          disabled={isJoining}
          activeOpacity={0.8}
        >
          {isJoining ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.joinButtonText}>{t('join_game')}</Text>
          )}
        </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{match?.title || t('untitled')}</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>{t('sport_label')}</Text>
          <Text style={styles.value}>{match?.sport_type ? t(match.sport_type) : t('not_specified')}</Text>
        </View>

        {(match?.pitch_name || match?.pitch_address) && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('place_label')}</Text>
            <Text style={[styles.value, { flex: 1, textAlign: 'right', marginLeft: 16 }]} numberOfLines={2}>
              {match.pitch_name ? `${match.pitch_name}, ` : ''}{match.pitch_address || ''}
            </Text>
          </View>
        )}
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>{t('start_time_label')}</Text>
          <Text style={styles.value}>{timeFormatted}</Text>
        </View>

        {match?.description ? (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>{t('description_label')}</Text>
            <Text style={styles.descriptionText}>{match.description}</Text>
          </View>
        ) : null}

        <TouchableOpacity 
          style={styles.infoRow} 
          onPress={() => setParticipantsModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.label}>{t('participants_label')}</Text>
          <Text style={[styles.value, { color: colors.primary, textDecorationLine: 'underline' }]}>
            {participantsCount} / {match?.max_players || '?'}
          </Text>
        </TouchableOpacity>
      </View>

      {match?.external_chat_link && isUserParticipant && (
        <TouchableOpacity 
          style={styles.chatButton} 
          onPress={() => Linking.openURL(match.external_chat_link)}
          activeOpacity={0.8}
        >
          <Text style={styles.chatButtonText}>{t('go_to_chat')}</Text>
        </TouchableOpacity>
      )}

      {match?.pitch_is_paid && (
        <View style={styles.paidWarningContainer}>
          <Text style={styles.paidWarningText}>
            {t('paid_pitch_warning', { price: match.pitch_price_per_hour })}
          </Text>
        </View>
      )}

      {renderActionButtons()}

      <Modal
        visible={isParticipantsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setParticipantsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('participants_list')}</Text>
            
            <FlatList
              data={match?.participants || []}
              keyExtractor={(item) => (typeof item === 'object' ? item.id.toString() : item.toString())}
              renderItem={({ item }) => {
                if (typeof item !== 'object') {
                   return (
                     <View style={styles.participantRow}>
                       <Text style={styles.participantName}>{t('user_number', { id: item })}</Text>
                     </View>
                   );
                }

                const sportIcon = match?.sport_type === 'FOOTBALL' ? '⚽' : match?.sport_type === 'BASKETBALL' ? '🏀' : '🏓';
                const rawLevel = item.sport_skills?.[match.sport_type] || 'not_specified';
                const levelName = t(rawLevel);
                const avatarUrl = getAvatarUrl(item.avatar);

                return (
                  <TouchableOpacity 
                    style={styles.participantRow}
                    onPress={() => {
                      setParticipantsModalVisible(false);
                      navigation.navigate('PublicProfile', { user: item });
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.participantInfoContainer}>
                      {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.participantAvatar} />
                      ) : (
                        <MaterialIcons name="account-circle" size={40} color={colors.primary} style={styles.participantAvatarIcon} />
                      )}
                      <Text style={styles.participantName}>{item.username.replace(/_/g, ' ')}</Text>
                    </View>
                    <View style={styles.participantSkillBadge}>
                      <Text style={styles.participantSkillText}>{sportIcon} {levelName}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>{t('no_participants_yet')}</Text>}
            />

            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => setParticipantsModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>{t('close_btn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  label: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  descriptionContainer: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
  },
  descriptionLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  joinButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  joinButtonText: {
    color: '#FFFFFF', // Can use colors.surface
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  chatButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  chatButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  paidWarningContainer: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  paidWarningText: {
    color: '#92400E',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  participantInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#E1E1E1',
  },
  participantAvatarIcon: {
    marginRight: 12,
  },
  participantName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    flexShrink: 1,
  },
  participantSkillBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  participantSkillText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 20,
    marginBottom: 20,
  },
  closeModalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
