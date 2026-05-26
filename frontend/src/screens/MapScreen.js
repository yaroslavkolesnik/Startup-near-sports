import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, ScrollView, Keyboard } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Marker, Callout } from 'react-native-maps';
import MapView from "react-native-map-clustering";
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getPitches, getMyPitches } from '../api/pitches';
import SportFilter from '../components/SportFilter';
import { theme } from '../theme';

export default function MapScreen({ navigation }) {
  const { t } = useTranslation();
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [selectedSurface, setSelectedSurface] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const mapRef = useRef(null);

  const [region, setRegion] = useState({
    latitude: 49.930936,
    longitude: 36.415709,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0922,
  });

  const handleCenterUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let location;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 5000
        });
      } catch (err) {
        console.log('getCurrentPositionAsync failed, trying getLastKnownPositionAsync...', err);
        location = await Location.getLastKnownPositionAsync({});
      }

      if (location && location.coords) {
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0922,
        };
        setRegion(newRegion);
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      } else {
        console.log('Could not obtain any location data.');
      }
    } catch (error) {
      console.log('Error getting location: ', error);
    }
  };

  useEffect(() => {
    handleCenterUserLocation();
  }, []);

  const surfaceOptions = [
    { label: t('filter_all'), value: null },
    { label: t('surface_natural'), value: 'NATURAL_GRASS' },
    { label: t('surface_synthetic'), value: 'SYNTHETIC_GRASS' },
    { label: t('surface_parquet'), value: 'PARQUET' },
    { label: t('surface_asphalt'), value: 'ASPHALT' },
    { label: t('surface_rubber'), value: 'RUBBER' },
    { label: t('surface_sand'), value: 'SAND' }
  ];

  const onResultPress = (pitch) => {
    setShowDropdown(false);
    Keyboard.dismiss();
    if (mapRef.current && pitch.latitude && pitch.longitude) {
      mapRef.current.animateToRegion({
        latitude: Number(pitch.latitude),
        longitude: Number(pitch.longitude),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 1000);
    }
  };

  // Keep useFocusEffect to refresh data when returning to screen
  useFocusEffect(
    useCallback(() => {
      const fetchPitchesFocus = async () => {
        try {
          let data;
          if (viewMode === 'my') {
            data = await getMyPitches(selectedSport, searchQuery, selectedSurface, paymentFilter);
          } else {
            data = await getPitches(selectedSport, searchQuery, selectedSurface, paymentFilter);
          }
          setPitches(data || []);
        } catch (error) {
          console.error('Failed to load pitches for map on focus:', error);
        }
      };
      fetchPitchesFocus();
    }, [viewMode, searchQuery, selectedSurface, selectedSport, paymentFilter])
  );

  // Add useEffect with debounce for search and filters
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      // Removed setLoading(true) to avoid unmounting map during search
      try {
        let data;
        if (viewMode === 'my') {
          data = await getMyPitches(selectedSport, searchQuery, selectedSurface, paymentFilter);
        } else {
          data = await getPitches(selectedSport, searchQuery, selectedSurface, paymentFilter);
        }
        setPitches(data || []);
      } catch (error) {
        console.error('Failed to load pitches for map:', error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, viewMode, selectedSport, selectedSurface, paymentFilter]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary || '#007AFF'} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchOverlay}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('search_placeholder')}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (text.trim().length > 0) setShowDropdown(true);
            else setShowDropdown(false);
          }}
          onFocus={() => {
            if (searchQuery.trim().length > 0) setShowDropdown(true);
          }}
          placeholderTextColor="#999"
        />
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'all' && styles.toggleButtonActive]}
            onPress={() => setViewMode('all')}
          >
            <Text style={[styles.toggleButtonText, viewMode === 'all' && styles.toggleButtonTextActive]}>{t('all_pitches')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'my' && styles.toggleButtonActive]}
            onPress={() => setViewMode('my')}
          >
            <Text style={[styles.toggleButtonText, viewMode === 'my' && styles.toggleButtonTextActive]}>{t('my_pitches')}</Text>
          </TouchableOpacity>
        </View>

        {showDropdown && searchQuery.trim().length > 0 && (
          <ScrollView style={styles.dropdown} keyboardShouldPersistTaps="handled">
            {pitches.length > 0 ? (
              pitches.map((pitch, index) => (
                <TouchableOpacity
                  key={pitch.id ? pitch.id.toString() : index.toString()}
                  style={styles.dropdownItem}
                  onPress={() => onResultPress(pitch)}
                >
                  <Text style={styles.dropdownItemTitle}>{pitch.title}</Text>
                  <Text style={styles.dropdownItemAddress}>{pitch.address}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.dropdownItem}>
                <Text style={styles.dropdownItemAddress}>{t('nothing_found')}</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      <View style={styles.filterOverlay}>
        <SportFilter
          selectedSport={selectedSport}
          onSelectSport={setSelectedSport}
          paymentFilter={paymentFilter}
          onPaymentFilterChange={setPaymentFilter}
        />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.surfaceFilterContainer}
          contentContainerStyle={styles.surfaceFilterContent}
        >
          {surfaceOptions.map((option) => {
            const isActive = selectedSurface === option.value;
            return (
              <TouchableOpacity
                key={option.value || 'ALL'}
                style={[styles.surfaceChip, isActive && styles.surfaceChipActive]}
                onPress={() => setSelectedSurface(option.value)}
              >
                <Text style={[styles.surfaceChipText, isActive && styles.surfaceChipTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={true}
        mapPadding={{ top: 110, right: 0, bottom: 0, left: 0 }}
        clusterColor={theme.colors.primary}
      >
        {pitches.map((pitch) => {
          // Protection against bad data
          if (!pitch.latitude || !pitch.longitude || !pitch.id) return null;

          return (
            <Marker
              key={pitch.id.toString()}
              coordinate={{
                latitude: parseFloat(pitch.latitude),
                longitude: parseFloat(pitch.longitude),
              }}
              title={pitch.title}
              description={t(pitch.sport_type)}
            >
              <Callout
                tooltip={false}
                onPress={() => navigation.navigate('PitchDetails', { pitch })}
              >
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{pitch.title}</Text>
                  <Text style={styles.calloutDescription}>
                    {t(pitch.sport_type)} - {pitch.address}
                  </Text>
                  <Text style={styles.calloutClickable}>{t('click_for_details')}</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <TouchableOpacity
        style={styles.locationFab}
        activeOpacity={0.8}
        onPress={handleCenterUserLocation}
      >
        <MaterialCommunityIcons name="crosshairs-gps" size={28} color={theme.colors.primary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CreatePitch')}
      >
        <MaterialIcons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background || '#ffffff',
  },
  filterOverlay: {
    position: 'absolute',
    top: 150, // Shifted down so as not to overlap search
    left: 0,
    right: 0,
    zIndex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  surfaceFilterContainer: {
    marginTop: 8,
  },
  surfaceFilterContent: {
    paddingHorizontal: 10,
  },
  surfaceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  surfaceChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  surfaceChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  surfaceChipTextActive: {
    color: '#fff',
  },
  searchOverlay: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    color: '#333',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 6,
    marginHorizontal: 4,
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  dropdown: {
    marginTop: 8,
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  dropdownItemAddress: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background || '#ffffff',
  },
  calloutContainer: {
    padding: 10,
    width: 200,
    alignItems: 'center',
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  calloutDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  calloutClickable: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.level2,
  },
  locationFab: {
    position: 'absolute',
    bottom: 105,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.level1,
  },
});
