import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import MapView from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { updatePitch } from '../api/pitches';
import { theme } from '../theme';
import { PITCH_SPORT_KEYS } from '../config/sports';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function EditPitchScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { pitch } = route.params;

  const [title, setTitle] = useState(pitch.title || '');
  const [address, setAddress] = useState(pitch.address || '');
  const [latitude, setLatitude] = useState(Number(pitch.latitude) || 49.930936);
  const [longitude, setLongitude] = useState(Number(pitch.longitude) || 36.415709);
  const [sportType, setSportType] = useState(pitch.sport_type || 'FOOTBALL');
  const [surfaceType, setSurfaceType] = useState(pitch.surface_type || 'RUBBER');
  const [description, setDescription] = useState(pitch.description || '');
  const [photos, setPhotos] = useState(pitch.photos || []);
  const [photosUpdated, setPhotosUpdated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldsCount, setFieldsCount] = useState(pitch.fields_count ? String(pitch.fields_count) : '1');

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
      setPhotos(selectedUris.slice(0, 5));
      setPhotosUpdated(true);
    }
  };

  const handleUpdate = async () => {
    if (!title || !address) {
      Alert.alert(t('error'), t('error_fill_required'));
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedFieldsCount = parseInt(fieldsCount, 10) || 1;
      const pitchData = {
        title,
        address,
        latitude,
        longitude,
        sport_type: sportType,
        surface_type: surfaceType,
        description,
        fields_count: parsedFieldsCount,
      };

      await updatePitch(pitch.id, pitchData, photosUpdated ? photos : null);
      Alert.alert(t('success'), t('success_update_pitch'));
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('error'), error.message || t('error_update_pitch'));
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
        <Input 
          label={t('pitch_name_label')}
          value={title} 
          onChangeText={setTitle} 
          placeholder={t('pitch_name_placeholder')} 
        />

        <Input 
          label={t('pitch_address_label')}
          value={address} 
          onChangeText={setAddress} 
          placeholder={t('pitch_address_placeholder')} 
        />

        <Text style={styles.sectionTitle}>{t('pitch_location_label')}</Text>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: latitude,
              longitude: longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            onRegionChangeComplete={(region) => {
              setLatitude(region.latitude);
              setLongitude(region.longitude);
            }}
          />
          <View pointerEvents="none" style={styles.markerFixed}>
            <MaterialIcons name="location-on" size={40} color={theme.colors.primary} />
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

        <Input 
          label={t('fields_count_label')}
          value={fieldsCount} 
          onChangeText={setFieldsCount} 
          placeholder={t('fields_count_label')} 
          keyboardType="numeric" 
        />

        <Input 
          label={t('description_optional_label')}
          style={styles.textArea} 
          value={description} 
          onChangeText={setDescription} 
          placeholder={t('description_placeholder')} 
          multiline={true}
          numberOfLines={4}
        />

        <Text style={styles.sectionTitle}>{t('photos_label')}</Text>
        <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
          <Text style={styles.photoButtonText}>{t('update_pitch_photos')}</Text>
        </TouchableOpacity>

        {photos && photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
            {photos.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.thumbnailImage} resizeMode="cover" />
            ))}
          </ScrollView>
        )}

        <Button 
          title={t('save_changes_btn')}
          onPress={handleUpdate}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={{ marginTop: 10 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: 20 },
  sectionTitle: { ...theme.typography.labelMedium, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm, marginTop: 12 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  mapContainer: { height: 300, width: '100%', borderRadius: 12, overflow: 'hidden', marginTop: 8, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.border },
  map: { ...StyleSheet.absoluteFillObject },
  markerFixed: { position: 'absolute', top: '50%', left: '50%', marginTop: -38, marginLeft: -20 },
  coordinatesText: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 16, textAlign: 'center' },
  sportsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  sportBadge: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, marginRight: 8, marginBottom: 8, backgroundColor: theme.colors.surface },
  sportBadgeActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  sportBadgeText: { color: theme.colors.textSecondary, fontWeight: '600' },
  sportBadgeTextActive: { color: theme.colors.surface },
  photoButton: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  photoButtonText: { color: theme.colors.primary, fontSize: 16, fontWeight: 'bold' },
  photosScroll: { marginBottom: 20 },
  thumbnailImage: { width: 100, height: 100, borderRadius: 8, marginRight: 10 },
  pickerContainer: { backgroundColor: theme.colors.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 16, overflow: 'hidden', height: 50, justifyContent: 'center', paddingHorizontal: 10 },
  picker: { width: '100%', color: theme.colors.text },
});
