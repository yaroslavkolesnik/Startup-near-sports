import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Image, Alert, Share } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import { getMyMatches } from '../api/matches';
import { getMyPitches, deletePitch } from '../api/pitches';
import CountdownTimer from '../components/CountdownTimer';
import WeatherBadge from '../components/WeatherBadge';
import SportFilter from '../components/SportFilter';

export default function MyMatchesScreen({ navigation }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('matches');
  const [matches, setMatches] = useState([]);
  const [myPitches, setMyPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [activeTab, selectedSport, paymentFilter])
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'matches') {
        const data = await getMyMatches(selectedSport, '', paymentFilter);
        setMatches(Array.isArray(data) ? data : []);
      } else {
        const data = await getMyPitches(selectedSport, '', null, paymentFilter);
        setMyPitches(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error(`Error fetching my ${activeTab}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [activeTab, selectedSport, paymentFilter]);

  const handleDeletePitch = (id) => {
    Alert.alert(
      t('delete_pitch_title'),
      t('delete_pitch_desc'),
      [
        { text: t('cancel'), style: "cancel" },
        { 
          text: t('delete'), 
          style: "destructive",
          onPress: async () => {
            try {
              await deletePitch(id);
              fetchData();
            } catch (error) {
              Alert.alert(t('error'), t('error_delete_pitch'));
            }
          }
        }
      ]
    );
  };

  const handleShareMatch = async (match) => {
    try {
      const timeFormatted = match.start_time 
        ? new Date(match.start_time).toLocaleString('ru-RU', { 
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
          })
        : t('time_not_specified');
        
      const availableSpots = (match.max_players || 0) - (match.participants?.length || 0);

      const shareMessage = `${t('share_join_game')}${match.title || t(match.sport_type)}!\n${t('share_pitch')}${match.pitch_name || t('share_see_app')}\n${t('share_start')}${timeFormatted}\n${t('share_available_spots')}${availableSpots > 0 ? availableSpots : t('share_no_spots')}${t('share_download_app')}`;

      await Share.share({
        message: shareMessage,
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  const renderItem = ({ item }) => {
    const participantsCount = item.participants?.length || 0;
    
    const timeFormatted = item.start_time 
      ? new Date(item.start_time).toLocaleString('ru-RU', { 
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
        })
      : t('time_not_specified');

    const now = new Date();
    const startTime = item.start_time ? new Date(item.start_time) : null;
    const duration = item.duration_minutes || 90;
    
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

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('MatchDetails', { match: item })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.title}>{item.title || t(item.sport_type)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {item.pitch_latitude && item.pitch_longitude && (
              <WeatherBadge 
                latitude={item.pitch_latitude} 
                longitude={item.pitch_longitude} 
                startTime={item.start_time} 
              />
            )}
            <TouchableOpacity 
              onPress={() => navigation.navigate('MatchChat', { matchId: item.id, matchTitle: item.title || t(item.sport_type) })} 
              style={styles.actionIconButton}
            >
              <MaterialIcons name="forum" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleShareMatch(item)} style={styles.actionIconButton}>
              <Ionicons name="share-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {item.pitch_address && (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color="#666" style={styles.addressIcon} />
            <Text style={styles.addressText} numberOfLines={1}>{item.pitch_address}</Text>
          </View>
        )}
        
        {useCountdown ? (
          <CountdownTimer targetTime={item.start_time} />
        ) : isPlayingNow ? (
          <View style={styles.playingNowBadge}>
            <Text style={styles.playingNowText}>{t('playing_now')}</Text>
          </View>
        ) : isStartingSoonStatic ? (
          <View style={styles.startingSoonBadge}>
            <Text style={styles.startingSoonText}>{t('starting_soon_static')}</Text>
          </View>
        ) : (
          <Text style={styles.time}>{timeFormatted}</Text>
        )}
        
        {item.pitch_is_paid && (
          <View style={styles.paidBadge}>
            <Text style={styles.paidBadgeText}>{t('price_per_hour', { price: item.pitch_price_per_hour })}</Text>
          </View>
        )}
        
        <Text style={styles.participants}>
           {t('participants_label')} {participantsCount} / {item.max_players || '?'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPitchItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('PitchDetails', { pitch: item })}
      >
        {item.photos && item.photos.length > 0 && (
          <Image source={{ uri: item.photos[0] }} style={styles.pitchThumbnail} />
        )}
        <View style={styles.pitchHeader}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => navigation.navigate('EditPitch', { pitch: item })}
            >
              <MaterialIcons name="edit" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleDeletePitch(item.id)}
            >
              <MaterialIcons name="delete" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.time}>{item.address}</Text>
        <Text style={styles.participants}>{item.surface_type ? t(item.surface_type) : t('surface_not_specified')}</Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="football-outline" size={80} color="rgba(0, 0, 0, 0.15)" style={{marginBottom: 16}} />
      <Text style={styles.emptyText}>{t('no_games_yet')}</Text>
      <Text style={styles.emptySubText}>{t('no_games_desc')}</Text>
    </View>
  );

  const renderEmptyPitches = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="location-outline" size={80} color="rgba(0, 0, 0, 0.15)" style={{marginBottom: 16}} />
      <Text style={styles.emptyText}>{t('no_pitches_yet')}</Text>
      <Text style={styles.emptySubText}>{t('no_pitches_desc')}</Text>
      <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate('CreatePitch')}>
        <Text style={styles.createButtonText}>{t('add_pitch_btn')}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'matches' && styles.activeTab]}
          onPress={() => setActiveTab('matches')}
        >
          <Text style={[styles.tabText, activeTab === 'matches' && styles.activeTabText]}>{t('my_games')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pitches' && styles.activeTab]}
          onPress={() => setActiveTab('pitches')}
        >
          <Text style={[styles.tabText, activeTab === 'pitches' && styles.activeTabText]}>{t('my_pitches')}</Text>
        </TouchableOpacity>
      </View>

      <SportFilter 
        selectedSport={selectedSport} 
        onSelectSport={setSelectedSport} 
        excludeMulti={true}
        paymentFilter={paymentFilter}
        onPaymentFilterChange={setPaymentFilter}
      />

      <FlatList
        data={activeTab === 'matches' ? matches : myPitches}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={activeTab === 'matches' ? renderItem : renderPitchItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={activeTab === 'matches' ? renderEmptyComponent : renderEmptyPitches}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]} // Android
            tintColor={colors.primary} // iOS
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  actionIconButton: {
    padding: 4,
    marginLeft: 12,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
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
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  time: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  participants: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: '#666',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#FFF',
  },
  pitchThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  createButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  pitchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editButton: {
    padding: 4,
  },
});
