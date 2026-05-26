import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, TextInput, ScrollView, Platform, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { getMatches, getMyMatches } from '../api/matches';
import { getSportName } from '../config/sports';
import MatchCard from '../components/MatchCard';
import SportFilter from '../components/SportFilter';

export default function MatchesScreen({ navigation }) {
  const { t } = useTranslation();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState(null);
  
  // Advanced filters states
  const [dateFilter, setDateFilter] = useState(null); // 'TODAY', 'WEEKEND', Date, null
  const [hasSpotsFilter, setHasSpotsFilter] = useState(false);
  const [levelFilter, setLevelFilter] = useState(null); // 'BEGINNER', 'AMATEUR', 'PRO', null
  const [showDatePicker, setShowDatePicker] = useState(false);

  const getDateFilterText = () => {
    if (dateFilter === 'TODAY') return t('today_filter');
    if (dateFilter === 'WEEKEND') return t('weekend_filter');
    if (dateFilter instanceof Date) return `🗓 ${dateFilter.getDate()}.${dateFilter.getMonth() + 1}`;
    return t('select_date_filter');
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') return;
    if (selectedDate) {
      setDateFilter(selectedDate);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = selectedTab === 'all' 
          ? await getMatches(selectedSport, searchQuery, paymentFilter) 
          : await getMyMatches(selectedSport, searchQuery, paymentFilter);
        setMatches(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [selectedTab, selectedSport, searchQuery, paymentFilter]);

  useFocusEffect(
    useCallback(() => {
      const fetchMatchesFocus = async () => {
        try {
          const data = selectedTab === 'all' 
            ? await getMatches(selectedSport, searchQuery, paymentFilter) 
            : await getMyMatches(selectedSport, searchQuery, paymentFilter);
          setMatches(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error("Error fetching matches on focus:", error);
        }
      };
      fetchMatchesFocus();
    }, [selectedTab, selectedSport, searchQuery, paymentFilter])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = selectedTab === 'all' 
        ? await getMatches(selectedSport, searchQuery, paymentFilter) 
        : await getMyMatches(selectedSport, searchQuery, paymentFilter);
      setMatches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error refreshing matches:", error);
    } finally {
      setRefreshing(false);
    }
  }, [selectedTab, selectedSport, searchQuery, paymentFilter]);

  const filteredMatches = matches.filter(match => {
    // 0. Hide old games
    const now = new Date();
    const startTime = match.start_time ? new Date(match.start_time) : null;
    const duration = match.duration_minutes || 90;
    if (startTime) {
      const endTime = new Date(startTime.getTime() + duration * 60000);
      if (now > endTime) return false;
    }

    // 1. Has spots
    if (hasSpotsFilter) {
      const participantsCount = match.participants?.length || 0;
      if (participantsCount >= (match.max_players || 999)) return false;
    }

    // 2. Level
    if (levelFilter) {
      if (match.level && match.level !== 'ANY' && match.level !== levelFilter) {
        return false;
      }
    }

    // 3. Date
    if (dateFilter) {
      if (!match.start_time) return false;
      const matchDate = new Date(match.start_time);
      const today = new Date();
      
      if (dateFilter === 'TODAY') {
        if (matchDate.toDateString() !== today.toDateString()) return false;
      } else if (dateFilter === 'WEEKEND') {
        const day = matchDate.getDay();
        if (day !== 0 && day !== 6) return false;
      } else if (dateFilter instanceof Date) {
        if (matchDate.toDateString() !== dateFilter.toDateString()) return false;
      }
    }

    return true;
  });

  const handleShareMatch = async (match) => {
    try {
      const timeFormatted = match.start_time 
        ? new Date(match.start_time).toLocaleString('ru-RU', { 
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
          })
        : t('time_not_specified');
        
      const availableSpots = (match.max_players || 0) - (match.participants?.length || 0);

      const shareMessage = `${t('share_join')}: ${match.title || t(match.sport_type)}!\n${t('share_pitch')}: ${match.pitch_name || t('see_in_app')}\n${t('share_time')}: ${timeFormatted}\n${t('share_spots')}: ${availableSpots > 0 ? availableSpots : t('share_no_spots')}\n\n${t('share_download')}`;

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
        pitchLocation={{ latitude: item.pitch_latitude, longitude: item.pitch_longitude }}
      />
    );
  };

  const renderEmptyComponent = () => {
    if (searchQuery.trim().length > 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={80} color="rgba(0, 0, 0, 0.15)" style={{marginBottom: 16}} />
          <Text style={styles.emptyText}>{t('nothing_found')}</Text>
          <Text style={styles.emptySubText}>{t('search_no_results', { query: searchQuery })}</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="football-outline" size={80} color="rgba(0, 0, 0, 0.15)" style={{marginBottom: 16}} />
        <Text style={styles.emptyText}>{t('no_games_yet')}</Text>
        <Text style={styles.emptySubText}>{t('no_games_desc')}</Text>
      </View>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity 
        style={[styles.tab, selectedTab === 'all' && styles.activeTab]}
        onPress={() => setSelectedTab('all')}
      >
        <Text style={[styles.tabText, selectedTab === 'all' && styles.activeTabText]}>{t('all_games')}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, selectedTab === 'mine' && styles.activeTab]}
        onPress={() => setSelectedTab('mine')}
      >
        <Text style={[styles.tabText, selectedTab === 'mine' && styles.activeTabText]}>{t('my_games')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAdvancedFilters = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.filtersContainer}
      contentContainerStyle={styles.filtersContent}
    >
      <TouchableOpacity 
        style={[styles.filterChip, dateFilter === 'TODAY' && styles.filterChipActive]}
        onPress={() => setDateFilter(dateFilter === 'TODAY' ? null : 'TODAY')}
      >
        <Text style={[styles.filterChipText, dateFilter === 'TODAY' && styles.filterChipTextActive]}>
          {t('today_filter')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.filterChip, dateFilter === 'WEEKEND' && styles.filterChipActive]}
        onPress={() => setDateFilter(dateFilter === 'WEEKEND' ? null : 'WEEKEND')}
      >
        <Text style={[styles.filterChipText, dateFilter === 'WEEKEND' && styles.filterChipTextActive]}>
          {t('weekend_filter')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.filterChip, dateFilter instanceof Date && styles.filterChipActive]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={[styles.filterChipText, dateFilter instanceof Date && styles.filterChipTextActive]}>
          {getDateFilterText()}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.filterChip, hasSpotsFilter && styles.filterChipActive]}
        onPress={() => setHasSpotsFilter(!hasSpotsFilter)}
      >
        <Text style={[styles.filterChipText, hasSpotsFilter && styles.filterChipTextActive]}>
          {t('has_spots_filter')}
        </Text>
      </TouchableOpacity>

      {['BEGINNER', 'AMATEUR', 'PRO'].map(level => {
        return (
          <TouchableOpacity 
            key={level}
            style={[styles.filterChip, levelFilter === level && styles.filterChipActive]}
            onPress={() => setLevelFilter(levelFilter === level ? null : level)}
          >
            <Text style={[styles.filterChipText, levelFilter === level && styles.filterChipTextActive]}>
              {t(level)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('search_placeholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>
      {renderTabs()}
      <SportFilter 
        selectedSport={selectedSport} 
        onSelectSport={setSelectedSport} 
        excludeMulti={true}
        paymentFilter={paymentFilter}
        onPaymentFilterChange={setPaymentFilter}
      />
      {renderAdvancedFilters()}

      {showDatePicker && (
        <DateTimePicker
          value={dateFilter instanceof Date ? dateFilter : new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredMatches}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
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
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: theme.colors.surface,
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: theme.colors.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainer,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  shareButton: {
    padding: 4,
    marginLeft: 8,
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
    backgroundColor: '#FF9500', // iOS orange
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
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  filtersContainer: {
    flexGrow: 0,
    minHeight: 50,
    paddingVertical: 8,
    marginBottom: 10,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
});
