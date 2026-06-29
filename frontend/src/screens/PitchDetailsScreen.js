import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Linking, Image, Alert, Dimensions, ScrollView, Platform, Share } from 'react-native';
import ImageView from "react-native-image-viewing";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { getMatches } from '../api/matches';
import { deletePitch } from '../api/pitches';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { getSportName } from '../config/sports';
import MatchCard from '../components/MatchCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function PitchDetailsScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { pitch } = route.params;
  const { user } = useContext(AuthContext);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState(null);
  const [hasSpotsFilter, setHasSpotsFilter] = useState(false);
  const [levelFilter, setLevelFilter] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const uniqueSports = [...new Set(matches.map(m => m.sport_type))].filter(Boolean);
  const filteredMatches = matches.filter(match => {
    const now = new Date();
    const startTime = match.start_time ? new Date(match.start_time) : null;
    const duration = match.duration_minutes || 90;
    if (startTime) {
      const endTime = new Date(startTime.getTime() + duration * 60000);
      if (now > endTime) return false;
    }

    if (activeFilter !== 'ALL' && match.sport_type !== activeFilter) return false;
    
    if (hasSpotsFilter) {
      const participantsCount = match.participants?.length || 0;
      if (participantsCount >= (match.max_players || 999)) return false;
    }

    if (levelFilter) {
      if (match.level && match.level !== 'ANY' && match.level !== levelFilter) {
        return false;
      }
    }

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

  const galleryImages = pitch?.photos ? pitch.photos.map(photo => ({ uri: photo })) : [];

  const handleImagePress = (index) => {
    setCurrentImageIndex(index);
    setIsGalleryVisible(true);
  };

  const cardWidth = Dimensions.get('window').width - 72;

  useEffect(() => {
    fetchMatches();
  }, []);

  const openDirections = () => {
    if (pitch?.latitude && pitch?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${pitch.latitude},${pitch.longitude}`;
      Linking.openURL(url);
    }
  };

  const handleDeletePitch = () => {
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
              await deletePitch(pitch.id || pitch);
              navigation.goBack();
            } catch (error) {
              Alert.alert(t('error'), t('delete_pitch_error'));
            }
          }
        }
      ]
    );
  };

  const fetchMatches = async () => {
    try {
      const data = await getMatches(null, '', null, 1, pitch.id || pitch, true);
      const allMatches = Array.isArray(data?.results || data) ? (data?.results || data) : [];
      setMatches(allMatches);
    } catch (error) {
      console.error("Error fetching matches for pitch:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareMatch = async (match) => {
    try {
      const timeFormatted = match.start_time 
        ? new Date(match.start_time).toLocaleString('ru-RU', { 
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
          })
        : t('time_not_specified');
        
      const availableSpots = (match.max_players || 0) - (match.participants?.length || 0);

      const shareMessage = `${t('share_join')}: ${match.title || t(match.sport_type)}!\n${t('share_pitch')}: ${pitch?.title || t('see_in_app')}\n${t('share_time')}: ${timeFormatted}\n${t('share_spots')}: ${availableSpots > 0 ? availableSpots : t('share_no_spots')}\n\n${t('share_download')}`;

      await Share.share({
        message: shareMessage,
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  const renderMatch = ({ item }) => {
    return (
      <MatchCard 
        match={item}
        onPress={() => navigation.navigate('MatchDetails', { match: item })}
        onShare={handleShareMatch}
        pitchLocation={{ latitude: pitch?.latitude, longitude: pitch?.longitude }}
      />
    );
  };

  const renderHeader = () => (
    <>
      <View style={styles.headerCard}>
        {pitch?.photos && pitch.photos.length > 0 ? (
          <FlatList
            data={pitch.photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity activeOpacity={0.9} onPress={() => handleImagePress(index)}>
                <Image 
                  source={{ uri: item }} 
                  style={[styles.pitchImage, { width: cardWidth }]} 
                  resizeMode="cover" 
                />
              </TouchableOpacity>
            )}
            style={{ width: cardWidth }}
          />
        ) : (
          <View style={[styles.pitchImagePlaceholder, { width: cardWidth }]}>
            <Text style={styles.placeholderText}>{t('no_photos')}</Text>
          </View>
        )}
        <Text style={styles.title}>{pitch?.title || t('untitled')}</Text>
        
        {pitch?.sport_type === 'MULTI' && pitch?.fields_breakdown ? (
          <View style={styles.breakdownContainer}>
            {Object.entries(pitch.fields_breakdown).map(([sport, count]) => {
              const sportEmojis = {
                'FOOTBALL': '⚽', 'BASKETBALL': '🏀', 'PING_PONG': '🏓', 'VOLLEYBALL': '🏐',
                'TENNIS': '🎾', 'WORKOUT': '💪', 'RUNNING': '🏃', 'CYCLING': '🚲',
                'YOGA': '🧘', 'PADEL': '🎾', 'CHESS': '♟️', 'CHECKERS': '🏁',
                'BOXING': '🥊', 'SWIMMING': '🏊', 'GYM': '🏋️', 'MULTI': '🏟️'
              };
              const emoji = sportEmojis[sport] || '🏟️';
              return (
                <View key={sport} style={styles.breakdownChip}>
                  <Text style={styles.breakdownChipText}>{emoji} {count}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.sportType}>{pitch?.sport_type ? t(pitch.sport_type) : t('not_specified')}</Text>
        )}

        <Text style={styles.address}>{pitch?.address || t('address_not_specified')}</Text>
        <Text style={styles.creatorName}>{t('added_by')} {pitch?.creator_name || t('unknown_user')}</Text>

        {pitch?.is_active === false && (
          <View style={styles.closedBanner}>
            <Ionicons name="warning" size={24} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.closedBannerText}>
              {t('pitch_temporarily_closed')}{pitch.status_message ? `: ${pitch.status_message}` : ''}
            </Text>
          </View>
        )}

        {pitch?.description ? (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>{t('description_label')}</Text>
            <Text style={styles.descriptionText}>{pitch.description}</Text>
          </View>
        ) : null}

        {pitch?.latitude && pitch?.longitude && (
          <TouchableOpacity 
            style={styles.directionsButton}
            onPress={openDirections}
            activeOpacity={0.7}
          >
            <Text style={styles.directionsButtonText}>{t('get_directions')}</Text>
          </TouchableOpacity>
        )}

        <Button 
          title={t('create_game_here')}
          onPress={() => navigation.navigate('CreateMatch', { 
            pitchId: pitch?.id || pitch,
            pitchSportType: pitch?.sport_type,
            pitchFieldsBreakdown: pitch?.fields_breakdown
          })}
          style={[{ marginTop: 16 }, pitch?.is_active === false && styles.createButtonDisabled]}
          disabled={pitch?.is_active === false}
        />

        {user?.id === (pitch?.created_by?.id || pitch?.created_by) && (
          <View style={styles.authorActions}>
            <Button 
              title={t('edit')}
              variant="secondary"
              onPress={() => navigation.navigate('EditPitch', { pitch })}
              style={{ flex: 1, marginRight: 8 }}
            />
            
            <Button 
              title={t('delete')}
              variant="primary"
              onPress={handleDeletePitch}
              style={{ flex: 1, backgroundColor: '#FF3B30' }}
            />
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>{t('games_on_pitch')}</Text>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {uniqueSports.length > 0 && (
          <>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'ALL' && styles.filterChipActive]}
              onPress={() => setActiveFilter('ALL')}
            >
              <Text style={[styles.filterChipText, activeFilter === 'ALL' && styles.filterChipTextActive]}>
                {t('all_sports')}
              </Text>
            </TouchableOpacity>
            
            {uniqueSports.map(sport => (
              <TouchableOpacity
                key={sport}
                style={[styles.filterChip, activeFilter === sport && styles.filterChipActive]}
                onPress={() => setActiveFilter(sport)}
              >
                <Text style={[styles.filterChipText, activeFilter === sport && styles.filterChipTextActive]}>
                  {t(sport)}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

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
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredMatches}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderMatch}
        ListHeaderComponent={renderHeader()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <Text style={styles.emptyText}>{t('no_games_desc')}</Text>
          )
        }
      />
      <ImageView
        images={galleryImages}
        imageIndex={currentImageIndex}
        visible={isGalleryVisible}
        onRequestClose={() => setIsGalleryVisible(false)}
      />

      {showDatePicker && (
        <DateTimePicker
          value={dateFilter instanceof Date ? dateFilter : new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
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
  headerCard: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  pitchImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  pitchImagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  sportType: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  breakdownContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 8,
  },
  breakdownChip: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  breakdownChipText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  address: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  creatorName: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  closedBannerText: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  createButtonDisabled: {
    backgroundColor: '#A0A0A0',
    borderColor: '#A0A0A0',
  },
  matchParticipants: {
    fontSize: 14,
    color: theme.colors.textSecondary,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  descriptionContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  descriptionLabel: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  directionsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  directionsButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  matchCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  shareButton: {
    padding: 4,
    marginLeft: 8,
  },
  matchTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  matchTime: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  matchParticipants: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginTop: 30,
    ...theme.typography.bodyMedium,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  authorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
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
