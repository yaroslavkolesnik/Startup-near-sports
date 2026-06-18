import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Card from './ui/Card';
import ProgressIndicator from './ui/ProgressIndicator';
import CountdownTimer from './CountdownTimer';
import WeatherBadge from './WeatherBadge';
import { theme } from '../theme';
import { AuthContext } from '../context/AuthContext';
import { createRematch } from '../api/matches';
import DateTimePicker from '@react-native-community/datetimepicker';

const MatchCard = ({ match, onPress, onShare, onChat, pitchLocation }) => {
  const { t } = useTranslation();
  const { user } = React.useContext(AuthContext);
  const participantsCount = match.participants?.length || 0;
  const isOrganizer = user && match.organizer === user.id;

  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [date, setDate] = React.useState(new Date(match.start_time || Date.now()));
  const [isCreating, setIsCreating] = React.useState(false);
  
  const timeFormatted = match.start_time 
    ? new Date(match.start_time).toLocaleString('ru-RU', { 
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
      })
    : t('time_not_specified');

  const now = new Date();
  const startTime = match.start_time ? new Date(match.start_time) : null;
  const duration = match.duration_minutes || 90;
  
  let isPlayingNow = false;
  let useCountdown = false;
  let isStartingSoonStatic = false;
  
  if (startTime) {
    const endTime = new Date(startTime.getTime() + duration * 60000);
    isPlayingNow = now >= startTime && now <= endTime;
    
    if (!isPlayingNow && startTime > now) {
      const timeDiffMs = startTime.getTime() - now.getTime();
      if (timeDiffMs <= 60 * 60 * 1000) {
        useCountdown = true;
      } else if (timeDiffMs <= 2 * 60 * 60 * 1000) {
        isStartingSoonStatic = true;
      }
    }
  }

  const confirmRematch = async (daysToAdd = null, customDate = null) => {
    setIsCreating(true);
    try {
        let targetDate;
        if (daysToAdd) {
            targetDate = new Date(match.start_time);
            targetDate.setDate(targetDate.getDate() + daysToAdd);
        } else {
            targetDate = customDate;
        }
        
        await createRematch(match.id, targetDate.toISOString());
        Alert.alert(t('success'), t('rematch_created_success', 'Повторный матч успешно создан!'));
    } catch (err) {
        Alert.alert(t('error'), err.message);
    } finally {
        setIsCreating(false);
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

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={{ marginBottom: 12 }}>
        <View style={styles.cardHeader}>
          <Text style={styles.matchTitle}>{match.title || t(match.sport_type)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {pitchLocation?.latitude && pitchLocation?.longitude && (
              <WeatherBadge 
                latitude={pitchLocation.latitude} 
                longitude={pitchLocation.longitude} 
                startTime={match.start_time} 
              />
            )}
            {isOrganizer && (
              <TouchableOpacity onPress={handleRematch} style={styles.actionIconButton}>
                {isCreating ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                    <MaterialIcons name="repeat" size={24} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            )}
            {onChat && (
              <TouchableOpacity onPress={() => onChat(match)} style={styles.actionIconButton}>
                <MaterialIcons name="forum" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
            {onShare && (
              <TouchableOpacity onPress={() => onShare(match)} style={styles.actionIconButton}>
                <Ionicons name="share-outline" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {match.pitch_address && (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} style={styles.addressIcon} />
            <Text style={styles.addressText} numberOfLines={1}>{match.pitch_address}</Text>
          </View>
        )}

        {useCountdown ? (
          <CountdownTimer targetTime={match.start_time} />
        ) : isPlayingNow ? (
          <View style={styles.playingNowBadge}>
            <Text style={styles.playingNowText}>{t('playing_now')}</Text>
          </View>
        ) : isStartingSoonStatic ? (
          <View style={styles.startingSoonBadge}>
            <Text style={styles.startingSoonText}>{t('starting_soon')}</Text>
          </View>
        ) : (
          <Text style={styles.matchTime}>{timeFormatted}</Text>
        )}

        {match.pitch_is_paid && (
          <View style={styles.paidBadge}>
            <Text style={styles.paidBadgeText}>{t('price_per_hour', { price: match.pitch_price_per_hour || '?' })}</Text>
          </View>
        )}

        <Text style={styles.matchParticipants}>
          {t('participants_count')}: {participantsCount} / {match.max_players || '?'}
        </Text>

        {match.max_players && (
          <ProgressIndicator 
            current={participantsCount} 
            max={match.max_players} 
            style={{ marginTop: 8 }} 
          />
        )}

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
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  actionIconButton: {
    padding: 4,
    marginLeft: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressIcon: {
    marginRight: 4,
  },
  addressText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  matchTitle: {
    ...theme.typography.headlineSmall,
    color: theme.colors.text,
    flex: 1,
  },
  matchTime: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  matchParticipants: {
    ...theme.typography.labelMedium,
    color: theme.colors.primary,
  },
  playingNowBadge: {
    backgroundColor: '#FF3B30',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  playingNowText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  startingSoonBadge: {
    backgroundColor: '#FF9500',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  startingSoonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paidBadge: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  paidBadgeText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default MatchCard;
