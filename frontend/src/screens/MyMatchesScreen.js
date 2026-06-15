import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Image, Alert, Share } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { getMyMatches } from '../api/matches';
import { getMyPitches, deletePitch } from '../api/pitches';
import SportFilter from '../components/SportFilter';
import MatchCard from '../components/MatchCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function MyMatchesScreen({ navigation }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('matches');
  const [matches, setMatches] = useState([]);
  const [myPitches, setMyPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchData(1);
    }, [activeTab, selectedSport, paymentFilter])
  );

  const fetchData = async (pageNum = 1) => {
    if (pageNum === 1) setLoading(true);
    else setIsLoadingMore(true);

    try {
      let data;
      if (activeTab === 'matches') {
        data = await getMyMatches(selectedSport, '', paymentFilter, pageNum);
        const newItems = data?.results || data;
        const isArray = Array.isArray(newItems);
        if (pageNum === 1) setMatches(isArray ? newItems : []);
        else setMatches(prev => [...prev, ...(isArray ? newItems : [])]);
      } else {
        data = await getMyPitches(selectedSport, '', null, paymentFilter, pageNum);
        const newItems = data?.results || data;
        const isArray = Array.isArray(newItems);
        if (pageNum === 1) setMyPitches(isArray ? newItems : []);
        else setMyPitches(prev => [...prev, ...(isArray ? newItems : [])]);
      }
      setHasMore(!!data?.next);
      setPage(pageNum);
    } catch (error) {
      console.error(`Error fetching my ${activeTab}:`, error);
    } finally {
      if (pageNum === 1) setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(1);
    setRefreshing(false);
  }, [activeTab, selectedSport, paymentFilter]);

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore && !loading) {
      fetchData(page + 1);
    }
  };

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
              fetchData(1);
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
    return (
      <MatchCard 
        match={item}
        onPress={() => navigation.navigate('MatchDetails', { match: item })}
        onShare={handleShareMatch}
        onChat={() => navigation.navigate('MatchChat', { matchId: item.id, matchTitle: item.title || t(item.sport_type) })}
        pitchLocation={{ latitude: item.pitch_latitude, longitude: item.pitch_longitude }}
      />
    );
  };

  const renderPitchItem = ({ item }) => {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('PitchDetails', { pitch: item })}>
        <Card style={{ marginVertical: 6 }}>
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
                <MaterialIcons name="edit" size={24} color={theme.colors.primary} />
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
        </Card>
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
      <Button 
        title={t('add_pitch_btn')} 
        onPress={() => navigation.navigate('CreatePitch')}
        style={{ marginTop: 16 }}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color={theme.colors.primary} style={{ margin: 16 }} /> : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
    </View>
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
  },
  card: {
    backgroundColor: theme.colors.surface,
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
    color: theme.colors.text,
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
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  participants: {
    color: theme.colors.primary,
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
    color: theme.colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.primary,
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
