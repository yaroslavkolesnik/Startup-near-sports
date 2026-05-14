import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import MapView from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { createPitch } from '../api/pitches';
import { colors } from '../theme/colors';
import { PITCH_SPORT_KEYS } from '../config/sports';

export default function CreatePitchScreen({ navigation }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(49.930936);
  const [longitude, setLongitude] = useState(36.415709);
  const [sportType, setSportType] = useState('FOOTBALL');
  const [surfaceType, setSurfaceType] = useState('RUBBER');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('');

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('error'), t('error_gallery_permission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUris = result.assets.map(asset => asset.uri);
      setPhotos(prev => {
        const combined = [...prev, ...selectedUris];
        return combined.slice(0, 5); // Limit to 5 max
      });
    }
  };

  const handleCreate = async () => {
    if (!title || !address) {
      Alert.alert(t('error'), t('error_fill_required'));
      return;
    }

    setIsSubmitting(true);
    try {
      const pitchData = {
        title,
        address,
        latitude,
        longitude,
        sport_type: sportType,
        surface_type: surfaceType,
        description,
        is_paid: isPaid,
        price_per_hour: isPaid ? parseFloat(price) : null,
      };

      await createPitch(pitchData, photos);
      Alert.alert(t('success'), t('success_create_pitch'));
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('error'), error.message || t('error_create_pitch'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>{t('pitch_name_label')}</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder={t('pitch_name_placeholder')} />

        <Text style={styles.sectionTitle}>{t('pitch_address_label')}</Text>
        <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder={t('pitch_address_placeholder')} />

        <Text style={styles.sectionTitle}>{t('pitch_location_label')}</Text>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 49.930936,
              longitude: 36.415709,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            onRegionChangeComplete={(region) => {
              setLatitude(region.latitude);
              setLongitude(region.longitude);
            }}
          />
          <View pointerEvents="none" style={styles.markerFixed}>
            <MaterialIcons name="location-on" size={40} color={colors.primary} />
          </View>
        </View>
        <Text style={styles.coordinatesText}>
          {t('selected_coordinates')} {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </Text>

        <Text style={styles.sectionTitle}>{t('sport_type_label')}</Text>
        <View style={styles.sportsContainer}>
          {PITCH_SPORT_KEYS.map((sport) => {
            const isActive = sportType === sport;
            return (
              <TouchableOpacity
                key={sport}
                style={[styles.sportBadge, isActive && styles.sportBadgeActive]}
                onPress={() => setSportType(sport)}
              >
                <Text style={[styles.sportBadgeText, isActive && styles.sportBadgeTextActive]}>{t(sport)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>{t('surface_type_label')}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={surfaceType}
            onValueChange={(itemValue) => setSurfaceType(itemValue)}
            style={styles.picker}
            itemStyle={{ color: '#000000', fontSize: 16 }}
          >
            <Picker.Item label={t('surface_natural_full')} value="NATURAL_GRASS" color="#000000" />
            <Picker.Item label={t('surface_synthetic_full')} value="SYNTHETIC_GRASS" color="#000000" />
            <Picker.Item label={t('surface_parquet_full')} value="PARQUET" color="#000000" />
            <Picker.Item label={t('surface_asphalt_full')} value="ASPHALT" color="#000000" />
            <Picker.Item label={t('surface_rubber_full')} value="RUBBER" color="#000000" />
            <Picker.Item label={t('surface_sand_full')} value="SAND" color="#000000" />
          </Picker>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>{t('paid_pitch_label')}</Text>
          <Switch value={isPaid} onValueChange={setIsPaid} trackColor={{ true: colors.primary }} />
        </View>

        {isPaid && (
          <View style={{ marginBottom: 16 }}>
            <TextInput 
              style={styles.input} 
              value={price} 
              onChangeText={setPrice} 
              placeholder={t('price_per_hour_placeholder')} 
              keyboardType="numeric" 
            />
          </View>
        )}

        <Text style={styles.sectionTitle}>{t('description_optional_label')}</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          value={description} 
          onChangeText={setDescription} 
          placeholder={t('description_placeholder')} 
          multiline={true}
          numberOfLines={4}
        />

        <Text style={styles.sectionTitle}>{t('photos_label')}</Text>
        <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
          <Text style={styles.photoButtonText}>{t('select_pitch_photos')}</Text>
        </TouchableOpacity>

        {photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
            {photos.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.thumbnailImage} resizeMode="cover" />
            ))}
          </ScrollView>
        )}

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleCreate}
          disabled={isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>{t('create_pitch_btn')}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: colors.surface, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, fontSize: 16 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  mapContainer: { height: 300, width: '100%', borderRadius: 12, overflow: 'hidden', marginTop: 8, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  map: { ...StyleSheet.absoluteFillObject },
  markerFixed: { position: 'absolute', top: '50%', left: '50%', marginTop: -38, marginLeft: -20 },
  coordinatesText: { fontSize: 14, color: colors.textSecondary, marginBottom: 16, textAlign: 'center' },
  sportsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  sportBadge: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 8, marginBottom: 8, backgroundColor: colors.surface },
  sportBadgeActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  sportBadgeText: { color: colors.textSecondary, fontWeight: '600' },
  sportBadgeTextActive: { color: colors.surface },
  photoButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  photoButtonText: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
  photosScroll: { marginBottom: 20 },
  thumbnailImage: { width: 100, height: 100, borderRadius: 8, marginRight: 10 },
  submitButton: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  pickerContainer: { backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#CCCCCC', marginBottom: 16, overflow: 'hidden', height: 50, justifyContent: 'center', paddingHorizontal: 10 },
  picker: { width: '100%', color: '#000000' },
  switchContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 12, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  switchLabel: { fontSize: 16, color: colors.text, fontWeight: '600' },
});
